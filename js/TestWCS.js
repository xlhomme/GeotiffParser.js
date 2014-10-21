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
//var Coverage = "nurc__Arc_Sample"; //  64bits and 1bands
//var bbox ="";

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

	var parser = new GeotiffParser();
		
	// loadPixels to read TIff / Geotiff parameter and get the buffer of pixels
	var pixels = parser.loadPixels(xhr.response);
		
	// Show Image parameter
	var width  = parser.imageWidth
	var height = parser.imageLength;
	console.log(" w=" + width + " h=" + height );
  
	// DataType  UChar8 or Int16
	var bitsPerPixel = parser.bitsPerPixel;
	console.log("bitsPerPixel=" +  bitsPerPixel);

	// Band count : 1 or 3 bands RGB
	var samplesPerPixel  = parser.samplesPerPixel;
	console.log("samplesPerPixel=" +  samplesPerPixel);

	// Get a sample of pixels value 
	for (var i =0; i <10 ; i++) {
		var j=3;
		console.log("x=" + i + " y=" + j + " pixels="+ parser.getPixelValue(pixels,i,j) );
	}
	
	// If a GeoTiff retrieve the BBOX 
	console.log("isGeotiff=" +  parser.isGeotiff());
	if (parser.isGeotiff())
	{
		console.log("CRS Code:" + parser.getCRSCode());
		
		var ul=  parser.ImageToPCS(0,0);
		var ur=  parser.ImageToPCS(width,0);
		var ll=  parser.ImageToPCS(0,height);
		var lr=  parser.ImageToPCS(width,height);
		if (ul[0]==1) console.log("UL=" +  ul[1],ul[2]); else console.log("UL= failure" ); 
		if (ur[0]==1) console.log("UR=" +  ur[1],ur[2]); else console.log("UR= failure" ); 
		if (ll[0]==1) console.log("LL=" +  ll[1],ll[2]); else console.log("LL= failure" ); 
		if (lr[0]==1) console.log("LR=" +  lr[1],lr[2]); else console.log("LR= failure" ); 
	
	}
			
};
xhr.send();

}

loadTiff(request); 
