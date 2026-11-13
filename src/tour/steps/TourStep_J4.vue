<template>
  <TourStep title="Explore the survey">
    <p>
      Each ALMAGAL region has measured properties you can filter on: its mass, luminosity, L/M
      ratio, dust temperature, and distance. Try narrowing the catalog by evolutionary stage:
    </p>

    <!-- TODO: L/M cutoffs are placeholders; confirm values with the science team -->
    <table class="tour-actions-table">
      <tbody>
        <tr>
          <td>
            <v-btn
              size="small"
              @click="filterCatalog('lm', null, 1)"
            >
              Young
            </v-btn>
          </td>
          <td>Low L/M: the earliest stages of star formation.</td>
        </tr>
        <tr>
          <td>
            <v-btn
              size="small"
              @click="filterCatalog('lm', 10, null)"
            >
              Evolved
            </v-btn>
          </td>
          <td>High L/M: more evolved, more luminous regions.</td>
        </tr>
        <tr>
          <td>
            <v-btn
              size="small"
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
      &ldquo;Are there any trends with the age of a star forming region and where it is in the
      Galaxy? With respect to spiral arms?&rdquo;
    </p>
    <p>
      &ldquo;Are more evolved regions (higher L/M) found in cold, dusty filaments (seen as dark
      clumps in the Spitzer GLIMPSE data)?&rdquo;
    </p>
    <p>
      <v-btn
        size="small"
        @click="showBackground('glimpse')"
      >
        Show GLIMPSE
      </v-btn>
    </p>
    <p>
      The shape of the dust in a forming protocluster can be tied to its evolutionary stage. Play
      around with these filters and see what patterns you can find!
    </p>
  </TourStep>
</template>

<script setup lang="ts">
import TourStep from "../TourStep.vue";
import { resetFilters } from "../../almagal_state";
import { filterCatalog, showBackground } from "../tourActions";
</script>
