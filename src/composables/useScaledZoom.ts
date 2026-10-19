 
import { computed } from "vue";
import { WWTControl } from "@wwtelescope/engine";
import { engineStore } from "@wwtelescope/engine-pinia";
import { useWwtZoom } from "./useZoomControl";

export function useScaledZoom() {

  const store = engineStore();
  const { setZoom } = useWwtZoom();
    
  // @ts-expect-error get_zoomMax and get_zoomMin doe exist
  const ZOOM_MIN   = WWTControl.singleton.get_zoomMin();
  // @ts-expect-error get_zoomMax and get_zoomMin doe exist
  const ZOOM_MAX   = WWTControl.singleton.get_zoomMax();
  const LOG_MIN    = Math.log(ZOOM_MIN);
  const LOG_MAX    = Math.log(ZOOM_MAX);
  // Power < 1 stretches the small-zoom (zoomed-in) end of the slider.
  const ZOOM_POWER = 1; // = 1 will give a straight logarithmic slider. 

  // Map linear slider position [0,1] → stretched slider position [0,1].
  const stretchSlider   = (t: number) => Math.pow(t, ZOOM_POWER);
  // Inverse: stretched slider position → linear slider position.
  const unstretchSlider = (t: number) => Math.pow(t, 1 / ZOOM_POWER);

  function zoomToSlider(zoom: number): number {
    const linear = (Math.log(zoom) - LOG_MIN) / (LOG_MAX - LOG_MIN);
    return unstretchSlider(linear);
  }
  function sliderToZoom(t: number): number {
    return Math.exp(LOG_MIN + stretchSlider(t) * (LOG_MAX - LOG_MIN));
  }
  
  const zoomSliderValue = computed(() => zoomToSlider(store.zoomDeg));

  function onZoomSlider(value: number) {
    setZoom(sliderToZoom(value));
  }

  function zoomIn() {
    setZoom(store.zoomDeg / 1.25);
  }

  function zoomOut() {
    setZoom(store.zoomDeg * 1.25);
  }

  
  return {
    zoomSliderValue,
    onZoomSlider,
    zoomIn,
    zoomOut,
  };
}