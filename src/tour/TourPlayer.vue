<template>
  <div class="tour-player">
    <v-window
      v-model="step"
      class="tour-window"
    >
      <v-window-item
        v-for="(component, index) in TOUR_STEPS"
        :key="index"
        :value="index + 1"
      >
        <component :is="component" />
      </v-window-item>
    </v-window>

    <TourBreadcrumbs
      :step="step"
      :total-steps="TOUR_STEPS.length"
      show-back-on-first-step
      show-next-on-last-step
      @previous="step--"
      @next="step++"
      @step="(n) => step = n"
    >
      <template #back>
        <v-btn
          class="tour-nav-button"
          density="compact"
          elevation="0"
          variant="text"
          icon="mdi-chevron-left"
          aria-label="Previous step"
          :disabled="step === 1"
          @click="step--"
        ></v-btn>
      </template>
      <template #next>
        <v-btn
          class="tour-nav-button"
          density="compact"
          elevation="0"
          variant="text"
          icon="mdi-chevron-right"
          aria-label="Next step"
          :disabled="step === TOUR_STEPS.length"
          @click="step++"
        ></v-btn>
      </template>
    </TourBreadcrumbs>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { TOUR_STEPS } from "./steps";
import { setupTourStep } from "./tourActions";
import TourBreadcrumbs from "./TourBreadcrumbs.vue";

// 1-indexed, to match the step numbers shown and `setupTourStep`
const step = ref(1);

watch(step, (n) => setupTourStep(n), { immediate: true });
</script>

<style scoped lang="less">
.tour-player {
  display: flex;
  flex-direction: column;
}

/* TourBreadcrumbs fills its own buttons in accent colour; these are bare
   chevrons. Two classes deep to beat its `.tour-text-controls .v-btn`. */
.tour-text-controls .tour-nav-button {
  border: none;
  background-color: transparent;
}
</style>
