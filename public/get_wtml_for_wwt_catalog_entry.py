from wwt_data_formats.folder import Folder
from wwt_data_formats.place import Place
from wwt_data_formats.imageset import ImageSet

# The imagesets available in the WWT web-client are found at https://cdn.worldwidetelescope.org/wwtweb/catalog.aspx?X=ImageSets6
# X means we are returning an XML file (which is really just WTML, with an .xml file extension)
# All catalogs available in the WWT web-client come from https://cdn.worldwidetelescope.org/wwtweb/catalog.aspx?W=explorerootweb
import requests
from pathlib import Path
from urllib3.util import parse_url

def imageset_from_place(imageset, initial_coords=None):
    place = Place()
    place.foreground_image_set = imageset
    if initial_coords is not None:
        place.set_ra_dec(*initial_coords)
    else:
        place.set_ra_dec(imageset.center_x / 15, imageset.center_y)
    place.name = imageset.name
    place.data_set_type = imageset.data_set_type
    place.thumbnail = imageset.thumbnail_url
    return place

def get_wtml_for_wwt_catalog_name(name, initial_coords=None):
    """
    Search the WTML files for imagesets with the given name, and construct a WTML file for the entry
    """
    
    # This is a Folder containing a bunch of Imagesets (not nested in any place)
    url_imagesets6 = f"https://cdn.worldwidetelescope.org/wwtweb/catalog.aspx?X=ImageSets6"
    folder = Folder.from_url(url_imagesets6)
    for imageset in folder.children:
        if imageset.name == name:
            print(f"Found imageset with name {name}")
            place = imageset_from_place(imageset, initial_coords)
            out_folder = Folder()
            out_folder.name = name
            out_folder.children = [place]
            return out_folder
    print(f"Could not find imageset with name {name}")

folder = get_wtml_for_wwt_catalog_name("GLIMPSE 360")


if folder is not None:
    with open("GLIMPSE_360.wtml", "w") as f:
        folder.write_xml(f)