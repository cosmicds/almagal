import { engineStore } from "@wwtelescope/engine-pinia";
import { Color } from "@wwtelescope/engine";
import { MarkerScales, PlotTypes } from "@wwtelescope/engine-types";

export type MarkerType = "gaussian" | "point" | "circle";

export interface SpreadsheetLayerOptions {
  name?: string;
  color?: string; 
  markerSize?: number;
  markerType?: MarkerType;
}

const MARKER_TYPE_MAP: Record<MarkerType, PlotTypes> = {
  gaussian: PlotTypes.gaussian,
  point: PlotTypes.point,
  circle: PlotTypes.circle,
};

function buildCsv(points: [number, number][]): string {
  const rows = points.map(([ra, dec]) => `${ra},${dec}`).join("\r\n");
  return `ra,dec\r\n${rows}`;
}

export function useSpreadsheetLayer(
  points: [number, number][],
  options: SpreadsheetLayerOptions = {}
) {
  const store = engineStore();
  // with defaults
  const {
    name = "spreadsheet-layer",
    color = "#ffffff",
    markerSize = 10,
    markerType = "circle",
  } = options;

  const ready = store.waitForReady().then(async () => {
    console.log(points);
    const dataCsv = buildCsv(points);
    const l = await store.createTableLayer(
      { 
        name, 
        referenceFrame: "Sky", 
        dataCsv 
      });
    l.set_lngColumn(0);
    l.set_latColumn(1);
    l.set_markerScale(MarkerScales.screen);
    l.set_color(Color.fromHex(color));
    l.set_scaleFactor(markerSize);
    l.set_plotType(MARKER_TYPE_MAP[markerType]);
    l.set_opacity(1);
    console.log(l);
  });

  return { ready };
}
