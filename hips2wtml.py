# based on @wwtelescope/wwt-hips-list-importer

import argparse
import html
import sys

import requests

from wwt_data_formats import write_xml_doc
from wwt_data_formats.enums import Bandpass, DataSetType, ProjectionType
from wwt_data_formats.folder import Folder
from wwt_data_formats.imageset import ImageSet
from wwt_data_formats.place import Place

PLANETS_CATEGORY_NAME = "Planets & Moons"

# get the properties and conver it to a dictionary and make sure it is compatible with 
# what the globalhipslist returned
def fetch_properties(service_url: str) -> dict:
    """Fetch a HiPS ``properties`` file and shape it like a global-list entry.

    The properties format is a simple ``key = value`` text file. We inject
    ``hips_service_url`` and ``ID`` so the helpers pasted from
    ``hips_list_parser.py`` (which expect a global-list JSON entry) work
    unchanged.
    """
    props_url = service_url.rstrip("/") + "/properties"
    resp = requests.get(props_url)
    resp.raise_for_status()

    info = {}
    for line in resp.text.splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        if "=" not in line:
            continue
        key, _, value = line.partition("=")
        info[key.strip()] = value.strip()

    info["hips_service_url"] = service_url
    info.setdefault("ID", info.get("creator_did", "").replace("ivo://", ""))
    return info




# From hips_list_parser.py - Convert()
def get_credits_url(info: dict):
    credits_url = info.get("obs_copyright_url", "")
    if isinstance(credits_url, list):
        return info.get("hips_service_url", "").strip("/") + "/properties"
    else:
        return credits_url


def get_credits(info: dict):
    credits = info.get("obs_copyright", "")
    if isinstance(credits, list):
        return ", ".join(credits)
    else:
        return credits


def get_name(info: dict):
    name = info.get("obs_title", "")
    if not name:
        name = info.get("ID", "")

    return name


def get_file_type(info: dict):
    file_formats = info.get("hips_tile_format", "")
    if isinstance(file_formats, list):
        file_formats = " ".join(file_formats)
    file_formats_arr = file_formats.split(" ")

    if "fits" in file_formats_arr and len(file_formats_arr) > 1:
        file_formats_arr.remove("fits")
        file_formats = " ".join(file_formats_arr)
        file_formats += " fits"

    return file_formats


def get_bandpass_name(info: dict):
    regime = info.get("obs_regime", "")

    if isinstance(regime, list):
        regime = regime[0]

    regime = regime.lower()

    if "radio" in regime:
        return "Radio"
    elif "gamma-ray" in regime or "gamma" in regime:
        return "Gamma"
    elif "x-ray" in regime or "xray" in regime:
        return "XRay"
    elif "infrared" in regime or "ir" in regime:
        return "Infrared"
    elif "uv" in regime or "ultraviolet" in regime:
        return "Ultraviolet"
    elif "optical" in regime:
        return "Visible"
    elif "millimeter" in regime or "microwave" in regime:
        return "Microwave"
    else:
        hips_frame = info.get("hips_frame", "").lower()
        if (
            "galactic" in hips_frame
            or "ecliptic" in hips_frame
            or "equatorial" in hips_frame
        ):
            return "Uncategorized"
        else:
            return PLANETS_CATEGORY_NAME


def build_image_data(info: dict):
    """
    Create our "yaml record hips_list_parser.Convert.add_image_set
    """
    ident = info["ID"]

    bandpass_name = get_bandpass_name(info)

    dataset_type = "Sky"
    if bandpass_name == PLANETS_CATEGORY_NAME:
        bandpass_name = "Uncategorized"

        if "panorama" in info.get("obs_title", "").lower():
            dataset_type = "Panorama"
        else:
            dataset_type = "Planet"

    url = info.get("hips_service_url", "").strip("/") + "/Norder{0}/Dir{1}/Npix{2}"
    tile_levels = info.get("hips_order", "")
    name = get_name(info)
    file_type = get_file_type(info)
    credits = get_credits(info)
    credits_url = get_credits_url(info)
    thumbnail_url = info.get("hips_service_url", "").strip("/") + "/preview.jpg"
    description = info.get("obs_description") or f"HiPS List ID: {ident}"

    return {
        "_id": ident,
        "_name": name,
        "bandpass": bandpass_name,
        "credits": credits,
        "credits_url": credits_url,
        "description": description,
        "file_type": file_type,
        "tile_levels": int(tile_levels),
        "thumbnail_url": thumbnail_url,
        "type": dataset_type,
        "url": url,
        # Initial-view hints for the enclosing Place, if the survey provides them.
        "ra": info.get("hips_initial_ra", ""),
        "dec": info.get("hips_initial_dec", ""),
        "fov": info.get("hips_initial_fov", ""),
    }


# Realizing the WTML objects --- pasted from create_wtml.py
def realize_imageset(info: dict):
    imgset = ImageSet()

    if info["bandpass"] != "Uncategorized":
        imgset.band_pass = Bandpass[info["bandpass"].upper()]

    imgset.base_degrees_per_tile = 180
    imgset.credits = info["credits"]
    imgset.credits_url = info["credits_url"]

    if info["type"] != "Uncategorized":
        imgset.data_set_type = DataSetType[info["type"].upper()]

    imgset.description = html.escape(info["description"])
    imgset.file_type = info["file_type"]
    imgset.mean_radius = 1
    imgset.name = info["_name"]
    imgset.projection = ProjectionType.HEALPIX
    imgset.quad_tree_map = "0123"
    imgset.reference_frame = "Sky"
    imgset.thumbnail_url = info["thumbnail_url"]
    imgset.tile_levels = int(info["tile_levels"])
    imgset.width_factor = 1
    imgset.url = info["url"]
    return imgset

# need to create a place. either use original ra/dec (hr/deg) or just 0 0
def realize_place(info: dict, imgset: ImageSet):
    place = Place()
    place.name = info["_name"]
    place.data_set_type = imgset.data_set_type
    place.foreground_image_set = imgset
    place.thumbnail = info["thumbnail_url"]

    # HiPS initial-view hints are optional; fall back to (0, 0) if absent.
    try:
        place.set_ra_dec(float(info["ra"]) / 15.0, float(info["dec"]))
    except (KeyError, ValueError):
        place.set_ra_dec(0.0, 0.0)

    # WWT's zoom level is six times the vertical field of view in degrees.
    try:
        place.zoom_level = float(info["fov"]) * 6.0
    except (KeyError, ValueError):
        place.zoom_level = 360.0

    place.update_constellation()
    return place

# simplified from create_wtml.py since we are never nesting
def realize_folder(info: dict, place: Place):
    f = Folder(name=info["_name"])
    f.group = "Explorer"
    f.searchable = True
    f.children.append(place)
    return f


def entrypoint():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("service_url", help="The HiPS service base URL")
    parser.add_argument(
        "-o",
        "--output",
        help="Output WTML path (default: derived from the survey name, or stdout with '-')",
    )
    args = parser.parse_args()

    info = build_image_data(fetch_properties(args.service_url))
    imgset = realize_imageset(info)
    place = realize_place(info, imgset)
    folder = realize_folder(info, place)

    if args.output == "-":
        write_xml_doc(
            folder.to_xml(), indent=True, dest_stream=sys.stdout, dest_wants_bytes=False
        )
        return

    if args.output:
        out_path = args.output
    else:
        safe_name = info["_name"].replace("/", "_").replace(" ", "_")
        out_path = f"{safe_name}.wtml"

    with open(out_path, "wt", encoding="utf-8") as f:
        write_xml_doc(
            folder.to_xml(), indent=True, dest_stream=f, dest_wants_bytes=False
        )

    print(f"Wrote {out_path}")


if __name__ == "__main__":
    entrypoint()
