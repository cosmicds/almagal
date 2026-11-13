<template>
  <TourStep title="Information on the data">
    <p>
      Each targeted clump in the ALMAGAL sample has several properties associated with it including
      its total mass, luminosity, surface density and its distance from the Sun, all of which were
      measured from the Herschel observations from the HiGAL survey. Additionally, we have the
      luminosity-to-mass ratio (L/M) of each clump, which is used as a proxy for how evolved a
      region is. Regions in the earliest stages of star formation should have low L/M ratios
      (&lt;1 Lsun/Msun) whereas the most evolved regions likely have high L/M (&gt;10 Lsun/Msun).
      Additionally we include information on the number of pre/protostellar cores there are in each
      clump, as well as what type of morphology is observed there. An &ldquo;empty&rdquo; morphology
      means there is little to no structure found in the ALMA observations. The
      &ldquo;isolated&rdquo;, &ldquo;simple&rdquo; and &ldquo;rich&rdquo; categories note regions of
      increasing hierarchical structure.
    </p>
  </TourStep>
</template>

<script setup lang="ts">
import TourStep from "../TourStep.vue";
</script>
