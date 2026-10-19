<template>
  <div class="d-flex flex-row align-center ml-4 mt-4">
    <div>
      <h3>Catalog: </h3>
    </div>
    <v-btn-group
      density="compact"
      class="ga-2 ml-2"
      divided
      rounded
      color="var(--almagal-orange)"
      variant="tonal"
    >
      <v-btn
        :active="model === true"
        @click="model = true"
      >
        Show
      </v-btn>
      <v-btn
        :active="model === false"
        @click="model = false"
      >
        Hide
      </v-btn>
      <v-btn
        :active="model === null"
        @click="model = null"
      >
        Auto
      </v-btn>
    </v-btn-group>
  </div>
</template>

<script setup lang="ts">
// true = show, false = hide, null = auto
const model = defineModel<boolean | null>({ required: true });
</script>
