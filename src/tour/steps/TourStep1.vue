<template>
  <TourStep title="Step 1">
    <v-img
      class="step-image"
      src="https://picsum.photos/200"
      alt=""
    ></v-img>
    <p>
      Interesting text about ALMAGAL purpose and sources
    </p>
  </TourStep>
</template>

<script setup lang="ts">
import { toRef } from "vue";
import { D2R } from "@wwtelescope/astro";
import TourStep from "../TourStep.vue";
import { useTourStep } from "../useTourStep";

const props = defineProps<{ active: boolean }>();

// https://simbad.cds.unistra.fr/simbad/sim-id?Ident=gal+center 17 45 39.60213 -29 00 22.0000
useTourStep(toRef(props, "active"), (store) => {
  store.gotoRADecZoom({
    raRad: (17 + 45 / 60 + 39.60213 / 3600) * 15 * D2R,
    decRad: -(29 + 0 / 60 + 22.0000 / 3600) * D2R,
    zoomDeg: 60,
    instant: false,
  });
});
</script>

<style scoped lang="less">
.step-image {
  float: right;
  width: 40%;
  max-width: 200px;
  margin: 0 0 0.5em 1em;
  border-radius: 4px;
}
</style>
