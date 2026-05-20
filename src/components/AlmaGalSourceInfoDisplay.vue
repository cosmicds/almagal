<template>
  <div class="almagal-source-description">
    <h3>Source: {{ source["iid"] }}</h3>
    <div
      v-for="item of Object.keys(source)"
      :key="item"
      :class="['almgal-item', item]"
    > 
      <div class="almgal-item-key">
        {{ item }}:
      </div>
      <div class="almgal-item-value">
        <a
          v-if="item === 'photo_url'"
          :href="source[item]"
          target="_blank"
          rel="noopener noreferrer"
        >
          View Image
        </a>
        <span v-else>
          {{ source[item] }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { type ALMAGalSource } from '@/almagal_utils';

const { source } = defineProps<{
  source: ALMAGalSource;
}>();

</script>
<style scoped>
.almagal-source-description {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 1em;
}

.almgal-item {
  display: flex;
  flex-direction: column;
  gap: 0.5em;
  background-color: rgba(255, 255, 255, 0.7);
  color: black;
  padding: 0.5em;
  border-radius: 4px;
}

</style>