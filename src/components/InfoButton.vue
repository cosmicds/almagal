<template>
  <v-dialog v-model="dialogVisible" max-width="500">
    <template #activator="{ props: activatorProps }">
      <v-tooltip :text="tooltipTextValue" :disabled="!showTooltip">
        <template #default>
          <span v-html="tooltipTextValue" />
        </template>
        <template #activator="{ props: moreProps }">
          <slot
            name="activator"
            v-bind="{ ...activatorProps, ...moreProps, show: dialogVisible }"
          >
            <v-icon
              v-bind="{ ...activatorProps, ...moreProps }"
              class="info-button-icon"
              elevation="1"
              icon="mdi-information-variant-circle-outline"
              variant="text"
              @click="dialogVisible = true"
              @keydown="handleKeydown"
            >
            </v-icon>
          </slot>
        </template>
      </v-tooltip>
    </template>
    <v-card class="gradient-background d-flex flex-row ga-0">
      <div class="v-card-info-text ma-2 mr-0">
        <slot>{{ helpText }}</slot>
      </div>
      <div class="info-button-close-icon">
        <v-btn
          class="info-button-close-icon__icon ma-2"
          icon="mdi-close"
          variant="text"
          density="compact"
          @click="dialogVisible = false"
          @keydown="handleKeydown"
        >
        </v-btn>
      </div>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";

const props = defineProps<{
  helpText?: string;
  showTooltip?: boolean;
  tooltipText?: string;
}>();

const dialogVisible = ref(false);
const tooltipTextValue = computed(
  () => props.tooltipText ?? (props.showTooltip ? "Learn More" : undefined),
);

function handleKeydown(event: KeyboardEvent) {
  if (event.key === "Enter") {
    dialogVisible.value = !dialogVisible.value;
  }
}
</script>

<style scoped>
.v-card-info-text {
  font-size: 1em;
  line-height: 1.5em;
  padding-block: 1em;
  padding-inline: 1em;

  flex-grow: 1;

  p {
    margin-block: 0.5em;
  }
}

.v-card-info-text > p {
  margin-bottom: 1em;
}

.info-button-close-icon {
  pointer-events: auto;
}

.info-button-close-icon__icon {
  cursor: pointer;
}

.info-button-icon {
  font-size: 1.3em;
  color: var(--accent-color);
}
</style>
