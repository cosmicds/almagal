
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
  'rdylbu'
] as const;
export type Colormaps =  typeof COLORMAPS[number];