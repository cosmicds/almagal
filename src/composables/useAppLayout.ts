import { computed } from "vue";
import { useDisplay } from "vuetify";

let layout: ReturnType<typeof createAppLayout> | null = null;

function createAppLayout() {
  /* Properties related to device/screen characteristics */
  const { xs, smAndDown, width: viewportWidth, height: viewportHeight } = useDisplay();
  const isVertical = computed(() => viewportHeight.value > viewportWidth.value);
  const smallSize = computed(() => smAndDown.value);
  const isLandscape = computed(() => viewportWidth.value > viewportHeight.value * 1.25);
  // Where the info sheet lives: beside the view when there's width to spare,
  // otherwise across the bottom. A tall/portrait window gets the bottom panel
  // even when it's wide enough not to count as `smallSize`.
  const sidePanel = computed(() => isLandscape.value || (!smallSize.value && !isVertical.value));
  // a phone. Not `smallSize`, which reaches to 960.
  const isMobile = computed(() => xs.value);

  return {
    viewportWidth,
    viewportHeight,
    smallSize,
    isLandscape,
    sidePanel,
    isMobile,
  };
}

// `useDisplay` injects, so the first call has to come from a component setup.
export function useAppLayout() {
  if (!layout) {
    layout = createAppLayout();
  }
  return layout;
}
