import type { Component } from "vue";
import TourStep1 from "./steps/TourStep1.vue";
import TourStep2 from "./steps/TourStep2.vue";
import TourStep3 from "./steps/TourStep3.vue";

/** Ordered list of tour steps. Add a component here and it shows up in the player. */
export const TOUR_STEPS: Component[] = [
  TourStep1,
  TourStep2,
  TourStep3,
];
