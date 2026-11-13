<!-- One clump's ALMA image: the name that used to sit inline in ALMAGAL.vue,
     and one control beside it that walks through download -> in progress ->
     give up on it. -->
<template>
  <div
    class="layer-list__item download-almagal"
  >
    <div class="pending-source-label">
      {{ getAlmagalSourceById(iid)?.aid ?? iid }}
    </div>

    <!-- taking too long: offer to stop waiting on it -->
    <v-btn
      v-if="pending && timedOut"
      size="small"
      variant="text"
      density="compact"
      icon="mdi-close"
      aria-label="Cancel this download"
      @click="emit('cancel', iid)"
    />
    <v-progress-circular
      v-else-if="pending"
      indeterminate
      color="orange"
      size="28"
      width="2"
    >
      <v-icon
        icon="mdi-download"
        size="x-small"
      />
    </v-progress-circular>
    <v-btn
      v-else
      size="small"
      variant="text"
      density="compact"
      icon="mdi-download"
      aria-label="Download this image"
      @click="emit('download', iid)"
    />
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from "vue";
import { getAlmagalSourceById, type ALMAGalSource } from "../almagal_utils";

const props = defineProps<{
  iid: ALMAGalSource["iid"];
  /** already on its way, so show progress instead of the button */
  pending: boolean;
}>();

const emit = defineEmits<{
  download: [iid: ALMAGalSource["iid"]];
  cancel: [iid: ALMAGalSource["iid"]];
}>();

/* Half a minute before offering a way out. Keyed off `pending` rather than the
   click, so it covers downloads this row did not start. */
const GIVE_UP_AFTER_MS = 30_000;
const timedOut = ref(false);
let timer: ReturnType<typeof setTimeout> | null = null;

function clearTimer() {
  if (timer !== null) {
    clearTimeout(timer);
    timer = null;
  }
}

watch(() => props.pending, (isPending) => {
  clearTimer();
  timedOut.value = false;
  if (isPending) {
    timer = setTimeout(() => { timedOut.value = true; }, GIVE_UP_AFTER_MS);
  }
}, { immediate: true });

onBeforeUnmount(clearTimer);
</script>

<style scoped lang="less">
.download-almagal {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 0.5em;
  padding-right: 4px;
}
</style>
