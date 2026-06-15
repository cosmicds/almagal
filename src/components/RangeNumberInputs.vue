<!-- min/max number inputs + a <double-range-slider>, all bound to one {min,max} model -->
<template>
  <div class="range-number-inputs">
    <div class="rni-numbers">
      <input
        v-if="false"
        v-model.number="minValue"
        type="number"
        :min="min"
        :max="max"
      >
      <span class="rni-display">{{ formatSigFigs(minValue) }}</span>
      <span class="sep">&mdash;</span>
      <input
        v-if="false"
        v-model.number="maxValue"
        type="number"
        :min="min"
        :max="max"
      >
      <span class="rni-display">{{ formatSigFigs(maxValue) }}</span>
    </div>
    <div 
      :class="['rni-drs', sliderFiducial ? 'has-fiducial' : '']"
      :style="{'--fiducial-value': sliderFiducial}"
    >
      <double-range-slider
        ref="sliderEl"
        :min="sliderMin"
        :max="sliderMax"
        :step="sliderStep"
        @input="onSliderInput"
      />
      <span
        v-if="sliderFiducial"
        class="rni-fiducial-display"
      ></span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, watch } from "vue";
import { DoubleRangeSlider } from "double-range-slider-web";

// Register the custom element <double-range-slider> (idempotent: no-ops if
// already registered, so it's fine for this component to own it).
DoubleRangeSlider.register();

const model = defineModel({
  type: Object as () => { min: number | null; max: number | null },
  required: true,
});

const props = defineProps<{
  min: number;
  max: number;
  steps?: number;
  log?: boolean;
  fiducial?: number;
}>();

const transform = (v: number) => props.log ? Math.log10(v) : v;
const inverse = (v: number) => props.log ? 10 ** v : v;

const formatSigFigs = (v: number, sigFigs = 3) =>
  Number.isFinite(v) ? Number(v.toPrecision(sigFigs)).toString() : String(v);

const minValue = computed({
  get: () => model.value.min ?? props.min,
  set: (value) => {
    model.value.min = value;
  },
});
const maxValue = computed({
  get: () => model.value.max ?? props.max,
  set: (value) => {
    model.value.max = value;
  },
});


// Slider bounds/step live in slider (possibly log10) space.
const sliderMin = computed(() => transform(props.min));
const sliderMax = computed(() => transform(props.max));
const sliderStep = computed(() => (sliderMax.value - sliderMin.value) / (props.steps ?? 100));
const sliderFiducial = computed(() => props.fiducial ? (transform(props.fiducial) - sliderMin.value)/(sliderMax.value - sliderMin.value) : undefined);

const sliderEl = ref<DoubleRangeSlider | null>(null);

// slider -> model (detail is the [lower, upper] pair, in slider space)
function onSliderInput(event: Event) {
  const [lower, upper] = (event as CustomEvent<[number, number]>).detail;
  model.value.min = inverse(lower);
  model.value.max = inverse(upper);
}

watch([minValue, maxValue], ([lo, hi]) =>
  sliderEl.value?.setValues(transform(lo), transform(hi))
);

onMounted(() => {
  sliderEl.value?.setValues(transform(minValue.value), transform(maxValue.value));
  
  // override an internal style of the double-range-slider
  // https://stackoverflow.com/questions/37352637/shadow-dom-styling-from-the-outside
  const root = sliderEl.value?.shadowRoot;
  if (root) {
    // instead of trying to setAttribute on some select, just get the style and append what we want
    const style = document.createElement("style");
    style.textContent = ".slider-container { padding-right: 0; }";
    root.appendChild(style);
  }
});
</script>

<style lang="less">
.range-number-inputs {
  display: grid;
  grid-template-columns: auto;
  grid-template-rows:auto auto;
  margin-inline: 0.5em;
}

.rni-numbers {
  display: flex;
  justify-content: space-between;
}

.sep {
  text-align: center;
}

.rni-numbers > input {
  width: min-content;
  outline: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 4px;
  padding-left: 2px;
  padding-right: 2px;
}

.rni-numbers > input::hover {

}
.rni-numbers > input:last-child {
  text-align: right;
}

.rni-display {
  width: min-content;
  padding-left: 2px;
  padding-right: 2px;
}

.rni-display:last-of-type {
  text-align: right;
}


.range-number-inputs > * {
}

.rni-drs {
  position: relative;
  padding-top: 0.75em;
  padding-bottom: 0.75em;
  padding-left: 0;
  padding-right: 0;
}

/* after puts it on top, before will put it below the track */
//The 14 px comes from out setting for the thumb width. 
.rni-fiducial-display {
  position: absolute;
  top: 0;
  left: 7px;
  right: 7px;
  bottom: 0;
  pointer-events: none;
}
.rni-fiducial-display::after {
  content: "";
  position: absolute;
  left: calc(var(--fiducial-value) * 100%);
  top: 50%;
  height: 75%;
  transform: translateY(-50%) translateX(50%);
  width: auto;
  border: 2px solid hsl(327, 70%, 90%);
  
}

double-range-slider {
  --dri-track-color: #ccc;
  --dri-track-filled-color: #f72d9c;
  --dri-thumb-width: 14px;
  --dri-thumb-height: 14px;
}
</style>
