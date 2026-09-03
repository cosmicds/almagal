<template>
  <TourStep title="Two of the 1013">
    <p>
      ALMA sees a similar amount of emission in each of these two clumps, but arranged very
      differently. The ALMAGAL team found that as clumps evolve there is moderate trend towards more complex stuctures. 
    </p>

    <table class="tour-actions-table">
      <tbody>
        <tr>
          <td>
            <v-btn
              size="small"
              variant="outlined"
              @click="goToSource('AG028.5671-0.2329', 0.0002, 0.004)"
            >
              Regular
            </v-btn>
          </td>
          <td>
            One compact, roughly round patch of emission. 8200 M<sub>&#9737;</sub> of dust at 9 K,
            barely lit: L/M = 0.05.
          </td>
        </tr>
        <tr>
          <td>
            <v-btn
              size="small"
              variant="outlined"
              @click="goToSource('AG288.9609+0.2643', 0.00015, 0.002)"
            >
              Complex
            </v-btn>
          </td>
          <td>
            The same emission, broken into a straggling shape. 16 times less massive, 34 times more
            luminous: L/M = 26.
          </td>
        </tr>
      </tbody>
    </table>

    <p>
      That is the survey&rsquo;s finding in miniature: the more evolved a clump is, the more complex
      the structure inside it. L/M is the clock &mdash; use it to cut the catalog by stage.
    </p>

    <table class="tour-actions-table">
      <tbody>
        <tr>
          <td>
            <v-btn
              size="small"
              variant="outlined"
              @click="filterCatalog('lm', null, 1)"
            >
              L/M &lt; 1
            </v-btn>
          </td>
          <td>423 clumps in the earliest stages, still cold.</td>
        </tr>
        <tr>
          <td>
            <v-btn
              size="small"
              variant="outlined"
              @click="filterCatalog('lm', 1, 10)"
            >
              1&ndash;10
            </v-btn>
          </td>
          <td>318 with protostars already warming them from inside.</td>
        </tr>
        <tr>
          <td>
            <v-btn
              size="small"
              variant="outlined"
              @click="filterCatalog('lm', 10, null)"
            >
              L/M &gt; 10
            </v-btn>
          </td>
          <td>270 of the most evolved, up to the HII region stage.</td>
        </tr>
        <tr>
          <td>
            <v-btn
              size="small"
              variant="text"
              @click="resetFilters()"
            >
              All
            </v-btn>
          </td>
          <td>Clear the cut and put the whole sample back.</td>
        </tr>
      </tbody>
    </table>
  </TourStep>
</template>

<script setup lang="ts">
import TourStep from "../TourStep.vue";
import { resetFilters } from "../../almagal_state";
// the vmin/vmax are measured off each clump's archive FITS; see TOUR_NOTES.md
import { filterCatalog, goToSource } from "../tourActions";
</script>
