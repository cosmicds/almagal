/**
 * A tiny wrapper for setInterval that lets you start and stop and reset 
 * on some callback (that may optionally depend on play state)
 */

import { ref, computed} from 'vue';



export function useSetInterval(
  callback: ((isPlaying?: boolean) => void) | (() => void), 
  interval: number
) {
  const _isPlaying = ref(false);
  const isPlaying = computed(() => _isPlaying.value);
  let intervalId: number | null = null;

  function start() {
    if (intervalId !== null) return; // already running
    _isPlaying.value = true;
    intervalId = setInterval(() => {
      callback(_isPlaying.value);
    }, interval);
  };

  function stop() {
    if (intervalId === null) return; // not running
    _isPlaying.value = false;
    clearInterval(intervalId);
    intervalId = null;
  };

  
  const playing = computed({
    get: () => _isPlaying.value,
    set: (val: boolean) => {
      if (val) {
        start();
      } else {
        stop();
      }
    }
  });
  
  const togglePlayPause = () => {
    if (_isPlaying.value) {
      stop();
    } else {
      start();
    }
  };

  return { isPlaying, togglePlayPause, start, stop, playing };
}