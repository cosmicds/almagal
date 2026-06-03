import {ref, watch, type Ref, computed} from "vue";
import { engineStore } from "@wwtelescope/engine-pinia";
import { Folder, Place, Imageset, ImageSetLayer, FitsImage, WWTControl } from "@wwtelescope/engine";



interface WtmlLoaderOptions {
  onNewFolder?: (folder: Folder) => void;
  onNewPlace?: (place: Place, index: number) => void;
  onNewImageset?: (imageset: Imageset, index: number) => void; // callback for when a new imageset is found, with the imageset and its corresponding place as arguments
  onNewLayer?: ((layer: ImageSetLayer, index: number) => void); // callback for when a new layer is added, with the layer and its corresponding place as arguments
  onLoad?:(out: {folder: Folder, place: Place, imageset: Imageset, layer: ImageSetLayer, fitsImage?: FitsImage | null }, index: number) => void; // callback that is run when each layer is created
  goTo?: ((iset: Imageset) => boolean) | ((iset: Imageset, index: number) => boolean) | boolean;
  instant?: boolean; // should the move be instant
  verbose?: boolean; // whether to log verbose messages about the loading process, defaults to false
  prefetch?: boolean;
  useFits?: boolean; // wether to allow auto or force fits mode for loading the imageset collection. should be true for fits imagesets
  autoload?: boolean; // whether to start loading immediately, defaults to true
}

interface WtmlLoaderReturn {
  ready: Promise<void>;
  fetchingComplete: Ref<boolean>;
  places: Ref<Place[]>;
  imagesets: Ref<Imageset[]>;
  imagesetLayers: Ref<ImageSetLayer[]>;
  fitsImages: Ref<(FitsImage | null)[]>;
  show: (name?: string) => void;
  hide: (name?: string) => void;
  load: () => void;
  loaded: Ref<boolean>;
  opacities: Ref<Map<string, number>>;
  placeNames: Ref<string[]>;
  imagesetNames: Ref<string[]>;
}

type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

function isTemplateURL(url: string): boolean {
  return url.match(/{[0-9]*}/) != null;
}


/**
 * onNewPlace(place, placeIndex)` gets run right after the place is loaded, but before its
 * ImageSetLayer is loaded. One could use this to do a move, or something else that doesnt
 * require the imageset layer to be loaded.
 *
 * `onNewLayer(layer, layerIndex)` is run right after on the return of `store.addImageSetLayer`,
 *  this is where we would usually set initial opticiies or layer properties, or do a move on
 * the the index ==== 0 layer, or something like that.
 *
 * `onNewFolder(folder)` is there do something with the folder. We have 'loadChildFolders = false` set
 *
 * `goTo` is a function to determine if we should `goTo` a layer when loaded. Should be true for only 1 layer. default is false.
 *
 *
 * returns:
 *  - `ready` ref that is true when the loading process is complete
 * - `places` ref with the loaded places, in the order they appear in the WTML file
 * - `imagesets` ref with the loaded imagesets, in the order they appear in the WTML file
 * - `imagesetLayers` ref with the loaded imageset layers, in the order they appear in the WTML file
 *
 * imagesetLayers is usually the thing you want to use.
 **/
export function useWtmlLoader(wtmlUrl: string, _options?: WtmlLoaderOptions): Prettify<WtmlLoaderReturn> {

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function debugLog(...messages: any[]) {
    if (options?.verbose) {
      console.log(...messages);
    }
  }


  // const ready = ref(false);
  let promiseResolve: () => void;
  const ready = new Promise<void>((resolve) => {
    promiseResolve = resolve;
  });
  
  const loaded = ref(false);
  const options = _options ?? {};

  const folder = ref<Folder>();

  const places = ref<Place[]>([]);
  const imagesets = ref<Imageset[]>([]);
  const imagesetLayers = ref<ImageSetLayer[]>([]);
  const fitsImages = ref<(FitsImage | null)[]>([]);
  
  const placeNames = computed(() => places.value.map(p => p.get_name()));
  const imagesetNames = computed(() => imagesets.value.map(i => i.get_name()));
  
  const opacities = ref<Map<string, number>>(new Map());

  const fetchingComplete = ref(false);

  function setOpacity(name: string, opacity: number) {
    if (imagesetLayers.value.length === 0)  return;
    const layer = imagesetLayers.value.find(layer => layer.get_name() === name);
    if (!layer) {
      console.warn(`No layer found for place with name ${name}`);
      return;
    }
    layer.set_opacity(opacity);
    opacities.value.set(name, opacity);
  }

  function getOpacity(name: string): number | undefined {
    return opacities.value.get(name);
  }

  const store = engineStore();

  function thumbnails2Places(thumbnails: (ReturnType<Folder["get_children"]>)): Place[] {
    if (thumbnails == null) return [];
    return thumbnails.filter(child => child instanceof Place) as Place[];
  }

  function getOrdered<T>(array: [number, T][]): T[] {
    const tempArray: T[] = [];
    array.forEach(([index, item]) => {
      tempArray[index] = item;
    });
    return tempArray;
  }

  function resolveGoTo(iset: Imageset, index: number): boolean {
    if (options?.goTo === undefined) return false;

    if (typeof options.goTo === "boolean") return options.goTo;

    return options.goTo(iset, index); // js doesn't care if there are too many argument, and TS is happy :)
  }


  function load() {
    store.waitForReady().then(async () => {
      debugLog(`Starting to load WTML file from ${wtmlUrl}...`);
      WWTControl.singleton.renderOneFrame();
      try {
        folder.value = await store.loadImageCollection({
          url: wtmlUrl,
          loadChildFolders: false,
        });
        if (options?.onNewFolder) options.onNewFolder(folder.value);
      } catch (error) {
        console.error(`Failed to load WTML file from ${wtmlUrl}:`, error);
        return;
      }

      const children = folder.value.get_children();
      if (children === null || children === undefined) {
        console.warn(`No children found in the provided WTML file at ${wtmlUrl}`);
        return;
      }
      // i don't knw why we usually do the "isinstance of Place" check instead of just
      // casting the type, but whoami to question it...
      places.value = thumbnails2Places(children);

      if (places.value.length === 0) {
        console.warn(`Folder had ${children.length} children, but no places found in the provided WTML file at ${wtmlUrl}`);
        return;
      }

      // keep track of the index so we don't need a sort operations
      const _isets: [number, Imageset][] = [];
      const _layers: [number, ImageSetLayer][] = [];
      const _fits: [number, FitsImage | null][] = [];
      // let _addedAtLeastOneLayer = false;

      console.log(`Found ${places.value.length} places in the WTML file. Starting to load imageset layers...`);

      const toFetch: string[] = [];

      const layerPromises = places.value.map(async (child: Place, _index: number) => {
        const imageset = child.get_backgroundImageset() ?? child.get_studyImageset();
        console.log(imageset);
        if (imageset == null) {
          console.warn(`No imageset found for place with name ${child.get_name()} at index ${_index}`);
          return;
        };

        if (options?.onNewPlace) options.onNewPlace(child, _index);
        


        const url = imageset.get_url();
        if (options?.prefetch && !isTemplateURL(url)) {
          toFetch.push(url);
        }
        
        await store.addImageSetLayer({
          url,
          mode: options?.useFits ? "fits" : "autodetect",
          name: imageset.get_name(),
          goto: resolveGoTo(imageset, _index) && !options?.instant,
        }).then(async layer => {
          debugLog(`Successfully loaded layer for place with name ${child.get_name()} at index ${_index}`);
          // get the ImageSetLayer, Imageset and FitImage from the actual store
          const _iset = store.imagesetForLayer(layer.id.toString());
          const _layer = store.imagesetLayerById(layer.id.toString());
          const _fit = _layer?.getFitsImage() ?? null;        

          if (folder.value && _iset && _layer) {
            _isets.push([_index,_iset]);
            _layers.push([_index,_layer]);
            _fits.push([_index, _fit]);
            const out = {
              folder: folder.value,
              place: child,
              imageset: _iset,
              layer: _layer,
              fitsImage: _fit
            };
            
            if (options?.onNewImageset) options.onNewImageset(_iset, _index);
            if (options?.onNewLayer) options.onNewLayer(layer, _index);
            if (options?.onLoad) options.onLoad(out, _index);
            
            if (resolveGoTo(_iset, _index) && options?.instant) {
              // store.gotoRADecZoom({
              //   raRad: child.get_RA() * 15 * Math.PI / 180,
              //   decRad: child.get_dec() * Math.PI / 180,
              //   // @ts-expect-error _guessZoomSetting exists
              //   zoomDeg: _iset._guessZoomSetting(WWTControl.singleton.renderContext.viewCamera.zoom), // this is a bit of a hack to get the zoom level, but it works
              //   instant: true,
              //   rollRad: 0,
              // });
              const ctl = WWTControl.singleton;
              const rc = ctl.renderContext;
              const ra = child.get_RA() * 15;
              const dec = child.get_dec();
              // @ts-expect-error _guessZoomSetting exists
              const zoomDeg = _iset._guessZoomSetting(WWTControl.singleton.renderContext.viewCamera.zoom);
              store.gotoRADecZoom({
                raRad: ra * Math.PI / 180,
                decRad: dec * Math.PI / 180,
                zoomDeg,
                instant: true,
                rollRad: 0,
              });

              await new Promise(requestAnimationFrame);
              ctl.renderOneFrame();

              const pt = store.findScreenPointForRADec({ ra, dec });
              const center = store.findRADecForScreenPoint({
                x: rc.width / 2,
                y: rc.height / 2,
              });

              console.log({
                target: { ra, dec },
                screenPoint: pt,
                canvasCenter: { x: rc.width / 2, y: rc.height / 2 },
                centerRaDec: center,
                camera: {
                  ra: rc.viewCamera.get_RA() * 15,
                  dec: rc.viewCamera.get_dec(),
                  alt: rc.alt,
                  az: rc.az,
                  targetAlt: rc.targetAlt,
                  targetAz: rc.targetAz,
                },
              });
            }
          }
          
          /* we should never see these two error messages */
          if (!_iset) {
            console.error(`Imageset not found for imageSetID: ${layer.id.toString()}`, _iset);
          }
          
          if (!_layer) {
            console.error(`layer not found for id: ${layer.id.toString()}`, _layer);
          }
          
          
        }).catch(error => {
          console.error("Failed to load imageset from", error, imageset);
        });

      });

      const interval = 20;
      function timeoutFetch<T>(callable: () => PromiseLike<T>, timeout: number): Promise<void> {
        return new Promise(resolve => {
          setTimeout(async () => {
            await callable();
            resolve();
          }, timeout);
        });
      }
      const fetchPromises = toFetch.map((url, index) => timeoutFetch(() => fetch(url), index * interval));
      Promise.all(fetchPromises).then(() => fetchingComplete.value = true);

      await Promise.all(layerPromises);

      // this is not getting set, so just skip it
      // if (!_addedAtLeastOneLayer) {
      //   console.warn("No imageset layers were added.");
      //   return;
      // }
      // want to construct these so that they are in the same order as the places
      // just in case the order was important.
      // want to do a set so that a watcher or something will respond to these being ready
      imagesetLayers.value = getOrdered(_layers);
      imagesets.value = getOrdered(_isets);
      fitsImages.value = getOrdered(_fits);

      promiseResolve();
      loaded.value = true;
      debugLog("Finished loading WTML file.");
    });
  }

  if (options.autoload === undefined || options.autoload) {
    load();
  }


  const show = (name?: string) => {
    if (!name) {
      // if no name is provided, show all layers
      imagesetLayers.value.forEach(layer => layer.set_enabled(true));
      return;
    }
    const index = places.value.findIndex(p => p.get_name() === name);
    if (index === -1) {
      console.warn(`No place found with name ${name}`);
      return;
    }
    const layer = imagesetLayers.value[index];
    if (!layer) {
      console.warn(`No layer found for place with name ${name}`);
      return;
    }
    layer.set_enabled(true);
    layer.set_opacity(getOpacity(name) ?? 1);
  };

  const hide = (name?: string) => {
    if (!name) {
      // if no name is provided, hide all layers
      imagesetLayers.value.forEach(layer => layer.set_enabled(false));
      return;
    }
    const index = places.value.findIndex(p => p.get_name() === name);
    if (index === -1) {
      console.warn(`No place found with name ${name}`);
      return;
    }
    const layer = imagesetLayers.value[index];
    if (!layer) {
      console.warn(`No layer found for place with name ${name}`);
      return;
    }
    setOpacity(name, 0);
  };

  watch(opacities, (newOpacities) => {
    newOpacities.forEach((opacity, name) => {
      const index = places.value.findIndex(p => p.get_name() === name);
      if (index === -1) {
        console.warn(`No place found with name ${name}`);
        return;
      }
      const layer = imagesetLayers.value[index];
      if (!layer) {
        console.warn(`No layer found for place with name ${name}`);
        return;
      }
      layer.set_opacity(opacity);
    });
  }, { deep: true });

  return {
    ready,
    loaded,
    fetchingComplete,
    places,
    placeNames,
    imagesets,
    imagesetNames,
    imagesetLayers,
    fitsImages,
    load,
    show,
    hide,
    opacities,
  };


}
