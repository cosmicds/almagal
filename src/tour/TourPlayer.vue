<template>
  <div class="tour-player">
    <div class="tour-nav">
      <v-btn
        density="compact"
        elevation="0"
        variant="text"
        icon="mdi-chevron-left"
        aria-label="Previous step"
        :disabled="step === 0"
        @click="step--"
      ></v-btn>

      <v-breadcrumbs
        class="tour-crumbs pa-0"
        density="compact"
        :items="crumbs"
      >
        <template #divider>
          <v-icon icon="mdi-chevron-right"></v-icon>
        </template>
        <template #title="{ index }">
          <span
            class="tour-crumb"
            :class="{ 'tour-crumb--active': index === step }"
            role="button"
            tabindex="0"
            @click="step = index"
            @keyup.enter="step = index"
          >{{ index + 1 }}</span>
        </template>
      </v-breadcrumbs>

      <v-btn
        density="compact"
        elevation="0"
        variant="text"
        icon="mdi-chevron-right"
        aria-label="Next step"
        :disabled="step === TOUR_STEPS.length - 1"
        @click="step++"
      ></v-btn>
    </div>

    <v-window
      v-model="step"
      class="tour-window"
    >
      <v-window-item
        v-for="(component, index) in TOUR_STEPS"
        :key="index"
        :value="index"
      >
        <component
          :is="component"
          :active="index === step"
        />
      </v-window-item>
    </v-window>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { TOUR_STEPS } from "./steps";

const step = ref(0);

const crumbs = computed(() =>
  TOUR_STEPS.map((_component, index) => ({
    title: String(index + 1),
    disabled: false,
  }))
);
</script>

<style scoped lang="less">
.tour-nav {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0.25em;
}

.tour-crumb {
  cursor: pointer;
  opacity: 0.6;

  &--active {
    opacity: 1;
    font-weight: bold;
  }
}
</style>
