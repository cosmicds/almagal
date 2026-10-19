import { computed, } from "vue";
import { WWTControl } from "@wwtelescope/engine";
import { engineStore } from "@wwtelescope/engine-pinia";

export function useWwtZoom() {
  
  const store = engineStore();

  function clampZoom(zoom: number) {
    // use WWTControl here so that it is always current with how it has been set. 
    // @ts-expect-error get_zoomMax and get_zoomMin doe exist
    return Math.max(WWTControl.singleton.get_zoomMin(), Math.min(WWTControl.singleton.get_zoomMax(), zoom));
  }
  
  
  function setZoom(zoom: number) {
    zoom = clampZoom(zoom);
    const rc = WWTControl.singleton.renderContext;
    rc.targetCamera.zoom = zoom; 
    // rc.viewCamera.zoom   = zoom; // i think this was to get an instant effect, but won't do this for now
    WWTControl.singleton.renderOneFrame();
  }

  const zoom = computed({
    get: () => store.zoomDeg,
    set: (value: number) => {
      setZoom(value);
    },
  });
  
  

  
  return {
    zoom,
    setZoom,
  };
}