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
	
	console.log("Try first part of the function getPixelValueOnDemand " );
	console.log("x=" + 10 + " y=" + 10 + " pixels="+ parser.getPixelValueOnDemand(10,10));
	console.log("x=" + 11 + " y=" + 10 + " pixels="+ parser.getPixelValueOnDemand(11,10));
	
	// Get the buffer of pixels
	// Get a sample of pixels value 
	var pixels = parser.loadPixels();
	for (var i =200; i <210 ; i++) {
		var j=200;
		console.log("x=" + i + " y=" + j + " pixels="+ parser.getPixelValue(pixels,i,j) );
	}
}
	