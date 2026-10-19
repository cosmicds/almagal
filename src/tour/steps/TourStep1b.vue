<template>
  <TourStep title="Orion, up close">
    <p>
      The nearest place this is happening is the Orion Nebula, about 12000 lightyears away. See how much changing the wavelength you are looking at changes the view.
    </p>

    <table class="tour-actions-table">
      <tbody>
        <tr>
          <td class="tour-action-name">
            Hubble
          </td>
          <td>Visible light: gas already lit up and blown clear by the massive stars at the centre.</td>
        </tr>
        <tr>
          <td class="tour-action-name">
            Spitzer
          </td>
          <td>Infrared: warm dust through the whole cloud, and young stars still buried inside it.</td>
        </tr>
        <tr>
          <td class="tour-action-name">
            WISE
          </td>
          <td>A longer infrared view: An entire cloud of cool dust lights up, with nebula bright in the center</td>
        </tr>
        <tr>
          <td class="tour-action-name">
            Recentre
          </td>
          <td>Put Orion back in the middle of the view if you have wandered off.</td>
        </tr>
      </tbody>
    </table>
  </TourStep>
</template>

<script setup lang="ts">
import TourStep from "../TourStep.vue";
</script>
