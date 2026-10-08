/**
 * @elah/react-native
 *
 * React Native binding for the Elah video engine. Same `Project` document,
 * same `TimelineEngine`, same `@elah/react` hooks as the web; the rendering,
 * decode, audio and export seams are native and arrive workstream by
 * workstream (docs/react-native/04-workstreams.md).
 *
 * Status, in the order it ships:
 *   - timeline model (lanes, gestures, commands): here, tested in Node
 *   - <Timeline> component: RN-T3 .. RN-T7
 *   - @elah/core/engine entry so Metro can bundle the engine: RN-P1
 *   - <Preview> (Skia), native decode, audio, import, export: RN-P4 .. RN-P10
 *
 * Until RN-P1 lands, importing this package from a Metro bundle fails inside
 * `@elah/core` on the one ES feature Metro rejects (the export worker's module
 * URL; see docs/react-native/02-platform-audit.md section 2). The model and
 * its tests do not need Metro.
 */

// --- React layer, unchanged from the web ---
export {
  EditorContext,
  useEditor,
  useTimelineEngine,
  usePlaybackEngine,
  useTracksStore,
  usePlaybackStore,
  useSelectionStore,
  useTransitionsStore,
  useTextStylePresetsStore,
  useMediaLibraryStore,
  useClipLoadStore,
} from '@elah/react'
export type { EditorContextValue, BoundStoreHook } from '@elah/react'
// Deliberately NOT re-exported: useMediaLibrary / useAssets. @elah/react's
// useMediaLibrary imports the browser importers (importFiles, importUrl,
// importBlob) by value; mobile import is its own seam (RN-P8). See RN-T1.

// --- Engine types. Values (TimelineEngine, resolveTimeline, the clip
// factories...) are re-exported from `@elah/core/engine` once RN-P1 adds it;
// re-exporting them from the root barrel today would pin the Metro blocker
// into this package's public surface.
export type {
  Project,
  Track,
  Clip,
  ClipType,
  TrackKind,
  Scene,
  Transform,
  Transition,
  MediaAsset,
  MediaKind,
  PlaybackState,
  PlaybackActions,
  SelectionState,
  SelectionActions,
  TracksState,
} from '@elah/core'

// --- Timeline ---
export * from './timeline'
