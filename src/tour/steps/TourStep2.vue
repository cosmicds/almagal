<template>
  <TourStep title="Step 2">
    <v-img
      class="step-image"
      src="https://picsum.photos/200"
      alt=""
    ></v-img>
    <p>
      Interesting text
    </p>
  </TourStep>
</template>

<script setup lang="ts">
import { toRef } from "vue";
import { D2R } from "@wwtelescope/astro";
import TourStep from "../TourStep.vue";
import { useTourStep } from "../useTourStep";

const props = defineProps<{ active: boolean }>();

// out along the plane to Eta Carinae (10 45 03.00 -59 41 04.00)
useTourStep(toRef(props, "active"), (store) => {
  store.gotoRADecZoom({
    raRad: (10 + 45 / 60 + 3.00 / 3600) * 15 * D2R,
    decRad: -(59 + 41 / 60 + 4.00 / 3600) * D2R,
    zoomDeg: 5,
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
