<template>
  <TourStep title="Behind the dust">
    <p>
      Other high-mass regions are hundreds to thousans of parsecs away, deep in the dusty plane of the
      Galaxy. This is one of them, in the Carina arm.
    </p>

    <table class="tour-actions-table">
      <tbody>
        <tr>
          <td>
            <v-btn
              size="small"
              variant="outlined"
              @click="showBackground('none')"
            >
              Visible light
            </v-btn>
          </td>
          <td>Foreground stars, and dark lanes where dust blots out everything behind it.</td>
        </tr>
        <tr>
          <td>
            <v-btn
              size="small"
              variant="outlined"
              @click="showBackground('herschel')"
            >
              Far-infrared
            </v-btn>
          </td>
          <td>
            The same dust, glowing. This is the <i>Herschel</i> Hi-GAL survey that ALMAGAL&rsquo;s
            targets were picked from.
          </td>
        </tr>
      </tbody>
    </table>
  </TourStep>
</template>

<script setup lang="ts">
import TourStep from "../TourStep.vue";
import { showBackground } from "../tourActions";
</script>
