import type { Component } from "vue";
import TourStep1 from "./steps/TourStep1.vue";
import TourStep1b from "./steps/TourStep1b.vue";
import TourStep2 from "./steps/TourStep2.vue";
import TourStep2b from "./steps/TourStep2b.vue";
import TourStep3 from "./steps/TourStep3.vue";
import TourStep3b from "./steps/TourStep3b.vue";
import TourStep4 from "./steps/TourStep4.vue";
import TourStep4b from "./steps/TourStep4b.vue";

/**
 * Ordered list of tour steps: each of the scientists' four sections, followed by
 * a "b" slide with the things to try for it. Add one here and give it a branch
 * in `setupTourStep`.
 */
export const TOUR_STEPS: Component[] = [
  TourStep1,
  TourStep1b,
  TourStep2,
  TourStep2b,
  TourStep3,
  TourStep3b,
  TourStep4,
  TourStep4b,
];
