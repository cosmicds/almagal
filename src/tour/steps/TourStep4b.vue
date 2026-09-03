<template>
  <TourStep title="Have a look around">
    <p>
      Every slider in the filter panel cuts the catalog on one of those properties. Mass is a good
      place to start:
    </p>

    <table class="tour-actions-table">
      <tbody>
        <tr>
          <td>
            <v-btn
              size="small"
              variant="outlined"
              @click="filterCatalog('mass', 2000, null)"
            >
              High mass
            </v-btn>
          </td>
          <td>The 118 heaviest clumps, 2000 M<sub>&#9737;</sub> and up.</td>
        </tr>
        <tr>
          <td>
            <v-btn
              size="small"
              variant="outlined"
              @click="filterCatalog('mass', null, 500)"
            >
              Low mass
            </v-btn>
          </td>
          <td>The 132 lightest, 500 M<sub>&#9737;</sub> and below.</td>
        </tr>
        <tr>
          <td>
            <v-btn
              size="small"
              variant="text"
              @click="resetFilters()"
            >
              Clear
            </v-btn>
          </td>
          <td>Back to the whole catalog.</td>
        </tr>
      </tbody>
    </table>

    <p>
      Click any green marker for a clump&rsquo;s properties, and its ALMA image on request. And
      since every clump has a measured distance, these are real positions in the Galaxy rather than
      directions on the sky &mdash; <b>Switch to 3D</b>, top left, to go and look.
    </p>
  </TourStep>
</template>

<script setup lang="ts">
import TourStep from "../TourStep.vue";
import { resetFilters } from "../../almagal_state";
import { filterCatalog } from "../tourActions";
</script>
