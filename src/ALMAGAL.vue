<template>
  <v-app
    id="app"
    :style="cssVars"
    :class="[smallSize ? 'app-is-small' : '', isLandscape ? 'app-is-landscape' : '']"
  >
    <div
      id="main-content"
    >
      <WorldWideTelescope
        ref="wwt-container"
        :wwt-namespace="wwtNamespace"
        @pointermove="almagalSpreadsheetLayer.onPointerMove"
        @click="almagalSpreadsheetLayer.onPointerClick"
      ></WorldWideTelescope>
      <wwt-loader v-model="isLoading" />

      
      <!-- This contains the splash screen content -->
      <SplashScreen
        v-model="showSplashScreen"
        :accent-color="accentColor"
        :highlight-color="accentColor2"
        :loaded="!isLoading"
      />


      <!-- This block contains the elements (e.g. icon buttons displayed at/near the top of the screen -->
      <div
        v-show="!(showSplashScreen)"
        id="wwt-overlay"
      > 
        <div id="top-content">
          <!-- old left-buttons / right-buttons layout preserved below -->
          <div id="left-buttons">
            <fieldset class="almagal-filterset">
              <!-- mass, lum, lm, tdust, dist_ag, tbol -->
              <div
                v-for="field in filterFields"
                :key="field"
                class="filter-slider"
              >
                <label><span>{{ filterFieldLabels[field] }}</span>
                  <RangeNumberInputs
                    :model-value="filterSpec.get(field)!"
                    :min="almagalColumnRanges[field].min"
                    :max="almagalColumnRanges[field].max"
                    :fiducial="hoveredSource ? hoveredSource[field] : undefined"
                    :steps="500"
                    log
                    @update:model-value="(val) => filterSpec.set(field, val)"
                  />
                </label>
              </div>
            </fieldset>
            <div 
              v-if="!in3dView"
              class="d-flex align-center mt-1 ga-2"
            >
              <v-tooltip
                v-if="!showSearch"
                text="Search for source"
                location="bottom"
              >
                <template #activator="{ props: tooltipProps }">
                  <v-btn
                    v-bind="tooltipProps"
                    prepend-icon="mdi-magnify"
                    style="pointer-events: auto;"
                    class="blur-button"
                    variant="outlined"
                    @click="showSearch = true"
                  >
                    Search for source
                  </v-btn>
                </template>
              </v-tooltip>
              <template v-else>
                <v-autocomplete
                  v-if="almagalSourceList"
                  v-model="selectedAlmagalSource"
                  class="almagal-v-select"
                  :items="almagalSourceList"
                  item-title="iid"
                  item-value="iid"
                  return-object
                  hide-details
                  label="ALMAGAL Source"
                  :loading="pendingSourceIids.length > 0"
                  autofocus
                />
                <v-btn
                  icon="mdi-close"
                  size="small"
                  style="pointer-events: auto;"
                  variant="outlined"
                  class="blur-button"
                  @click="showSearch = false"
                />
              </template>
            </div>
          </div>
          <div id="right-buttons">
            <div class="d-flex flex-row flex-wrap ga-4 pa-2 bunch-o-buttons">
              <wwt-3d-switch
                v-model="in3dView"
                @3d="setup3DView"
              >
                <template #default="{ in3d, onClick}">
                  <v-btn
                    @click="onClick"
                  >
                    {{ in3d ? "Switch to 2D" : "Switch to 3D" }}
                  </v-btn>
                </template>
              </wwt-3d-switch>
              <v-btn
                style="pointer-events: auto;"
                @click="showInfoSheet = true"
              >
                Show Info
              </v-btn>
              <v-btn
                v-if="showAllInView && !in3dView"
                style="pointer-events: auto;"
                @click="showAllSourcesInView"
              >
                Show all in view ({{ sourcesInView.count }})
              </v-btn>
              <v-btn
                style="pointer-events: auto;"
                :prepend-icon="spreadsheetVisible ? 'mdi-eye-off' : 'mdi-eye'"
                @click="spreadsheetVisible = !spreadsheetVisible"
              >
                {{ spreadsheetVisible ? 'Hide sources' : 'Show sources' }}
              </v-btn>
            </div>
            <!-- The main wtml layer. there is just one, but a loop avoids an annoting v-if -->
            <v-select
              v-if="!in3dView"
              v-model="foregroundImage"
              :items="foregroundImageOptions"
              item-title="label"
              item-value="value"
              hide-details
              density="compact"
              style="pointer-events: auto; max-width: 220px;"
              class="blur-button"
              label="Background survey"
            />
            <div
              v-if="!in3dView"
            >
              <div
                v-for="layer in almagalWtml.imagesetLayers"
                
                :key="layer.id.toString()"
                class="layer-list__item elevation-2 my-2"
              >
                <ImagesetItem
                  style="color: black"
                  :imageset="store.imagesetStateForLayer(layer.id.toString())!"
                  instant
                  :crange="{min: -0.001, max: 1}"
                  log-stretch-slider
                />
                <div
                  style="pointer-events: auto;"
                >
                  <v-btn
                    size="small"
                    variant="outlined"
                    class="blur-button"
                    prepend-icon="mdi-refresh"
                    @click="setFitsLayerSettings(layer.id.toString(), store, FITS_LAYER_SETTINGS_RESET)"
                  >
                    Reset
                  </v-btn>
                </div>
              </div>
            </div>
            <div 
              v-if="(almagalSourceLayers.size > 0 || pendingSourceIids.length > 0) && !in3dView"
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
                  hide-goto
                  no-open
                />
              </div>
              <div
                v-for="iid in pendingSourceIids"
                :key="iid"
                class="layer-list__item"
              >
                <div class="pending-source-label">
                  {{ getAlmagalSourceById(iid)?.aid ?? iid }}
                </div>
                <v-progress-linear
                  indeterminate
                  color="orange"
                  height="3"
                />
              </div>
            </div>
          </div>
        </div>


        <!-- This block contains the elements (e.g. the project icons) displayed along the bottom of the screen -->

        <div id="bottom-content">
          <div class="hovered-source-info">
            Currently hovering: {{ hoveredSource ? hoveredSource.aid : "none" }}
          </div>
          <div
            id="body-logos"
            :class="{'small-logos': smallSize}"
          >
            <credit-logos
              :default-logos="['cosmicds', 'wwt', 'sciact', 'nasa']"
              :logo-size="smallSize ? '1em' : '2.5em'"
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
    <component
      :is="false ? 'v-navigation-drawer' : 'v-bottom-sheet'"
      id="side-drawer"
      v-model="showInfoSheet"
      :class="[false ? 'info-side' : 'info-bottom', showInfoSheet ? 'side-drawer-open' : 'side-drawer-closed']"
    >
      <InformationSheet
        v-model="showInfoSheet"
        :tab-color="accentColor"
        text-color="#e6e6e6"
      >
        <!-- default slot appears under Information heading -->
        <div>
          <p>
            ALMAGAL: ALMA Evolutionary study of High Mass Protocluster Formation in the Galaxy
          </p>
          <AlmaGalSourceInfoDisplay
            v-if="selectedAlmagalSource && !in3dView"
            :source="selectedAlmagalSource"
          />
        </div>
      </InformationSheet>
    </component>
  </v-app>
</template>

<script setup lang="ts">
/* eslint-disable @typescript-eslint/no-unused-vars */
import { ref, reactive, computed, onMounted, watch, shallowRef } from "vue";
import { useDisplay } from "vuetify";

/* WWT imports */
import { GotoRADecZoomParams, engineStore, ImageSetLayerState } from "@wwtelescope/engine-pinia";
import { 
  BackgroundImageset, 
  skyBackgroundImagesets, 
  supportsTouchscreen, 
  useWWTKeyboardControls, 
  useFullscreen,
} from "@cosmicds/vue-toolkit";
import { D2R  } from "@wwtelescope/astro";
import { 
  WWTControl, 
  LayerManager, 
  Place, 
  ImageSetLayer, 
  Imageset, 
  TileCache,
  Coordinates,
  Color,
  SpreadSheetLayer,
} from "@wwtelescope/engine";
// scale types: linear, log, power, sqrt, histogramEqualization
import { ScaleTypes, RAUnits, AltTypes, AltUnits, MarkerScales, PlotTypes } from "@wwtelescope/engine-types";
import { addCustomColormaps, COLORMAPS, type Colormaps  } from "./wwt-colormaps/colormaps";
addCustomColormaps();

/* local components and composables */
import WebGlTest from "./components/WebGlTest.vue";
const webglDisabled = ref(false);


import SplashScreen from "./components/SplashScreen.vue";
import InformationSheet from "./components/InformationSheet.vue";
import ImagesetItem from "./components/ImagesetItem.vue";
import RangeNumberInputs from "./components/RangeNumberInputs.vue";
import Wwt3dSwitch from "./components/Wwt3dSwitch.vue";


import { useWtmlLoader } from "./composables/useWtmlLoader";
import { useHoverableSpreadsheetLayer } from "./composables/useHoverableSpreadsheetLayer";
import { useSourcesInView } from "./composables/useSourcesInView";
import { setFitsLayerSettings } from "./wwt-helpers";

import { 
  almagalSources,
  getAlmagalSourceById, 
  getAlmagalSourceUrl,
  type ALMAGalSource
} from "./almagal_utils";
import AlmaGalSourceInfoDisplay from "./components/AlmaGalSourceInfoDisplay.vue";
import { useSpreadsheetLayer } from "./composables/useSpreadsheetLayer";

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

const skipSplash = searchParams.get("splash")?.toLowerCase() === "false";
console.log("kiosk mode?", kiosk);
console.log("skip splash?", skipSplash);
const store = engineStore();

useWWTKeyboardControls(store);

/* Properties related to device/screen characteristics */
const touchscreen = supportsTouchscreen();
const  { smAndDown, width: viewportWidth, height: viewportHeight } = useDisplay();
const isVertical = computed(() => viewportHeight.value > viewportWidth.value);
const smallSize = computed(() => smAndDown.value);
const isLandscape = computed(() => viewportWidth.value > viewportHeight.value * 1.25);

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
const showInfoSheet = ref(false);
const showSearch = ref(false);
const showSplashScreen = ref(false);
const layersLoaded = ref(false);
const positionSet = ref(false);
const accentColor = ref("#306C9F");
const accentColor2 = ref("#FC9954");


/* Get the source list first */
import almagalClumps from "./assets/almagal_clump_props_WWT.json";
// merge almagalClumps "type" and an "included field" based on iid/INTERNAL_ID
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mergedCatalog(sources: ALMAGalSource[], clumps: any[]): ( ALMAGalSource & { type: string; included: boolean })[] {
  const clumpMap = new Map(clumps.map(clump => [clump.INTERNAL_ID, clump]));
  return sources.map(source => {
    const clump = clumpMap.get(source.iid);
    return {
      ...source,
      type: clump ? clump.TYPE : "unknown",
      included: !!clump,
      color: clump ? "#ec42f5" : "#999999", // color sources with clumps green, others gray
    };
  });
}

const almagalSourceList = shallowRef(mergedCatalog(almagalSources, almagalClumps));
const hoveredSource = ref<ALMAGalSource | null>(null);
const MAX_ITEMS_TO_SHOW = 2;
const sourcesInView= useSourcesInView(almagalSourceList.value);
const showAllInView = computed(() => sourcesInView.count.value > 0 && sourcesInView.count.value <= MAX_ITEMS_TO_SHOW);

function showAllSourcesInView() {
  sourcesInView.sourcesInView.value.forEach(source => {
    loadAlmaGalFitsSource(source.iid).then(layer => {
      setFitsLayerSettings(layer.id.toString(), store, FITS_LAYER_SETTINGS);
    });
  });
}

// { onPointerMove, onPointerClick, createLayer: setupSpreadsheet, setFilter, applyFilter, show: showSpreadsheet, hide: hideSpreadsheet, setVisible: setSpreadsheetVisible }
const almagalSpreadsheetLayer = useHoverableSpreadsheetLayer(
  almagalSourceList.value,
  {
    name: "ALMAGAL Sources",
    color: "#32CD32",
    markerSize: 7,
    markerType: "point",
    distanceColumn: "dist_ag",
    raUnit: RAUnits.degrees,
    onHover: (row, index) => { 
      hoveredSource.value = row as ALMAGalSource | null; 
    },
    onClick: (row) => { 
      selectedAlmagalSource.value = row as ALMAGalSource;
    },
  }
);
const spreadsheetVisible = ref(true);
watch(spreadsheetVisible, (visible) => {
  almagalSpreadsheetLayer.setVisible(visible);
});


function moveToImageset(layer: ImageSetLayer, instant = true) {
  const imageset = layer.get_imageSet();
  // const roll = imageset.get_rotation() * D2R;

  // @ts-expect-error _guessZoomSetting is internal; gives projection-aware zoom
  const zoomDeg = imageset._guessZoomSetting(Number.POSITIVE_INFINITY);

  return store.gotoRADecZoom({
    raRad: imageset.get_centerX() * D2R,
    decRad: imageset.get_centerY() * D2R,
    zoomDeg,
    rollRad: store.rollRad,
    instant,
  });
}

/* Load WTMLS for different background layers. 
   Don't forget to add them to `foregroundImageOptions` and the `foregroundImage` watcher!
*/
// In principle we could use autoload: true. But it is useful to try to load things in order
// newer GLIMPSE 360
const glimpse = useWtmlLoader('./GLIMPSE_360.wtml', {autoload: false});

// Start this disabled. Use herschelPacs.show() to show it. It has a black layer which
const herschel = useWtmlLoader('./herschel_spire_rgb.wtml', {autoload: false, onLoad: (out) => {
  out.layer?.set_enabled(false);
}});

const decaps = useWtmlLoader('./decaps_dr1.wtml', {autoload: false, onLoad: (out) => {
  out.layer?.set_enabled(false);
}});

const foregroundImage = ref<'glimpse' | 'herschel' | 'decaps'>('glimpse');
const foregroundImageOptions = [
  { label: 'GLIMPSE 360', value: 'glimpse' },
  { label: 'Herschel SPIRE (color)', value: 'herschel' },
  { label: 'DECAPS DR1', value: 'decaps' },
];
watch(foregroundImage, (val) => {
  if (val === 'glimpse') { glimpse.show(); herschel.hide(); decaps.hide(); }
  else if (val === 'herschel') { herschel.show(); glimpse.hide(); decaps.hide(); }
  else if (val === 'decaps') { decaps.show(); glimpse.hide(); herschel.hide(); }
  else { glimpse.show(); herschel.hide(); decaps.hide();  }
});

/** settings that will be applied to each fits layer */
const FITS_LAYER_SETTINGS = {
  cmap: 'rdbu' as Colormaps,
  opacity: 1.0,
  stretch: {
    stretch: ScaleTypes.linear,
    vmin: -0.0005,
    vmax: 0.0015,
  }
};

const FITS_LAYER_SETTINGS_RESET = {
  cmap: 'rdbu' as Colormaps,
  opacity: 1.0,
  stretch: {
    stretch: ScaleTypes.linear,
    vmin: -0.0005,
    vmax: 0.0015,
  }
} as const;


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
    markerType: "point",
    raUnit: RAUnits.degrees,
    distanceUnit: AltUnits.parsecs,
  }).createLayer().then(layer => {
    if (!layer) {
      throw new Error("Failed to create sun layer");
    }
    layer.set_plotType(PlotTypes.gaussian);
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
    // keeping it in RA/Dec for convenience. Easier to check if point are in view and to go to a matching 3D view
    store.applySetting(["galacticMode", true]); /* moves might be wierd, but convenient coord sys */
    store.applySetting(["solarSystemCosmos", false]);
    skyBackgroundImagesets.forEach(iset => backgroundImagesets.push(iset));
    // get the hipparcos catalog to start loading
    store.setBackgroundImageByName("Solar System");
    await new Promise(resolve => setTimeout(resolve, 350)); // 250 - 500ms is about long enough to wait for hipparchos to load so later swtich is quicker
    store.setBackgroundImageByName('GAIA DR2'); // look at the Imagery list on the WWT page to see a list of background names
    WWTControl.singleton.setSolarSystemMinZoom(15000 * 9 / 4);  // min zoom for showing the solar system.
    
    // wait for spreadhseet to load
    await almagalSpreadsheetLayer.createLayer().then(layer => {
      const colorCol = almagalSpreadsheetLayer.getColumnIndex("color");
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
    
    decaps.load();
    await decaps.ready.then(() => {
      decaps.hide();
    });
      
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

/* Tracks whether the WWT view is currently in 3D mode, kept in sync via wwt-3d-switch's v-model */
const in3dView = ref(false);

watch(in3dView, (in3d) => {
  sunLayer.value?.set_enabled(in3d); 
});

let first3dswap = true;
function setup3DView() {
  if (!first3dswap) {
    return;
  }
  // the swtich has already set the initial view and mode, now we want to zoom out and above the galactic plane
  store.gotoRADecZoom({
    raRad: -(store.raRad + Math.PI / 2),
    decRad: -(store.decRad + 23.5 * D2R), // tilt up by 23.5 degrees to get above the galactic plane
    zoomDeg: 8 * 1000 * 206265,
    rollRad: 62.9 * Math.PI / 180,
    instant: false,
    duration: 4,
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


interface AlmaGalSourceFilterRange { max: number | null; min: number | null }
type AlmaGalSourceFilterSpec = Map<keyof ALMAGalSource, AlmaGalSourceFilterRange>;

// Numeric source fields exposed as range-filter sliders. Edit this list to add or remove sliders.
const filterFields = ["mass", "lum", "lm", "tdust", "dist_ag", "tbol"] as const;

// Human-readable labels for the filter sliders above.
const filterFieldLabels: Record<typeof filterFields[number], string> = {
  mass: "Mass",
  lum: "Luminosity",
  lm: "Lum/Mass",
  tdust: "Dust Temp.",
  // eslint-disable-next-line @typescript-eslint/naming-convention
  "dist_ag": "Distance (pc)",
  tbol: "Bolometric Temp.",
};

// Full [min, max] of each filterable column, measured from the loaded sources.
const almagalColumnRanges = filterFields.reduce((ranges, field) => {
  let min = Infinity;
  let max = -Infinity;
  for (const source of almagalSourceList.value) {
    const value = source[field];
    if (typeof value !== "number" || Number.isNaN(value)) continue;
    if (value === -999) continue; // -999 is missing value
    if (value < min) min = value;
    if (value > max) max = value;
  }
  ranges[field] = { min, max };
  return ranges;
}, {} as Record<typeof filterFields[number], { min: number; max: number }>);

// Seed each filter at its column's full range, so nothing is filtered out until a slider is moved.
const initialFilterSpec = new Map(
  filterFields.map(field => [field, { max: almagalColumnRanges[field].max, min: almagalColumnRanges[field].min }])
);
const filterSpec = ref<AlmaGalSourceFilterSpec>(initialFilterSpec);
// the use of a ref here means the function will always reflect the latest filter spec.
function filterFunction(row: Record<string, string>) {
  for (const [column, range] of filterSpec.value) {
    const value = +row[column];
    if (Number.isNaN(value)) return false; // empty value or something else -> false
    if (range.min != null && value < range.min) return false;
    if (range.max != null && value > range.max) return false;
  }
  return true;
}  

// the filter function closes over a reactive, so this function changes as the filter spec changes. 
almagalSpreadsheetLayer.setFilter(filterFunction);

//Re-apply filter whenever the spec changes. does nothing if layer doesn't exist
watch(filterSpec, () => almagalSpreadsheetLayer.applyFilter(), { deep: true });


const selectedAlmagalSource = ref<ALMAGalSource | null>(null);
const almagalSourceLayers = ref<Map<ALMAGalSource["iid"], ImageSetLayer>>(new Map());
const pendingSourceIids = ref<ALMAGalSource["iid"][]>([]);

/**
 * Create a fitsimage layer from an ALMAGal source id
 * The create layer get's added to almagalSourceLayers
 */
function loadAlmaGalFitsSource(iid: ALMAGalSource["iid"]): Promise<ImageSetLayer> {
  // make sure it has not already been loaded. 
  if (almagalSourceLayers.value.has(iid)) {
    return Promise.resolve(almagalSourceLayers.value.get(iid)!);
  }
  
  // otherwise get it's url and load it as a new "fits" ImageSetLayer
  const source = getAlmagalSourceById(iid);
  if (!source) {
    throw new Error(`Source with id ${iid} not found`);
  }
  
  // keep track of what is being loaded
  if (!pendingSourceIids.value.includes(iid)) {
    pendingSourceIids.value.push(iid);
  }
  const url = getAlmagalSourceUrl(source);
  console.log("Loading ALMAGAL source from url:", source, url);
  console.warn("The CORS is ok. It takes a moment to fetch via WWT Proxy");
  return store.addImageSetLayer({
    url: url,
    mode: "fits", 
    name: source.aid,
    goto: false,
  }).then(layer => {
    almagalSourceLayers.value.set(iid, layer);
    const idx = pendingSourceIids.value.indexOf(iid);
    if (idx !== -1) pendingSourceIids.value.splice(idx, 1);
    return layer;
  });
}

watch(selectedAlmagalSource, (newSource, oldSource) => {
  if (newSource) {
    store.gotoRADecZoom({
      raRad: newSource.ra * D2R,
      decRad: newSource.dec * D2R,
      zoomDeg: store.zoomDeg, // just go without zooming
      rollRad: 0,
      instant: false,
    });
    loadAlmaGalFitsSource(newSource.iid).then(layer => {
      setFitsLayerSettings(layer.id.toString(), store, FITS_LAYER_SETTINGS);
    });
  }
});


const ready = computed(() => positionSet.value && layersLoaded.value);
/* `isLoading` is a bit redundant here, but it could potentially have independent logic */
const isLoading = computed(() => !ready.value);




/* This lets us inject component data into element CSS */
const cssVars = computed(() => {
  return {
    "--accent-color": accentColor.value,
    "--accent-color-2": accentColor2.value
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
.v-application__wrap {
  flex-direction: row;
  max-height: 100svh;  // force the application to be 100%
}

#app.app-is-small {
  .v-application__wrap {
    flex-direction: column;  // add for the side panel
    max-height: 100svh;  // force the application to be 100%
  }
}


#main-content {
  // This is the containing block for the absolutely positioned WWT host and overlay.
  position: relative;
  display: block; // don't need to set width. block elements stretch to fill their container by default.
  // Its height is determined by the flex layout in `#app`.
  flex: 1 0 auto;
  overflow: hidden;
  order: 2;
  transition: height 0.1s ease-in-out;
}

#app.app-is-small #main-content {
  order: 1;
}

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
  transition: height 0.2s ease-in-out;
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


#bottom-content {
  display: grid;
  grid-template-columns: auto;
  grid-template-rows: auto auto auto;
  pointer-events: none;
  align-items: flex-end;
}

#bottom-content {
  .bottom-row-1 {
    grid-row: 1 / 2;
    display: flex;
    justify-content: space-between;
    align-items:flex-end;
    gap: 1em;
  }

  .bottom-row-2 {
    grid-row: 2 / 3;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  #body-logos {
    align-self: flex-end;
    grid-row:  3 / 4;
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



.main-logo-text {
  text-align: center;
  width:fit-content;
}

.v-btn.blur-button.v-btn--variant-outlined {
  // background-color: black;
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

.almagal-v-select {
  pointer-events: auto;
  width: 100%;
  min-width: 250px;
  background-color: rgba(0, 0, 0, 0.364);
  backdrop-filter: blur(10px);
  outline: 1px solid white;
  border-radius: 4px;
}

.hovered-source-info {
  background-color: rgba(0, 0, 0, 0.364);
  backdrop-filter: blur(10px);
  width: fit-content;
  padding: 0.5em 1em;
  border-radius: 8px;
}


.almagal-filterset {
  display: flex;
  flex-direction: column;
  gap: 0.5em;
  width: fit-content;
  pointer-events: auto;
  padding-inline: 5px;
  background-color: rgba(0, 0, 0, 0.364);
  backdrop-filter: blur(8px);
  border-radius: 8px;
  font-size: 0.9em;
  padding-bottom: 1em;
}

// style the legend to be centerd
.almagal-filterset > legend {
  margin-inline: auto;
  padding: 0 5px;
}

.almagal-filterset label > span {
  font-weight: bold;
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
</style>
