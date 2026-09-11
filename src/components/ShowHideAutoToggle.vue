<template>
  <v-btn-group
    density="compact"
    divided
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
</template>

<script setup lang="ts">
// true = show, false = hide, null = auto
const model = defineModel<boolean | null>({ required: true });
</script>
