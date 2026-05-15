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
        :wwt-namespace="wwtNamespace"
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
          <!-- <div id="left-buttons">
          </div> -->
          <!-- <div id="right-buttons">
          </div> -->
          <div
            v-if="ready && almagalSources && almagalSources.imagesetLayers?.length > 0"
            id="layer-list"
          >
            <div
              v-for="layer in almagalSources.imagesetLayers"
              
              :key="layer.id.toString()"
              class="layer-list__item"
            >
              <v-btn
                class="pointer-events-auto my-1"
                @click="() => moveToImageset(layer)"
              >
                {{ layer.get_name() }} 
              </v-btn>
            </div>
          </div>
        </div>


        <!-- This block contains the elements (e.g. the project icons) displayed along the bottom of the screen -->

        <div id="bottom-content">
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
      :is="isLandscape || !smallSize ? 'v-navigation-drawer' : 'v-bottom-sheet'"
      id="side-drawer"
      v-model="showInfoSheet"
      :class="[isLandscape || !smallSize ? 'info-side' : 'info-bottom', showInfoSheet ? 'side-drawer-open' : 'side-drawer-closed']"
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
          <p class="mt-2 mb-2">
            ALMAGAL will observe for the first time a statistically significant and complete sample of high-mass star-forming regions with the ALMA interferometer to answer some of the open questions in the field of clump fragmentation and of formation of high-mass stars.
          </p>
        </div>
      </InformationSheet>
    </component>
  </v-app>
</template>

<script setup lang="ts">
/* eslint-disable @typescript-eslint/no-unused-vars */
import { ref, reactive, computed, onMounted, watch, nextTick } from "vue";
import { useDisplay } from "vuetify";

/* WWT imports */
import { GotoRADecZoomParams, engineStore } from "@wwtelescope/engine-pinia";
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
} from "@wwtelescope/engine";

/* local components and composables */
import WebGlTest from "./components/WebGlTest.vue";
const webglDisabled = ref(false);


import SplashScreen from "./components/SplashScreen.vue";
import InformationSheet from "./components/InformationSheet.vue";

import { useWtmlLoader } from "./composables/useWtmlLoader";
import { useSetInterval } from "./composables/useSetInterval";


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
const showSplashScreen = ref(false);
const layersLoaded = ref(false);
const positionSet = ref(false);
const accentColor = ref("#306C9F");
const accentColor2 = ref("#FC9954");




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


/** Load an older version of GLIMPSE - less coverage, higher resolution. We
 *  We don't need to adjust the layer in any way. This will by default be visible
 *  So we don't need to assign it to a variable. Just leave it. */
useWtmlLoader('https://projects.cosmicds.cfa.harvard.edu/cds-website/wwt-content/glimpse_original.wtml');
/** We're not using the newer GLIMPSE360 layer here. This is the layer that is 
 *  used in the WWT web client. It is slightly lower resolution. 
 *  It was generated using the `get_wtml_for_wwt_catalog_entry.py` script in public. 
*/
// useWtmlLoader('./GLIMPSE_360.wtml');

/** load either the individual image "./index.wtml" or the tiled version './gal_plane_toast/index_rel.wtml'
 * - The individual images will give you finer grained control over the display of each image, and the places that 
 *   come along with it can be used for labeling and positioning. However, all data loads at once, which is alot for many images.
 *   The individual images need to be loaded with 'useFits: true' so the engine can load them properly
 * - The tiled version allows you to load only what is needed for the current view, at increasing resolution as you zoom in. 
 *   However all tiles will have the same opacity, color scale, etc. 
*/
const useTiledVersion = false; // don't use a ref, because we will not change this during runtime. useWTML does not react to changes in the url.
const url = useTiledVersion ? './gal_plane_toast/index_rel.wtml' : './index.wtml';

const almagalSources = ref(useWtmlLoader(url, { 
    onNewPlace: (place, index) => {
      console.log(`Loaded place ${place.get_name()} at index ${index}`);
    },
    onNewLayer: (layer, index) => {
    layer.set_opacity(0.3);
    layer.set_colorMapperName('plasma');
    console.log(layer.getFitsImage()?.fitsProperties);
    },
  goTo: (_, index) => index === 0, // this will make a long move. we will move to the first place manually in onNewPlace
  instant: true,
  useFits: !useTiledVersion ,
})
);

onMounted(() => {

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

    store.applySetting(["showGrid", true]);
    store.applySetting(["showEquatorialGridText", true]);
    store.applySetting(["galacticMode", true]);
    skyBackgroundImagesets.forEach(iset => backgroundImagesets.push(iset));

      positionSet.value = true;
    
    

    almagalSources.value!.ready.then(() => {
      // push all at once
      layersLoaded.value = true;
    });
  });
});



function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}


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
  flex-direction: column; // stack top-buttons-row and second-buttons-row vertically
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
:focus-visible {
  /* Keep this override outside Vuetify's layers so it wins without !important. */
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



</style>
