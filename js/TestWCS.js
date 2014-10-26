// --- Inspect GeoTiff from WCS  --- \\


//Choose your own WCS server URI
var url = "http://localhost:8080/geoserver/wcs";

//Choose your own GeoTiff filename and modifiy the bounding box parameters
//var Coverage = "polecarto__N34E069";  // RASTER RGB 24bits and 3bands
var Coverage    = "polecarto__N34E069_lv3_AF"; // DEM 16bits and 1bands
var bbox = "&SUBSET=Long,EPSG:4326(69.2,69.3)&SUBSET=Lat,EPSG:4326(34.2,34.3)";  // polecarto

//var Coverage    = "sf__sfdem";  // DEM 32bits
//var Coverage = "nurc__mosaic"; //  32bits and 4bands
//var Coverage = "nurc__Img_Sample"; //  24bits and 3bands
var Coverage = "nurc__Arc_Sample"; //  64bits and 1bands
var bbox ="";

var request = "SERVICE=WCS&VERSION=2.0.1&REQUEST=GetCoverage&CoverageId=" + Coverage  + bbox + "&FORMAT=image/geotiff";

// Issue : 
// 1/ Coverage    = "sf__sfdem" bbox ? request with bbox failed
// 2/ Coverage    = "sf__sfdem"    getPixelValue failed
// 3/ Coverage    = "nurc__mosaic" getPixelValue failed



//Load a Geotiff from WCS resquest 
var loadTiff = function(request) {
var xhr = new XMLHttpRequest();
xhr.responseType = 'arraybuffer';
xhr.open('GET', url+ "?" + request);
xhr.onload = function (e) {

	testGeotiffParser(xhr.response);
			
};
xhr.send();

}

loadTiff(request); 
