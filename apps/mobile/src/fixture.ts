import type { InitialTrackConfig, TimelineEngine } from '@elah/react-native'

/**
 * The harness fixture: the SAME three lanes and clips as the model tests
 * (packages/react-native/src/timeline/model/__fixtures__/project.ts), so what a
 * contributor sees on the phone can be checked against the Node tests.
 *
 *   V1 (video)     A [30, 90)   B [120, 180)
 *   V2 (video)     (empty)
 *   Elements       Title [30, 120)
 *
 * Video clips point at no real file: the timeline only needs their frames, and
 * the preview (RN-P4+) does not exist yet.
 */

export const FPS = 30

export const INITIAL_TRACKS: InitialTrackConfig[] = [
  { kind: 'video', name: 'V1', height: 60 },
  { kind: 'video', name: 'V2', height: 60 },
  { kind: 'elements', name: 'Elements', height: 60 },
]

export interface FixtureIds {
  v1: string
  v2: string
  elements: string
  a: string
  b: string
  title: string
}

/** Fill an engine built from INITIAL_TRACKS. Clears undo so "Reset" is a clean start. */
export function loadFixture(engine: TimelineEngine): FixtureIds {
  const [v1, v2, elements] = engine.getProject().tracks
  for (const track of engine.getProject().tracks) {
    for (const clip of engine.getClipsOnTrack(track.id)) engine.removeClip(clip.id, track.id)
  }

  const a = engine.addClip({ trackId: v1.id, type: 'video', name: 'A', src: 'fixture://a.mp4', startFrame: 30, durationFrames: 60 })
  engine.updateClip(a.id, v1.id, { sourceStartFrame: 20, sourceDurationFrames: 120 })
  const b = engine.addClip({ trackId: v1.id, type: 'video', name: 'B', src: 'fixture://b.mp4', startFrame: 120, durationFrames: 60 })
  const title = engine.addClip({
    trackId: elements.id,
    type: 'text',
    name: 'Title',
    text: { content: 'Hello from Elah' },
    startFrame: 30,
    durationFrames: 90,
  })

  // Start the demo with an empty history.
  engine.loadProject(engine.getProject(), { transport: 'rewind' })

  return { v1: v1.id, v2: v2.id, elements: elements.id, a: a.id, b: b.id, title: title.id }
}
