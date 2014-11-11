
// Test function to check if RGBA value pixel is what we expected 
function TestRGBAPixel(parser,x,y,r,g,b,a)
{
	var pix=parser.getPixelValueOnDemand(x,y);
	var rgba= parser.getRGBAPixelValue(pix)
	console.log("x=" + x + " y=" + y + " pixels="+ pix  +" " + rgba);
	if (rgba[0] == r && rgba[1] == g && rgba[2] == b && rgba[3] == a)
		return true; 
	else
	  return false;
}
function testGeotiffParser(data) {

	var parser = new GeotiffParser();

	// parseHeader to read TIff / Geotiff parameters
	parser.parseHeader(data);
	
	parser.consoleTiffProperty();
		
	// If a GeoTiff retrieve the BBOX 
	console.log("isGeotiff=" +  parser.isGeotiff());
	if (parser.isGeotiff())
	{
		console.log("CRS Code:" + parser.getCRSCode());
		
		var ul=  parser.ImageToPCS(0,0);
		var ur=  parser.ImageToPCS(parser.imageWidth,0);
		var ll=  parser.ImageToPCS(0,parser.imageLength);
		var lr=  parser.ImageToPCS(parser.imageWidth,parser.imageLength);
		if (ul[0]==1) console.log("UL=" +  ul[1],ul[2]); else console.log("UL= failure" ); 
		if (ur[0]==1) console.log("UR=" +  ur[1],ur[2]); else console.log("UR= failure" ); 
		if (ll[0]==1) console.log("LL=" +  ll[1],ll[2]); else console.log("LL= failure" ); 
		if (lr[0]==1) console.log("LR=" +  lr[1],lr[2]); else console.log("LR= failure" ); 
	
	}
	
	//console.log("Try first part of the function getPixelValueOnDemand " );
	//var pix=parser.getPixelValueOnDemand(123,0);
	//console.log("x=" + 123 + " y=" + 0 + " pixels="+ pix  +" " + parser.getRGBAPixelValue(pix));
	/*//console.log("x=" + 11 + " y=" + 10 + " pixels="+ parser.getPixelValueOnDemand(11,10));
	console.log("x=" + 120 + " y=" + 2 + " pixels="+ parser.getPixelValueOnDemand(120,2));
	// Get the buffer of pixels
	// Get a sample of pixels value 
	var pixels = parser.loadPixels();
	console.log("x=" + 10 + " y=" + 10 + " pixels="+ parser.getPixelValue(pixels,10,10) );*/
	
}
// Test Flag_T24.tiff
// SubTest for Flag_T24.tiff 
function testFlag_T24_Color(parser) {

	console.log(TestRGBAPixel(parser, 81,10,248,0,248,1));
	console.log(TestRGBAPixel(parser, 112,10,0,248,248,1));
	console.log(TestRGBAPixel(parser, 113,10,0,0,248,1));
	console.log(TestRGBAPixel(parser, 81,11,248,248,0,1));
	console.log(TestRGBAPixel(parser, 82,11,0,248,0,1));
	console.log(TestRGBAPixel(parser, 81,42,248,0,0,1));
	console.log(TestRGBAPixel(parser, 117,49,248,0,248,1));
}

function LoadGeotiffParser(data,canvas) {

	var parser = new GeotiffParser();

	// parseHeader to read TIff / Geotiff parameters
	parser.parseHeader(data);
	var tiffCanvas = parser.toCanvas(canvas,0,0,parser.imageWidth,parser.imageLength,600,2000);
			
	return tiffCanvas;
}
	