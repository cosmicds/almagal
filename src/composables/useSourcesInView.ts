import { computed, shallowRef, reactive } from "vue";
import { watchThrottled } from "@vueuse/core";
import { engineStore } from "@wwtelescope/engine-pinia";
import { WWTControl } from "@wwtelescope/engine";
import { ImageSetType } from "@wwtelescope/engine-types";

export interface RaDecPair {
  ra: number;  // degrees
  dec: number; // degrees
}

export interface SourcesInViewOptions {
  // How often (ms) to recompute while the camera is moving.
  throttle?: number;
}

/**
 * Given a list of rows with `ra`/`dec` columns (in degrees), figure out which
 * of them currently fall inside the WWT view. This is takes a simple approach, meaing
 * that the rotation to galactic coordinates is ignored, so sometimes a nearby off-screen
 * source will be included. 
 *
 * The calculation is throttled every 200ms using @vueuse watchThrottled, not watchDebounced,
 * so that it will run while the user is moving. 
 * 
 * This takes in a row: {ra, dec, ...}[]
 */
export function useSourcesInView<T extends RaDecPair>(
  rows: T[],
  options: SourcesInViewOptions = {}
) {
  const { throttle = 200 } = options;
  const store = engineStore();

  const sourcesInView = shallowRef<T[]>([]);

  function recompute() {
    // since we are not using store.waitForReady, we need to manually check for a renderContext
    const ctl = WWTControl.singleton;
    if (!ctl?.renderContext || (store.backgroundImageset?.get_dataSetType() !== ImageSetType.sky)) {
      sourcesInView.value = [];
      return;
    }
    const w = ctl.renderContext.width;
    const h = ctl.renderContext.height;
    const skyMode = store.backgroundImageset?.get_dataSetType()=== ImageSetType.sky;
    
    if (!skyMode) {
      sourcesInView.value = [];
      return;
    }
    // this doesn't actually take very long - even for 1000 sources
    // probably don't even need to throttle tbh
    sourcesInView.value = rows.filter(row => {
      const pt = ctl.getScreenPointForCoordinates(row.ra / 15, row.dec);
      return pt.x >= 0 && pt.x < w && pt.y >= 0 && pt.y < h;
    });
  }

  let setupOnlyOnce = false;
  function setup() {
    if (setupOnlyOnce) return;
    setupOnlyOnce = true;
    watchThrottled(
      () => [store.raRad, store.decRad, store.zoomDeg, store.rollRad],
      recompute,
      { throttle, trailing: true, immediate: true }
    );
  }

  const count = computed(() => sourcesInView.value.length);

  return reactive({ sourcesInView, count, recompute, setup });
}
