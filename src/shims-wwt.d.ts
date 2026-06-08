/* eslint-disable @typescript-eslint/naming-convention */

import "@wwtelescope/engine"; // all types are available to typescript here, but i import them specifically below for clarity


declare module "@wwtelescope/engine" {
  interface Table {
    rows: string[][];
    header: string[];
  }
  
  
  // merges with existing SpreadSheetLayer type
  interface SpreadSheetLayer {
    get__table(): Table;
    set__table(table: Table): Table;
    dirty: boolean;
  }
}