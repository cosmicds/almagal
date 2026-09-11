<template>
  <!-- rearranges the v-expansion-title layout using grid -->
  <v-expansion-panel-title class="two-level-v-expansion-title">
    <div class="two-level-title__title">
      <slot name="title"></slot>
    </div>
    <div class="two-level-title__bottom" @click.stop>
      <slot name="bottom"></slot>
    </div>
  </v-expansion-panel-title>
</template>

<style scoped>

  .v-expansion-panel-title.two-level-v-expansion-title {

    display: grid;
    grid-template-columns: 1fr min-content;
    grid-template-rows: min-content 1fr;
    gap: 0px;
    transition: gap 0.3s linear;
  }
  
  .two-level-v-expansion-title .v-expansion-panel--active > .v-expansion-panel-title {
    gap: 8px !important;
  }
  
  /* https://cssgrid-generator.netlify.app/ */
  .two-level-title__title { grid-area: 1 / 1 / 2 / 2; }
  /* .div2 { grid-area: 1 / 2 / 2 / 3; } */
  .two-level-title__bottom { grid-area: 2 / 1 / 3 / 3; }

  /* keep for debugging
  .two-level-title__title { background-color: red; }
  .div2 { background-color: green; }
  .two-level-title__bottom { background-color: blue; } 
  */
  
  .v-expansion-panel-title.two-level-v-expansion-title > .v-expansion-panel-title__icon {
    grid-area: 1 / 2 / 2 / 3; 
  }


</style>
