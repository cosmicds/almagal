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
import { watch } from "vue";
import { engineStore } from '@wwtelescope/engine-pinia';
import { useWwt3dControl } from "../composables/wwt3dControl";

const store = engineStore();

const model = defineModel<boolean>({ default: false });
const emits = defineEmits(['3d', '2d']);

const { in3D, toggle3d } = useWwt3dControl(store, {
  on3d: () => emits('3d'),
  on2d: () => emits('2d'),
});

// keep any v-model bound by the parent in sync with the actual store-derived state
watch(in3D, (value) => { model.value = value; }, { immediate: true });
</script>

<style>
.wwt-3d-swtich-container {
  pointer-events: auto;
}
</style>
