<!-- modified from wwt-webgl-engine/research-app/src/ImagesetItem.vue 
  - added instant prop
  - switch to v-slider for opacity control
  - use slider for low-high input
  - add an inview indicator
 -->
<template>
  <div
    class="imageset-item-root-container"
    @mouseenter="hasFocus = true"
    @mouseleave="hasFocus = false"
    @focus="hasFocus = true"
    @blur="hasFocus = false"
  >
    <div
      id="main-container"
    >
      <label
        id="name-label"
        focusable="false"
        class="ellipsize"
        @click="isSelected = !isSelected"
        @keyup.enter="isSelected = !isSelected"
      >{{ imageset.settings.name }}
      </label>
      <span
        class="in-view-dot"
        :class="{ 'in-view-dot--visible': isInView }"
        title="In view"
      ></span>
      <font-awesome-icon
        v-hide="!hasFocus"
        class="icon-button"
        icon="map-marker-alt"
        @click="handleGoto"
      />
      <font-awesome-icon
        v-hide="!hasFocus"
        class="icon-button"
        :icon="imageset.settings.enabled ? 'eye' : 'eye-slash'"
        @click="handleVisibility"
      />
      <font-awesome-icon
        v-hide="!hasFocus"
        class="icon-button"
        icon="times"
        @click="handleDelete"
      />
    </div>
    <transition-expand>
      <div
        v-if="isSelected"
        class="detail-container"
      >
        <div class="detail-row">
          <span class="prompt">Opacity:</span>
          <v-slider
            v-model="twoWayOpacity"
            class="scrubber"
            :max="1"
            :min="0"
            :step="0.01"
            hide-details
          ></v-slider>
        </div>

        <div class="detail-row">
          <span class="prompt">Colormap:</span><select v-model="twoWayColorMapperName">
            <option
              v-for="x in uiColorMaps"
              :key="x.desc"
              :value="x.wwt"
            >
              {{ x.desc }}
            </option>
          </select>
        </div>

        <div class="detail-row">
          <span class="prompt">Stretch:</span><select v-model="twoWayScaleType">
            <option
              v-for="x in uiScaleTypes"
              :key="x.desc"
              :value="x.wwt"
            >
              {{ x.desc }}
            </option>
          </select>
        </div>
      
        <div class="detail-row">
          <span class="prompt cutoff">Low:</span>
          <input
            v-model.lazy="twoWayVMinText"
            type="text"
            class="cutoff-input"
          />
          <v-slider
            v-model="twoWayVMin"
            class="scrubber"
            :min="fitsDataMin"
            :max="fitsDataMax"
            :step="cutoffStep"
            hide-details
          ></v-slider>
        </div>
        <div class="detail-row">
          <span class="prompt cutoff">High:</span>
          <input
            v-model.lazy="twoWayVMaxText"
            type="text"
            class="cutoff-input"
          />
          <v-slider
            v-model="twoWayVMax"
            class="scrubber"
            :min="fitsDataMin"
            :max="fitsDataMax"
            :step="cutoffStep"
            hide-details
          ></v-slider>
        </div>
      </div>
    </transition-expand>
  </div>
</template>

<script lang="ts">
import { mapActions, mapState } from "pinia";

import { D2R } from "@wwtelescope/astro";
import { ProjectionType, ScaleTypes } from "@wwtelescope/engine-types";
import { ImageSetLayerSetting } from "@wwtelescope/engine";
import {
  StretchFitsLayerOptions,
} from "@wwtelescope/engine-helpers";
import {
  ImageSetLayerState,
  engineStore,
} from "@wwtelescope/engine-pinia";

import { defineComponent } from "vue";

interface UiColorMaps {
  wwt: string;
  desc: string;
}

const uiColorMaps: UiColorMaps[] = [
  { wwt: "viridis", desc: "Viridis" },
  { wwt: "plasma", desc: "Plasma" },
  { wwt: "inferno", desc: "Inferno" },
  { wwt: "magma", desc: "Magma" },
  { wwt: "cividis", desc: "Cividis" },
  { wwt: "rdylbu", desc: "Thermal (Red-Yellow-Blue)" },
  { wwt: "gray", desc: "Black-to-White" },
  { wwt: "greys", desc: "White-to-Black" },
  { wwt: "purples", desc: "White-to-Purple" },
  { wwt: "blues", desc: "White-to-Blue" },
  { wwt: "greens", desc: "White-to-Green" },
  { wwt: "oranges", desc: "White-to-Orange" },
  { wwt: "reds", desc: "White-to-Red" },
];

interface UiScaleTypes {
  wwt: ScaleTypes;
  desc: string;
}

const uiScaleTypes: UiScaleTypes[] = [
  { wwt: ScaleTypes.linear, desc: "Linear" },
  { wwt: ScaleTypes.log, desc: "Logarithmic" },
  { wwt: ScaleTypes.squareRoot, desc: "Square Root" },
  { wwt: ScaleTypes.power, desc: "Exponential" },

  // Not fully implemented ... I think ...?
  //{ wwt: ScaleTypes.histogramEqualization, desc: "Hist-Eq" },
];

export default defineComponent({

  props: {
    imageset: { type: ImageSetLayerState, required: true },
    instant: {type: Boolean, required: false, default: false }
  },

  data() {
    return {
      uiColorMaps,
      uiScaleTypes,
      hasFocus: false,
      isSelected: false
    };
  },

  computed: {
    ...mapState(engineStore, ["imagesetForLayer"]),
    ...mapState(engineStore, {
      wwtZoomDeg: "zoomDeg",
      wwtRaRad: "raRad",
      wwtDecRad: "decRad",
    }),

    isInView(): boolean {
      // check if imageset center is within the view
      // assume it is a square
      const imgset = this.imagesetForLayer(this.imageset.getGuid());
      if (!imgset) return false;
      const imgRaRad = imgset.get_centerX() * D2R;
      const imgDecRad = imgset.get_centerY() * D2R;
      // zoomDeg is the vertical FOV * 6 in WWT; actual half-FOV in degrees ≈ zoomDeg / 12
      const halfFovRad = (this.wwtZoomDeg / 12) * D2R;
      const dRa = (imgRaRad - this.wwtRaRad) * Math.cos(this.wwtDecRad);
      const dDec = imgDecRad - this.wwtDecRad;
      return Math.sqrt(dRa * dRa + dDec * dDec) < halfFovRad;
    },

    twoWayOpacity: {
      get(): number {
        return this.imageset.settings.opacity;
      },
      set(v: number) {
        this.applySettings([["opacity", v]]);
      }
    },

    twoWayColorMapperName: {
      get(): string {
        return this.imageset.settings.colorMapperName;
      },
      set(v: string) {
        this.applySettings([["colorMapperName", v]]);
      }
    },

    twoWayScaleType: {
      get(): ScaleTypes {
        return this.imageset.scaleType;
      },
      set(v: ScaleTypes) {
        const o: StretchFitsLayerOptions = {
          id: this.imageset.getGuid(),
          vmin: this.imageset.vmin,
          vmax: this.imageset.vmax,
          stretch: v,
        };

        this.stretchFitsLayer(o);
      }
    },

    twoWayVMax: {
      get(): number {
        return this.imageset.vmax;
      },
      set(v: number) {
        const o: StretchFitsLayerOptions = {
          id: this.imageset.getGuid(),
          vmin: this.imageset.vmin,
          vmax: v,
          stretch: this.imageset.scaleType,
        };

        this.stretchFitsLayer(o);
      }
    },

    fitsDataMin(): number {
      const imgset = this.imagesetForLayer(this.imageset.getGuid());
      return imgset?.get_fitsProperties().minVal ?? 0;
    },

    fitsDataMax(): number {
      const imgset = this.imagesetForLayer(this.imageset.getGuid());
      return imgset?.get_fitsProperties().maxVal ?? 1;
    },

    cutoffStep(): number {
      return (this.fitsDataMax - this.fitsDataMin) / 1000;
    },

    twoWayVMaxText: {
      get(): string {
        return "" + this.twoWayVMax;
      },
      set(v: string) {
        const n = Number(v);

        if (isFinite(n)) {
          this.twoWayVMax = n;
        }
      }
    },

    twoWayVMin: {
      get(): number {
        return this.imageset.vmin;
      },
      set(v: number) {
        const o: StretchFitsLayerOptions = {
          id: this.imageset.getGuid(),
          vmin: v,
          vmax: this.imageset.vmax,
          stretch: this.imageset.scaleType,
        };

        this.stretchFitsLayer(o);
      }
    },

    twoWayVMinText: {
      get(): string {
        return "" + this.twoWayVMin;
      },
      set(v: string) {
        const n = Number(v);

        if (isFinite(n)) {
          this.twoWayVMin = n;
        }
      }
    }
  },

  methods: {
    ...mapActions(engineStore, [
      "applyFitsLayerSettings",
      "gotoRADecZoom",
      "deleteLayer",
      "stretchFitsLayer",
    ]),

    applySettings(settings: ImageSetLayerSetting[]) {
      this.applyFitsLayerSettings({
        id: this.imageset.getGuid(),
        settings: settings,
      });
    },

    handleDelete() {
      this.deleteLayer(this.imageset.getGuid());
    },

    handleGoto() {
      const imgset = this.imagesetForLayer(this.imageset.getGuid());

      if (imgset !== null) {
        // This is all a little shaky since we're not accounting for things like
        // offsetX, rotation, etc. But it should be OK.

        let zoomDeg = this.wwtZoomDeg;
        const wcsimg = imgset.get_wcsImage();
        // eslint-disable-next-line @typescript-eslint/naming-convention
        const FOV_FACTOR = 1.7;

        if (imgset.get_projection() == ProjectionType.skyImage) {
          if (wcsimg !== null) {
            // untiled SkyImage: baseTileDegrees is degrees per pixel
            zoomDeg =
              imgset.get_baseTileDegrees() * wcsimg.get_sizeY() * 6 * FOV_FACTOR;
          }
        } else {
          // tiled image: baseTileDegrees is angular height of image after power-of-2 padding
          zoomDeg = imgset.get_baseTileDegrees() * 6 * FOV_FACTOR;
        }

        // Only zoom in, not out.
        if (this.wwtZoomDeg < zoomDeg) {
          zoomDeg = this.wwtZoomDeg;
        }

        this.gotoRADecZoom({
          zoomDeg: zoomDeg,
          raRad: imgset.get_centerX() * D2R,
          decRad: imgset.get_centerY() * D2R,
          instant: this.instant,
        });
      }
    },

    handleVisibility() {
      this.applySettings([["enabled", !this.imageset.settings.enabled]]);
    },

    handleCutoffInteract(isMax: boolean) {
      // This is a prototype interactive UX. It needs iteration and a detailed
      // explanation, but here's the capsule version:
      //
      // When this action is triggered, we turn the cursor into a crosshair (by
      // adding the `pointer-tracking` class to the <html> DOM element) and start
      // monitoring the user's mouse motions. As the mouse moves, we adjust the
      // "vmin" or "vmax" cutoff value used to visualize the FITS data (depending
      // on `isMax). When the mouse is to the left of the screen (lastrx => -1),
      // the cutoff value is decreased. When it's to the right of the screen
      // (lastrx => 1), it increases.
      //
      // The *scale* of the modification is a function of both the horizontal and
      // vertical position of the pointer. The maximum possible delta is the
      // magnitude of `|vmax - vmin|` when the mouse is at the top of the screen
      // (lastry => -1), and 1% of it at the bottom of the screen (lastry => +1).
      // This scale setting is determined relative to the initial value of the
      // parameter that's being adjusted, which is stored in `lastCommittedValue`.
      // This maximum scale is achieved when the mouse is on the left/right edges
      // of the screen and scales linearly with the horizontal pointer position
      // between the two. So if the pointer lies on the vertical line in the dead
      // center of the window, the delta should be zero.
      //
      // When the user clicks the pointer, the change in the cutoff value is
      // committed and the interaction ends.
      //
      // If the user hits spacebar during the interaction, the change in the
      // cutoff value is committed but the interaction continues. So if you want
      // to raise the cutoff value a lot, you move the mouse to the top-right of
      // the screen and hit spacebar repeatedly. One awkward aspect of this
      // interaction is that it's easy to hit spacebar to lock in your "final"
      // setting, but then the interaction continues because you shold have
      // clicked. The "solution" is to click in the bottom middle of the screen
      // (which is as close to "don't change anything" as you can get) but that's
      // not at all intuitive.
      //
      // Weaknesses that we're aware of:
      //
      // - The switch between keyboard and mouse is awkward.
      // - We don't actually "grab" the pointer, so the click that ends the
      //   interaction will also be processed by whatever it landed on.
      // - This won't work well at all on mobile.

      let lastrx = 0;
      let lastry = 0;
      let lastCommittedValue = isMax ? this.imageset.vmax : this.imageset.vmin;

      const update = () => {
        const other = isMax ? this.twoWayVMin : this.twoWayVMax;
        const scale = Math.abs(other - lastCommittedValue);
        const delta = scale * Math.pow(10, -1 - lastry);
        const newvalue = lastCommittedValue + delta * lastrx;

        if (Number.isFinite(newvalue)) {
          if (isMax) {
            this.twoWayVMax = newvalue;
          } else {
            this.twoWayVMin = newvalue;
          }
        }
      };

      const onmove = (event: PointerEvent) => {
        const w = window.innerWidth;
        const h = window.innerHeight;
        lastrx = (2 * event.clientX) / w - 1; // range: -1 (left edge) => +1 (right edge)
        lastry = (2 * event.clientY) / h - 1; // range: -1 (top edge) => +1 (bottom edge)
        update();
      };

      const onkeydown = (event: KeyboardEvent) => {
        if (event.code == "Space") {
          if (isMax) {
            lastCommittedValue = this.twoWayVMax;
          } else {
            lastCommittedValue = this.twoWayVMin;
          }

          update();
        }
      };

      const cleanup = (_event: Event) => {
        document.documentElement.classList.remove("pointer-tracking");
        document.removeEventListener("pointermove", onmove, { capture: true });
        document.removeEventListener("pointerup", cleanup, { capture: true });
        document.removeEventListener("pointercancel", cleanup, { capture: true });
        document.removeEventListener("keydown", onkeydown, { capture: true });
      };

      document.addEventListener("pointermove", onmove, { capture: true });
      document.addEventListener("pointerup", cleanup, { capture: true });
      document.addEventListener("pointercancel", cleanup, { capture: true });
      document.addEventListener("keydown", onkeydown, { capture: true });
      document.documentElement.classList.add("pointer-tracking");
    }
  },


});
</script>

<style scoped lang="less">
.imageset-item-root-container {
  color: white !important;
  font-weight: bold;
  font-size: 12pt;
  padding: 0px;
  overflow: hidden;
  pointer-events: auto;

  &:hover {
    background: #9999995b;
  }
}

#main-container {
  width: calc(100% - 10px);
  padding: 5px;
  display: flex;
  align-items: center;
  gap: 2px;
}

#name-label {
  display: inline-block;
  flex: 1;
  padding-right: 10px;

  &:hover {
    cursor: pointer;
  }
}

select {
  width: 70%;
  max-width: fit-content;
}

.detail-container {
  font-size: 9pt;
  margin: 0px 5px;
  padding-left: 15px;
}

.icon-button {
  cursor: pointer;
  margin: 2px;
  width: 1em;
}

.prompt {
  font-size: 11pt;
  font-weight: bold;
  padding-right: 5px;
}

.detail-row {
  padding: 1px 0px;

  // Get nice vertical alignment in individual rows
  display: flex;
  align-items: center;
  gap: 2px;
  justify-content: flex-start;
}

.detail-input {
  flex: 1;
  min-width: 10px;
  text-align: center;
}

.scrubber {
  flex: 1;
  cursor: pointer;
}

.in-view-dot {
  width: 8px;
  aspect-ratio: 1;
  border-radius: 50%;
  background: transparent;
  border: 1.5px solid rgba(255, 255, 255, 0.4);
  flex-shrink: 0;
  transition: background 0.2s;

  &.in-view-dot--visible {
    background: #4caf50;
    border-color: #4caf50;
  }
}

.cutoff {
  width: 40px;
  padding-right: 0px;
  flex-shrink: 0;
}

.cutoff-input {
  width: 60px;
  flex-shrink: 0;
  text-align: center;
}

</style>
