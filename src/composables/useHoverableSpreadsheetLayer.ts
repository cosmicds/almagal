import { engineStore } from "@wwtelescope/engine-pinia";
import { distance } from "@wwtelescope/astro";
import { useSpreadsheetLayer, type SpreadsheetLayerOptions } from "./useSpreadsheetLayer";

const D2R = Math.PI / 180;

export interface RaDecPair {
  ra: number;  // degrees
  dec: number; // degrees
}

export interface HoverableSpreadsheetLayerOptions<T extends RaDecPair> extends SpreadsheetLayerOptions {
  pixelThreshold?: number;
  onHover?: (row: T | null, index: number) => void;
  onClick?: (row: T | null, index: number) => void;
}

export function useHoverableSpreadsheetLayer<T extends RaDecPair>(
  rows: T[],
  options: HoverableSpreadsheetLayerOptions<T> = {}
) {
  const store = engineStore();
  const { pixelThreshold = 20, onHover, ...spreadsheetOptions } = options;

  // ra in hours for the WWT layer column
  // const points = rows.map(r => [r.ra / 15, r.dec] as [number, number]);
  // convert row to have ra in hours
  const points = rows.map(r => ({ ...r, ra: r.ra / 15 }));
  const spreadsheet = useSpreadsheetLayer(points, spreadsheetOptions); // create the underlying spreadsheet layer

  // add mouse/pointer trackings (like green-comet, brute force)
  function findClosestRow(event: PointerEvent) {
    const pt = { x: event.offsetX, y: event.offsetY };
    const raDecDeg = store.findRADecForScreenPoint(pt);
    const targetRaRad = raDecDeg.ra * D2R;
    const targetDecRad = raDecDeg.dec * D2R;

    let minDist = Infinity;
    let closestIndex = -1;
    
    // brute-force search through rows
    rows.forEach((row, i) => {
      const dist = distance(targetRaRad, targetDecRad, row.ra * D2R, row.dec * D2R);
      if (dist < minDist) {
        minDist = dist;
        closestIndex = i;
      }
    });

    if (closestIndex === -1) return null;

    const closest = rows[closestIndex];
    const screenPoint = store.findScreenPointForRADec({ ra: closest.ra, dec: closest.dec });
    
    // check if we are within the pixel threshold
    const pixelDist = Math.sqrt((pt.x - screenPoint.x) ** 2 + (pt.y - screenPoint.y) ** 2);

    return pixelDist < pixelThreshold ? { row: closest, index: closestIndex } : null;
  }

  let lastResult: ReturnType<typeof findClosestRow> = null;
  function onPointerMove(event: PointerEvent) {
    if (!onHover) return;
    const result = findClosestRow(event);
    if (lastResult === null && result === null) return; // both null, no change
    if (result && lastResult?.index === result.index) return; // same row, no change
    onHover(result?.row ?? null, result?.index ?? -1);
    lastResult = result;
  }

  function onPointerDown(_event: PointerEvent) { /* i don't think we need this */ }

  function onPointerUp(_event: PointerEvent) { /* i don't think we need this */ }
  
  function onPointerClick(event: PointerEvent) {
    if (!options.onClick) return;
    const result = findClosestRow(event);
    if (result) {
      console.log("Clicked row:", result.row, "at index:", result.index);
      options.onClick(result.row ?? null, result.index ?? -1);
    }
  }

  return {
    ...spreadsheet,
    onPointerMove,
    onPointerDown,
    onPointerUp,
    onPointerClick,
  };
}
