/*
colors = wwtlib.ColorMapContainer.viridis.colors.map((color, index) => [index, color.r, color.g, color.b]);
cm=wwtlib.ColorMapContainer.fromArgbList(colors); // also is a .fromStringList which takes hex
wwtlib.ColorMapContainer.registerNamedColormap("viridisalpha", cm);
layer.get_imageSet().get_fitsProperties().colorMapName = "viridisalpha"
*/

import { ColorMapContainer } from "@wwtelescope/engine";
import rdbu from "@/assets/RdBu_r";

export const COLORMAPS = [
  'viridis',
  'plasma',
  'inferno',
  'magma',
  'cividis',
  'greys',
  'gray',
  'purples',
  'blues',
  'greens',
  'oranges',
  'reds',
  'rdylbu',
  'rdbu',
] as const;
export type Colormaps =  typeof COLORMAPS[number];

export function addCustomColormaps() {
  const cm = ColorMapContainer.fromStringList(rdbu);
  ColorMapContainer.registerNamedColormap("rdbu", cm);
}