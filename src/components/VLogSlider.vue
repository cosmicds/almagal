<!-- A super-thin wrapper around Vuetify's v-slider that operates on a
  logarithmic scale. Everything is forwarded down to v-slider via $attrs;
  only `min`, `max`, `step` and the v-model are intercepted so that the
  exposed model value maps logarithmically onto the linear slider track.

  Note: a log scale requires a strictly positive range, so `min`/`max`
  (and the model value) are clamped to a small positive epsilon. -->
<template>
  <v-slider
    v-bind="$attrs"
    :model-value="sliderValue"
    :min="logMin"
    :max="logMax"
    :step="logStep"
    @update:model-value="onSliderInput"
  ></v-slider>
</template>

<script setup lang="ts">
import { computed } from "vue";

defineOptions({ inheritAttrs: false });

// Only the props we actually intercept are declared here; everything else
// (color, hide-details, class, ...) is forwarded to v-slider via $attrs.
const props = withDefaults(
  defineProps<{
    modelValue: number;
    min?: number;
    max?: number;
  }>(),
  { min: 1, max: 100 }
);

const emit = defineEmits<
  (e: "update:modelValue", value: number) => void
>();

// The symlog transition scale: the curve is ~linear for |x| < stepSize and
// logarithmic beyond it. Derived from the range so it tracks min/max changes.
const epsilon = 1e-10;
const stepSize = computed((): number => props.max !== props.min ? (props.max - props.min) / 1000 : epsilon);

// simple symlog transformation. linear around step-size
function symlogForward(x: number, c: number): number {
  // y = sign(x) * log10(|x/C| + 1)
  const sign = Math.sign(x);
  const absOverC = Math.abs(x / c);
  return sign * Math.log10(absOverC + 1);
}

function symlogInverse(y: number, c: number): number {
  // x = sign(y) * C * (-1 + 10^|y|)
  const sign = Math.sign(y);
  const abs = Math.abs(y);
  return sign * c * (-1 + Math.pow(10, abs));
}

const logMin = computed(() => symlogForward(props.min, stepSize.value));
const logMax = computed(() => symlogForward(props.max, stepSize.value));
const sliderValue = computed(() => symlogForward(props.modelValue, stepSize.value));
const logStep = computed(() => (logMax.value - logMin.value) / 1000);

function onSliderInput(v: number) {
  emit("update:modelValue", symlogInverse(v, stepSize.value));
}
</script>
