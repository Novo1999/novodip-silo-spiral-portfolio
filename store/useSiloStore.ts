import { create } from "zustand";
import { SILO_LEVELS } from "@/data/portfolio";
import { playSpatialStepSound } from "@/utils/sound";

interface SiloState {
  currentStepIndex: number;
  previousStepIndex: number;
  /**
   * Floor whose section the portal shows. Lags behind currentStepIndex during
   * a climb so the old section stays put while the shutter closes, and the
   * new one only appears once the camera has arrived.
   */
  displayedStepIndex: number;
  isTransitioning: boolean;
  /**
   * Controls the "Black Shutter / Aperture Opening Up" section reveal:
   * - false while the camera & spiral stairs are animating between floors
   * - true once the camera arrives at the target floor so the black portal opens smoothly
   */
  isPanelOpen: boolean;
  loopNavigation: boolean;
  soundEnabled: boolean;
  activeProjectFilter: string;
  completeTransition: () => void;
  goToStep: (index: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  setIsPanelOpen: (open: boolean) => void;
  toggleLoopNavigation: () => void;
  toggleSound: () => void;
  setActiveProjectFilter: (filter: string) => void;
}

export const useSiloStore = create<SiloState>((set, get) => ({
  currentStepIndex: 0,
  previousStepIndex: 0,
  displayedStepIndex: 0,
  isTransitioning: false,
  isPanelOpen: true,
  loopNavigation: true,
  soundEnabled: true,
  activeProjectFilter: "All",

  completeTransition: () =>
    set((state) => ({
      isTransitioning: false,
      isPanelOpen: true,
      displayedStepIndex: state.currentStepIndex
    })),

  setIsPanelOpen: (open) => set({ isPanelOpen: open }),

  goToStep: (targetIndex) => {
    const { currentStepIndex, isTransitioning, soundEnabled } = get();
    if (isTransitioning || targetIndex === currentStepIndex) return;
    if (targetIndex < 0 || targetIndex >= SILO_LEVELS.length) return;

    const direction = targetIndex > currentStepIndex ? "up" : "down";
    if (soundEnabled) {
      playSpatialStepSound(direction, targetIndex);
    }

    // 1. Close the black section shutter first & start stair/camera transition
    set({
      previousStepIndex: currentStepIndex,
      currentStepIndex: targetIndex,
      isTransitioning: true,
      isPanelOpen: false
    });
  },

  nextStep: () => {
    const { currentStepIndex, loopNavigation, goToStep } = get();
    const maxIndex = SILO_LEVELS.length - 1;
    if (currentStepIndex < maxIndex) {
      goToStep(currentStepIndex + 1);
    } else if (loopNavigation) {
      goToStep(0);
    }
  },

  prevStep: () => {
    const { currentStepIndex, loopNavigation, goToStep } = get();
    const maxIndex = SILO_LEVELS.length - 1;
    if (currentStepIndex > 0) {
      goToStep(currentStepIndex - 1);
    } else if (loopNavigation) {
      goToStep(maxIndex);
    }
  },

  toggleLoopNavigation: () =>
    set((state) => ({ loopNavigation: !state.loopNavigation })),

  toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),

  setActiveProjectFilter: (filter) => set({ activeProjectFilter: filter })
}));
