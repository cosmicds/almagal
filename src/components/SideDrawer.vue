<!--
  A drawer that takes one of three shapes, chosen by the caller:

    'bottom'  a panel under the main content, full width
    'push'    a column beside it, full height
    'float'   over its lower-left corner, out of the flow, so the main content
              stays full width

  "The main content" throughout is the drawer's SIBLING -- the thing it shares
  the container with and takes room from (why-roman's #main-content, with WWT
  in it). Not the slot: the slot is the drawer's own content, and the drawer
  never contains the main content.

  It knows nothing about the screen: which shape suits which screen is the
  app's policy, and the caller passes the result as `layout` (see
  SideDrawerTest.vue's `autoLayout` for why-roman's rule).

  WHAT THE CONTAINER HAS TO DO -- the drawer sizes its own box, but the box
  only lands in the right place inside a container that:

    1. is a flex box, `flex-direction: row` for 'push' and `column` for
       'bottom', off the same value it passes as `layout`. This is the one that
       bites: nothing the drawer does to itself can move it from beside the
       main content to under it.
    2. holds the drawer BEFORE the main content in the markup -- that puts it
       left in 'push' with no `order`, which would have broken the tab order
       ('bottom' uses `order: 1` below, visually last but still first for the
       keyboard).
    3. gives the main content `flex: 1 1 auto; min-width: 0; min-height: 0`, so
       it yields the drawer's share instead of setting a floor.
    4. is positioned (relative/fixed) and fills the screen, since 'float'
       anchors to it.
    5. has a definite size in the axis the drawer takes: `sideDrawerWidth` and
       `bottomDrawerHeight` are percentages of it.

  See src/pages/SideDrawerTest.vue for a container that does all five.
-->
<template>
  <div
    class="layout-drawer"
    :class="[`drawer-${layout}`, open ? 'drawer-open' : 'drawer-closed']"
    :style="{
      '--side-drawer-width': sideDrawerWidth,
      '--bottom-drawer-height': bottomDrawerHeight,
      '--float-max-height': floatMaxHeight,
      '--container-width': containerWidth,
      '--container-height': containerHeight,
      '--float-top': floatLocation.top,
      '--float-bottom': floatLocation.bottom,
      '--float-left': floatLocation.left,
      '--float-right': floatLocation.right,
    }"
  >
    <slot v-if="open" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    open: boolean
    /** which shape to take - bottom, push, or float */
    layout: 'bottom' | 'push' | 'float'
    /** the column's share of the screen ('push' and 'float') */
    sideDrawerWidth?: string
    /** the bottom panel's share of the screen ('bottom' only) */
    bottomDrawerHeight?: string
    /** cap on the 'float' box, which is otherwise as tall as its content */
    floatMaxHeight?: string
    /** floating location */
    location?: string
  }>(),
  {
    sideDrawerWidth: '34%',
    bottomDrawerHeight: '34%',
    floatMaxHeight: '50vh',
    location: '',
  },
);

/* --container-width / --container-height are the box's own dimensions, for
   slotted content that sizes itself against the drawer rather than the raw
   viewport (a text panel scaling its font, say). They assume the container
   fills the screen, and fill in the axis the layout does not set. The size
   props pass straight through, so pass units that suit what reads them: a
   percentage is fine for the layout, but content doing calc() on these wants
   viewport units. */
const containerWidth = computed(() =>
  props.layout === 'bottom' ? '100vw' : props.sideDrawerWidth,
);

const containerHeight = computed(() => {
  if (props.layout === 'bottom') {
    return props.bottomDrawerHeight;
  }
  return props.layout === 'float' ? props.floatMaxHeight : '100vh';
});

function _floatLocation (location: string) {
  if (!location) {
    return {};
  }
  
  // check for top, bottom, left, right, middle, center and combos without hyphens
  const top = location.includes('top');
  const bottom = location.includes('bottom');
  const left = location.includes('left');
  const right = location.includes('right');
  const middle = location.includes('middle'); // TB center. vertical centering ↕
  const center = location.includes('center'); // LR center. horizontal centering ↔
  // but we are going to act like they are the same.
  const n = location.split(/[-\s]/).length;
  const pos: {
    top?: string
    bottom?: string
    left?: string
    right?: string
  } = {};
  if (top) {
    pos.top = '0';
  }
  if (bottom) {
    pos.bottom = '0';
  }
  if (left) {
    pos.left = '0';
  }
  if (right) {
    pos.right = '0';
  }
  
  if ((top || bottom) && (middle || center)) {
    pos.left = '50%';
  }
  
  if ((left || right) && (middle || center)) {
    pos.top = '50%';
  }
  
  if ((middle || center) && (n === 1)) {
    pos.top = '50%';
    pos.left = '50%';
  }
  
  // fill the rest with unset i think
  for (const key of ['top', 'bottom', 'left', 'right'] as const) {
    if (!pos[key]) {
      pos[key] = 'unset';
    }
  }
  
  return pos;
}

const floatLocation = computed(() => (props.layout === 'float' && props.location) ? _floatLocation(props.location) : {});
</script>

<style scoped>
.layout-drawer {
  display: flex;
  flex-direction: column;
  flex: 0 0 auto;
  min-height: 0;
  overflow: hidden;
}

/* a column beside the main content */
.drawer-push {
  width: 0;
}

.drawer-push.drawer-open {
  width: var(--side-drawer-width);
}

/* a panel under the main content -- needs the container to be a column */
.drawer-bottom {
  order: 1; /* visually last, still first in the tab order */
  width: 100%;
  height: 0;
}

.drawer-bottom.drawer-open {
  height: var(--bottom-drawer-height);
}

/* over the main content's lower-left corner */
.drawer-float {
  position: absolute;
  top: var(--float-top);
  bottom: var(--float-bottom);
  left: var(--float-left);
  right: var(--float-right);
  width: 0;
  height: 0;
  z-index: 1000;
}

.drawer-float.drawer-open {
  width: var(--side-drawer-width);
  /* min-content, so the box is only as tall as the content inside it. That
     content has to size itself: `height: 100%` in there resolves against an
     indefinite height and collapses. */
  height: min-content;
  max-height: var(--float-max-height);
}
</style>
