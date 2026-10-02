# Glossary

> Terms used throughout the codebase, in one place. If a term shows up in code and isn't here, add it.

---

### Active clip

A clip that is "playing" at the current frame. Output of `resolveTimeline`. Comes in six flavors: `ActiveVideoClip`, `ActiveAudioClip`, `ActiveTextClip`, `ActiveImageClip`, `ActiveShapeClip`, `ActiveFreehandClip`. See [`resolver/scene.ts`](../packages/core/src/resolver/scene.ts).

### Asset

A piece of media (video file, audio file, image) imported into the editor. Lives in the in-memory `MediaLibrary` (`core/assets/`). Distinct from a **clip**: a single asset can be used by many clips. Modeled as `MediaAsset`.

### `assetId`

The reference from a `Clip` to its source `MediaAsset` in the library. Set on clips created via drag-from-`AssetPanel`. A raw `src: string` URL can coexist on the clip during the migration to an `assetId`-only model.

### Batch

A `TimelineEngine.batch(recipe, description?)` transaction that groups multiple mutations into a single undo entry. Nested batches collapse into the outermost.

### Clip

A single placed segment on a track: video, audio, image, text, shape or freehand. Has `startFrame`, `durationFrames`, `sourceStartFrame`, `sourceDurationFrames`, and optional `speed`, `crop`, `cornerRadius` and `transform`. Distinct from an **asset** (the underlying file). See [`types/index.ts`](../packages/core/src/types/index.ts).

### Commit

`TimelineEngine.commit(recipe, description)` — the one function through which every mutation passes. Applies Immer, records history, fires `'change'` and `'history:change'` events.

### Copy-and-close

The frame-ownership fix on the real decode path: each decoded `VideoFrame` is copied into an `ImageBitmap` and closed immediately, returning its slot in the decoder's output pool. The cache then holds plain memory, not pool slots. See [`renderer/architecture.md` § 6.5](../packages/core/src/renderer/architecture.md).

### `currentFrame`

The playhead position, in integer frames. Owned by `PlaybackEngine`; mirrored into `usePlaybackStore.currentFrame` for React.

### `currentFrameEpoch`

A monotonically increasing counter in `usePlaybackStore` that bumps on every explicit `setCurrentFrame` call. Used by subscribers (e.g. the playhead DOM writer) to detect scrub events even when the frame number is unchanged — it does not bump on every RAF tick, only on user-driven scrubs.

### Echo guard

The check `state.currentFrame !== playback.currentFrame` in the store→engine subscription that prevents an infinite loop between the two playback state mirrors. Wired in [`EditorProvider.tsx`](../packages/editor/src/editor/EditorProvider.tsx).

### Engine

Shorthand for `TimelineEngine` — the framework-agnostic class that owns the `Project` and is the only legal source of mutations.

### Frame

The unit of time. Always an integer. `frame = seconds × fps`. The engine never uses floating-point seconds internally.

### `FrameCache`

Bounded cache of decoded frames keyed by source frame number, with pivot-relative eviction (by frame count and by an optional byte budget). **Owns** every stored frame and is the only thing that closes it; `get()` returns a borrowed reference. On the real decode path it holds `ImageBitmap` copies. See [`media/video/FrameCache.ts`](../packages/core/src/media/video/FrameCache.ts).

### Holdover

The last textured frame of a video clip that just left the scene, kept by `VideoLayer` so a direct cut to the next clip has something to draw until that clip's first frame is decoded. Dropped on a gap larger than a few frames or on a seek. See [`renderer/architecture.md` § 7](../packages/core/src/renderer/architecture.md).

### MediaLibrary

The in-memory registry of imported `MediaAsset`s (`useMediaLibraryStore` in `core/assets/`). One asset → many clips. Not persisted by the engine: `snapshotMediaLibrary` / `hydrateMediaLibrary` let a host store and restore it, and `relinkProjectMedia` re-points clips at restored assets.

### `MotionSpec`

The far end of a text or shape clip's entry or exit ramp: opacity, offset, scale multiplier and rotation delta plus easing. The near end is always the clip's authored resting state. Carried by `TextAnimation.inMotion` / `outMotion`. See [`ARCHITECTURE.md` § 4](../ARCHITECTURE.md#animation-model).

### Project

The whole timeline document: `fps`, `stage`, `tracks`, `clips`, `transitions`, `version`. Immutable; replaced wholesale on every commit. A stored copy is read back with `readProjectDocument`, which checks the `version` stamp (`PROJECT_VERSION`).

### `resolveTimeline`

The pure function `(frame, project) → Scene`. The single bridge between data and rendering — consumed by both the live renderer and the export worker. See [`resolver/resolveTimeline.ts`](../packages/core/src/resolver/resolveTimeline.ts).

### Renderer

Anything that consumes a `Scene` and produces pixels. Implements the `Renderer` interface: `mount(container)`, `resize(w, h, dpr?)`, `render(scene)`, `dispose()`. The shipped implementation is the WebGL2 `GpuRenderer`.

### Ring (R0 / R1 / R2)

The three layers of state in the codebase. See [`ARCHITECTURE.md` § 2](../ARCHITECTURE.md#2-the-three-ring-state-model).

- **R0** — Engine state. Immutable. Class-owned. Source of truth.
- **R1** — Reactive mirror. Zustand stores synced from R0.
- **R2** — UI/transient state. Selection, drag handles, etc.

### Scene

The output of `resolveTimeline`. A plain-data object listing every active clip at a given frame, with `sourceFrame`, `opacity`, `zIndex`, and optional `transform`, plus the project's `fps` and `stage` and any active transitions. Renderers consume only this. See [`resolver/scene.ts`](../packages/core/src/resolver/scene.ts).

### Solo

A track flag that, when enabled on any track of a given kind (`video`, `audio` or `elements`), excludes all other tracks of that kind from the resolved scene. Image clips piggyback on video solo.

### Source frame

The frame inside the **source asset** (the original media file) that corresponds to the current timeline frame for an active clip. Computed by the resolver: `sourceFrame = (currentFrame - clip.startFrame) + clip.sourceStartFrame`. This is the value a renderer hands to the decoder / `<video>.currentTime`.

### `sourceStartFrame` / `sourceDurationFrames`

The trim window into the source asset. `sourceStartFrame` is the first frame of the source that this clip uses; `sourceDurationFrames` is the *total length of the source asset* (used as an upper bound when extending the trim). The clip's actual playing range is `[sourceStartFrame, sourceStartFrame + durationFrames)`.

### Stage

The output composition canvas — `Project.stage` (`width × height`). Default `{ width: 1080, height: 1920 }` (portrait 9:16). Switchable at runtime via `TimelineEngine.setStage`.

### `StreamingFrameProducer`

The production `VideoFrameProvider`: push-based (`setPlayhead` + `getCurrent`), owns a `VideoDecoderManager` + `FrameCache`, feeds the decoder a forward lookahead window tracked by a feed watermark. See [`media/video/StreamingFrameProducer.ts`](../packages/core/src/media/video/StreamingFrameProducer.ts).

### Subscriber storm

Pathological behavior where one state change triggers many downstream re-renders that re-trigger the original change. Avoided by (a) the echo guard, (b) only calling `setCurrentFrame` when the frame actually changed, (c) Ring 0 → Ring 1 sync at engine-event granularity, (d) notifying only on integer-frame advance.

### Timeline

Two meanings, both used:
1. The `<Timeline />` React component — the UI surface ([`Timeline.tsx`](../packages/timeline/src/Timeline.tsx)).
2. The conceptual data structure (tracks + clips ordered in time). Pedantically that's the `Project`.

### Track

A horizontal lane in the timeline. Has a `kind` (`video` | `audio` | `elements`; text, shape and freehand clips live on `elements` tracks) and an `order` (0 = topmost in UI). A project can have several video tracks; the topmost lane composites on top. `protected` tracks cannot be removed, and `pinned: 'bottom'` tracks stay below freely-added ones. Holds clips. See [`types/index.ts`](../packages/core/src/types/index.ts).

### Transform

The position/scale/rotation/anchor of a clip on the stage (`Clip.transform`). Stored as normalized `0..1` coordinates so it's resolution-independent. Resolved to pixels by `resolveDrawRect` (video/image) and `computeTextLayout` (text).

### Transition

A `fade`, `slide` or `wipe` between two adjacent clips on a track (`Project.transitions`). While one is active, `Scene.transitions` carries an `ActiveTransition` with eased progress `t`; the preview draws it as a snapshot overlay and export draws the same snapshot. `slide` moves left only for `direction: 'left'`, `wipe` ignores direction, and `up` / `down` are typed but not implemented.

### Visitor

A pure function that takes an Immer `Draft<Project>` and applies a single mutation type: `addClip`, `removeClip`, `updateClip`, `splitClip`, `cloneClip`, `removeTrack`, `updateTrack`. Called by `TimelineEngine` inside `commit`. See [`core/visitor/`](../packages/core/src/visitor/).

### Zustand mirror

A Ring 1 store (`useTracksStore`, `usePlaybackStore`) that mirrors engine state for React consumption. Updated by `sync()` calls fired from engine events. Never the source of truth.

### z-index

In the resolver: `(maxOrder - track.order) * 1000`, plus a large fixed offset (`ELEMENTS_ZINDEX_BASE`) on `elements` tracks so text, shape and freehand clips sit above all video. Higher zIndex = closer to viewer = renders on top. The `* 1000` reserves space for sub-layer offsets.
