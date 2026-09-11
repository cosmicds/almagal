<!-- min/max number inputs + a <double-range-slider>, all bound to one {min,max} model -->
<template>
  <div class="range-number-inputs">
    <!-- Typing a bound beats dragging to it on a log range spanning orders of
         magnitude. The field shows the rounded value while idle and the full
         value once focused, so editing never starts from a truncated number. -->
    <div class="rni-numbers">
      <input
        class="rni-display"
        type="number"
        :value="minFocused ? minValue : formatSigFigs(minValue)"
        :min="min"
        :max="max"
        :aria-label="ariaLabel ? `${ariaLabel} minimum` : 'Minimum'"
        @focus="minFocused = true"
        @blur="minFocused = false"
        @change="commit('min', $event)"
      >
      <input
        class="rni-display"
        type="number"
        :value="maxFocused ? maxValue : formatSigFigs(maxValue)"
        :min="min"
        :max="max"
        :aria-label="ariaLabel ? `${ariaLabel} maximum` : 'Maximum'"
        @focus="maxFocused = true"
        @blur="maxFocused = false"
        @change="commit('max', $event)"
      >
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
import { formatSigFigs } from "../almagal_utils";

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
  ariaLabel?: string;
}>();

const minFocused = ref(false);
const maxFocused = ref(false);

/* Clamp to the column's own extent and keep the pair ordered, so a typed bound
   can't invert the range or push the slider off its track. A blank or
   unparseable entry resets that end to the column extreme. */
function commit(end: "min" | "max", event: Event) {
  const raw = (event.target as HTMLInputElement).value;
  const parsed = raw === "" ? NaN : Number(raw);
  const fallback = end === "min" ? props.min : props.max;
  const clamped = Math.min(Math.max(Number.isNaN(parsed) ? fallback : parsed, props.min), props.max);

  if (end === "min") {
    minValue.value = Math.min(clamped, maxValue.value);
  } else {
    maxValue.value = Math.max(clamped, minValue.value);
  }
}

const transform = (v: number) => props.log ? Math.log10(v) : v;
const inverse = (v: number) => props.log ? 10 ** v : v;

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

.rni-display {
  /* Room for seven characters, the widest formatSigFigs(v, 3) output these
     columns produce ("524000", "0.00123"). box-sizing is border-box, so the
     16px of padding and border below has to be added back explicitly -- a bare
     7ch is the whole field and leaves only about three characters of content.
     Fixed rather than sized to content so the boxes don't resize mid-drag. */
  width: calc(7ch + 16px);
  padding: 2px 7px;
  border: 1px solid var(--panel-border, rgba(255, 255, 255, 0.3));
  border-radius: 4px;
  background: transparent;
  color: var(--panel-value, inherit);
  font-size: var(--panel-font-body, 0.8125rem);
  /* Right-justified with tabular figures so the digits sit on a fixed grid:
     the ones column stays put as a value gains or loses digits mid-drag,
     instead of the whole number sliding. */
  text-align: right;
  font-variant-numeric: tabular-nums;

  &:hover {
    border-color: var(--panel-accent, rgba(255, 255, 255, 0.6));
  }

  &:focus-visible {
    outline: 2px solid var(--panel-accent, #3D96EE);
    outline-offset: 1px;
  }

  // The spinners cramp an already narrow field and mis-step a log range.
  &::-webkit-inner-spin-button,
  &::-webkit-outer-spin-button {
    appearance: none;
    margin: 0;
  }
  appearance: textfield;
}


.rni-drs {
  position: relative;
  margin-top: 0.25em;
  padding-top: 0.5em;
  padding-bottom: 0.5em;
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
  // Colors come from the panel tokens in ALMAGAL.vue; only geometry here.
  --dri-thumb-width: 14px;
  --dri-thumb-height: 14px;
}
</style>
