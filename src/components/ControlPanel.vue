<!-- Mounted in the info sheet's CONTROLS tab, or in the tour sheet with most
     cards hidden. State lives in almagal_state, not here. -->
<template>
  <div class="settings-page">
    <v-expansion-panels
      v-model="settingsPanels"
      variant="accordion"
      multiple
      eager
      elevation="0"
    >
      <v-expansion-panel v-if="!hideSourceFilters" value="filters" class="mb-2">
        <v-expansion-panel-title>
          <h4>Source Filters</h4>
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <div v-if="!hideClumpType" class="clump-type-filter">
            <div class="clump-type-header">
              <span>Clump type</span><InfoButton
                :show-tooltip="true"
                :tooltip-text="'Filter the sources by their clump type'"
              >
                <div class="info-button-text">
                  The clump type tells you how complex a source's shape is,
                  which is related to it's evolutionary stage. We have several classifications
                  <ul>
                    <li><b>Empty</b> - no clump detected</li>
                    <li><b>Isolated</b> - Individual disconnected clumps</li>
                    <li><b>Simple</b> - A few connected clumps</li>
                    <li><b>Rich</b> - larger clumps which themselves may contain other "simple" or "rich" strucutres</li>
                  </ul>
                </div>
              </InfoButton>
              <span class="clump-type-actions">
                <button
                  type="button"
                  @click="clumpTypeFilter = [...CLUMP_TYPES]"
                >
                  All
                </button>
                <span aria-hidden="true">&middot;</span>
                <button
                  type="button"
                  @click="clumpTypeFilter = []"
                >
                  None
                </button>
              </span>
            </div>
            <div class="clump-type-options">
              <label
                v-for="type in CLUMP_TYPES"
                :key="type"
                class="clump-type-option"
              >
                <input
                  v-model="clumpTypeFilter"
                  type="checkbox"
                  :value="type"
                />
                <span
                  class="clump-type-swatch"
                  :style="{
                    backgroundColor: clumpTypeColor(type),
                    color: clumpTypeCheckColor(type),
                  }"
                ></span>
                <span class="clump-type-label">{{ type }}</span>
              </label>
            </div>
          </div>
          <fieldset
            class="almagal-filterset"
          >
            <hr v-if="!hideClumpType" class="mt-5 mb-3" />
            <div class="clump-type-header">
              Properties
            </div>
            <!-- mass, lum, lm, tdust, dist_ag, tbol -->
            <div
              v-for="field in filterFields"
              v-show="!(hideDisabled && disableFilters.includes(field))"
              :key="field"
              class="filter-slider"
            >
              <div class="filter-slider-and-label">
                <div class="d-flex justify-space-between">
                  <!-- The hovered source's value is no longer read out
                      here: RangeNumberInputs shows it as a callout
                      over that source's marker on the track. -->
                  <span
                    class="filter-field-label"
                    :class="{ 'filter-field-label-disabled': disableFilters.includes(field) }"
                    v-html="filterFieldLabels[field]"
                  ></span>
                  <InfoButton
                    :help-text="filterFieldLabels[field]"
                    :show-tooltip="true"
                    :tooltip-text="`What is ${filterFieldLabels[field]}?`"
                  />
                </div>
                <RangeNumberInputs
                  :model-value="filterSpec.get(field)!"
                  :min="almagalColumnRanges[field].min"
                  :max="almagalColumnRanges[field].max"
                  :aria-label="filterFieldLabels[field]"
                  :fiducial="hoveredSource ? hoveredSource[field] : undefined"
                  :steps="500"
                  :disabled="disableFilters.includes(field)"
                  log
                  @update:model-value="(val) => filterSpec.set(field, val)"
                />
              </div>
            </div>
          </fieldset>
        </v-expansion-panel-text>
      </v-expansion-panel>
      <v-expansion-panel
        v-if="!hideAlmagalImages"
        value="imageset-settings"
        class="mb-2"
        :disabled="!almagalWtml?.loaded"
      >
        <TwoLevelExpansionPanelTitle class="ga-1">
          <template #title>
            <h4>ALMAGAL Images</h4>
          </template>
          <template #bottom>
            <ImagesetOpacity
              v-for="layer in almagalWtml?.imagesetLayers"
              :key="layer.id.toString()"
              :imageset="store.imagesetStateForLayer(layer.id.toString())!"
            >
              <template #default="{on}">
                <v-slider
                  v-bind="on"
                  :min="0"
                  :max="1"
                  :step="0.01"
                  hide-details
                  density="compact"
                  prepend-icon="mdi-circle-opacity"
                  aria-label="Comparison image opacity"
                />    
              </template>
            </ImagesetOpacity>
          </template>
        </TwoLevelExpansionPanelTitle>
        <v-expansion-panel-text>
          <div class="d-flex flex-column ga-6">
            <!-- note - the sliders are logarithmic even if the stretch is not -->
            <ImagesetStretch
              v-for="layer in almagalWtml?.imagesetLayers"
              :key="layer.id.toString()"
              :imageset="store.imagesetStateForLayer(layer.id.toString())!"
              log-stretch-slider
              hide-stretch
              :crange="{min: -0.001, max: 1}"
            />
            <ImagesetColormap
              v-for="layer in almagalWtml?.imagesetLayers"
              :key="layer.id.toString()"
              :imageset="store.imagesetStateForLayer(layer.id.toString())!"
            >
              <template #default="{on, colormaps}">
                <!-- on = {modelValue, 'onUpdate:modelVaue'} to simulate the v-model -->
                <v-select
                  v-bind="on"
                  :items="colormaps"
                  item-title="desc"
                  item-value="wwt"
                  label="Colormap"
                  hide-details
                  density="compact"
                  variant="outlined"
                />
              </template>
            </ImagesetColormap>
            <v-btn
              v-for="layer in almagalWtml?.imagesetLayers"
              :key="layer.id.toString()"
              variant="outlined"
              @click="() => resetFitsImagesetSettings(layer)"
              @keyup.enter="() => resetFitsImagesetSettings(layer)"
            >
              Reset
            </v-btn>
          </div>
        </v-expansion-panel-text>
      </v-expansion-panel>
      <v-expansion-panel v-if="!hideBackgroundSurveys" value="background" class="mb-2">
        <TwoLevelExpansionPanelTitle class="ga-1">
          <template #title>
            <h4>Background Surveys</h4>
          </template>
          <template #bottom>
            <v-slider
              v-model="foregroundOpacity"
              :min="0"
              :max="1"
              :step="0.01"
              hide-details
              density="compact"
              prepend-icon="mdi-circle-opacity"
              aria-label="Background survey opacity"
              :disabled="in3dView || !foregroundImageLoaded"
            />
          </template>
        </TwoLevelExpansionPanelTitle>
        <v-expansion-panel-text>
          <wwt-3d-switch
            class="mb-4"
            @3d="emit('setup3d')"
          >
            <template #default="{ onClick}">
              <!-- The knob carries no icon: the state is already named
                  by the two labels either side of it. -->
              <div class="d-flex align-center ga-2">
                <span
                  class="dimension-label"
                  :class="{ 'is-active': !in3dView }"
                >2D</span>
                <v-switch
                  :model-value="in3dView"
                  inset
                  hide-details
                  density="compact"
                  aria-label="Switch between the 2D sky view and the 3D view"
                  @click="onClick"
                />
                <span
                  class="dimension-label"
                  :class="{ 'is-active': in3dView }"
                >3D</span>
              </div>
            </template>
          </wwt-3d-switch>
          <v-select
            v-model="foregroundImage"
            class="almagal-v-select mb-4"
            :items="foregroundImageOptions"
            item-title="label"
            item-value="value"
            label="Background survey"
            hide-details
            density="compact"
            variant="outlined"
            :disabled="in3dView"
          />
          <p class="settings-hint">
            Opacity of {{ foregroundImageLabel }} (foreground image) over the backgroun GAIA DR2 image.
          </p>
        </v-expansion-panel-text>
      </v-expansion-panel>
      <v-expansion-panel v-if="!hideComparisonImages" value="comparison" class="mb-2">
        <TwoLevelExpansionPanelTitle class="ga-1">
          <template #title>
            <h4>Comparison Images</h4>
          </template>
          <template #bottom>
            <v-slider
              v-if="!in3dView && comparisonItems.length > 0"
              v-model="comparisonOpacity"
              :min="0"
              :max="1"
              :step="0.01"
              hide-details
              density="compact"
              prepend-icon="mdi-circle-opacity"
              aria-label="Comparison image opacity"
              :disabled="comparisonIndex === -1 && comparisonsVisible"
            />
          </template>
        </TwoLevelExpansionPanelTitle>
        <v-expansion-panel-text>
          <template v-if="in3dView">
            <p class="settings-hint">
              Comparison images are only available in the 2D sky view.
            </p>
          </template>
          <template v-else-if="comparisonItems.length > 0">
            <v-select
              :model-value="comparisonIndex === -1 ? null : comparisonIndex"
              :items="comparisonItems"
              item-title="label"
              item-value="value"
              persistent-hint
              :hint="comparisonAvailableHint"
              density="compact"
              variant="outlined"
              clearable
              label="Comparison image"
              @update:model-value="(v) => emit('goToComparison', v)"
            >
              <template #item="{index, props}">
                <v-list-item v-bind="props">
                  <template #title>
                    {{ comparisonItems[index].label }}
                  </template>
                  <template #prepend>
                    <span 
                      class="item-in-view"
                      :class="{'in-view': comparisonsItemsInView.find(item => item.index === comparisonItems[index].value)?.inView }"
                    ></span>
                  </template>
                </v-list-item>
              </template>
            </v-select>
            <!-- One segmented control rather than four loose icons.
                The two toggles carry an active color, so "hidden" and
                "showing all" are legible without hovering. -->
            <div class="settings-row segmented">
              <v-btn
                icon
                variant="flat"
                size="small"
                color="var(--almagal-blue)"
                aria-label="Previous comparison image"
                @click="emit('stepComparison', -1)"
              >
                <v-icon icon="mdi-chevron-left" />
                <v-tooltip
                  activator="parent"
                  location="bottom"
                  text="Previous comparison image"
                />
              </v-btn>
              <v-btn
                icon
                variant="flat"
                size="small"
                color="var(--almagal-blue)"
                aria-label="Next comparison image"
                @click="emit('stepComparison', 1)"
              >
                <v-icon icon="mdi-chevron-right" />
                <v-tooltip
                  activator="parent"
                  location="bottom"
                  text="Next comparison image"
                />
              </v-btn>
            </div>
            <p
              v-if="currentComparisonDescription"
              class="settings-description"
            >
              {{ currentComparisonDescription }}
            </p>
          </template>
          <p
            v-else
            class="settings-hint"
          >
            Still loading the comparison image collection.
          </p>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
  </div>
</template>

<script lang="ts">
import { ref } from "vue";

// Module scope so it outlives either panel. Here, not almagal_state: which
// cards are open is the panel's business, not the survey's.
export const settingsPanels = ref<string[]>([]);
</script>

<script setup lang="ts">
import { engineStore } from "@wwtelescope/engine-pinia";
import type { UnwrapNestedRefs } from "vue";
import { computed } from 'vue';
import InfoButton from "./InfoButton.vue";
import RangeNumberInputs from "./RangeNumberInputs.vue";
import TwoLevelExpansionPanelTitle from "./TwoLevelExpansionPanelTitle.vue";
import Wwt3dSwitch from "./Wwt3dSwitch.vue";
import ImagesetOpacity from "./imageset_settings/ImagesetOpacity.vue";
import ImagesetColormap from "./imageset_settings/ImagesetColormap.vue";
import ImagesetStretch from "./imageset_settings/ImagesetStretch.vue";

import { useWwt3dControl } from "../composables/wwt3dControl";
import type { useWtmlLoader } from "../composables/useWtmlLoader";
import {
  CLUMP_TYPES,
  almagalColumnRanges,
  clumpTypeCheckColor,
  clumpTypeColor,
  clumpTypeFilter,
  comparisonIndex,
  comparisonOpacity,
  comparisonsVisible,
  filterFields,
  filterFieldLabels,
  filterSpec,
  foregroundImage,
  foregroundImageLabel,
  foregroundImageOptions,
  foregroundOpacity,
  hoveredSource,
  resetFitsImagesetSettings,
  type FilterField,
} from "../almagal_state";


export interface ControlPanelProps {
  almagalWtml?: UnwrapNestedRefs<ReturnType<typeof useWtmlLoader>>;
  foregroundImageLoaded?: boolean;
  comparisonItems?: { label: string, value: number }[];
  currentComparisonDescription?: string | null;
  comparisonsItemsInView?: {index: number, inView: boolean}[];
  hideSourceFilters?: boolean;
  hideClumpType?: boolean;
  hideAlmagalImages?: boolean;
  hideBackgroundSurveys?: boolean;
  hideComparisonImages?: boolean;
  disableFilters?: FilterField[];
  hideDisabled?: boolean;
}

/* One prop per card, so hiding a card means you can skip its prop -- the
   filters need none. Un-hide one without its prop and you get an empty card. */
const _props = withDefaults(defineProps<ControlPanelProps>(), {
  almagalWtml: undefined,
  foregroundImageLoaded: false,
  comparisonItems: () => [],
  currentComparisonDescription: null,
  comparisonsItemsInView: () => [],
  hideSourceFilters: false,
  hideClumpType: false,
  hideAlmagalImages: false,
  hideBackgroundSurveys: false,
  hideComparisonImages: false,
  disableFilters: () => [],
  hideDisabled: false,
});

const emit = defineEmits<{
  (e: "setup3d"): void,
  (e: "goToComparison", index: number | null): void,
  (e: "stepComparison", delta: number): void,
}>();

const store = engineStore();
const { in3D: in3dView } = useWwt3dControl(store);


const anyComparisonVisible = computed(() => {
  return _props.comparisonsItemsInView.some(item => item.inView);
});

const comparisonAvailableHint = computed(() => {
  if (anyComparisonVisible.value) {
    return "Some images are visible in the current view";
  } else {
    return "No images are visible in the current view";
  }
});
</script>

<!-- unscoped: these reach into Vuetify and RangeNumberInputs internals -->
<style lang="less">
// One narrow column by default: a 230px panel hides far less sky than a 470px
// one, and a clear view is worth more than a short panel wherever there is
// height to spend. `minmax(0, 1fr)` rather than `1fr`: the sliders' own
// min-content is wide enough to blow the column past its share otherwise.
.almagal-filterset {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 0.5em 1.25em;
  border-radius: 8px;
  font-size: 0.9em;
  padding-bottom: 1em;
  padding-right: 1em;
  border: none; // browser has a default border on fieldsets
  
}

.filter-slider .filter-slider-and-label {
  display: block; /* */
}

// The divider and the clump-type block are not sliders: they run across both
// columns. Longhands on purpose -- this stylesheet is Less, which compiles the
// shorthand `grid-column: 1 / -1` to `grid-column: -1` (it reads the slash as
// division), which silently adds a third column and scrambles the sliders.
.almagal-filterset > hr,
.almagal-filterset > .clump-type-filter {
  grid-column-start: 1;
  grid-column-end: -1;
}

// A seam between two groups in the same card, not a rule that divides the
// panel -- so it matches the card border rather than the text.
.almagal-filterset > hr {
  border: none;
  border-top: 1px solid var(--almagal-smoke);
}

// style the legend to be centerd
.almagal-filterset > legend {
  margin-inline: auto;
  padding: 0 5px;
}

.almagal-filterset label > span {
  font-weight: bold;
}

.almagal-filterset > .clump-type-filter {
  margin: 0.5em;
  display: flex;
  flex-direction: column;
  gap: 0.5em;
}

// A subsection inside the Filters card, so it is demoted below the card title
// rather than competing with it.
.clump-type-header {
  display: flex;
  align-items: center;
  // justify-content: space-between;
  gap: 0.5em;
  font-size: var(--panel-font-body);
  padding-bottom: 0.75em;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--panel-accent2);
  margin-bottom: 0.25em;
}

.clump-type-actions {
  display: flex;
  align-items: baseline;
  gap: 0.4em;
  font-weight: normal;
  text-transform: none;
  letter-spacing: normal;
  color: var(--panel-accent);
  margin-left: auto;
}

.clump-type-actions > button {
  color: inherit;
  cursor: pointer;

  &:hover,
  &:focus-visible {
    text-decoration: underline;
  }
}

// The separator is punctuation, not a third link: hold it back from the two.
.clump-type-actions > span {
  opacity: 0.5;
}
// 100px gives two across in the narrow one-column panel; the two-column
// media query above raises it so the five types do not break 4 + a stray one
.clump-type-filter > .clump-type-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 0.25em;
}

// The swatch *is* the checkbox: it shows the color the point layer draws this
// clump type in, and carries the check. The native input stays in the DOM,
// visually hidden, so the control keeps its keyboard and screen-reader
// behaviour for free.
.clump-type-option {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.5em;
  cursor: pointer;
}

.clump-type-option > input[type="checkbox"] {
  position: absolute;
  width: 0;
  height: 0;
  margin: 0;
  opacity: 0;
}

.clump-type-swatch {
  width: 1.4em;
  height: 1.4em;
  flex: 0 0 auto;
  border-radius: 50%;
  // The ring keeps the near-black "unknown" swatch visible on the dark panel.
  border: 2px solid rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 0.15s ease;

  // Checkmark, in the ink color the template picks for this swatch.
  &::after {
    content: "";
    width: 0.36em;
    height: 0.62em;
    border: solid currentColor;
    border-width: 0 2px 2px 0;
    transform: translateY(-0.08em) rotate(45deg);
  }
}

// Two classes on purpose: it has to outrank `.almagal-filterset label > span`,
// which sets the control-name color and weight.
.clump-type-option > .clump-type-label {
  font-weight: normal;
  font-size: var(--panel-font-body);
  color: var(--panel-text);
}

/* Off: the whole cell drops to 40%, the check is removed and the label is
   struck through. The white ring is deliberately identical on and off -- it is
   the only reason the near-black "unknown" fill stays visible against the card,
   and recoloring it would introduce a hue that means nothing. */
.clump-type-option:has(> input:not(:checked)) {
  opacity: 0.4;
}

.clump-type-option > input:not(:checked) {
  + .clump-type-swatch::after {
    opacity: 0;
  }

  ~ .clump-type-label {
    text-decoration: line-through;
  }
}

.clump-type-option > input:focus-visible + .clump-type-swatch {
  outline: 2px solid var(--almagal-orange);
  outline-offset: 2px;
}

.info-button-text {
  ul {
    padding-left: 1.5em;
  }
}

/* the comparison controls, now inside the info sheet's Settings tab rather
   than spread across the bottom of the view */
.settings-page {
  display: flex;
  flex-direction: column;
  gap: 0.75em;
}

.settings-hint {
  font-size: 0.9em;
  opacity: 0.8;
}

.settings-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0.25em;
}

.settings-description {
  font-size: 0.9em;
  border-left: 2px solid var(--almagal-blue);
  padding-left: 0.75em;
}

.settings-page {
  gap: 12px;
  padding: 12px;
}

/* -- cards ------------------------------------------------------------- */

.settings-page .v-expansion-panel {
  background: var(--panel-card);
  overflow: hidden;

  // Vuetify's accordion variant squares off and hairlines adjacent panels.
  &::after { display: none; }
  &.mb-2 { margin-bottom: 12px !important; }
  &:last-child { margin-bottom: 0 !important; }
}

.settings-page .v-expansion-panel__shadow { display: none; }

.settings-page .v-expansion-panel-title h4 {
  color: var(--panel-title);
  font-size: var(--panel-font-title);
  font-weight: 700;
  min-height: 0;
  // padding: 14px 16px;
}

.settings-page .v-expansion-panel-text__wrapper {
  // padding: 0 16px 14px;
  color: var(--panel-text);
}

// Chevrons read as interactive rather than as decoration.
.settings-page .v-expansion-panel-title__icon {
  color: var(--panel-title);
}

/* The imageset title stacks a heading over an opacity slider. Left centred, the
   chevron lines up with the slider and looks like it belongs to it, so pull it
   up to the title's own line. Written flat rather than nested: `&` inside
   `.settings-page .v-expansion-panel-title__icon` would expand to
   `.v-expansion-panel-title:has(...) .settings-page ...`, which never matches. */
.settings-page .v-expansion-panel-title:has(.detail-row) .v-expansion-panel-title__icon {
  align-self: flex-start;
  margin-top: 3px;
}

/* -- typography -------------------------------------------------------- */

// Control names: the thing being set.
.settings-page .almagal-filterset label > span,
.settings-page .filter-slider-and-label > .d-flex > span:first-child {
  color: var(--panel-label);
  font-size: var(--panel-font-body);
  font-weight: 400;
}

// A field disabled via disableFilters: the slider below is already greyed
// out on its own (RangeNumberInputs' :disabled), this just matches the label.
.settings-page .filter-field-label-disabled {
  color: var(--panel-muted);
}

// Numeric readouts: the value it is set to. Tabular figures stop the numbers
// jittering sideways while a slider is dragged.
.settings-page .rni-display,
.settings-page .rni-fiducial-flag {
  color: var(--panel-value);
  font-size: var(--panel-font-small);
  font-variant-numeric: tabular-nums;
}

.settings-page .settings-hint,
.settings-page .settings-description {
  color: var(--panel-muted);
  font-size: var(--panel-font-small);
  opacity: 1;
}



/* -- sliders ----------------------------------------------------------- */

// The filter sliders are a custom element; the opacity sliders are Vuetify.
// Both are painted here so the panel speaks one slider language.
.settings-page double-range-slider {
  --dri-track-color: var(--panel-track);
  --dri-track-filled-color: var(--panel-accent);
  --dri-thumb-color: var(--panel-thumb);
  --dri-thumb-hover-color: #FFFFFF;
  --dri-thumb-active-color: #FFFFFF;
  --dri-thumb-border-color: var(--panel-drawer);
  --dri-thumb-border-hover-color: var(--panel-drawer);
  --dri-thumb-border-width: 1px;
}

// RangeNumberInputs: the min/max fields either side of the slider, and the
// hover callout over the track.
.settings-page .range-number-inputs {
  /* Opaque, not transparent: the hover callout passes over the min/max fields
     near the ends of the track and has to stay readable where it does, and the
     app's white focus ring (the universal focus state) would otherwise sit
     white on white. */
  --rni-field-bg-color: var(--almagal-blue-darkest);
  --rni-field-border-color: var(--panel-border);
  --rni-field-border-hover-color: var(--panel-accent);
  --rni-field-focus-color: var(--panel-accent);
  // The hovered source: its marker on the track, and the callout's border and point.
  --rni-fiducial-color: var(--panel-accent2);
}

.settings-page {
  .v-slider-track__background { background: var(--panel-track); }
  .v-slider-track__fill { background: var(--panel-accent); }

  .v-slider-thumb {
    color: var(--panel-thumb);

    .v-slider-thumb__surface {
      background: var(--panel-thumb);
      // Keeps the thumb legible where it sits on top of the filled track.
      border: 1px solid var(--panel-drawer);

      &::before { display: none; } // Vuetify's hover halo, in the old accent
    }
  }

  .v-slider .v-input__prepend .v-icon { color: var(--panel-label); }
}

.settings-page .dimension-label {
  font-size: var(--panel-font-body);
  color: var(--panel-muted);

  &.is-active { color: var(--panel-text); }
}

/* -- comparison image controls ----------------------------------------- */

// A segmented container, so the four icon buttons read as one control.
.settings-page .settings-row.segmented {
  display: inline-flex;
  gap: 1rem;
  // border: 1px solid var(--panel-border);
  border-radius: 4px;
  overflow: hidden;
  margin-block: 12px;

  .v-btn {
    border-radius: 0;
    // color: var(--panel-accent);

    // & + .v-btn { border-left: 1px solid var(--panel-border); }

    // Hidden state has to be legible at a glance, so it gets its own color
    // rather than reading as just another idle icon.
    &.is-active {
      // background: var(--panel-border);
      color: var(--panel-title);
    }
  }
}

/* -- per-card reset ---------------------------------------------------- */

// Only rendered when something in the card is off its default, so the panel
// says at a glance which controls are actually doing work.
.settings-page .card-reset {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: var(--panel-font-small);
  color: var(--panel-accent);
  border: 1px solid var(--panel-border);
  border-radius: 999px;
  padding: 3px 9px;
  margin-right: 12px;
  cursor: pointer;
}

.item-in-view {
  display: inline;
  background-color: red;
  width: 0.5em;
  height: 0.5em;
  border-radius: 50%;
}
.item-in-view.in-view {
  background-color: limegreen;
}
</style>
