<template>
  <div class="tour-step">
    <h1>{{ title }}</h1>
    <div class="tour-step-content">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string;
}>();
</script>

<style scoped lang="less">
.tour-step {
  h1 {
    font-size: 1.3em;
    margin-bottom: 0.5em;
  }
}

// contain whatever a step floats, without styling it
.tour-step-content {
  display: flow-root;
}

</style>
