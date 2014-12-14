GeotiffParser.js
===============

A JavaScript-based parser for the GeoTIFF image format.
This parser is based on the GPHemsley/tiff-js : canvas part has been removed, but GeoTiff geoKey has been added.
Not all Tiff capacity has been coded. 

What's supported for the Tiff part <BR>
Compression     :   None and Packbits  <BR>
Strips / Tiles  :  Supported <BR>
Photometric Interpretation : RGB , GreyScale, BiLevel, RGB, RGB Color Palette<BR>
Planar Configuration :  PLANARCONFIG_CONTIG  <BR>
Size  : images should not be to big in order to be loaded properly.


What's supported for the GeoTiff part <BR>
ModelPixelScale : Supported <BR>
ModelTransformation : Supported <BR>
ModelTiepoint : GTIFTiepointTranslate is not implemented  <BR>





Some part of the code is a port from LibGeoTiff 1.4.0 <BR>
See  http://trac.osgeo.org/geotiff  for geoTiff information<BR>

-----------------------------------------------------------

Why GeotiffParser.js ?

My attempt is to parse GeoTiff files coming from a WCS server (I'm using a Geoserver) in order to do some computation like obtaining the elevation along a path. With GeoTiff client side you could also change dynamically the rendering function. 


-----------------------------------------------------------
GeotiffParser in action with OpenLayers 3 :

<img src="img/ol3Geotiff.jpg" alt="Geotiff in action"  >
