import type { Colormaps } from "./wwt-colormaps/colormaps";
import type { engineStore } from "@wwtelescope/engine-pinia";
import { ScaleTypes } from "@wwtelescope/engine-types";


export function setFitsLayerSettings(
  guid: string, 
  store: ReturnType<typeof engineStore>, 
  options: {
    cmap?: Colormaps, 
    opacity?: number, 
    stretch?: {
      stretch: ScaleTypes, 
      vmin: number, vmax:number
    }} = {}
) {
  
  if (options.cmap) {
    store.applyFitsLayerSettings({
      id: guid,
      settings: [
        ['colorMapperName', options.cmap as Colormaps],
      ]
    });
  }
  if (options.opacity) {
    store.applyFitsLayerSettings({
      id: guid,
      settings: [
        ['opacity', options.opacity],
      ]
    });
  }
  if (options.stretch) {
    store.stretchFitsLayer({
      id: guid,
      stretch: options.stretch.stretch,
      vmin: options.stretch.vmin,
      vmax: options.stretch.vmax,
    });
  }
}


