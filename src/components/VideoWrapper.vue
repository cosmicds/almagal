<template>
  <v-dialog
    id="video-container"
    v-model="showVideoSheet"
    transition="slide-y-transition"
    fullscreen
    close-on-content-click
  >
    <div class="video-wrapper">
      <font-awesome-icon
        id="video-close-icon"
        class="close-icon"
        icon="times"
        size="lg"
        tabindex="0"
        @click="showVideoSheet = false"
        @keyup.enter="showVideoSheet = false"
      ></font-awesome-icon>

      <iframe
        id="info-video"
        :src="src"
        title="YouTube video player"
        frameborder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowfullscreen
      ></iframe>
    </div>
  </v-dialog>
</template>

<script setup lang="ts">
interface VideoProps {
  src: string;
}

defineProps<VideoProps>();

const showVideoSheet = defineModel<boolean>({ default: false });
</script>

<style lang="less">
#video-icon-dummy
{
  pointer-events: none;
  visibility: hidden;
}

#video-icon-wrapper
{
  display: initial;
}


.video-wrapper
{
  position: relative;
  display: flex;
  padding: 10px;
  height: 100%;
  max-width: 100%;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(2px);
  text-align: center;
  z-index: 1000;
  // border: 1px solid white;
}

#video-close-icon
{
  position: absolute;
  top: 1rem;
  right: 1rem;
  cursor: pointer;
  color: white;
  z-index: 1001;
}

video,
#info-video
{
  margin: auto;
  width: min(95%, calc(90vh * 16 / 9));
  height: auto;
  aspect-ratio: 16/9;
  object-fit: contain;
}

#video-container
{
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  max-width: 100%;
  overflow: hidden;
  padding: 0px;
  z-index: 1000;
}
</style>
