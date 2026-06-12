<template>
  <div class="wwt-3d-swtich-container">
    <slot 
      :in-3d="in3D"
      :on-click="toggle3d"
    >
      <v-btn
        variant="flat"
        @click="in3D = !in3D"
      >
        {{ in3D ? "Switch to 2D" : "Switch to 3D" }}
      </v-btn>
    </slot>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from "vue";
import { engineStore } from '@wwtelescope/engine-pinia';

const store = engineStore();

const model = defineModel<boolean>({ default: false });
const emits = defineEmits(['3d', '2d']);

const THREED_VIEW_NAME = "3D Solar System View";
let oldBackgroundLayer: string | null = null;
let oldPosition: {ra: number, dec: number, zoom: number, roll: number} | null = null;


function switchTo3D() {
  if (store.backgroundImageset) {
    oldBackgroundLayer = store.backgroundImageset.get_name();
  }
  
  oldPosition = {
    ra: store.raRad,
    dec: store.decRad,
    zoom: store.zoomDeg,
    roll: store.rollRad,
  };
  console.log("Switching to 3D, saving old position", oldPosition);
  
  store.setBackgroundImageByName(THREED_VIEW_NAME);
  
  // look back towards where we were pointed. 
  // in 3d mode this is where our eye is pointed towards the sun
  requestAnimationFrame(() => {
    if (!oldPosition) return; // should never happen, but just in case
    store.gotoRADecZoom({
      raRad: -(oldPosition.ra + Math.PI / 2),
      decRad: -(oldPosition.dec + 23.5 * Math.PI / 180), // rotate by earth' approximate obliquity
      rollRad: 62.9 * Math.PI / 180, // tilt by angle between celestial equator & galactic planes
      zoomDeg: 2 * 15000 * 9 / 4,
      instant: true,
    }).then(() => {
      emits('3d');
    });
  });

}

function switchTo2D() {
  console.log("Switching back to 2D");
  if (oldBackgroundLayer) {
    store.setBackgroundImageByName(oldBackgroundLayer);
  }
  
  requestAnimationFrame(() => {
    // need to wait a tick for WWT to finish switching the background layer
    if (oldPosition) {
      console.log("Going back to old position", oldPosition);
      store.gotoRADecZoom({
        raRad: oldPosition.ra,
        decRad: oldPosition.dec,
        zoomDeg: oldPosition.zoom,
        rollRad: oldPosition.roll,
        instant: true
      }).then(() => {
        emits('2d');
      });
    }
  });
}

const in3D = computed({
  get: () => store.backgroundImageset?.get_name() === THREED_VIEW_NAME,
  set: (value: boolean) => {
    if (value) {
      switchTo3D();
    } else {
      switchTo2D();
    }
  }
});

// keep any v-model bound by the parent in sync with the actual store-derived state
watch(in3D, (value) => { model.value = value; }, { immediate: true });

function toggle3d() {
  in3D.value = !in3D.value;
}

</script>

<style>
.wwt-3d-swtich-container {
  pointer-events: auto;
}
</style>