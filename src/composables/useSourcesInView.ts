import { computed, shallowRef } from "vue";
import { watchThrottled } from "@vueuse/core";
import { engineStore } from "@wwtelescope/engine-pinia";
import { WWTControl } from "@wwtelescope/engine";

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
    if (!ctl?.renderContext) {
      sourcesInView.value = [];
      return;
    }
    const w = ctl.renderContext.width;
    const h = ctl.renderContext.height;

    const corners = [
      store.findRADecForScreenPoint({ x: 0, y: 0 }), // TL
      store.findRADecForScreenPoint({ x: w, y: 0 }), // TR
      store.findRADecForScreenPoint({ x: 0, y: h }), // BL
      store.findRADecForScreenPoint({ x: w, y: h }), // BR
    ];

    const ras = corners.map(c => c.ra);
    const decs = corners.map(c => c.dec);
    
    const minRa = Math.min(...ras);
    const maxRa = Math.max(...ras);
    const minDec = Math.min(...decs);
    const maxDec = Math.max(...decs);

    sourcesInView.value = rows.filter(row =>
      row.ra >= minRa && row.ra <= maxRa &&
      row.dec >= minDec && row.dec <= maxDec
    );
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

  return { sourcesInView, count, recompute, setup };
}
