function testGeotiffParser(data) {

	var parser = new GeotiffParser();

	// parseHeader to read TIff / Geotiff parameters
	parser.parseHeader(data);
	
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
	console.log("PlanarConfiruration=" +parser.getPlanarConfiguration());
	
		
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
	
	// Get the buffer of pixels
	// Get a sample of pixels value 
	var pixels = parser.loadPixels();
	for (var i =200; i <210 ; i++) {
		var j=200;
		console.log("x=" + i + " y=" + j + " pixels="+ parser.getPixelValue(pixels,i,j) );
	}
}
	