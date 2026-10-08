import { describe, expect, it } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, relative, resolve, sep } from 'node:path'

/**
 * Guards `@elah/core/engine` (src/engine.ts): the entry React Native, workers
 * and Node use. Walks the RUNTIME import graph from engine.ts (type-only
 * imports are erased by the compiler and skipped) and fails if
 *
 *   (a) a reached file is not on the explicit allowlist below,
 *   (b) a reached file uses `import.meta` (Metro and Hermes reject it) or a
 *       browser-only API, or touches `document` / `window` without a
 *       `typeof` guard,
 *   (c) a reached file imports an npm package other than the allowed ones.
 *
 * Adding a module to the entry is a deliberate act: add it to ALLOWED_FILES in
 * the same change. Modelled on no-react-imports.test.ts.
 */

const SRC_ROOT = __dirname
const ENTRY = join(SRC_ROOT, 'engine.ts')

const ALLOWED_PACKAGES = new Set(['immer', 'zustand/vanilla'])

const ALLOWED_FILES = [
  'actions/splitClipAtPlayhead.ts',
  'assets/store.ts',
  'assets/types.ts',
  'debug/PerfSummary.ts',
  'debug/trace.ts',
  'editor/TimelineEngine.ts',
  'editor/projectDocument.ts',
  'elements/audio.ts',
  'elements/base.ts',
  'elements/freehand.ts',
  'elements/image.ts',
  'elements/shape.ts',
  'elements/text.ts',
  'elements/textTemplates.ts',
  'elements/video.ts',
  'engine.ts',
  'frames/FrameSequenceController.ts',
  'frames/frameSequence.ts',
  'frames/frameSequenceProject.ts',
  'playback/PlaybackEngine.ts',
  'project/serialization.ts',
  'renderer/gpu/layers/drawRect.ts',
  'renderer/gpu/layers/objectFit.ts',
  'renderer/gpu/layers/textLayout.ts',
  'renderer/gpu/viewport.ts',
  'resolver/resolveTimeline.ts',
  'resolver/textAnimation.ts',
  'stores/clipLoad.store.ts',
  'stores/playback.store.ts',
  'stores/selection.store.ts',
  'stores/textStylePresets.store.ts',
  'stores/tracks.store.ts',
  'stores/transitions.store.ts',
  'track/track.ts',
  'utils/frames.ts',
  'utils/id.ts',
  'utils/snap.ts',
  'utils/timelineMath.ts',
  'visitor/add.ts',
  'visitor/clone.ts',
  'visitor/remove.ts',
  'visitor/split.ts',
  'visitor/update.ts',
]

/** Browser-only identifiers that must never be reached. */
const BANNED = [
  'import.meta',
  'new Worker(',
  'OffscreenCanvas',
  'VideoDecoder',
  'VideoEncoder',
  'VideoFrame',
  'createImageBitmap',
  'WebGL2RenderingContext',
  'URL.createObjectURL',
  'indexedDB',
  'crypto.',
]

function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1')
}

// `import x from '...'`, `export { x } from '...'`, `import '...'`, `import('...')`.
// Statements starting `import type` / `export type` are erased and skipped.
const STATIC_RE = /(?:^|\n)\s*(import|export)\s+(type\s+)?([\s\S]*?)\s*from\s+['"]([^'"]+)['"]/g
const BARE_RE = /(?:^|\n)\s*import\s+['"]([^'"]+)['"]/g
const DYNAMIC_RE = /import\(\s*['"]([^'"]+)['"]\s*\)/g

function runtimeSpecifiers(source: string): string[] {
  const out: string[] = []
  for (const m of source.matchAll(STATIC_RE)) {
    if (m[2]) continue // import type / export type
    // `import { type A, type B } from` is erased too when every binding is a type.
    const bindings = m[3].replace(/[{}]/g, '').split(',').map((s) => s.trim()).filter(Boolean)
    if (bindings.length > 0 && bindings.every((b) => b.startsWith('type '))) continue
    out.push(m[4])
  }
  for (const m of source.matchAll(BARE_RE)) out.push(m[1])
  for (const m of source.matchAll(DYNAMIC_RE)) out.push(m[1])
  return out
}

function resolveRelative(fromFile: string, spec: string): string {
  const base = resolve(dirname(fromFile), spec)
  for (const candidate of [`${base}.ts`, `${base}.tsx`, join(base, 'index.ts')]) {
    if (existsSync(candidate)) return candidate
  }
  throw new Error(`cannot resolve '${spec}' from ${fromFile}`)
}

const rel = (file: string) => relative(SRC_ROOT, file).split(sep).join('/')

interface Graph {
  files: Map<string, string> // reached file -> the file that first reached it
  packages: Map<string, string> // npm specifier -> importing file
}

function walk(entry: string): Graph {
  const files = new Map<string, string>([[entry, '(entry)']])
  const packages = new Map<string, string>()
  const queue = [entry]
  while (queue.length > 0) {
    const file = queue.shift() as string
    const source = stripComments(readFileSync(file, 'utf8'))
    for (const spec of runtimeSpecifiers(source)) {
      if (spec.startsWith('.')) {
        const target = resolveRelative(file, spec)
        if (!files.has(target)) {
          files.set(target, file)
          queue.push(target)
        }
      } else if (!packages.has(spec)) {
        packages.set(spec, file)
      }
    }
  }
  return { files, packages }
}

/** Human-readable chain from the entry to `file`, for failure messages. */
function pathTo(graph: Graph, file: string): string {
  const chain = [rel(file)]
  let current = graph.files.get(file)
  while (current && current !== '(entry)') {
    chain.unshift(rel(current))
    current = graph.files.get(current)
  }
  return chain.join(' -> ')
}

describe('@elah/core/engine stays browser-free', () => {
  const graph = walk(ENTRY)

  it('reaches only allowlisted files', () => {
    const unexpected = [...graph.files.keys()]
      .filter((f) => !ALLOWED_FILES.includes(rel(f)))
      .map((f) => pathTo(graph, f))
    expect(unexpected, 'add the file to ALLOWED_FILES on purpose, or stop reaching it').toEqual([])
  })

  it('keeps the allowlist honest (every allowed file is actually reached)', () => {
    const reached = new Set([...graph.files.keys()].map(rel))
    expect(ALLOWED_FILES.filter((f) => !reached.has(f))).toEqual([])
  })

  it('imports no npm package beyond immer and zustand/vanilla', () => {
    const offenders = [...graph.packages.entries()]
      .filter(([spec]) => !ALLOWED_PACKAGES.has(spec))
      .map(([spec, file]) => `${spec} (from ${pathTo(graph, file)})`)
    expect(offenders).toEqual([])
  })

  it('uses no import.meta and no browser-only API', () => {
    const offenders: string[] = []
    for (const file of graph.files.keys()) {
      const source = stripComments(readFileSync(file, 'utf8'))
      for (const banned of BANNED) {
        if (source.includes(banned)) offenders.push(`${banned} in ${pathTo(graph, file)}`)
      }
    }
    expect(offenders).toEqual([])
  })

  it('touches document / window / localStorage only behind a typeof guard', () => {
    const offenders: string[] = []
    for (const file of graph.files.keys()) {
      const source = stripComments(readFileSync(file, 'utf8'))
      for (const global of ['document', 'window', 'localStorage']) {
        const used = new RegExp(`\\b${global}\\.`).test(source)
        const guarded = source.includes(`typeof ${global}`)
        if (used && !guarded) offenders.push(`${global} in ${pathTo(graph, file)}`)
      }
    }
    expect(offenders).toEqual([])
  })
})
