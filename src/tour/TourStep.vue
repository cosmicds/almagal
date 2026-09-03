<template>
  <div class="tour-step">
    <h1 class="tour-step-title">
      {{ title }}
    </h1>
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

  p + p {
    margin-top: 0.75em;
  }
}

// each row is a button and a line on what it will show
:slotted(.tour-actions-table) {
  width: 100%;
  margin-top: 0.75em;
  border-collapse: collapse;

  td {
    padding: 0.3em 0;
    vertical-align: middle;
  }

  td:first-child {
    width: 1%;
    white-space: nowrap;
    padding-right: 0.85em;
  }

  td:last-child {
    font-size: 0.92em;
    line-height: 1.35;
    opacity: 0.92;
  }
}

</style>
