/* eslint-disable @typescript-eslint/no-explicit-any */
import { engineStore } from "@wwtelescope/engine-pinia";
import { Color, SpreadSheetLayer } from "@wwtelescope/engine";
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function jsonToCsv(jsonData: any[]): string {
  if (jsonData.length === 0) {
    return '';
  }

  const headers = Object.keys(jsonData[0]);
  const csvRows = [headers.join(',')];

  for (const row of jsonData) {
    const values = headers.map(header => {
      // const escaped = ('' + row[header]).replace(/"/g, '\\"');
      // return `"${escaped}"`;
      return row[header];
    });
    csvRows.push(values.join(','));
  }

  return csvRows.join('\n').replace(/\n/g, "\r\n");
}

function buildCsv(points: [number, number][]): string {
  const rows = points.map(([ra, dec]) => `${ra},${dec}`).join("\r\n");
  return `ra,dec\r\n${rows}`;
}

/** A row keyed by column name, e.g. `{ ra: "1.23", dec: "4.56", mass: "750" }`. */
type NamedRow = Record<string, string>;

let originalRows: string[][] | null = null;
let originalNamedRows: NamedRow[] | null = null;
let originalLayer: SpreadSheetLayer | null = null;

interface CoordinateJson extends Record<string, any> {
  ra: number;
  dec: number;
}
export function useSpreadsheetLayer(
  points: [number, number][] | CoordinateJson[],
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
    if (points.length === 0) {
      console.warn("No points provided to useSpreadsheetLayer");
      return;
    }
    let dataCsv: string | undefined;
    let latCol = 1;
    let lonCol = 0;
    if (Array.isArray(points) && Array.isArray(points[0]) && points[0].length === 2) {
      dataCsv = buildCsv(points as [number, number][]);
    } else if (Array.isArray(points) && "ra" in points[0] && "dec" in points[0]) {
      dataCsv = jsonToCsv(points as CoordinateJson[]);
      // get the first row to determine which columns are ra/dec
      const firstRow = dataCsv.split("\r\n")[0].split(",");
      latCol = firstRow.findIndex(h => h.toLowerCase() === "dec");
      lonCol = firstRow.findIndex(h => h.toLowerCase() === "ra");
    } else {
      throw new Error("Invalid points format for useSpreadsheetLayer");
    }
    
    const l = await store.createTableLayer(
      { 
        name, 
        referenceFrame: "Sky", 
        dataCsv 
      });
    l.set_lngColumn(lonCol);
    l.set_latColumn(latCol);
    l.set_markerScale(MarkerScales.screen);
    l.set_color(Color.fromHex(color));
    l.set_scaleFactor(markerSize);
    l.set_plotType(MARKER_TYPE_MAP[markerType]);
    l.set_opacity(1);
    console.log("Created spreadsheet layer", l);
    originalLayer = l;
    const table = l.get__table();
    originalRows = table.rows.slice(); // make a copy
    const header = table.header;
    originalNamedRows = originalRows.map(row => {
      const named: NamedRow = {};
      header.forEach((h, i) => { named[h] = row[i]; });
      return named;
    });
    return l;
  });
  
  type Filter = (row: NamedRow) => boolean;

  // A single, user-customizable filter. Defaults to keeping every row; the
  // consumer overrides it via setFilter().
  let filter: Filter = () => true;
  function setFilter(f: Filter) {
    filter = f;
  }

  // Apply the current filter to the table.
  function applyFilter() {
    if (!originalLayer) return;
    if (!originalRows || !originalNamedRows) return;
    const t = originalLayer.get__table();
    // Test against the named view, but keep the positional row the table needs.
    t.rows = originalRows.filter((_, i) => filter(originalNamedRows![i]));
    originalLayer.set__table(t);
    originalLayer.dirty = true; // mark layer as dirty to trigger re-render
  }

  return { ready, applyFilter, setFilter };
}
