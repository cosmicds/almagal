<template>
  <v-app
    id="app"
    :style="cssVars"
    :class="[smallSize ? 'app-is-small' : '', isLandscape ? 'app-is-landscape' : '', sidePanel ? 'app-side-panel' : '']"
  >
    <!-- ahead of #main-content in the markup so the tab order follows the
         visual one; `order` moves a flex item without moving it for the keyboard.

         'push' and 'bottom' want the drawer right here, as a flex sibling of
         #main-content. 'float' does not: it sits over the view's lower-left
         corner, which used to mean padding #bottom-content past a width the
         overlay could not see. Teleporting it into the overlay's own bottom row
         instead makes it a real flex item there, so the control bar flows
         beside it. `defer` waits for that target to render; `disabled` leaves
         the drawer in place for the other two layouts. One call either way. -->
    <Teleport
      defer
      to="#tour-float-slot"
      :disabled="tourDrawerLayout !== 'float'"
    >
      <SideDrawer
        id="tour-drawer"
        :open="showTour"
        :layout="tourDrawerLayout"
        location="bottom left"
        :side-drawer-width="tourDrawerWidth"
        float-max-height="100vh"
      >
        <!-- two sheets; the container lays them out -->
        <div class="tour-stack">
          <div class="tour-sheet">
            <v-btn
              class="tour-sheet-close"
              density="compact"
              variant="text"
              icon="mdi-close"
              aria-label="Close the tour"
              @click="showTour = false"
            />
            <TourPlayer @step="tourStep = $event" />
          </div>
          <!-- the tour talks about the filters and the image controls are relevant -->
          <div v-if="controlsInTourSheet" class="controls-sheet">
            <ControlPanel
              :almagal-wtml="almagalWtml"
              :hide-almagal-images="tourStep !== 6"
              :disable-filters="disabledFilters"
              hide-disabled
              hide-clump-type
              hide-background-surveys
              hide-comparison-images
            />
          </div>
        </div>
      </SideDrawer>
    </Teleport>

    <div
      id="main-content"
    >
      <WorldWideTelescope
        ref="wwt-container"
        :wwt-namespace="wwtNamespace"
        @pointermove="almagalSpreadsheetLayer.onPointerMove"
        @click="almagalSpreadsheetLayer.onPointerClick"
        @dblclick.stop="almagalSpreadsheetLayer.onPointerDoubleClick"
      ></WorldWideTelescope>
      <wwt-loader v-model="isLoading" />


      <!-- This contains the splash screen content -->
      <SplashScreen
        v-model="showSplashScreen"
        :accent-color="almagalBlue"
        :highlight-color="almagalOrange"
        :loaded="!isLoading"
        @tour="startTour"
        @explore="startExploring"
      />


      <!-- This block contains the elements (e.g. icon buttons displayed at/near the top of the screen -->
      <div
        v-show="!(showSplashScreen)"
        id="wwt-overlay"
      >
        <div id="top-content">
          <!-- old left-buttons / right-buttons layout preserved below -->
          <div
            id="left-buttons"
          >
            <div 
              class="source-controls"
              :class="{
                'flex-column': showFilters,
              }"
            >
              <div class="d-flex flex-column align-start ga-2">
                <div
                  v-if="!in3dView"
                  class="d-flex align-center ga-2"
                >
                  <v-tooltip
                    v-if="!showTour"
                    text="Search for source"
                    location="bottom"
                  >
                    <template #activator="p">
                      <v-btn
                        v-bind="p.props"
                        :icon="showSearch ? 'mdi-close' : 'mdi-magnify'"
                        size="small"
                        color="surface-variant"
                        @click="showSearch = !showSearch"
                      />
                    </template>
                  </v-tooltip>
                  <template v-if="showSearch">
                    <v-autocomplete
                      v-if="almagalSourceList"
                      v-model="selectedAlmagalSource"
                      class="almagal-v-select on-canvas"
                      :items="almagalSourceList"
                      item-title="iid"
                      item-value="iid"
                      :custom-filter="filterAlmagalSource"
                      return-object
                      hide-details
                      label="ALMAGAL Source"
                      :loading="pendingSourceIids.length > 0"
                      density="compact"
                      @update:model-value="onSourceSearchSelect"
                    />
                  </template>
                </div>


                
                <v-tooltip
                  v-if="!showTour"
                  text="View settings"
                  location="bottom"
                >
                  <template #activator="p">
                    <v-btn
                      v-bind="p.props"
                      icon="mdi-tune-vertical"
                      size="small"
                      color="surface-variant"
                      aria-label="Comparison image settings"
                      @click="openSettings"
                    />
                  </template>
                </v-tooltip>

                <v-tooltip
                  v-if="!showTour"
                  text="User guide"
                  location="bottom"
                >
                  <template #activator="p">
                    <v-btn
                      v-bind="p.props"
                      icon="mdi-help"
                      size="small"
                      color="surface-variant"
                      aria-label="Open the user guide"
                      @click="openUserGuide"
                    />
                  </template>
                </v-tooltip>
                <v-tooltip
                  v-if="!showTour"
                  text="About ALMAGAL"
                  location="bottom"
                >
                  <template #activator="p">
                    <v-btn
                      v-bind="p.props"
                      class="almagal-logo-v-btn"
                      icon
                      size="small"
                      color="surface-variant"
                      aria-label="About ALMAGAL"
                      @click="openAboutAlmagal"
                    />
                  </template>
                </v-tooltip>
                <v-tooltip
                  v-if="!showTour"
                  text="tour"
                  location="bottom"
                >
                  <template #activator="p">
                    <v-btn
                      v-bind="p.props"
                      icon="mdi-transit-connection-variant"
                      size="small"
                      color="surface-variant"
                      aria-label="Start the tour"
                      @click="showTour = !showTour"
                    />
                  </template>
                </v-tooltip>
                <v-tooltip
                  v-if="startedInScienceMode"
                  :text="`Switch to ${scienceMode ? 'public' : 'science'} mode`"
                  location="bottom"
                >
                  <template #activator="p">
                    <v-btn
                      v-bind="p.props"
                      :icon="`${scienceMode ? 'mdi-school' : 'mdi-account-group'}`"
                      size="small"
                      :color="`${scienceMode ? almagalOrange : 'surface-variant'}`"
                      :aria-label="`Switch to ${scienceMode ? 'explore' : 'public'} mode`"
                      @click="scienceMode = !scienceMode"
                    />
                  </template>
                </v-tooltip>
              </div>
            </div>
          </div>
          <div id="right-buttons">
            <!-- zoom control -->
            <div
              v-if="!in3dView && !showTour"
              class="zoom-control pointer-events-auto"
            >
              <v-btn
                class="zoom-increase"
                density="compact"
                variant="text"
                icon="mdi-plus-box"
                color="surface-variant"
                aria-label="Zoom in"
                @click="zoomIn"
                @keyup.enter="zoomIn"
              />
              <div class="zoom-slider">
                <v-slider
                  :model-value="zoomSliderValue"
                  :max="0"
                  :min="1"
                  :step="-0.001"
                  thumb-label="hover"
                  hide-details
                  density="compact"
                  direction="vertical"
                  aria-label="Zoom level"
                  @update:model-value="onZoomSlider"
                />
              </div>
              <v-btn
                class="zoom-decrease"
                density="compact"
                variant="text"
                icon="mdi-minus-box"
                color="surface-variant"
                aria-label="Zoom out"
                @click="zoomOut"
                @keyup.enter="zoomOut"
              />
            </div>
            
            <div class="d-flex flex-row flex-wrap ga-4 pa-2 bunch-o-buttons">
            </div>

            <!-- TODO: remove this once we have the full 17 level tile-set -->
            <template v-if="false">
              <v-btn
                v-if="showAllInView && !in3dView"
                class="blur-button"
                variant="outlined"
                @click="showAllSourcesInView"
              >
                Get {{ sourcesInView.count }} source{{ sourcesInView.count > 1 ? 's' : '' }} in view
              </v-btn>
              <!-- <div
                v-else
                class="blur-background  py-2 px-4 rounded"
                style="max-width: 220px;"
              >
                Zoom in to download full images
              </div> -->
            </template>
            <!-- 
            <div
              v-if="(almagalSourceLayers.size > 0 || pendingSourceIids.length > 0 || selectedAlmagalSource) && !in3dView && !showTour"
              class="layer-list"
            >

              <div
                v-for="layer in [...almagalSourceLayers.values()]"
                :key="layer.id.toString()"
                class="layer-list__item"
              >
                <ImagesetItem
                  v-if="store.imagesetStateForLayer(layer.id.toString())"
                  style="color: black"
                  :imageset="store.imagesetStateForLayer(layer.id.toString())!"
                  instant
                  log-stretch-slider
                  hide-opacity
                  hide-colormap
                  hide-vrange
                  hide-reset
                  no-open
                />
              </div>
              <DownloadAlmagal
                v-for="iid in pendingSourceIids"
                :key="iid"
                :iid="iid"
                pending
                @download="downloadAlmagalSource"
                @cancel="cancelAlmagalSourceDownload"
              />

              <DownloadAlmagal
                v-if="selectedAlmagalSource
                  && !pendingSourceIids.includes(selectedAlmagalSource.iid)
                  && !almagalSourceLayers.has(selectedAlmagalSource.iid)"
                :iid="selectedAlmagalSource.iid"
                :pending="false"
                @download="downloadAlmagalSource"
                @cancel="cancelAlmagalSourceDownload"
              />
            </div>
            -->
          </div>
        </div>


        <!-- This block contains the elements (e.g. the project icons) displayed along the bottom of the screen -->

        <div id="bottom-content">
          <div class="bottom-main">
            <!-- Where the floating tour lands (see the Teleport above). Empty
                 and zero-width for the other two layouts. -->
            <div id="tour-float-slot"></div>
            <div class="control-bar">
              <!-- the tour borrows this spot for its own buttons -->
              <div v-if="showTour" class="tour-actions">
                <template v-if="tourStep === 2">
                  <v-btn
                    v-bind="tourBtnProps"
                    :active="activeOrionImageset === ORION.hubble"
                    :color="activeOrionImageset === ORION.hubble ? almagalOrange : tourBtnProps.color"
                    @click="showOrionImageset(ORION.hubble)"
                  >
                    Hubble (visible)
                  </v-btn>
                  <v-btn
                    v-bind="tourBtnProps"
                    :active="activeOrionImageset === ORION.spitzer"
                    :color="activeOrionImageset === ORION.spitzer ? almagalOrange : tourBtnProps.color"
                    @click="showOrionImageset(ORION.spitzer)"
                  >
                    Spitzer (hot dust)
                  </v-btn>
                  <v-btn
                    v-bind="tourBtnProps"
                    :active="activeOrionImageset === ORION.wise"
                    :color="activeOrionImageset === ORION.wise ? almagalOrange : tourBtnProps.color"
                    @click="showOrionImageset(ORION.wise)"
                  >
                    WISE (warm dust)
                  </v-btn>
                  <v-btn
                    v-bind="tourBtnProps"
                    prepend-icon="mdi-target"
                    @click="goToImageset(orion(), ORION.hubble, { zoom: 3, instant: false })"
                  >
                    Recentre
                  </v-btn>
                </template>
                <template v-else-if="tourStep === 4">
                  <v-btn
                    v-bind="tourBtnProps"
                    :active="foregroundImage === 'none'"
                    :color="foregroundImage === 'none' ? almagalOrange : tourBtnProps.color"
                    @click="showBackground('none')"
                  >
                    Visible light
                  </v-btn>
                  <v-btn
                    v-bind="tourBtnProps"
                    :active="foregroundImage === 'herschel'"
                    :color="foregroundImage === 'herschel' ? almagalOrange : tourBtnProps.color"
                    @click="showBackground('herschel')"
                  >
                    Far-infrared
                  </v-btn>
                </template>
              </div>
              <div v-else class="hovered-source-info">
                <span v-if="hoveredSource">Currently hovering: {{ hoveredSource.aid }}</span>
                <span v-else-if="selectedAlmagalSource">Last selected: {{ selectedAlmagalSource.aid }}</span>
                <span v-else>Currently hovering: none</span>
                <v-btn
                  v-if="hoveredSource || selectedAlmagalSource"
                  style="pointer-events: auto;"
                  class="ml-2"
                  density="compact"
                  icon="mdi-information-slab-circle-outline"
                  @click="openSourceInfo"
                >
                </v-btn>
              </div>
            </div>
          </div>
          <div
            id="body-logos"
            :class="{'small-logos': smallSize}"
          >
            <credit-logos
              :default-logos="['cosmicds', 'wwt', 'sciact', 'nasa']"
              :logo-size="smallSize ? '1em' : '1.5em'"
              :extra-logos="[
                {
                  alt: 'ALMAGAL',
                  src: 'https://battersby-physics.media.uconn.edu/wp-content/uploads/sites/2230/2020/09/ALMAGAL_Logo1_SM.jpg',
                  href:'https://www.almagal.org',
                  name: 'ALMAGAL: ALMA Evolutionary study of High Mass Protocluster Formation in the Galaxy'
                }
              ]"
            />
          </div>
        </div>
      </div>
    </div>
    <WebGlTest
      @webgl2-disabled="webglDisabled = true"
    />
    <!--
      NEW: a plain div is a flex sibling of #main-content inside
      .v-application__wrap, so opening it pushes/shrinks the WWT view rather
      than covering it. #main-content has `order: 2`, which puts this panel on
      the left in the row layout, and below the view when the app is small.
    -->
    <div
      v-show="!showSplashScreen"
      id="side-drawer"
      :class="[sidePanel ? 'info-side' : 'info-bottom', showInfoSheet ? 'side-drawer-open' : 'side-drawer-closed']"
    >
      <!-- 
      The Information sheet now will create tabs based on the content of the sheet
       -->
      <InformationSheet
        v-model="showInfoSheet"
        v-model:tab="infoSheetTab"
        tab-color="white"
        :slider-color="almagalOrange"
        :accent-color="almagalBlue"
        text-color="#e6e6e6"
        :bg-color="almagalBlueDarkest"
        page-color="transparent"
        :stay-open="forceInfoSheetOpen"
        show-close-button
        :align-tabs="'start'"
      >
        <!-- each page registers its own tab, in this order -->
        <InfoPage v-if="infoSheetTab === SOURCE_INFORMATION_TAB" title="ALMAGAL Source" value="source-information">
          <AlmaGalSourceInfoDisplay
            v-if="currentSource && !in3dView"
            :source="currentSource"
          />
          <p v-else>
            Hover over or click one of the green markers to see a clump's properties here.
          </p>
        </InfoPage>
        
        <InfoPage v-if="infoSheetTab === ALMAGAL_TAB" title="ALMAGAL">
          <almagal-info-page />
        </InfoPage>

        <!-- The UserGuide itself is an InfoPage
         so it can be included with wrapping it here.
         Useful for long componenets that can be easily placed in a different file.
          -->
        <UserGuide v-if="infoSheetTab === USER_GUIDE_TAB" />

        <InfoPage v-if="controlsInInfoSheet" title="CONTROLS" value="settings">
          <ShowHideAutoToggle v-if="!showTour" v-model="displaySpreadsheet" variant="flat" />
          <ControlPanel
            :almagal-wtml="almagalWtml"
            :foreground-image-loaded="foregroundImageLoaded"
            :comparison-items="comparisonItems"
            :current-comparison-description="currentComparisonDescription"
            :comparisons-items-in-view="comparisonsInView"
            :disable-filters="disabledFilters"
            hide-disabled
            :hide-clump-type="showTour"
            @setup3d="setup3DView"
            @go-to-comparison="goToComparison"
            @step-comparison="stepComparison"
          />
        </InfoPage>
        <!--  -->
      </InformationSheet>
    </div>
  </v-app>
</template>

<script setup lang="ts">
/* eslint-disable @typescript-eslint/no-unused-vars */
import { ref, reactive, computed, nextTick, onMounted, watch, shallowRef } from "vue";
import { storeToRefs } from "pinia";

/* WWT imports */
import { GotoRADecZoomParams, engineStore, ImageSetLayerState } from "@wwtelescope/engine-pinia";
import {
  BackgroundImageset,
  skyBackgroundImagesets,
  useWWTKeyboardControls,
  useFullscreen,
} from "@cosmicds/vue-toolkit";
import { D2R  } from "@wwtelescope/astro";
import {
  WWTControl,
  Coordinates,
  Color,
  SpreadSheetLayer,
} from "@wwtelescope/engine";
// scale types: linear, log, power, sqrt, histogramEqualization
import { RAUnits, AltUnits, MarkerScales } from "@wwtelescope/engine-types";
import { addCustomColormaps, type Colormaps  } from "./wwt-colormaps/colormaps";
addCustomColormaps();

/* local components and composables */
import WebGlTest from "./components/WebGlTest.vue";
const webglDisabled = ref(false);


import SplashScreen from "./components/SplashScreen.vue";
import SideDrawer from "./components/SideDrawer.vue";
import InformationSheet from "./components/InformationSheet.vue";
import ControlPanel from "./components/ControlPanel.vue";
import InfoPage from "./components/InfoPage.vue";
import DownloadAlmagal from "./components/DownloadAlmagal.vue";
import UserGuide from "./components/UserGuide.vue";
import ImagesetItem from "./components/ImagesetItem.vue";
import RangeNumberInputs from "./components/RangeNumberInputs.vue";
import Wwt3dSwitch from "./components/Wwt3dSwitch.vue";
import TourPlayer from "./tour/TourPlayer.vue";
import ImagesetOpacity from "./components/imageset_settings/ImagesetOpacity.vue";
import ImagesetColormap from "./components/imageset_settings/ImagesetColormap.vue";
import ImagesetStretch from "./components/imageset_settings/ImagesetStretch.vue";
import AlmagalInfoPage from "./components/AlmagalInfoPage.vue";
import TwoLevelExpansionPanelTitle from "./components/TwoLevelExpansionPanelTitle.vue";
import InfoButton from "./components/InfoButton.vue";
/* Catalog, filters and view flags shared with the tour; see almagal_state.ts */
import {
  CLUMP_TYPES,
  FITS_LAYER_SETTINGS,  
  almagalColumnRanges,
  almagalSourceLayers,
  cancelAlmagalSourceDownload,
  downloadAlmagalSource,
  almagalSourceList,
  clumpTypeCheckColor,
  clumpTypeColor,
  clumpTypeFilter,
  filterFields,
  filterFunction,
  filterSpec,
  foregroundImage,
  foregroundOpacity,
  infoSheetTab,
  pendingSourceIids,
  selectedAlmagalSource,
  showFilters,
  showInfoSheet,
  spreadsheetVisible,
  resetFitsImagesetSettings,
  displaySpreadsheet,
  ALMAGAL_TAB,
  SETTINGS_TAB,
  SOURCE_INFORMATION_TAB,
  USER_GUIDE_TAB,
  comparisonIndex,
  comparisonOpacity,
  comparisonsVisible,
  showAllComparisons,
  hoveredSource,
  type FilterField,
  type InfoSheetTab,
} from "./almagal_state";

import {
  goToSource,
  ORION,
  orion,
  showBackground,
} from "@/tour/tourActions";

import { useAppLayout } from "./composables/useAppLayout";
import { useWtmlLoader } from "./composables/useWtmlLoader";
import { useHoverableSpreadsheetLayer } from "./composables/useHoverableSpreadsheetLayer";
import { useSourcesInView } from "./composables/useSourcesInView";
import { goToImageset, moveToImageset, setFitsLayerSettings, showImagesets, waitForLayerMaps } from "./wwt-helpers";

import {
  type ALMAGalSource
} from "./almagal_utils";
import AlmaGalSourceInfoDisplay from "./components/AlmaGalSourceInfoDisplay.vue";
import ShowHideAutoToggle from "./components/ShowHideAutoToggle.vue";
import { useSpreadsheetLayer } from "./composables/useSpreadsheetLayer";
import { drawPointList } from "./wwt-hacks";

type CameraParams = Omit<GotoRADecZoomParams, "instant">;
export interface WwtPlaygroundProps {
  wwtNamespace?: string;
  initialCameraParams?: CameraParams;
}

const fullscreen = useFullscreen();
const searchParams = new URLSearchParams(window.location.search);
const kiosk = searchParams.get("kiosk")?.toLowerCase() === "true";
if (kiosk) {
  document.body.classList.add("kiosk");
}
const scienceMode = ref(searchParams.get("science")?.toLowerCase() === "true");
if (scienceMode.value) {
  document.body.classList.add("science-mode");
}
const startedInScienceMode = scienceMode.value;

const skipSplash = searchParams.get("splash")?.toLowerCase() === "false";
console.log("kiosk mode?", kiosk);
console.log("skip splash?", skipSplash);
const store = engineStore();
const {
  zoomDeg,
} = storeToRefs(store);

useWWTKeyboardControls(store);

const {
  viewportWidth,
  viewportHeight,
  smallSize,
  isLandscape,
  sidePanel,
  isMobile,
} = useAppLayout();

// default to the galactic center
const props = withDefaults(defineProps<WwtPlaygroundProps>(), {
  wwtNamespace: "wwt-playground",
  initialCameraParams: () => {
    return {
      raRad: 266.448 * D2R,
      decRad:  -28.969 * D2R,
      zoomDeg: 1.5,
      rollRad: 0,
    };
  }
});

const backgroundImagesets = reactive<BackgroundImageset[]>([]);
const forceInfoSheetOpen = ref(true);


const infoGroupTabs: InfoSheetTab[] = [USER_GUIDE_TAB, ALMAGAL_TAB];
const inInfoGroup = computed(() => infoGroupTabs.includes(infoSheetTab.value));

// TODO: currently if the tab sheet is closed, we need to make sure we do two things
// this seems bad
function openSettings() {
  infoSheetTab.value = SETTINGS_TAB;
  showInfoSheet.value = true;
}
function openUserGuide() {
  infoSheetTab.value = USER_GUIDE_TAB;
  showInfoSheet.value = true;
}
function openAboutAlmagal() {
  infoSheetTab.value = ALMAGAL_TAB;
  showInfoSheet.value = true;
}
function openSourceInfo() {
  if (showInfoSheet.value && infoSheetTab.value === SOURCE_INFORMATION_TAB) {
    showInfoSheet.value = false;
    return;
  }
  infoSheetTab.value = SOURCE_INFORMATION_TAB;
  showInfoSheet.value = true;
}


const showTour = ref(false);

// like why roman, we will handle starting the tour/explore modes from a function
// in case we need to do more work
function startTour() {
  showTour.value = true;
}
function startExploring() {
  showTour.value = false;
}
const tourDrawerLayout = computed<"bottom" | "push" | "float">(() => {
  if (!sidePanel.value) return "bottom";
  // set to iewportHeight.value >= 700 ? "float" : "push"; to have the tour panel float
  return viewportHeight.value >= 700 ? "push" : "push";
});

const tourDrawerWidth = computed(() => tourDrawerLayout.value === "push" ? "34%" : "50%");

const tourStep = ref(1);

// which Orion imageset the canvas buttons show as selected; steps 1 and 2
// both open on Hubble (tourActions.ts, setupTourStep)
const activeOrionImageset = ref(ORION.hubble);
watch(tourStep, (n) => {
  if (n === 1 || n === 2) activeOrionImageset.value = ORION.hubble;
});
function showOrionImageset(index: number) {
  showImagesets(orion(), index);
  activeOrionImageset.value = index;
}

// shared look for the tour's on WWT buttons. can also add classes here.
const tourBtnProps = { color: "surface-variant" };

// the steps that discuss the filters
const CONTROL_PANEL_STEPS = [6, 7, 8];
const tourWantsControls = computed(() =>
  showTour.value && CONTROL_PANEL_STEPS.includes(tourStep.value));

// step 6 (TourStep3b) only want L,M, L/M
const TOUR_STEP_6_HIDDEN_FILTERS: FilterField[] = ["tdust", "dist_ag"];
const SCIENCE_MODE_ONLY_FILTERS: FilterField[] = ["tbol"];
const disabledFilters = computed<FilterField[]>(() => {
  const disabled: FilterField[] = [];
  if (!scienceMode.value) {
    disabled.push(...SCIENCE_MODE_ONLY_FILTERS);
  }
  if (tourStep.value === 6) {
    disabled.push(...TOUR_STEP_6_HIDDEN_FILTERS);
  }
  return disabled;
});



/* 
We want the controls to share the space with the tour, everywhere except
on mobile and when the tour is floating. 
*/
const controlsInTourSheet = computed(() => {
  if (isMobile.value || !tourWantsControls.value) return false;
  // floats over the view, so it has no room to give -- the info sheet takes it
  if (tourDrawerLayout.value === "float") return false;
  // full width along the bottom: side by side, if both fit
  if (tourDrawerLayout.value === "bottom") {
    return viewportWidth.value >= 800; // only on wide screens will we split the bottom panel
  }
  // 'push': a column of its own to split
  return true;
});

const controlsInInfoSheet = computed(() => {
  if (isMobile.value) return false;
  if (showTour.value) return tourWantsControls.value && tourDrawerLayout.value === "float";
  return infoSheetTab.value === SETTINGS_TAB;
});

// while the tour is up, the sheet is open exactly when the panel lives in it
watch([controlsInInfoSheet, tourStep], ([inSheet]) => {
  if (!showTour.value) return;
  if (inSheet) infoSheetTab.value = SETTINGS_TAB;
  showInfoSheet.value = inSheet;
});


const showSearch = ref(false);
// match on aid, iid or orig_id -- whichever the user happens to have on hand
function filterAlmagalSource(_title: string, query: string, item?: { raw: ALMAGalSource }) {
  const q = query.trim().toLowerCase();
  if (!q || !item) return true;
  const source = item.raw;
  return [source.iid, source.aid, source.orig_id].some(field => field.toLowerCase().includes(q));
}

function onSourceSearchSelect(source: ALMAGalSource | null) {
  if (source && !in3dView.value) {
    store.gotoRADecZoom({
      raRad: source.ra * D2R,
      decRad: source.dec * D2R,
      zoomDeg: 0.4, // just go without zooming
      rollRad: 0,
      instant: false,
    });
  }
}
const queryShowSplash = searchParams.get("splash")?.toLowerCase() !== 'false';
const showSplashScreen = ref(queryShowSplash);
const layersLoaded = ref(false);
const positionSet = ref(false);
const almagalBlue = ref("#306C9F");
const almagalBlueDarker = ref("#002f5c"); 
const almagalOrange = ref("#FC9954");
const almagalOrangeDarker = ref("##c05000");
const almagalBrightBlue = ref("#4a8be0");
const almagalPeriwinkle = ref("#a4bcff");
const almagalSmoke = ref("#E8EFF7");
const almagalSlate = ref("#939da8");
const almagalBlueDarkest = ref("#0C1723");
const MAX_ITEMS_TO_SHOW = 4;
const sourcesInView= useSourcesInView(almagalSourceList.value);
const showAllInView = computed(() => sourcesInView.count > 0 && sourcesInView.count <= MAX_ITEMS_TO_SHOW);

function showAllSourcesInView() {
  sourcesInView.sourcesInView.forEach(source => downloadAlmagalSource(source.iid));
}

// { onPointerMove, onPointerClick, createLayer: setupSpreadsheet, setFilter, applyFilter, show: showSpreadsheet, hide: hideSpreadsheet, setVisible: setSpreadsheetVisible }
const almagalSpreadsheetLayer = useHoverableSpreadsheetLayer(
  almagalSourceList.value,
  {
    name: "ALMAGAL Sources",
    color: "#32CD32",
    markerSize: 7,
    markerType: "gaussian",
    distanceColumn: "dist_ag",
    raUnit: RAUnits.degrees,
    emitNull: true,
    onHover: (row, index) => {
      if (spreadsheetVisible.value) {
        hoveredSource.value = row as ALMAGalSource | null;
      }
    },
    onClick: (row) => {
      if (spreadsheetVisible.value) {
        selectedAlmagalSource.value = row as ALMAGalSource;
        if (row && !in3dView.value) {
          store.gotoRADecZoom({
            raRad: row.ra * D2R,
            decRad: row.dec * D2R,
            zoomDeg: store.zoomDeg, // just go without zooming
            rollRad: 0,
            instant: false,
          });
        }
      }
    },
    onDoubleClick: (row) => {
      if (spreadsheetVisible.value) {
        selectedAlmagalSource.value = row as ALMAGalSource;
        if (row && !in3dView.value) {
          store.gotoRADecZoom({
            raRad: row.ra * D2R,
            decRad: row.dec * D2R,
            zoomDeg: 0.1,
            rollRad: 0,
            instant: false,
          });
        }
      }
    },
  }
);
watch(spreadsheetVisible, (visible) => {
  almagalSpreadsheetLayer.setVisible(visible);
});

const tooCloseForSpreadsheet = computed(() => zoomDeg.value < 0.5);

watch(tooCloseForSpreadsheet, (tooClose: boolean) => {
  if (displaySpreadsheet.value !== null) { return; }
  spreadsheetVisible.value = !tooClose;
});

watch(displaySpreadsheet, (display) => {
  spreadsheetVisible.value = display ?? !tooCloseForSpreadsheet.value;
});

/* Load WTMLS for different background layers.
   Don't forget to add them to `foregroundImageOptions` and the `foregroundImage` watcher!
*/
const glimpse = useWtmlLoader('./GLIMPSE_360.wtml', {autoload: false});

// Start this disabled. Use herschelPacs.show() to show it. 
const herschel = useWtmlLoader('./herschel_spire_rgb.wtml', {autoload: false, onLoad: (out) => {
  out.layer?.set_enabled(false);
}});

const foregroundImageLoaded = computed(() => {
  if (foregroundImage.value === 'glimpse') {
    return glimpse.loaded.value;
  } else if (foregroundImage.value === 'herschel') {
    return herschel.loaded.value;
  } else {
    return true; // "none" is always loaded
  }
});


// const comparisons = reactive(useWtmlLoader('./almagal_sources_wwt_matches.wtml', {
const comparisons = reactive(useWtmlLoader('./almagal_tour_images.wtml', {
  autoload: false,
  onLoad: (out) => out.layer?.set_enabled(false),
}));

/* Stepping through the comparison images.
   Indexed rather than keyed by name: the WWT catalogs reuse names heavily (this
   collection has eleven repeated names, five of them "Eta Carinae"), so a name
   is not enough to identify a place. -1 means "nothing selected yet".
*/
const comparisonItems = computed(() => comparisons.places.map((place, index) => ({
  // Number them so the repeated names stay tellable apart.
  label: `${index + 1}. ${place.get_name()}`,
  value: index,
})));
const currentComparisonDescription = computed(() => {
  const place = comparisons.places[comparisonIndex.value];
  if (!place) return null;
  // Most entries only carry a description on the imageset (or none at all, just credits).
  const imageset = place.get_studyImageset() ?? place.get_backgroundImageset();
  return place.htmlDescription || imageset?.get_creditsText() || null;
});

const comparisionLocations = computed(() => comparisons.places.map(place => {
  const imageset = place.get_studyImageset() ?? place.get_backgroundImageset();
  if (!imageset) return null;
  return {
    ra: imageset.get_centerX(), // deg
    dec: imageset.get_centerY(),  // deg
  };
}));

import { refThrottled} from "@vueuse/core";
function pointInView(raDeg, decDeg) {
  const ctl = WWTControl.singleton;
  const rc = ctl.renderContext;
  const pt = ctl.getScreenPointForCoordinates(raDeg / 15, decDeg);
  return (
    pt.x >= 0 && pt.x < rc.width 
    && pt.y >= 0 && pt.y < rc.height
  );
}
// debounced ref to not recalculate on every move
const wwtView = refThrottled(computed(() => [store.raRad, store.decRad, store.zoomDeg, store.rollRad]), 100);
const comparisonsInView = computed(() => {
  if (!wwtView.value) return []; // we just need the computed to respond to the view change
  return comparisionLocations.value.map((loc, index) => {
    if (!loc) return {index: index, inView: false};
    return {index: index, inView: pointInView(loc.ra, loc.dec)};
  });
});

/** Enable the comparison layers that should be showing. */
function updateComparisonLayers() {
  comparisons.imagesetLayers.forEach((layer, i) => {
    const enabled = comparisonsVisible.value &&
      (showAllComparisons.value || i === comparisonIndex.value);
    layer.set_enabled(enabled);
    if (enabled) {
      layer.set_opacity(comparisonOpacity.value);
    }
  });
}

watch([comparisonsVisible, comparisonOpacity, showAllComparisons], updateComparisonLayers);

function _toggleShowAllComparisons() {
  showAllComparisons.value = !showAllComparisons.value;
  if (showAllComparisons.value) {
    // no point stacking them all up if they are see-through
    comparisonOpacity.value = 1;
  }
  updateComparisonLayers();
}

function goToComparison(index: number | null) {
  if (index === null) {
    comparisonIndex.value = -1;
    comparisonsVisible.value = false;
    updateComparisonLayers();
    return;
  }
  const layer = comparisons.imagesetLayers[index];
  if (!layer) return;
  comparisonIndex.value = index;
  // Showing the image is implied by asking to fly to it, and asking for one
  // image means one image.
  comparisonsVisible.value = true;
  showAllComparisons.value = false;
  updateComparisonLayers();
  moveToImageset(layer, store, true);
}

function stepComparison(delta: number) {
  const count = comparisons.imagesetLayers.length;
  if (count === 0) return;
  // With nothing selected, Next should land on the first image and Back on the
  // last, so start just outside whichever end we are stepping away from.
  const from = comparisonIndex.value >= 0 ? comparisonIndex.value : (delta > 0 ? -1 : 0);
  goToComparison((from + delta + count) % count);
}


watch(foregroundImage, (val) => {
  // "none" falls through to hiding both, which leaves WWT's Gaia DR2 background
  if (val === 'glimpse') { glimpse.show(); herschel.hide(); }
  else if (val === 'herschel') { herschel.show(); glimpse.hide(); }
  else { glimpse.hide(); herschel.hide(); }
  applyForegroundOpacity();
});

/* The loaders' show()/hide() work on `enabled`, so opacity is a separate knob.
   Applied to both collections: whichever is enabled is the one it shows on. */
function applyForegroundOpacity() {
  [glimpse, herschel].forEach(wtml => {
    wtml.imagesetLayers.value.forEach(layer => layer.set_opacity(foregroundOpacity.value));
  });
}
watch(foregroundOpacity, applyForegroundOpacity);

// load either the individual image "./index.wtml" or the tiled version './gal_plane_toast/index_rel.wtml'
const url = './almagal.wtml';

const almagalWtmlState = ref<ImageSetLayerState | null>(null); // This will go into the ImagesetItem to control our fits properties
// Load the WTML. This goes down to level 12
const almagalWtml = reactive(useWtmlLoader(url, {
  autoload: false,
  onLoad: (out, index) => {
    // out contains: folder, place, imageset, layer.
    console.log(`Loaded place ${out.place.get_name()} at index ${index}`);
    if (out.layer) {
      setFitsLayerSettings(out.layer.id.toString(), store, FITS_LAYER_SETTINGS);
      almagalWtmlState.value = store.imagesetStateForLayer(out.layer.id.toString());
    }

  },
  goTo: false, // to go to the first imageset in the WTML  replace false with (_, index) => index === 0
  instant: true,
  useFits: false , // this should be false when using a tiled layer, even if it is fits tiles. set true if loading a non-tiled fits layer.
})
);

const sunCSV = `
ra,dec,d
106.069042627535,-11.4743592401899,1E-8
`;
function createSunLayer() {
  /* idk what i did wrong with this */
  // return store.createTableLayer({
  //   referenceFrame: "Sky",
  //   name: "The Sun",
  //   dataCsv: sunCSV.replace(/\n/g, "\r\n")
  // }).then(layer => {
  //   layer.set_lngColumn(0);
  //   layer.set_latColumn(1);
  //   layer.set_altColumn(2);
  //   layer.set_raUnits(RAUnits.degrees);
  //   layer.set_altUnit(AltUnits.parsecs);
  //   layer.set_altType(AltTypes.distance);
  //   layer.set_showFarSide(true);
  //   layer.set_markerScale(MarkerScales.screen);
  //   layer.set_plotType(PlotTypes.gaussian);
  //   layer.set_opacity(1);
  //   layer.set_scaleFactor(100);
  //   store.applyTableLayerSettings({
  //     id: layer.id.toString(),
  //     settings: [
  //       ["color", Color.load('#ffff0a')],
  //       ["scaleFactor", 100]
  //     ]
  //   });
  //   return layer;
  // });

  return useSpreadsheetLayer([[106.069042627535, -11.4743592401899, 1E-8]], {
    name: "The Sun",
    color: "#ffff0a",
    markerSize: 10,
    markerType: "gaussian",
    raUnit: RAUnits.degrees,
    distanceUnit: AltUnits.parsecs,
  }).createLayer().then(layer => {
    if (!layer) {
      throw new Error("Failed to create sun layer");
    }
    layer.set_opacity(1);
    layer.set_markerScale(MarkerScales.screen);
    store.applyTableLayerSettings({
      id: layer.id.toString(),
      settings: [
        ["color", Color.load('#ffff0a')],
        ["scaleFactor", 100]
      ]
    });
    return layer;
  });
}

import { useScaledZoom } from './composables/useScaledZoom';
const { zoomSliderValue, onZoomSlider, zoomIn, zoomOut } = useScaledZoom();

const sunLayer = ref<SpreadSheetLayer | null>(null);
onMounted(() => {
  // boiler plate to disable WWT and let warning be
  // shown to user if WebGL2 is not supported.
  if (webglDisabled.value) {
    showSplashScreen.value = false;
    // eslint-disable-next-lint @typescript-eslint/ban-ts-comment
    // @ts-expect-error `canvas` is defined
    WWTControl.singleton.canvas.setAttribute("hidden", "true");
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    WWTControl.singleton.renderOneFrame = function() {};
    return;
  }
  


  store.waitForReady().then(async () => {
    await waitForLayerMaps();
    console.log("WWT engine ready, setting up initial view");
    console.log(WWTControl.singleton);

    // keeping it in RA/Dec for convenience. Easier to check if point are in view and to go to a matching 3D view
    store.applySetting(["galacticMode", true]); /* moves might be wierd, but convenient coord sys */
    store.applySetting(["solarSystemCosmos", false]);
    skyBackgroundImagesets.forEach(iset => backgroundImagesets.push(iset));
    console.log("WWT engine ready, background imagesets:", backgroundImagesets);
    // get the Hipparcos catalog to start loading
    /* Deliberately not awaited: the pause below only exists to give Hipparcos a
       head start, and nothing after it depends on the background imagery being
       settled. Awaiting it would put 350ms of dead time in front of the layer
       loading that the splash screen's buttons are waiting on. */
    (async () => {
      store.setBackgroundImageByName("Solar System");
      await new Promise(resolve => setTimeout(resolve, 350)); // 250 - 500ms is about long enough to wait for Hipparcos to load so later swtich is quicker
      store.setBackgroundImageByName('GAIA DR2'); // look at the Imagery list on the WWT page to see a list of background names
    })();
    WWTControl.singleton.setSolarSystemMinZoom(15000 * 9 / 4);  // min zoom for showing the solar system.

    // wait for spreadhseet to load
    await almagalSpreadsheetLayer.createLayer().then(layer => {
      const colorCol = almagalSpreadsheetLayer.getColumnIndex("color");
      layer?.set_scaleFactor(20);
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore Circle hacking
      layer.prepVertexBuffer(WWTControl.singleton.renderContext, layer.get_opacity()); layer.pointList.draw = drawPointList.bind(layer.pointList);
      if (layer && colorCol) {
        layer.set_colorMapColumn(colorCol);
      }
    });
    almagalSpreadsheetLayer.applyFilter();
    sourcesInView.setup();
    /*
     * The order in which image layers are loaded is important as they will stack.
     * awaiting makes sure the imageset layers are registered before moving on.
     */
    // wait for glimpse backgrund to load
    glimpse.load();
    await glimpse.ready;

    // //
    herschel.load();
    await herschel.ready.then(() => {
      herschel.hide();
    });

    // comparison images go above the background surveys but below ALMAGAL
    comparisons.load();
    await comparisons.ready;

    // wait for almagal toasted wtml to load, so that it is on top
    almagalWtml.load();
    await almagalWtml.ready;

    createSunLayer().then((layer) => {
      layer.set_enabled(false); // start with sun layer disabled, as it is just a reference point for the galactic center and can be distracting
      sunLayer.value = layer;
      console.log("Sun layer created");
    });

    // after that, we are ready to load
    layersLoaded.value = true;
    positionSet.value = true;
  });
});

function view3dFromGlonGlatDistkpc(glon: number, glat: number, dist_kpc: number) {
  const [ra, dec] = Coordinates.galactictoJ2000(glon, glat);
  // convert kpc to aU
  const distAu = dist_kpc * 1000 * 206265;

  return store.gotoRADecZoom({
    raRad: ra * D2R,
    decRad: dec * D2R,
    zoomDeg: distAu, // just go without zooming
    rollRad: store.rollRad,
    instant: false,
    duration: 2.5,
  });
}

/* singleton wwt 3d controller */
import { useWwt3dControl } from "./composables/wwt3dControl";
const { in3D: in3dView, switchTo2D } = useWwt3dControl(store);

watch(in3dView, (in3d) => {
  sunLayer.value?.set_enabled(in3d);
});

/* The tour's steps all set up 2D sky views, so opening it has to leave 3D. */
watch(showTour, (open) => {
  if (open && in3dView.value) {
    switchTo2D();
  }
});

let first3dswap = true;
function setup3DView() {
  if (!first3dswap) {
    return;
  }
  // the swtich has already set the initial view and mode, now we want to zoom out and above the galactic plane
  const initialTo = {
    "raRad": -6.2204406298475154,
    "decRad": 0.09487913429030448
  };
  store.gotoRADecZoom({
    // raRad: -(store.raRad + Math.PI / 2),
    // decRad: -(store.decRad + 23.5 * D2R), // tilt up by 23.5 degrees to get above the galactic plane
    ...initialTo,
    zoomDeg: 8 * 1000 * 206265,
    rollRad: 62.9 * Math.PI / 180,
    instant: false,
    duration: 3,
  }).then(() => {
    const [glon, glat] = Coordinates.j2000toGalactic(store.raRad / D2R, store.decRad / D2R);
    console.log("Current glon, glat:", glon, glat);
    view3dFromGlonGlatDistkpc(glon - 20 ,  glat + 30, 8).then(() => {
      store.gotoRADecZoom({
        raRad: store.raRad,
        decRad: store.decRad,
        zoomDeg: 16 * 1000 * 206265,
        rollRad: store.rollRad,
        instant: false,
        duration: 1,
      });
    });
  });
  first3dswap = false;
}


const  _filterFieldUnits: Record<FilterField, string> = {
  mass: "M<sub>⊙</sub>",
  lum: "L<sub>⊙</sub>",
  lm: "L<sub>⊙</sub>/M<sub>⊙</sub>",
  tdust: "K",
  // eslint-disable-next-line @typescript-eslint/naming-convention
  "dist_ag": "pc",
  tbol: "K",
};

// the filter function closes over a reactive, so this function changes as the filter spec changes.
almagalSpreadsheetLayer.setFilter(filterFunction);

//Re-apply filter whenever the spec changes. does nothing if layer doesn't exist
watch(filterSpec, () => almagalSpreadsheetLayer.applyFilter(), { deep: true });
watch(clumpTypeFilter, () => almagalSpreadsheetLayer.applyFilter(), { deep: true });


watch(selectedAlmagalSource, (newSource) => {
  // if (newSource && !in3dView.value) {
  //   store.gotoRADecZoom({
  //     raRad: newSource.ra * D2R,
  //     decRad: newSource.dec * D2R,
  //     zoomDeg: store.zoomDeg, // just go without zooming
  //     rollRad: 0,
  //     instant: false,
  //   });
  // }
  // picking a clump means the ALMAGAL blurb is not what is wanted
  if (newSource && infoSheetTab.value === ALMAGAL_TAB) {
    infoSheetTab.value = SOURCE_INFORMATION_TAB;
  }
});


const ready = computed(() => positionSet.value && layersLoaded.value);
/* `isLoading` is a bit redundant here, but it could potentially have independent logic */
const isLoading = computed(() => !ready.value);


const currentSource = computed(() => {
  return hoveredSource.value ?? selectedAlmagalSource.value;
});

/* This lets us inject component data into element CSS */
const cssVars = computed(() => {
  return {
    "--almagal-blue": almagalBlue.value,
    "--almagal-orange": almagalOrange.value,
    "--almagal-blue-darker": almagalBlueDarker.value,
    "--almagal-orange-darker": almagalOrangeDarker.value,
    "--almagal-bright-blue": almagalBrightBlue.value,
    "--almagal-periwinkle": almagalPeriwinkle.value,
    "--almagal-smoke": almagalSmoke.value,
    "--almagal-slate": almagalSlate.value,
    "--almagal-blue-darkest": almagalBlueDarkest.value,
  };
});


/* Sync up the colormap, stretch, and vmin/vmax for all of the loaded fits images with the WTML as the source of truth */
const imagesetLayerStates = computed(() => {
  const states: ImageSetLayerState[] = [];
  almagalSourceLayers.value.forEach(layer => {
    const state = store.imagesetStateForLayer(layer.id.toString());
    if (state) {
      states.push(state);
    }
  });
  return states;
});
function updateImagesetLayerDisplaySettings() {
  for (let state of imagesetLayerStates.value) {
    setFitsLayerSettings(state.getGuid(), store, FITS_LAYER_SETTINGS);
  }
}
watch(() => almagalWtmlState.value ? almagalWtmlState.value.vmax : null, (newVmax, oldVmax) => {
  if (newVmax && newVmax !== oldVmax) {
    FITS_LAYER_SETTINGS.stretch.vmax = newVmax;
    updateImagesetLayerDisplaySettings();
  }
});
watch(() => almagalWtmlState.value ? almagalWtmlState.value.vmin : null, (newVmin, oldVmin) => {
  if (newVmin && newVmin !== oldVmin) {
    FITS_LAYER_SETTINGS.stretch.vmin = newVmin;
    updateImagesetLayerDisplaySettings();
  }
});
watch(() => almagalWtmlState.value ? almagalWtmlState.value.scaleType : null, (newScale, oldScale) => {
  if (newScale && newScale !== oldScale) {
    FITS_LAYER_SETTINGS.stretch.stretch = newScale;
    updateImagesetLayerDisplaySettings();
  }
});
watch(() => almagalWtmlState.value ? almagalWtmlState.value.settings.colorMapperName : null, (newCmap, oldCmap) => {
  if (newCmap && newCmap !== oldCmap) {
    FITS_LAYER_SETTINGS.cmap = newCmap as Colormaps;
    updateImagesetLayerDisplaySettings();
  }
});
watch(() => almagalWtmlState.value ? almagalWtmlState.value.settings.opacity : null, (newOp, oldOp) => {
  if (newOp && newOp !== oldOp) {
    FITS_LAYER_SETTINGS.opacity = newOp;
    updateImagesetLayerDisplaySettings();
  }
});

</script>

<style lang="less">

// #app is a column flex container with two children:
// #main-content and #bottom-drawer.
// #main-content contains the WWT display and the overlay content.

#app {
  // Vuetify's root app element fills the viewport.
  overflow: hidden;
  overscroll-behavior: none;
  // Vuetify's root app element is a column flex layout
  // lets #main-content take the remaining height
  // after `#bottom-drawer` takes its own height.
}

// while #app is a flex, the direct parent
// is .v-application__wrap
// this takes the size of its children
// so we need to apply height definitions here
// for a display with a side-panel this is generally
// what we want
// Scoped under #app so these beat Vuetify's own `.v-application__wrap` rule,
// which sets `flex-direction: column`. A bare `.v-application__wrap` selector
// only ties it on specificity and loses on source order, which left the panel
// stacked on top of the view at 34% width.
// Default is the column/bottom-panel layout; a side panel opts in.
#app > .v-application__wrap {
  flex-direction: column;
  max-height: 100svh;  // force the application to be 100%
}

#app.app-side-panel > .v-application__wrap {
  flex-direction: row;
  max-height: 100svh;  // force the application to be 100%
}


#main-content {
  // This is the containing block for the absolutely positioned WWT host and overlay.
  position: relative;
  display: block; // don't need to set width. block elements stretch to fill their container by default.
  // Its height is determined by the flex layout in `#app`.
  // Shrinkable with no min-size floor, so an open drawer takes its share
  // instead of pushing the view off the screen (SideDrawer.vue, note 3).
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  // default (column layout): view on top, panel below it
  order: 1;
  // transition: height 0.1s ease-in-out;
}

// side-panel layout: #side-drawer follows #main-content in the DOM, so flipping
// the order is what puts the panel on the left of the view
#app.app-side-panel {
  #main-content {
    order: 2;
  }

  #side-drawer {
    order: 1;
  }
}

/* OLD: overlay version. Taken out of flow with `position: absolute`, so it
   slid over #main-content and the WWT view never changed size.
<v-select
                      v-model="foregroundImage"
                      class="almagal-v-select"
                      :items="foregroundImageOptions"
                      item-title="label"
                      item-value="value"
                      hide-details
                      autofocus
                      label="Background survey"
                    />
#side-drawer {
  position: absolute;
  bottom: 0;
  z-index: 10;
  height: 100%;
  width: 0;
  width: 34vw;
  transform: translateX(-34vw);
  transition: all 0.3s ease-in-out;
  border-top-right-radius: 5px;
  border-bottom-right-radius: 5px;

  &.side-drawer-open {
    transform: translateX(0);
  }
}

#side-drawer.info-bottom {
  left: 0;
  width: 100%;
  height: 0;
  transition: height 0.3s ease-in-out;
  transform: none;
  border-top-left-radius: 5px;
  border-bottom-right-radius: 0;

  &.side-drawer-open {
    height: 34vh;
  }
}
*/

// NEW: in-flow flex sibling of #main-content, so opening it shrinks the WWT
// view instead of covering it (same idea as artemis-ii / why-roman).
// Default is the bottom panel: full width, growing in height.
#side-drawer {
  flex: 0 0 auto;
  overflow: hidden;
  order: 2;
  width: 100%;
  height: 0;
  // transition: height 0.3s ease-in-out;
  border-top-left-radius: 5px;
  border-top-right-radius: 5px;

  &.side-drawer-open {
    height: 34%;
  }
}

// side panel: full height, growing in width
#app.app-side-panel #side-drawer {
  width: 0;
  height: 100%;
  // transition: width 0.3s ease-in-out;
  border-top-left-radius: 0;
  border-top-right-radius: 5px;
  border-bottom-right-radius: 5px;

  &.side-drawer-open {
    width: 34%;
  }
}


/* SideDrawer sizes its own box; where it sits and what it looks like are ours.
   Stacked, its own `order: 1` would put it above the view. */
#tour-drawer.drawer-bottom {
  order: 2;
}

#tour-drawer .tour-sheet {
  position: relative;
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  padding: 1em 1.25em;
  color: #e6e6e6;
  background-color: var(--almagal-blue-darker);
}

/* Teleported into #bottom-content, so it is an ordinary flex item in the
   overlay's bottom row rather than a box pinned to the corner. Undo the
   absolute positioning SideDrawer gives this layout -- the row places it now,
   and the control bar flows beside it instead of being padded past it. The
   overlay is pointer-events: none, so the drawer has to opt back in. */
#tour-drawer.drawer-float {
  position: relative;
  inset: auto;
  border-radius: 5px;
  box-shadow: 0 0 1rem #000a;
  pointer-events: auto;
}

#tour-drawer.drawer-float .tour-sheet {
  border-radius: 5px;
}

#tour-drawer.drawer-push .tour-sheet {
  border-top-right-radius: 5px;
  border-bottom-right-radius: 5px;
}

#tour-drawer.drawer-bottom .tour-sheet {
  border-top-left-radius: 5px;
  border-top-right-radius: 5px;
}

.tour-sheet-close {
  position: absolute;
  top: 0.25em;
  right: 0.25em;
  color: white;
}

/* The WWT host is out of flow so its measured size does not affect #main-content. */
// by using inset: 0, .wwttelescope-component fills #main-content and automatically resizes with it,
// without needing a height width set. this allows main-content to be more freely sizes.
/*
WWT can size itself from CSS alone here because #main-content has a real layout size (from the flex layout in #app)
and `.wwtelescope-component` is absolutely positioned to fill it.

This breaks if #main-content stops having a definite size from layout. Common failure modes:
  - `#main-content` loses `flex-grow`/flex sizing, so in a column layout it can collapse to zero height.
  - An ancestor no longer has a definite height, so percentage or flex-based heights stop resolving.
  - `#main-content` is changed to content-sized sizing (`auto`, `fit-content`, certain grid/flex min-content cases),
    so its size starts depending on descendants instead of the outer layout.
  - `.wwtelescope-component` is put back in normal flow, letting WWT's continuously resized canvas feed back into layout
    and recreate the growth loop.
  - Padding or other box-model changes are applied to the measured WWT host instead of an outer wrapper, which can
    reintroduce resize feedback.

If any of those happen, the ResizeObserver composable may be needed again to push the resolved size from
`#main-content` onto the WWT host explicitly.
*/
.wwtelescope-component {
  position: absolute; // putting this to relative will cause the growth loop, and will require the composable to prevent that
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
  // The composable sets the host element's inline width/height from #main-content.
  // transition: height 0.2s ease-in-out;
  opacity: 1;
}

/*
#wwt-overlay is positioned against #main-content, not the viewport.
`position: absolute` makes it fill #main-content.
`position: fixed` would anchor it to the viewport instead.
The overlay itself is out of flow, but its children can use normal flex layout inside it.
you can also do position: relative, height: 100%. (and remove the inset: 0)
- absolute + inset: 0 says “this is a layer pinned to the container”
- relative + height: 100% says “this is a normal child trying to be as tall as its parent”
we use the absolute variant to stay more independent of the which can interact weirdly with WWT's resizing.
and the relative still requires the parent to have a definite size.
and remember, position:absolute is still a positioned parent, so children can be absolute against it
*/
#wwt-overlay {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
  padding: 1rem;
  pointer-events: none;

  display: flex;
  flex-direction: column;
  justify-content: space-between; // pushes top and bottom content apart
}

#wwt-overlay > * {
  // give all direct children their own stacking context, so they layer in order
  isolation: isolate;
}

#app.app-is-landscape {
  .v-application__wrap {
    flex-direction: row;
    height: 100svh;
    max-height: 100svh;
  }

  #main-content {
    flex: 1 1 0;
    min-width: 0;
  }
}

#top-content {
  width: 100%; // 100% of the overlay less the padding
  pointer-events: none;
  display: flex;
  flex-direction: row; // stack top-buttons-row and second-buttons-row vertically
  justify-content: space-between; // keeps left, center, and right buttons spread
  align-items: flex-start;
}

#left-buttons {
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: flex-start;
  margin-bottom: 5px;
}

.top-buttons-row,
.second-buttons-row {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  margin-bottom: 10px;
}

#center-buttons {
  display: flex;
  flex-direction: row;
  gap: 10px;
  align-items: center;
  pointer-events: auto;
  width: 300px;
}
#right-buttons {
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: flex-end;
  height: auto;

  hr {
    margin-block: 0.25em;
    opacity: 0;
  }
}

.icon-wrapper {
    pointer-events: auto !important;
    background-color: transparent !important;
    -webkit-backdrop-filter: blur(6px);
    backdrop-filter: blur(6px);
  }


// two rows: the tour-and-controls row, then the logos
#bottom-content {
  display: grid;
  grid-template-columns: auto;
  grid-template-rows: auto auto;
  gap: 0.5em;
  pointer-events: none;
  align-items: flex-end;
}

#bottom-content {
  // the floating tour and the control bar share this row, bottom-aligned
  .bottom-main {
    display: flex;
    flex-direction: row;
    align-items: flex-end;
    gap: 1rem;
    min-width: 0;
  }

  // `contents` so the empty slot takes no room, and the teleported drawer
  // becomes a flex item of .bottom-main directly
  #tour-float-slot {
    display: contents;
  }

  #body-logos {
    align-self: flex-end;
  }

  #body-logos.small-logos {
    display: none;
    margin-top: 0.5em;
  }

  #icons-container {
    display: flex;
    justify-content: flex-end;
    gap: 4px;
  }

  .toolkit-credit {
    font-size: 0.65rem;
    color: rgba(255,255,255,0.55);
    text-align: right;
    margin: 2px 0 0;
    a { color: inherit; text-decoration: underline; }
  }
}

#app.app-is-small #bottom-content {
  padding: 0;
}

// From Sara Soueidan (https://www.sarasoueidan.com/blog/focus-indicators/) & Erik Kroes (https://www.erikkroes.nl/blog/the-universal-focus-state/)
// :not won't work on some browseers, but avoids a complicated set of css
:focus-visible:not(.v-btn):not(.v-field):not(.v-input) {
  outline: 4px double white;
  box-shadow: 0 0 0 2px black;
  border-radius: .025rem;
}

.v-field__input > input:focus-visible {
  outline: none !important;
  box-shadow: none !important;
}

.layout-debug {
  #main-content {
    border: 2px solid red;
  }
  #main-content,
  #top-content,
  #left-buttons,
  #center-buttons,
  #right-buttons,
  .top-buttons-row,
  .second-buttons-row,
  #bottom-content {
    outline: 1px solid white;
    min-width: 1px;
    min-height: 1px;
  }
  #wwt-overlay {
    border: 3px solid aqua;
  }

}

#bottom-drawer {
  position: relative;
  overflow: auto;
}

.v-btn {
  pointer-events: auto;
}

.blur-background {
  background-color: rgba(0, 0, 0, 0.364);
  backdrop-filter: blur(6px);
}

.white-outline {
  border: 1px solid white;
}

.source-controls {
  display: flex;
  align-items: start;
  justify-content: center;
  gap: 8px;
}


.main-logo-text {
  text-align: center;
  width:fit-content;
}

.v-btn.blur-button.v-btn--variant-outlined {
  background-color: rgba(0, 0, 0, 0.364);
  backdrop-filter: blur(6px);
}

.layer-list {
  outline: 1px solid black;
  border: 1px solid white;
  padding: 4px;
  border-radius: 4px;
}

.layer-list__item {
  background-color: rgba(0, 0, 0, 0.364);
  border: 1px solid rgba(255, 255, 255, 0.541);
  border-radius: 5px;
  backdrop-filter: blur(10px);
  width: 100%;
}

.on-canvas {
  background-color: rgba(0, 0, 0, 0.364);
  border: 1px solid rgba(255, 255, 255, 0.541);
  border-radius: 5px;
  backdrop-filter: blur(10px);
}

.almagal-v-select {
  pointer-events: auto;
  border-radius: 4px;
  min-width: 250px;
}

// the overlay is pointer-events: none, so these have to opt back in
.tour-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.5em;
  pointer-events: auto;
}

.hovered-source-info {
  background-color: rgba(0, 0, 0, 0.364);
  backdrop-filter: blur(10px);
  width: fit-content;
  min-height: 50px;
  padding: 0.5em 1em;
  border-radius: 8px;
}



.pending-source-label {
  color: white;
  font-size: 0.85em;
  padding: 4px 8px;
  font-weight: bold;
}

.bunch-o-buttons {
  max-width: 300px;
}

// takes whatever the tour leaves, and centres its buttons in that
#bottom-content .control-bar {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: center;
  align-items: flex-end;
  gap: 0.75em;
  padding-inline: 0.5em;
}

.v-field__outline {
  // --v-field-border-width: 1px !important;
  // --v-field-border-opacity: 1 !important;
}



// adjust the wwt-3d switch 
.wwt-3d-swtich-container .v-input.v-switch > .v-input__prepend {
  margin-right: 4px;
  font-size: 20px;
}
.wwt-3d-swtich-container .v-input.v-switch > .v-input__append {
  margin-left: 4px;
  font-size: 20px;
}

/* -- 2D / 3D toggle ---------------------------------------------------- */

.settings-page .wwt-3d-swtich-container {
  .v-switch__thumb { background: var(--panel-accent); }
  .v-switch__track { background: var(--panel-border); opacity: 1; }
}

/* ===================================================== control panel skin ==
   One token set for the settings drawer. The drawer is the quietest surface
   and the cards sit above it, so the panel stops competing with the nebula in
   the canvas behind it. Everything below is scoped to .settings-page (or to
   the sheet that holds it) so it cannot leak into the other info-sheet tabs. */
#app {
  --panel-drawer: var(--almagal-blue-darkest);   // drawer ground, behind the cards
  --panel-card: var(--almagal-blue-darker);     // card ground
  --panel-border: var(--almagal-bright-blue);   // card borders, dividers, segmented-control seams
  --panel-track: var(--almagal-slate);    // slider track, unfilled
  --panel-accent: var(--almagal-periwinkle); // slider fill, chevrons, links
  --panel-accent2: var(--almagal-orange); // card subheaders
  --panel-thumb: var(--almagal-smoke);    // slider thumbs
  --panel-title: #FFF;    // card titles
  --panel-label: var(--almagal-smoke);    // control names and subsection labels
  --panel-value: #FFF;    // numeric readouts
  --panel-muted: var(--almagal-slate);    // helper text, disabled labels
  --panel-text: var(--almagal-smoke);
  --bhal: #939da8;  

  /* A three-step type scale, in rem rather than px or a fluid clamp. rem is
     anchored to the root, so it inherits the reader's browser font-size setting
     and doesn't compound the way em does through drawer -> card -> label. Fixed
     rather than fluid because the drawer's width is near-constant (about 420px
     of content at a 1440px viewport, 256px at 360px), and because 12px has no
     room to shrink. To scale the panel on small screens, move these three here
     rather than making each size fluid on its own. */
  --panel-font-title: 1.1rem;     
  --panel-font-body: 0.95rem;        
  --panel-font-small: 0.75rem;    
  
  --tour-sheet-background: var(--almagal-blue-darkest);
}

// Anchors the close button against a title instead of leaving it floating.
// The title itself is styled in InformationSheet.vue, next to the tab rules it
// mirrors; the row only has to stop stretching it to full height.
.cds-info-sheet-header {
  display: flex;
  align-items: flex-end;
}


/* zoom control */
.zoom-control {
  background-color: rgba(0, 0, 0, 0.364);
  backdrop-filter: blur(2px);
  border-radius: 5px;
}

/* The drawer holds two sheets. After the .tour-sheet rule above, so this
   overflow beats its overflow-y. */
#tour-drawer .tour-stack {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0;
  gap: 0.5em;
}

#tour-drawer .tour-sheet {
  display: flex;
  flex-direction: column;
  overflow: hidden; // the step scrolls instead (TourPlayer.vue)
  flex: 1 0 auto;
}

#tour-drawer .tour-sheet > .tour-player {
  flex: 1 1 auto;
  min-height: 0;
}

// the tour takes whatever the panel does not
#tour-drawer .controls-sheet {
  flex: 0 1 auto;
  min-height: 0;
  // max-height: 50%;
  overflow-y: auto;
  color: #e6e6e6;
  background-color: var(--tour-sheet-background);
  border-radius: 5px;
}

/* Across the bottom there is width to spare but no height. No flag needed:
   too narrow and the panel is not rendered, and a row of one still fills. */
#tour-drawer.drawer-bottom .tour-stack {
  flex-direction: row;

  > .tour-sheet {
    min-width: 0;
    flex-shrink: 1;
  }

  > .controls-sheet {
    flex: 0 0 34%;
    min-width: 0;
    max-height: none;
  }
}

// A wide window makes the column wide, so cap the text (not the sheet --
// the breadcrumbs want the width). 60ch measures ~60 characters.
#tour-drawer.drawer-push .tour-window {
  max-width: 60ch;
}

.almagal-logo-v-btn {
  background-image: url("/almagal-header.png");
  background-size: cover;
  background-position: center;
}
</style>
