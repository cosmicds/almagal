import type { Colormaps } from "./wwt-colormaps/colormaps";
import { engineStore } from "@wwtelescope/engine-pinia";
import type { ImageSetLayer } from "@wwtelescope/engine";
import { ScaleTypes } from "@wwtelescope/engine-types";
import { D2R } from "@wwtelescope/astro";

/** A loaded WTML collection: what `useWtmlLoader` hands back, refs unwrapped. */
export interface LoadedWtml {
  imagesets: import("@wwtelescope/engine").Imageset[];
  imagesetLayers: ImageSetLayer[];
}

/** Enable these imagesets of a collection by index and disable the rest; with
    no indices, turn the collection off. */
export function showImagesets(wtml: LoadedWtml, ...indices: number[]) {
  wtml.imagesetLayers.forEach((layer, index) => {
    layer.set_enabled(indices.includes(index));
    layer.set_opacity(1);
  });
}

export interface ImagesetView {
  /** height of the view in degrees (WWT's own zoom number is six times this) */
  zoom: number;
  /** defaults to the imageset's own centre, in degrees */
  ra?: number;
  dec?: number;
  /** "imageset" takes the image's own rotation; a number is degrees */
  roll?: number | "imageset";
  instant?: boolean;
  duration?: number;
}

/** Move the view to one imageset of a collection, by index. */
export function goToImageset(
  wtml: LoadedWtml,
  index: number,
  view: ImagesetView,
  store = engineStore()
) {
  const imageset = wtml.imagesets[index];
  if (!imageset) {
    console.warn(`goToImageset: no imageset at index ${index}`);
    return;
  }
  const rollDeg = view.roll === "imageset" ? imageset.get_rotation() : (view.roll ?? 0);
  return store.gotoRADecZoom({
    raRad: (view.ra ?? imageset.get_centerX()) * D2R,
    decRad: (view.dec ?? imageset.get_centerY()) * D2R,
    zoomDeg: view.zoom * 6,
    rollRad: rollDeg * D2R,
    instant: view.instant ?? true,
    duration: view.duration,
  });
}

/** Centre the view on an imageset layer, framed the way WWT would frame it. */
export function moveToImageset(
  layer: ImageSetLayer,
  store = engineStore(),
  instant = true
) {
  const imageset = layer.get_imageSet();

  // @ts-expect-error _guessZoomSetting is internal; gives projection-aware zoom
  const zoomDeg = imageset._guessZoomSetting(Number.POSITIVE_INFINITY);

  return store.gotoRADecZoom({
    raRad: imageset.get_centerX() * D2R,
    decRad: imageset.get_centerY() * D2R,
    zoomDeg,
    rollRad: store.rollRad,
    instant,
  });
}


export function setFitsLayerSettings(
  guid: string, 
  store: ReturnType<typeof engineStore>, 
  options: {
    cmap?: Colormaps, 
    opacity?: number, 
    stretch?: {
      stretch: ScaleTypes, 
      vmin: number, vmax:number
    }} = {}
) {
  
  if (options.cmap) {
    store.applyFitsLayerSettings({
      id: guid,
      settings: [
        ['colorMapperName', options.cmap as Colormaps],
      ]
    });
  }
  if (options.opacity) {
    store.applyFitsLayerSettings({
      id: guid,
      settings: [
        ['opacity', options.opacity],
      ]
    });
  }
  if (options.stretch) {
    store.stretchFitsLayer({
      id: guid,
      stretch: options.stretch.stretch,
      vmin: options.stretch.vmin,
      vmax: options.stretch.vmax,
    });
  }
}





import { Imageset, HipsProperties, WWTControl } from "@wwtelescope/engine";
import { ImageSetType, BandPass,ProjectionType } from "@wwtelescope/engine-types";


// wwtlib.Util.getHashCode
const getHashCode = function (target) {
  let hash = 0;
  if (!target.length) {
    return hash;
  }
  for (let i = 0; i < target.length; i++) {
    const c = target.charCodeAt(i);
    hash = ((hash << 5) - hash) + c;
  }
  return hash;
};

/**
 * Creates an Imageset from a hips URL. Creates an imageset from a HiPs service url
 * It asumes that it is a sky imageset (so planet ones will appear on the sky), and I am unsure if it
 * will break if a hips service serves multiple file types, and we drop FITS based ones
 * hips ivoa standard document https://www.ivoa.net/documents/HiPS/20170519/REC-HIPS-1.0-20170519.pdf
 */
export async function hips2Imageset(url: string, name: string) {
  const base = url.endsWith('/') ? url : `${url}/`;
  const hipsUrl = `${base}Norder{0}/Dir{1}/Npix{2}`;
  const iset = Imageset.create(
    name                , // name: string                     , obs_title
    hipsUrl             , // url: string                      , 
    ImageSetType.sky    , // dataSetType: ImageSetType        , 
    BandPass.visible    , // bandPass: BandPass               , obs_regime
    7 as ProjectionType , // projection ProjectionType.healpix, 
    getHashCode(hipsUrl), // imageSetID: number               , 
    0                   , // baseLevel: number                , 
    1                   , // levels: number                   , hips_order
    null                , // unused_tileSize: null            , 
    180.0               , // baseTileDegrees: number          , 
    'png jpg jpeg fits' , // extension: string                , hips_tile_format
    false               , // bottomsUp: boolean               , 
    '0123'              , // quadTreeMap: string              , 
    0.0                 , // centerX: number                  , 
    0.0                 , // centerY: number                  , 
    0.0                 , // rotation: number                 , 
    true                , // sparse: boolean                  , 
    `${base}preview.jpg`, // thumbnailUrl: string             , // this may not exist
    false               , // defaultSet: boolean              , 
    false               , // elevationModel: boolean          , 
    1                   , // widthFactor: number              , 
    0                   , // offsetX: number                  , 
    0                   , // offsetY: number                  , 
    'hipsgen'           , // creditsText: string              , obs_copyright, obs_description
    base                , // creditsUrl: string               , hips_service_url [bib_reference_url, obs_copyright_url]
    ''                  , // demUrl: string                   , 
    ''                  , // altUrl: string                   , 
    1.0                 , // meanRadius: number               , 
    'Sky'               , // referenceFrame: string
  );
  
  // @ts-expect-error it actually does accept a single value, and Imageset
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const hipsProperties: any = new HipsProperties(iset); // any let's use check the internal _downloadComplete
  console.log("creating hips");
  // we need to wait for the properties to be ready
  await new Promise((resolve, reject) => {
    const start = Date.now();
    const interval = setInterval(() => {
      if (hipsProperties._downloadComplete) {
        clearInterval(interval);
        resolve(hipsProperties);
      } else if (Date.now() - start > 1000 ) {
        clearInterval(interval);
        reject(new Error(`Getting hips properties for ${url} timed out`));
      }
    }, 100);
  });
  // Set values from the HiPS properties
  /**
   * Required HIPs keys
   * creator_did, obs_title, dataproduct_type
   * hips_version, hips_release_date, hips_status
   * hips_tile_format, hips_order, hips_frame
   * 
   */
  iset.set_levels(hipsProperties._properties.hips_order);
  if (hipsProperties._properties.hips_tile_format === 'fits') {
    console.error("WWT may not fully support fits formatted Hips tiles");
  }
  iset.set_extension(hipsProperties._properties.hips_tile_format.replace('fits','').trim());
  iset.set_name(hipsProperties._properties.obs_title ?? name);
  
  const _descr = hipsProperties._properties.obs_copyright ?? hipsProperties._properties.obs_description ?? name; 
  iset.set_creditsText(_descr);
  
  if (hipsProperties._properties.obs_regime) {
    // "Radio" | "Millimeter" | "Infrared" |"Optical" | "UV" | "EUV" | "X-ray" | "Gamma-ray"
    const regime = hipsProperties._properties.obs_regime.toString().toLowerCase();
    if (regime.includes('gamma')) iset.set_bandPass(BandPass.gamma);
    if (regime.includes('x')) iset.set_bandPass(BandPass.xRay);
    if (regime.includes('uv')) iset.set_bandPass(BandPass.ultraviolet);
    if (regime.includes('optical')) iset.set_bandPass(BandPass.visible);
    if (regime.includes('visible')) iset.set_bandPass(BandPass.visible);
    if (regime.includes('infrared')) iset.set_bandPass(BandPass.IR);
    if (regime.includes('millimeter')) iset.set_bandPass(BandPass.microwave);
    if (regime.includes('radio')) iset.set_bandPass(BandPass.radio);
  }
  

  // @ts-expect-error set_hipsProperties exists
  iset.set_hipsProperties(hipsProperties); // accessible via iset.get_hipsProperties()
  
  return iset;
}

/**
 * Usage
 * awaiting this can for some reason make this take a longer to load, so it is better 
 * to create a WTML file and load it that way
 * ```ts
   loadHips('https://alasky.cds.unistra.fr/2MASS/Color/', 'test')
    .then(iset => {
      return store.addImageSetLayer({
        url: iset.get_url(),
        mode: "preloaded",
        name: iset.get_name(),
        goto: false,
      });
    })
    .then(layer => {
      layer.set_enabled(true);
      layer.set_opacity(1);
    })
 * ```
 */
export async function loadHips(url: string, name: string) {
  const iset = await hips2Imageset(url, name);
  WWTControl.addImageSetToRepository(iset);
  return iset;
}

