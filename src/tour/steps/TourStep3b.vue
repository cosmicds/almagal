<template>
  <TourStep title="Three of the 1013">
    <p>
      Dr. Wallace studied the structure of the clumps in ALMAGAL and was able to 
      related their structure to their evolutionary state. 
      
      She found that clumps with less structure (more "isolated") tended to be colder and seemed to be younger (evolutionarily speaking)
      thank clumps with more structure. 
    </p>

    <table class="tour-actions-table">
      <tbody>
        <tr>
          <td>
            <v-btn
              size="small"
              @click="goToSource('AG335.5905+0.1853', 0.00015, 0.0012)"
            >
              Isolated
            </v-btn>
          </td>
          <td>
            AG335.5905+0.1853 &mdash; an isolated source. L/M = 0.10.
          </td>
        </tr>
        <tr>
          <td>
            <v-btn
              size="small"
              @click="goToSource('AG337.1764-0.0321', 0.0002, 0.015)"
            >
              Simple
            </v-btn>
          </td>
          <td>
            AG337.1764-0.0321 &mdash; a source with some structure. L/M = 3.0.
          </td>
        </tr>
        <tr>
          <td>
            <v-btn
              size="small"
              @click="goToSource('AG316.7996-0.0559', 0.00045, 0.012)"
            >
              Rich
            </v-btn>
          </td>
          <td>
            AG316.7996-0.0559 &mdash; a source with a lot of structure. L/M = 11.4.
          </td>
        </tr>
      </tbody>
    </table>

    <div class="tour-btn-row">
      <v-btn size="small" @click="filterCatalog('lm', null, 1)">
        L/M &lt; 1
      </v-btn>
      <v-btn size="small" @click="filterCatalog('lm', 1, 10)">
        1&ndash;10
      </v-btn>
      <v-btn size="small" @click="filterCatalog('lm', 10, null)">
        L/M &gt; 10
      </v-btn>
      <v-btn size="small" @click="resetFilters()">
        All
      </v-btn>
    </div>
  </TourStep>
</template>

<script setup lang="ts">
import TourStep from "../TourStep.vue";
import { resetFilters } from "../../almagal_state";
// the vmin/vmax are measured off each clump's archive FITS; see TOUR_NOTES.md
import { filterCatalog, goToSource } from "../tourActions";
</script>

<style>
.tour-btn-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5em;
  margin-top: 0.75em;
}
</style>