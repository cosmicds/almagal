<template>
  <TourStep title="Step 3">
    <v-img
      class="step-image"
      :src="source?.photo_url ?? 'https://picsum.photos/200'"
      alt=""
    ></v-img>
    <p>
      Interesting text about {{ SOURCE_NAME }}
    </p>
  </TourStep>
</template>

<script setup lang="ts">
import { toRef } from "vue";
import { D2R } from "@wwtelescope/astro";
import TourStep from "../TourStep.vue";
import { useTourStep } from "../useTourStep";
import { getAlmagalSourceByName } from "../../almagal_utils";

const props = defineProps<{ active: boolean }>();

// example: look a source up by its ALMAGAL name and fly to it
const SOURCE_NAME = "AG342.7054+0.1251";
const source = getAlmagalSourceByName(SOURCE_NAME);

useTourStep(toRef(props, "active"), (store) => {
  if (!source) {
    console.warn(`Tour step 3: no ALMAGAL source named ${SOURCE_NAME}`);
    return;
  }
  store.gotoRADecZoom({
    raRad: source.ra * D2R,
    decRad: source.dec * D2R,
    zoomDeg: 0.05,
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
