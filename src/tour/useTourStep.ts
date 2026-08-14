import { onMounted, watch, type Ref } from "vue";
import { engineStore } from "@wwtelescope/engine-pinia";

type Store = ReturnType<typeof engineStore>;

/**
 * Shared plumbing for a tour step: hands back the WWT store and runs `action`
 * whenever the step becomes the displayed one.
 *
 * v-window mounts an item lazily (the first time it is shown), so `onMounted`
 * covers the first display and the watcher covers every return visit.
 */
export function useTourStep(active: Ref<boolean>, action?: (store: Store) => void) {
  const store = engineStore();

  onMounted(() => {
    if (active.value) {
      action?.(store);
    }
  });

  watch(active, (isActive) => {
    if (isActive) {
      action?.(store);
    }
  });

  return { store };
}
