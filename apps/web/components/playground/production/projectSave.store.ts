import { create } from 'zustand'
import type { MissingMedia } from '@elah/editor'

/**
 * Editor state shared between `LocalProjectBridge` (inside `EditorProvider`,
 * where the engine is), which writes it, and `ProjectMediaNotice` (outside it),
 * which reads it.
 */
interface ProjectSaveState {
  /**
   * Clips that came back from storage without a source file that can be
   * fetched again — a video imported from the user's own device, whose `blob:`
   * URL died with the session that made it.
   */
  missingMedia: MissingMedia[]

  setMissingMedia: (missing: MissingMedia[]) => void
  reset: () => void
}

const INITIAL = {
  missingMedia: [] as MissingMedia[],
}

export const useProjectSaveStore = create<ProjectSaveState>((set) => ({
  ...INITIAL,
  setMissingMedia: (missingMedia) => set({ missingMedia }),
  reset: () => set(INITIAL),
}))
