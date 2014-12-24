/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. 
 *
 * modified source code from GPHemsley/tiff-js
 * use pako for inflating when compression == deflate 
 */

"use strict";

function GeotiffParser() {
	this.tiffDataView = undefined;
	this.littleEndian = undefined;
	this.imageWidth = undefined;
	this.imageLength = undefined;
	this.bitsPerPixel = undefined;
	this.samplesPerPixel = undefined;
	this.photometricInterpretation = undefined;
	this.compression = undefined;
	this.fileDirectories = [];
	this.sampleProperties = [];
	this.geoKeys = [];
	this.blocks = [];
	this.colorMapValues = [];
	this.colorMapSampleSize = undefined;
	this.isPixelArea = 0;
	this.planarConfiguration = 1; 
	this.extraSamplesValues = [];
	this.numExtraSamples = 0;

}

/* GeotiffParser */ 
GeotiffParser.prototype = {

	/* isLittleEndian from Tiff-js  */
	isLittleEndian: function () {
		// Get byte order mark.
		var BOM = this.getBytes(2, 0);

		// Find out the endianness.
		if (BOM === 0x4949) {
			this.littleEndian = true;
		} else if (BOM === 0x4D4D) {
			this.littleEndian = false;
		} else {
			console.log( BOM );
			throw TypeError("Invalid byte order value.");
		}

		return this.littleEndian;
	},

	/* from Tiff-js  */
	hasTowel: function () {
		// Check for towel.
		if (this.getBytes(2, 2) !== 42) {
			throw RangeError("You forgot your towel!");
		}

		return true;
	},
	
	/* Translate LinearCode to string  */
	getLinearUnitsName: function (linearUnitsCode) {
		var LinearUnitsName;
		switch(linearUnitsCode) {
            case 0:
                LinearUnitsName = 'undefined';
                break;
            case 9001:
                LinearUnitsName = 'Linear_Meter';
                break;
            case 9002:
                LinearUnitsName = 'Linear_Foot';
                break;
            case 9003:
                LinearUnitsName = 'Linear_Foot_US_Survey';
                break;
            case 9004:
                LinearUnitsName = 'Linear_Foot_Modified_American';
                break;
            case 9005:
                LinearUnitsName = 'Linear_Foot_Clarke ';
                break;
            case 9006:
                LinearUnitsName = 'Linear_Foot_Indian ';
                break;
            case 9007:
                LinearUnitsName = 'Linear_Link ';
                break;
            case 9008:
                LinearUnitsName = 'Linear_Link_Benoit ';
                break;
            case 9009:
                LinearUnitsName = 'Linear_Link_Sears';
                break;
            case 9010:
                LinearUnitsName = 'Linear_Chain_Benoit';
                break;
            case 9011:
                LinearUnitsName = 'Linear_Chain_Sears';
                break;
            case 9012:
                LinearUnitsName = 'Linear_Yard_Sears';
                break;
            case 9013:
                LinearUnitsName = 'Linear_Yard_Indian';
                break;
            case 9014:
                LinearUnitsName = 'Linear_Fathom';
                break;
            case 9015:
                LinearUnitsName = 'user-Linear_Mile_International_Nautical';
                break;
		 default:
				    if (linearUnitsCode>=9000 && linearUnitsCode<=9099) LinearUnitsName= 'EPSG Linear Units';
					else if (linearUnitsCode>=9100 && linearUnitsCode<=9199) LinearUnitsName= 'EPSG Angular Units';
					else if (linearUnitsCode=32767) LinearUnitsName= 'user-defined unit';
					else if (linearUnitsCode>32767) LinearUnitsName= 'Private User Implementations';
			break;
		}		
		return LinearUnitsName;
	},
	
	/* Translate LinearCode to string  */
	getAngularUnitsName: function (angularUnitsCode) {
		var AngularUnitsName;
		switch(angularUnitsCode) {
            case 0:
                AngularUnitsName = 'undefined';
                break;
            case 9001:
                AngularUnitsName = 'Angular_Radian';
                break;
            case 9002:
                AngularUnitsName = 'Angular_Degree';
                break;
            case 9003:
                AngularUnitsName = 'Angular_Arc_Minute';
                break;
            case 9004:
                AngularUnitsName = 'Angular_Arc_Second';
                break;
            case 9005:
                AngularUnitsName = 'Angular_Grad';
                break;
            case 9006:
                AngularUnitsName = 'Angular_Gon';
                break;
            case 9007:
                AngularUnitsName = 'Angular_DMS';
                break;
            case 9008:
                AngularUnitsName = 'Angular_DMS_Hemisphere';
                break;
		 default:
				    if (angularUnitsCode>=9000 && angularUnitsCode<=9099) AngularUnitsName= 'EPSG Linear Units';
					else if (angularUnitsCode>=9100 && angularUnitsCode<=9199) AngularUnitsName= 'EPSG Angular Units';
					else if (angularUnitsCode=32767) AngularUnitsName= 'user-defined unit';
					else if (angularUnitsCode>32767) AngularUnitsName= 'Private User Implementations';
			break;
		}		
		return AngularUnitsName;
	},
	
	/* Translate modelTypeCode to string  */
	getModelTypeName: function (modelTypeCode) {
		var modelTypeName;
		switch(modelTypeCode) {
            case 0:
                modelTypeName = 'undefined';
                break;
            case 1:
                modelTypeName = 'ModelTypeProjected';
                break;
            case 2:
                modelTypeName = 'ModelTypeGeographic';
                break;
            case 3:
                modelTypeName = 'ModelTypeGeocentric';
                break;
            case 32767:
                modelTypeName = 'user-defined';
                break;
		 default:
					if (modelTypeCode<32767) modelTypeName= 'GeoTIFF Reserved Codes';
					else if (modelTypeCode>32767) modelTypeName= 'Private User Implementations';
			break;
		}		
		return modelTypeName;
	},
	
	/* Translate rasterTypeCode to string  */
	getRasterTypeName: function (rasterTypeCode) {
		var rasterTypeName;
		switch(rasterTypeCode) {
            case 0:
                rasterTypeName = 'undefined';
                break;
            case 1:
                rasterTypeName = 'RasterPixelIsArea';
                break;
            case 2:
                rasterTypeName = 'RasterPixelIsPoint';
                break;
            case 32767:
                rasterTypeName = 'user-defined';
                break;
		 default:
					if (rasterTypeCode<32767) rasterTypeName= 'GeoTIFF Reserved Codes';
					else if (rasterTypeCode>32767) rasterTypeName= 'Private User Implementations';
			break;
		}		
		return rasterTypeName;
	},
	
	/* Translate GeoKey to string  */
	getGeoKeyName:  function (geoKey) {
		var geoKeyTagNames = {
		1024: 'GTModelTypeGeoKey', 
		1025:'GTRasterTypeGeoKey',
		1026:'GTCitationGeoKey',
		2048:'GeographicTypeGeoKey',
		2049:'GeogCitationGeoKey',
		2050:'GeogGeodeticDatumGeoKey',
		2051:'GeogPrimeMeridianGeoKey',
		2052:'GeogLinearUnitsGeoKey',
		2053:'GeogLinearUnitSizeGeoKey',
		2054:'GeogAngularUnitsGeoKey',
		2055:'GeogAngularUnitSizeGeoKey',
		2056:'GeogEllipsoidGeoKey',
		2057:'GeogSemiMajorAxisGeoKey',
		2058:'GeogSemiMinorAxisGeoKey',
		2059:'GeogInvFlatteningGeoKey',
		2060:'GeogAzimuthUnitsGeoKey',
		2061:'GeogPrimeMeridianLongGeoKey',
		2062:'GeogTOWGS84GeoKey',
		3072:'ProjectedCSTypeGeoKey',
		3073:'PCSCitationGeoKey',
		3074:'ProjectionGeoKey',
		3075:'ProjCoordTransGeoKey',
		3076:'ProjLinearUnitsGeoKey',
		3077:'ProjLinearUnitSizeGeoKey',
		3078:'ProjStdParallel1GeoKey',
		3079:'ProjStdParallel2GeoKey',
		3080:'ProjNatOriginLongGeoKey',
		3081:'ProjNatOriginLatGeoKey',
		3082:'ProjFalseEastingGeoKey',
		3083:'ProjFalseNorthingGeoKey',
		3084:'ProjFalseOriginLongGeoKey',
		3085:'ProjFalseOriginLatGeoKey',
		3086:'ProjFalseOriginEastingGeoKey',
		3087:'ProjFalseOriginNorthingGeoKey',
		3088:'ProjCenterLongGeoKey',
		3089:'ProjCenterLatGeoKey',
		3090:'ProjCenterEastingGeoKey',
		3091:'ProjCenterNorthingGeoKey',
		3092:'ProjScaleAtNatOriginGeoKey',
		3093:'ProjScaleAtCenterGeoKey',
		3094:'ProjAzimuthAngleGeoKey',
		3095:'ProjStraightVertPoleLongGeoKey',
		3096:'ProjRectifiedGridAngleGeoKey',
		4096:'VerticalCSTypeGeoKey',
		4097:'VerticalCitationGeoKey',
		4098:'VerticalDatumGeoKey',
		4099:'VerticalUnitsGeoKey'
		};
		var geoKeyName;

		if (geoKey in geoKeyTagNames) {
			geoKeyName = geoKeyTagNames[geoKey];
		} else {
			console.log( "Unknown geoKey :", geoKey);
			geoKeyName =   geoKey + "GeoKey";
		}
		return geoKeyName;
	},

	/* from Tiff-js  */
	getFieldTagName: function (fieldTag) {
		// See: http://www.digitizationguidelines.gov/guidelines/TIFF_Metadata_Final.pdf
		// See: http://www.digitalpreservation.gov/formats/content/tiff_tags.shtml
		var fieldTagNames = {
			// TIFF Baseline
			0x013B: 'Artist',
			0x0102: 'BitsPerSample',
			0x0109: 'CellLength',
			0x0108: 'CellWidth',
			0x0140: 'ColorMap',
			0x0103: 'Compression',
			0x8298: 'Copyright',
			0x0132: 'DateTime',
			0x0152: 'ExtraSamples',
			0x010A: 'FillOrder',
			0x0121: 'FreeByteCounts',
			0x0120: 'FreeOffsets',
			0x0123: 'GrayResponseCurve',
			0x0122: 'GrayResponseUnit',
			0x013C: 'HostComputer',
			0x010E: 'ImageDescription',
			0x0101: 'ImageLength',
			0x0100: 'ImageWidth',
			0x010F: 'Make',
			0x0119: 'MaxSampleValue',
			0x0118: 'MinSampleValue',
			0x0110: 'Model',
			0x00FE: 'NewSubfileType',
			0x0112: 'Orientation',
			0x0106: 'PhotometricInterpretation',
			0x011C: 'PlanarConfiguration',
			0x0128: 'ResolutionUnit',
			0x0116: 'RowsPerStrip',
			0x0115: 'SamplesPerPixel',
			0x0131: 'Software',
			0x0117: 'StripByteCounts',
			0x0111: 'StripOffsets',
			0x00FF: 'SubfileType',
			0x0107: 'Threshholding',
			0x011A: 'XResolution',
			0x011B: 'YResolution',

			// TIFF Extended
			0x0146: 'BadFaxLines',
			0x0147: 'CleanFaxData',
			0x0157: 'ClipPath',
			0x0148: 'ConsecutiveBadFaxLines',
			0x01B1: 'Decode',
			0x01B2: 'DefaultImageColor',
			0x010D: 'DocumentName',
			0x0150: 'DotRange',
			0x0141: 'HalftoneHints',
			0x015A: 'Indexed',
			0x015B: 'JPEGTables',
			0x011D: 'PageName',
			0x0129: 'PageNumber',
			0x013D: 'Predictor',
			0x013F: 'PrimaryChromaticities',
			0x0214: 'ReferenceBlackWhite',
			0x0153: 'SampleFormat',
			0x0154: 'SMinSampleValue',
			0x0155: 'SMaxSampleValue',
			0x022F: 'StripRowCounts',
			0x014A: 'SubIFDs',
			0x0124: 'T4Options',
			0x0125: 'T6Options',
			0x0145: 'TileByteCounts',
			0x0143: 'TileLength',
			0x0144: 'TileOffsets',
			0x0142: 'TileWidth',
			0x012D: 'TransferFunction',
			0x013E: 'WhitePoint',
			0x0158: 'XClipPathUnits',
			0x011E: 'XPosition',
			0x0211: 'YCbCrCoefficients',
			0x0213: 'YCbCrPositioning',
			0x0212: 'YCbCrSubSampling',
			0x0159: 'YClipPathUnits',
			0x011F: 'YPosition',

			// EXIF
			0x9202: 'ApertureValue',
			0xA001: 'ColorSpace',
			0x9004: 'DateTimeDigitized',
			0x9003: 'DateTimeOriginal',
			0x8769: 'Exif IFD',
			0x9000: 'ExifVersion',
			0x829A: 'ExposureTime',
			0xA300: 'FileSource',
			0x9209: 'Flash',
			0xA000: 'FlashpixVersion',
			0x829D: 'FNumber',
			0xA420: 'ImageUniqueID',
			0x9208: 'LightSource',
			0x927C: 'MakerNote',
			0x9201: 'ShutterSpeedValue',
			0x9286: 'UserComment',

			// IPTC
			0x83BB: 'IPTC',

			// ICC
			0x8773: 'ICC Profile',

			// XMP
			0x02BC: 'XMP',

			// GDAL
			0xA480: 'GDAL_METADATA',
			0xA481: 'GDAL_NODATA',

			// Photoshop
			0x8649: 'Photoshop',
			
			// GeoTiff
			0x830E: 'ModelPixelScale',
			0x8482: 'ModelTiepoint',
			0x85D8: 'ModelTransformation',
			0x87AF: 'GeoKeyDirectory',
			0x87B0: 'GeoDoubleParams',
			0x87B1: 'GeoAsciiParams'
			
		};

		var fieldTagName;

		if (fieldTag in fieldTagNames) {
			fieldTagName = fieldTagNames[fieldTag];
		} else {
			console.log( "Unknown Field Tag:", fieldTag);
			fieldTagName = "Tag" + fieldTag;
		}
		return fieldTagName;
	},
	
	/* Translate the photometric code to a name  */
	getPhotometricName:  function (key) {
		var photometricNames = {
		0:'PHOTOMETRIC_MINISWHITE',
		1:'PHOTOMETRIC_MINISBLACK',
		2:'PHOTOMETRIC_RGB',
		3:'PHOTOMETRIC_PALETTE',
		4:'PHOTOMETRIC_MASK',
		5:'PHOTOMETRIC_SEPARATED',
		6:'PHOTOMETRIC_YCBCR',
		8:'PHOTOMETRIC_CIELAB',
		9:'PHOTOMETRIC_ICCLAB',
		10:'PHOTOMETRIC_ITULAB',
		32844:'PHOTOMETRIC_LOGL',
		32845:'PHOTOMETRIC_LOGLUV'
		};
		var photometricName;

		if (key in photometricNames) {
			photometricName = photometricNames[key];
		} else {
			photometricName = "UNKNOWN";
		}
		return photometricName;
	},
		
	/* Translate GeoKey to string  */
	getCompressionTypeName:  function (key) {
		var compressionNames = {

		1:'COMPRESSION_NONE',
		2:'COMPRESSION_CCITTRLE',
		3:'COMPRESSION_CCITTFAX3',
		4:'COMPRESSION_CCITTFAX4',
		5:'COMPRESSION_LZW',
		6:'COMPRESSION_OJPEG',
		7:'COMPRESSION_JPEG',
		32766:'COMPRESSION_NEXT',
		32771:'COMPRESSION_CCITTRLEW',
		32773:'COMPRESSION_PACKBITS',
		32809:'COMPRESSION_THUNDERSCAN',
		32895:'COMPRESSION_IT8CTPAD',
		32896:'COMPRESSION_IT8LW',
		32897:'COMPRESSION_IT8MP',
		32898:'COMPRESSION_IT8BL',
		32908:'COMPRESSION_PIXARFILM',
		32909:'COMPRESSION_PIXARLOG',
		32946:'COMPRESSION_DEFLATE',
		8:'COMPRESSION_ADOBE_DEFLATE',
		32947:'COMPRESSION_DCS',
		34661:'COMPRESSION_JBIG',
		34676:'COMPRESSION_SGILOG',
		34677:'COMPRESSION_SGILOG24',
		34712:'COMPRESSION_JP2000'
		};
		var compressionName;

		if (key in compressionNames) {
			compressionName = compressionNames[key];
		} else {
			compressionName = "UNKNOWN";
		}
		return compressionName;
	},

	/* from Tiff-js  */
	getFieldTypeName: function (fieldType) {
		var fieldTypeNames = {
			0x0001: 'BYTE',
			0x0002: 'ASCII',
			0x0003: 'SHORT',
			0x0004: 'LONG',
			0x0005: 'RATIONAL',
			0x0006: 'SBYTE',
			0x0007: 'UNDEFINED',
			0x0008: 'SSHORT',
			0x0009: 'SLONG',
			0x000A: 'SRATIONAL',
			0x000B: 'FLOAT',
			0x000C: 'DOUBLE'
		};

		var fieldTypeName;

		if (fieldType in fieldTypeNames) {
			fieldTypeName = fieldTypeNames[fieldType];
		}
		return fieldTypeName;
	},

	/* from Tiff-js  */
	getFieldTypeLength: function (fieldTypeName) {
		var fieldTypeLength;

		if (['BYTE', 'ASCII', 'SBYTE', 'UNDEFINED'].indexOf(fieldTypeName) !== -1) {
			fieldTypeLength = 1;
		} else if (['SHORT', 'SSHORT'].indexOf(fieldTypeName) !== -1) {
			fieldTypeLength = 2;
		} else if (['LONG', 'SLONG', 'FLOAT'].indexOf(fieldTypeName) !== -1) {
			fieldTypeLength = 4;
		} else if (['RATIONAL', 'SRATIONAL', 'DOUBLE'].indexOf(fieldTypeName) !== -1) {
			fieldTypeLength = 8;
		}

		return fieldTypeLength;
	},

	/* from Tiff-js  */
	getBits: function (numBits, byteOffset, bitOffset) {
		bitOffset = bitOffset || 0;
		var extraBytes = Math.floor(bitOffset / 8);
		var newByteOffset = byteOffset + extraBytes;
		var totalBits = bitOffset + numBits;
		var shiftRight = 32 - numBits;

		if (totalBits <= 0) {
			console.log( numBits, byteOffset, bitOffset );
			throw RangeError("No bits requested");
		} else if (totalBits <= 8) {
			var shiftLeft = 24 + bitOffset;
			var rawBits = this.tiffDataView.getUint8(newByteOffset, this.littleEndian);
		} else if (totalBits <= 16) {
			var shiftLeft = 16 + bitOffset;
			var rawBits = this.tiffDataView.getUint16(newByteOffset, this.littleEndian);
		} else if (totalBits <= 32) {
			var shiftLeft = bitOffset;
			var rawBits = this.tiffDataView.getUint32(newByteOffset, this.littleEndian);
		} else {
			console.log( numBits, byteOffset, bitOffset );
			throw RangeError("Too many bits requested");
		}

		var chunkInfo = {
			'bits': ((rawBits << shiftLeft) >>> shiftRight),
			'byteOffset': newByteOffset + Math.floor(totalBits / 8),
			'bitOffset': totalBits % 8
		};
		return chunkInfo;
	},

	/* from Tiff-js  */
	getBytes: function (numBytes, offset) {
		if (numBytes <= 0) {
			console.log( numBytes, offset );
			throw RangeError("No bytes requested");
		} else if (numBytes <= 1) {
			return this.tiffDataView.getUint8(offset, this.littleEndian);
		} else if (numBytes <= 2) {
			return this.tiffDataView.getUint16(offset, this.littleEndian);
		} else if (numBytes <= 3) {
			return this.tiffDataView.getUint32(offset, this.littleEndian) >>> 8;
		} else if (numBytes <= 4) {
			return this.tiffDataView.getUint32(offset, this.littleEndian);
		} else if (numBytes <= 8) {
			return this.tiffDataView.getFloat64(offset, this.littleEndian);
		} else {
			throw RangeError("Too many bytes requested");
		}
	},
	
	/* getSampleBytes : use Sampleformat  */
	getSampleBytes: function (sampleFormat, numBytes, offset) {
	
		// Decompress strip.
		switch (sampleFormat) {
			// Uncompressed
			case 1:
			case 2: // two’s complement signed integer data
				return this.getBytes(numBytes, offset);
			case 3: // floating point data
				{
					if (numBytes == 3) {
						return this.tiffDataView.getFloat32(offset, this.littleEndian) >>> 8;
					} else if (numBytes == 4) {
						return this.tiffDataView.getFloat32(offset, this.littleEndian);
					}
					// No break : if numBytes != 3 && 4 --> throw error
				}
			case 5: // Complex Int
			case 6: // Complex IEEE floating point 
			case 4: // void or undefined  
				default:
				throw Error("Do not attempt to parse the data  not handled  : " + sampleFormat);
			break;
			}
			
	},

	/* from Tiff-js  */
	getFieldValues: function (fieldTagName, fieldTypeName, typeCount, valueOffset) {
		var fieldValues = [];
		var fieldTypeLength = this.getFieldTypeLength(fieldTypeName);
		var fieldValueSize = fieldTypeLength * typeCount;

		if (fieldValueSize <= 4) {
			// The value is stored at the big end of the valueOffset.
			if (this.littleEndian === false) {
				var value = valueOffset >>> ((4 - fieldTypeLength) * 8);
			} else {
				var value = valueOffset;
			}

			fieldValues.push(value);
		} else {
			for (var i = 0; i < typeCount; i++) {
				var indexOffset = fieldTypeLength * i;

				if (fieldTypeLength >= 8) {
					if (['RATIONAL', 'SRATIONAL'].indexOf(fieldTypeName) !== -1) {
						// Numerator
						fieldValues.push(this.getBytes(4, valueOffset + indexOffset));
						// Denominator
						fieldValues.push(this.getBytes(4, valueOffset + indexOffset + 4));
					} else if (['DOUBLE'].indexOf(fieldTypeName) !== -1) {
						fieldValues.push(this.getBytes(8, valueOffset + indexOffset));
						//console.log(this.getBytes(8, valueOffset + indexOffset) );
					} else {
						console.log( " fff" + fieldTypeName, typeCount, fieldValueSize );
						//throw TypeError("Can't handle this field type or size");
					}
				} else {
					fieldValues.push(this.getBytes(fieldTypeLength, valueOffset + indexOffset));
				}
			}
		}

		if (fieldTypeName === 'ASCII') {
            fieldValues.forEach(function (e, i, a) {
                a[i] = String.fromCharCode(e);
            });
		}
		return fieldValues;
	},

	/* from Tiff-js  */
	clampColorSample: function(colorSample, bitsPerSample) {
		var multiplier = Math.pow(2, 8 - bitsPerSample);
		return Math.floor((colorSample * multiplier) + (1-multiplier));
	},
	
	clampAffineColorSample: function(colorSample, bitsPerSample,vmin,vmax ) {
		var multiplier = Math.pow(2, 8 ) / vmax;
		return Math.floor((colorSample-vmin) * multiplier );
	},

	/* from Tiff-js  */
	makeRGBAFillValue: function(r, g, b, a) {
		if(typeof a === 'undefined') {
			a = 1.0;
		}
		return "rgba(" + r + ", " + g + ", " + b + ", " + a + ")";
	},

	/* from Tiff-js  */
	parseFileDirectory: function (byteOffset) {
		var numDirEntries = this.getBytes(2, byteOffset);
		var tiffFields = [];

		for (var i = byteOffset + 2, entryCount = 0; entryCount < numDirEntries; i += 12, entryCount++) {
			var fieldTag = this.getBytes(2, i);
			var fieldType = this.getBytes(2, i + 2);
			var typeCount = this.getBytes(4, i + 4);
			var valueOffset = this.getBytes(4, i + 8);

			var fieldTagName = this.getFieldTagName( fieldTag );
			var fieldTypeName = this.getFieldTypeName( fieldType );			
			var fieldValues = this.getFieldValues(fieldTagName, fieldTypeName, typeCount, valueOffset);
			
			tiffFields[fieldTagName] = { 'type': fieldTypeName, 'values': fieldValues };
		}

		this.fileDirectories.push( tiffFields );

		var nextIFDByteOffset = this.getBytes(4, i);

		if (nextIFDByteOffset === 0x00000000) {
			return this.fileDirectories;
        }
        else {
			return this.parseFileDirectory(nextIFDByteOffset);
		}
	},
	
	/* check if the Tif is a GeoTiff  */
	isGeotiff: function() {
		var fileDirectory = this.fileDirectories[0];
		if (typeof(fileDirectory.GeoKeyDirectory) == 'undefined' || fileDirectory.GeoKeyDirectory == null ||
			typeof(fileDirectory.GeoKeyDirectory.values) == 'undefined' || fileDirectory.GeoKeyDirectory.values == null)
				return false; 
			var geoKeysDir = fileDirectory.GeoKeyDirectory.values;
			if (geoKeysDir.length<4)
				return false; 
			return true; 
		},	
		
		
	/* check  getPlanarConfiguration */
	getPlanarConfiguration: function() {
		var fileDirectory = this.fileDirectories[0];
		if (fileDirectory.hasOwnProperty('PlanarConfiguration') ==false ||
			fileDirectory.PlanarConfiguration.hasOwnProperty('values') == false ||
			fileDirectory.PlanarConfiguration.values == null)
			return 1; 
	
		return fileDirectory.PlanarConfiguration.values[0]; 
		},
		
		
	/* return the type  of the pixel or -1 */
	getSampleFormat: function() {
		var fileDirectory = this.fileDirectories[0];
		if (fileDirectory.hasOwnProperty('SampleFormat') ==false ||
			fileDirectory.SampleFormat.hasOwnProperty('values') == false ||
			fileDirectory.SampleFormat.values == null)
			return  1; 
	
		return fileDirectory.SampleFormat.values[0]; 
		},
		
	/* return min and max values if resent or -1 */
	getSampleMinMax: function() {
		var fileDirectory = this.fileDirectories[0];
		if (fileDirectory.hasOwnProperty('SMaxSampleValue') ==false ||
			fileDirectory.SMaxSampleValue.hasOwnProperty('values') == false ||
			fileDirectory.SMaxSampleValue.values == null)
			return -1; 
			
		if (fileDirectory.hasOwnProperty('SMinSampleValue') ==false ||
			fileDirectory.SMinSampleValue.hasOwnProperty('values') == false ||
			fileDirectory.SMinSampleValue.values == null)
			return -1; 
	
		return [fileDirectory.SMinSampleValue.values , fileDirectory.SMaxSampleValue.values]; 
	
		},
		
		
		
		
	/* isBlockLoaded : this function check if the block with blockOffset value has been loaded  */
	isBlockLoaded: function(blockOffset) {
			var blocks = this.blocks;
			for (var i=0;i<blocks.length;i++)
				if (this.blocks[i]!=null && this.blocks[i].offset==blockOffset)
					return i;				
			return -1;	
		},
		
	/* getBlock : this function get the block with blockOffset value has been loaded  */
	getBlock: function(blockOffset) {
			var blocks = this.blocks;
			for (var i=0;i<blocks.length;i++)
				if (this.blocks[i]!=null && this.blocks[i].offset==blockOffset)
					return this.blocks[i];				
			return null;	
		},
		
	/* add the new block to the list of the block 
	 * ToDo : limit the number of block loaded in order to control the memory isage
	 * remove older block 
	 */
	addBlock: function(stripToLoad,block) {
		this.blocks[stripToLoad] = block
	},
		
	/* check if StripOffset is set */
	hasStripOffset: function() {
		var fileDirectory = this.fileDirectories[0];
		if (typeof(fileDirectory.StripOffsets) == 'undefined' || fileDirectory.StripOffsets == null ||
			typeof(fileDirectory.StripOffsets.values) == 'undefined' || fileDirectory.StripOffsets.values == null)
				return false; 
		return true; 
		},	
	
	/* check if TileOffsets is set */
	hasTileOffset: function() {
		var fileDirectory = this.fileDirectories[0];
		if (fileDirectory.hasOwnProperty('TileOffsets') ==false  ||
			fileDirectory.TileOffsets.hasOwnProperty('values') == false || fileDirectory.TileOffsets.values == null)
				return false; 
		return true; 
		},	
	
	/*  parse de GeoKeyDirectory and fill geoKeys */
	parseGeoKeyDirectory: function () {
		var fileDirectory = this.fileDirectories[0];
		if (this.isGeotiff()==false)
			return ; 
		
		var hdr_num_keys= fileDirectory.GeoKeyDirectory.values[3];
		
        var geoKeyFields = [];
		for (var iKey =0 ; iKey < hdr_num_keys ; iKey++){
			/* GeoKey ID            */
			var ent_key = 	fileDirectory.GeoKeyDirectory.values[4+ iKey*4];
			/* TIFF Tag ID or 0     */
			var ent_location = 	fileDirectory.GeoKeyDirectory.values[5+ iKey*4];
			/* GeoKey value count   */
			var ent_count = 	fileDirectory.GeoKeyDirectory.values[6+ iKey*4];
			/* value or tag offset  */
			var ent_val_offset = 	fileDirectory.GeoKeyDirectory.values[7+ iKey*4];
				
			var value = 'undefined';
            if (ent_location == 0) {
				/* store value into data value */
				 value = ent_val_offset;
				//console.log("ent_val_offset =" + value );	
			}
            else if (this.getFieldTagName(ent_location) == "GeoKeyDirectory") {
				console.log("ent_key =" + this.getGeoKeyName(ent_key));
				console.log("ent_count =" + ent_count );
				console.log("ent_val_offset =" + ent_val_offset );
				console.log("GeoKeyDirectory =" );
			
			}
            else if (this.getFieldTagName(ent_location) == "GeoDoubleParams") {
			/*
				console.log("ent_key =" + this.getGeoKeyName(ent_key));
				console.log("ent_count =" + ent_count );		
				console.log("ent_val_offset =" + ent_val_offset );
				console.log("GeoDoubleParams ="  +GeoDoubleParams[ent_val_offset]);
				*/
				var GeoDoubleParams = fileDirectory.GeoDoubleParams.values;
				value = GeoDoubleParams[ent_val_offset];
				
			}
            else if (this.getFieldTagName(ent_location) == "GeoAsciiParams") {
				var str= "";
				/*console.log("ent_key =" + this.getGeoKeyName(ent_key));
				console.log("ent_count =" + ent_count );
				console.log("ent_val_offset =" + ent_val_offset );*/
				var GeoAsciiParams = fileDirectory.GeoAsciiParams.values;
				if (ent_val_offset!='undefined' && 
					ent_count!='undefined' && 
					ent_count>0 &&
                    ent_val_offset <= ent_count - 1) {
						for (var j=ent_val_offset;j<ent_count-1;j++)
							str+=GeoAsciiParams[j];
						if (GeoAsciiParams[ent_count-1] != '|')
							str+=GeoAsciiParams[ent_count-1];
					 
					}
				value=str;					
			}				
			geoKeyFields[this.getGeoKeyName(ent_key)] = {  'value': value };
		}		
			this.geoKeys=geoKeyFields ;	
			
			if (this.geoKeys.hasOwnProperty('GTRasterTypeGeoKey') == false)
				this.isPixelArea= 0;
			if (this.getRasterTypeName( this.geoKeys.GTRasterTypeGeoKey.value )=='RasterPixelIsArea')
				this.isPixelArea= 1;
			
	},
	
	/* Test */ 
	consoleTiffProperty: function () {
		console.log("--------------- Tiff property -------------------");
		// Show Image parameter
		console.log("Image : w=" + this.imageWidth + " h=" +  this.imageLength );
	  
		// DataType  UChar8 or Int16
		console.log("BitsPerPixel=" +  this.bitsPerPixel);

		// Band count : 1 or 3 bands RGB
		console.log("SamplesPerPixel=" +   this.samplesPerPixel);
		console.log("PlanarConfiruration=" + this.planarConfiguration);
		console.log("Photometric =" +  this.getPhotometricName(this.photometricInterpretation));
		console.log("Compression =" +  this.getCompressionTypeName(this.compression));
		console.log("SampleFormat : " , this.getSampleFormat());
		console.log("getSampleMinMax : " , this.getSampleMinMax());
	
		var fileDirectory = this.fileDirectories[0];
        if (this.hasStripOffset()) {
			var numoffsetValues = fileDirectory.StripOffsets.values.length;
			console.log("Has Strips nb offsetvalues count:" + numoffsetValues );
		}
			
        if (this.hasTileOffset()) {
			var  numoffsetValues = fileDirectory.TileOffsets.values.length;
			console.log("Has Tiles  offsetvalues count:" + numoffsetValues );
		}
		
	},
	
	/* Test */
	consoleGeotiffProperty: function () {
		console.log("--------------- GeoTiff property -------------------");
		var fileDirectory = this.fileDirectories[0];
		var hdr_version = fileDirectory.GeoKeyDirectory.values[0];
		var hdr_rev_major= fileDirectory.GeoKeyDirectory.values[1];
		var hdr_rev_minor = fileDirectory.GeoKeyDirectory.values[2];
		var hdr_num_keys= fileDirectory.GeoKeyDirectory.values[3];
			
		console.log("hdr_version =" + fileDirectory.GeoKeyDirectory + " " +hdr_version );
		console.log("hdr_rev_major =" + fileDirectory.GeoKeyDirectory + " " +hdr_rev_major );
		console.log("hdr_rev_minor =" + fileDirectory.GeoKeyDirectory + " " +hdr_rev_minor );
		console.log("hdr_num_keys =" + fileDirectory.GeoKeyDirectory + " " +hdr_num_keys );
		
		this.consoleCRSProperty();
		console.log("pixelSize =" + this.getPixelSize());
	},
	
	/* Test */
	consoleTestGeorefImage: function () {
	
		var x=2;
		var y=2;
		var res= this.ImageToPCS(x,y);
		if (res[0] == 1) 
			console.log(" ImageToPCS " + res[1] + " " + res[2]);
		else
			console.log(" ImageToPCS failure"  );
			
		var res2= this.PCSToImage(res[1] , res[2]);
		if (res2[0] == 1) 
			console.log(" PCSToImage " + res2[1] + " " + res2[2]);
		else
			console.log(" PCSToImage failure"  );	
	},
		
		
	/*
	 * parse Header
	 * 
	 */
	parseHeader: function (tiffArrayBuffer) {
		
		this.tiffDataView = new DataView(tiffArrayBuffer);		
		this.littleEndian = this.isLittleEndian(this.tiffDataView);

		if (!this.hasTowel(this.tiffDataView, this.littleEndian)) {
			return;
		}

		var firstIFDByteOffset = this.getBytes(4, 4);

		this.fileDirectories = this.parseFileDirectory(firstIFDByteOffset);
		var fileDirectory = this.fileDirectories[0];

		this.imageWidth = fileDirectory.ImageWidth.values[0];
		this.imageLength = fileDirectory.ImageLength.values[0];
	    this.photometricInterpretation = fileDirectory.PhotometricInterpretation.values[0];
		this.samplesPerPixel = fileDirectory.SamplesPerPixel.values[0];
		
		this.bitsPerPixel = 0;
		fileDirectory.BitsPerSample.values.forEach(function(bitsPerSample, i, bitsPerSampleValues) {
			this.sampleProperties[i] = {
				'bitsPerSample': bitsPerSample,
				'hasBytesPerSample': false,
                'bytesPerSample': undefined
			};

			if ((bitsPerSample % 8) === 0) {
				this.sampleProperties[i].hasBytesPerSample = true;
				this.sampleProperties[i].bytesPerSample = bitsPerSample / 8;
			}

			this.bitsPerPixel += bitsPerSample;
		}, this);
		
		this.compression = (fileDirectory.Compression) ? fileDirectory.Compression.values[0] : 1;
		
		if (fileDirectory.ColorMap) {
			this.colorMapValues = fileDirectory.ColorMap.values;
			this.colorMapSampleSize = Math.pow(2, this.sampleProperties[0].bitsPerSample);
		}
		
		if (fileDirectory.ExtraSamples) {
			this.extraSamplesValues = fileDirectory.ExtraSamples.values;
			this.numExtraSamples = this.extraSamplesValues.length;
		}

		
		if (fileDirectory.hasOwnProperty('PlanarConfiguration') &&true &&
			fileDirectory.PlanarConfiguration.hasOwnProperty('values') == true)
			this.planarConfiguration= fileDirectory.PlanarConfiguration.values[0]; 
		
		
		this.parseGeoKeyDirectory();
	},

	/*
	* SubFunction (should be private)
	* Decode a Strip or a Tiles 
	*/
    decodeBlock: function (stripOffset,stripByteCount,moduleDecompression) {
		var decodedBlock  = [];
		var jIncrement = 1, pixel = [] ; 
		var sampleformat  = this.getSampleFormat();
		// Decompress strip.
		switch (this.compression) {
			// Uncompressed
			case 1:
			case 5:
				var bitOffset = 0;
				var hasBytesPerPixel = false;
				if ((this.bitsPerPixel % 8) === 0) {
							hasBytesPerPixel = true;
					var bytesPerPixel = this.bitsPerPixel / 8;
				}
					
				if (hasBytesPerPixel) {
					jIncrement = bytesPerPixel;
				} else {
					jIncrement = 0;
					throw RangeError("Cannot handle sub-byte bits per pixel");
				}
				
				for (var byteOffset = 0; byteOffset < stripByteCount;  byteOffset += jIncrement) {
				
					// Loop through samples (sub-pixels).
					for (var m = 0, pixel = []; m < this.samplesPerPixel; m++) {
						if (this.sampleProperties[m].hasBytesPerSample) {
							var sampleOffset = this.sampleProperties[m].bytesPerSample * m;
							pixel.push(this.getSampleBytes(sampleformat,this.sampleProperties[m].bytesPerSample, stripOffset + byteOffset + sampleOffset));
						} else {
							var sampleInfo = this.getBits(this.sampleProperties[m].bitsPerSample, stripOffset + byteOffset, bitOffset);

							pixel.push(sampleInfo.bits);

							byteOffset = sampleInfo.byteOffset - stripOffset;
							bitOffset  = sampleInfo.bitOffset;

							throw RangeError("Cannot handle sub-byte bits per sample");
						}
					}

					decodedBlock.push(pixel);
				}
				if (this.compression == 5) // LZW
				{
					var decompressed = LZString.decompressFromUint8Array(decodedBlock);
				}
			break;
			
			// Deflate 
			// Code not yes validate 
			case 32946:
				var inflator = new moduleDecompression.Inflate();
				var bitOffset = 0;
				var hasBytesPerPixel = false;
				if ((this.bitsPerPixel % 8) === 0) {
							hasBytesPerPixel = true;
					var bytesPerPixel = this.bitsPerPixel / 8;
				}
					
				if (hasBytesPerPixel) {
					jIncrement = bytesPerPixel;
				} else {
					jIncrement = 0;

					throw RangeError("Cannot handle sub-byte bits per pixel");
				}
					
				var isLast=false;
				for (var byteOffset = 0; byteOffset < stripByteCount;  byteOffset += jIncrement) {
				
					// Loop through samples (sub-pixels).
					for (var m = 0, pixel = []; m < this.samplesPerPixel; m++) {
						if (this.sampleProperties[m].hasBytesPerSample) {
							// XXX: This is wrong!
							var sampleOffset = this.sampleProperties[m].bytesPerSample * m;

							pixel.push(this.getBytes(this.sampleProperties[m].bytesPerSample, stripOffset + byteOffset + sampleOffset));
						} else {
							var sampleInfo = this.getBits(this.sampleProperties[m].bitsPerSample, stripOffset + byteOffset, bitOffset);

							pixel.push(sampleInfo.bits);

							byteOffset = sampleInfo.byteOffset - stripOffset;
							bitOffset  = sampleInfo.bitOffset;

							throw RangeError("Cannot handle sub-byte bits per sample");
						}
					}
						
					if (byteOffset + jIncrement >= stripByteCount)
						isLast = true;
					inflator.push(pixel, isLast);
					
				}
				if (inflator.err) {
				console.log(inflator.msg);
				}

				decodedBlock.push( inflator.result);
			break; 
			
			// PackBits
			case 32773:
				var currentSample = 0;
				var sample = 0;
				var numBytes = 0;
				var getHeader = true;
				for (var byteOffset = 0; byteOffset < stripByteCount;  byteOffset += jIncrement) {
							
					// Are we ready for a new block?
					if (getHeader) {
						getHeader = false;

						var blockLength = 1;
						var iterations = 1;

						// The header byte is signed.
						var header = this.tiffDataView.getInt8(stripOffset + byteOffset, this.littleEndian);

						if ((header >= 0) && (header <= 127)) { // Normal pixels.
							blockLength = header + 1;
						} else if ((header >= -127) && (header <= -1)) { // Collapsed pixels.
							iterations = -header + 1;
						} else /*if (header === -128)*/ { // Placeholder byte?
							getHeader = true;
						}
					} else {
						var currentByte = this.getBytes(1, stripOffset + byteOffset);

						// Duplicate bytes, if necessary.
						for (var m = 0; m < iterations; m++) {
							if (this.sampleProperties[sample].hasBytesPerSample) {
								// We're reading one byte at a time, so we need to handle multi-byte samples.
								currentSample = (currentSample << (8 * numBytes)) | currentByte;
								numBytes++;

								// Is our sample complete?
								if (numBytes === this.sampleProperties[sample].bytesPerSample) {
									pixel.push(currentSample);
									currentSample = numBytes = 0;
									sample++;
								}
							} else {
								throw RangeError("Cannot handle sub-byte bits per sample");
							}

							// Is our pixel complete?
                            if (sample === this.samplesPerPixel) {
								decodedBlock.push(pixel);

								pixel = [];
								sample = 0;
							}
						}

						blockLength--;

						// Is our block complete?
						if (blockLength === 0) {
							getHeader = true;
						}
					}

					jIncrement = 1;
				}
			break;

			// Unknown compression algorithm
			default:
				throw Error("Do not attempt to parse the data Compression not handled  : " + this.getCompressionTypeName(this.compression));
				// Do not attempt to parse the image data.
			break;
		}
					
		var blockInfo = {
			'offset': stripOffset,
            'value': decodedBlock
		};
		return blockInfo;		
	},

	
	/* use requireJS to get the decompressionModule
	*
	*/
	getDecompressionModule: function (stripOffset,stripByteCount,moduleDecompression) {
		var moduleDecompression = undefined;
		// utiliser requirejs pour charger les modules de décompression 
        if (this.compression == 32946) {
			define(function (require) {
                moduleDecompression = require('pako_inflate');
            });
			//moduleDecompression= require('pako_inflate');
		}
		return moduleDecompression;
	},
	
	/**
	 * Load Pixels 
	 */
	loadPixels: function () {
		var FullPixelValues=[];
		var index = 0;
		for (var j=0;j<this.imageLength;j++)
            for (var i = 0; i < this.imageWidth; i++) {
				var pixelValue = this.getPixelValueOnDemand(i,j);
                for (var k = 0; k < this.samplesPerPixel; k++) {
					FullPixelValues[index] = pixelValue[k];
					index++;
				}
			}
		return FullPixelValues;
	},
	
	/* getRGBAPixelValue
	*  This function is the default one , you shoul use this function in order to draw the image into a canvas
	*  If you have a multiband image , you should define how to combine bands in order to obtain a RGBA value
	*/
	getRGBAPixelValue: function(pixelSamples) {
		var red = 0;
		var green = 0;
		var blue = 0;
		var opacity = 1.0;

		// To Understand this portion of code from Tiff-JS
		if (this.numExtraSamples > 0) {
			for (var k = 0; k < this.numExtraSamples; k++) {
				if (this.extraSamplesValues[k] === 1 || this.extraSamplesValues[k] === 2) {
					// Clamp opacity to the range [0,1].
					opacity = pixelSamples[3 + k] / 256;

					break;
				}
			}
		}
		//-------------------------------------------
		var aRGBAPixelValue = [];
		switch (this.photometricInterpretation) {
			// Bilevel or Grayscale
			// WhiteIsZero
			case 0:
				if (this.sampleProperties[0].hasBytesPerSample) {
					var invertValue = Math.pow(0x10, this.sampleProperties[0].bytesPerSample * 2);
				}

				// Invert samples.
                pixelSamples.forEach(function (sample, index, samples) {
                    samples[index] = invertValue - sample;
                });

			// Bilevel or Grayscale
			// BlackIsZero
			case 1:
				red = green = blue = this.clampColorSample(pixelSamples[0], this.sampleProperties[0].bitsPerSample);
			break;

			// RGB Full Color
			case 2:
				if (this.samplesPerPixel==1)
					red = green = blue = this.clampColorSample(pixelSamples[0], this.sampleProperties[0].bitsPerSample);
                else if (this.samplesPerPixel > 2) {
					red = this.clampColorSample(pixelSamples[0], this.sampleProperties[0].bitsPerSample);
					green = this.clampColorSample(pixelSamples[1], this.sampleProperties[1].bitsPerSample);
					blue = this.clampColorSample(pixelSamples[2], this.sampleProperties[2].bitsPerSample);
				}
				// Assuming 4 => RGBA 
                if (this.samplesPerPixel == 4) {
				// Check this function A should be a value between 0->1 ? then devide pixelSamples[3]/this.sampleProperties[3].bitsPerSample
					var maxValue = Math.pow(2, this.sampleProperties[0].bitsPerSample);
					opacity = pixelSamples[3] / maxValue;
				}
			break;

			// RGB Color Palette
			case 3:
				if (this.colorMapValues === undefined) {
					throw Error("Palette image missing color map");
				}

				var colorMapIndex = pixelSamples[0];

				red    = this.clampColorSample(this.colorMapValues[colorMapIndex], 16);
				green = this.clampColorSample(this.colorMapValues[this.colorMapSampleSize + colorMapIndex], 16);
				blue = this.clampColorSample(this.colorMapValues[(2 * this.colorMapSampleSize) + colorMapIndex], 16);
			
			break;

			
			// Unknown Photometric Interpretation
			default:
				throw RangeError( ' Photometric Interpretation Not Yet Implemented::', getPhotometricName(this.photometricInterpretation) );
			break;
		}
		aRGBAPixelValue = [red,green,blue,opacity];
		return aRGBAPixelValue;
	},
	
	/* getRGBAPixelValue
	*  This function is the default one , you shoul use this function in order to draw the image into a canvas
	*  If you have a multiband image , you should define how to combine bands in order to obtain a RGBA value
	*/
	getMinMaxPixelValue: function(pixelSamples,vmin,vmax) {
		var red = 0;
		var green = 0;
		var blue = 0;
		var opacity = 1.0;

		// To Understand this portion of code from Tiff-JS
		if (this.numExtraSamples > 0) {
			for (var k = 0; k < this.numExtraSamples; k++) {
				if (this.extraSamplesValues[k] === 1 || this.extraSamplesValues[k] === 2) {
					// Clamp opacity to the range [0,1].
					opacity = pixelSamples[3 + k] / 256;

					break;
				}
			}
		}
		//-------------------------------------------
		var aRGBAPixelValue = [];
		switch (this.photometricInterpretation) {
			// Bilevel or Grayscale
			// WhiteIsZero
			case 0:
				if (this.sampleProperties[0].hasBytesPerSample) {
					var invertValue = Math.pow(0x10, this.sampleProperties[0].bytesPerSample * 2);
				}

				// Invert samples.
                pixelSamples.forEach(function (sample, index, samples) {
                    samples[index] = invertValue - sample;
                });

			// Bilevel or Grayscale
			// BlackIsZero
			case 1:
				red = green = blue = this.clampAffineColorSample(pixelSamples[0], this.sampleProperties[0].bitsPerSample,vmin,vmax);
			break;

			// RGB Full Color
			case 2:
				if (this.samplesPerPixel==1)
					red = green = blue = this.clampAffineColorSample(pixelSamples[0], this.sampleProperties[0].bitsPerSample,vmin,vmax);
                else if (this.samplesPerPixel > 2) {
					red = this.clampAffineColorSample(pixelSamples[0], this.sampleProperties[0].bitsPerSample,vmin,vmax);
					green = this.clampAffineColorSample(pixelSamples[1], this.sampleProperties[1].bitsPerSample,vmin,vmax);
					blue = this.clampAffineColorSample(pixelSamples[2], this.sampleProperties[2].bitsPerSample,vmin,vmax);
				}
				// Assuming 4 => RGBA 
                if (this.samplesPerPixel == 4) {
				// Check this function A should be a value between 0->1 ? then devide pixelSamples[3]/this.sampleProperties[3].bitsPerSample
					var maxValue = Math.pow(2, this.sampleProperties[0].bitsPerSample);
					opacity = pixelSamples[3] / maxValue;
				}
			break;

			// RGB Color Palette
			case 3:
				if (this.colorMapValues === undefined) {
					throw Error("Palette image missing color map");
				}

				var colorMapIndex = pixelSamples[0];

				red    = this.clampAffineColorSample(this.colorMapValues[colorMapIndex], 16,vmin,vmax);
				green = this.clampAffineColorSample(this.colorMapValues[this.colorMapSampleSize + colorMapIndex], 16,vmin,vmax);
				blue = this.clampAffineColorSample(this.colorMapValues[(2 * this.colorMapSampleSize) + colorMapIndex], 16,vmin,vmax);
			
			break;

			
			// Unknown Photometric Interpretation
			default:
				throw RangeError( ' Photometric Interpretation Not Yet Implemented::', getPhotometricName(this.photometricInterpretation) );
			break;
		}
		aRGBAPixelValue = [red,green,blue,opacity];
		return aRGBAPixelValue;
	},
	 
	 /* Test getPixelValueOnDemand
	*  start implementation : 
	*  1 -  check if the block is loaded  if not load the block
	*  2 - get the pixel value in the block
	*/
	getClosestPixelValue: function(x,y) {
		x= Math.floor(x);
		y= Math.floor(y);
		
		var fileDirectory = this.fileDirectories[0];
		var blockToLoad = 0;
		var offsetValues = [];
		var numoffsetValues =0;
		var blockByteCountValues = [];
		var rowsPerStrip  = 0;
		var decompressionModule = this.getDecompressionModule();
		var xInBlock=x;
		var yInBlock=y;
		var blockWidth = 0 ;
		var blockInfo = [] ;
        if (this.hasStripOffset()) {
			// If RowsPerStrip is missing, the whole image is in one strip.
			if (fileDirectory.RowsPerStrip) {
				 rowsPerStrip = fileDirectory.RowsPerStrip.values[0];
				  blockToLoad = Math.floor(y / rowsPerStrip) ;
			} else {
				 rowsPerStrip = this.imageLength;
			}
			offsetValues = fileDirectory.StripOffsets.values;
			blockWidth = this.imageWidth;
			
			var idBlocks = this.isBlockLoaded( offsetValues[blockToLoad]);
            if (idBlocks == -1) {
				 // StripByteCounts is supposed to be required, but see if we can recover anyway.
				if (fileDirectory.StripByteCounts) {
					 blockByteCountValues = fileDirectory.StripByteCounts.values;
				} else {
					console.log("Missing StripByteCounts!");
					// Infer StripByteCounts, if possible.
					if (numoffsetValues === 1) {
						blockByteCountValues = [Math.ceil((this.imageWidth * this.imageLength * bitsPerPixel) / 8)];
						} else {
						throw Error("Cannot recover from missing StripByteCounts");
					}
				}
				blockInfo = this.decodeBlock(offsetValues[blockToLoad], blockByteCountValues[blockToLoad],decompressionModule);
				this.addBlock(blockToLoad,blockInfo );	
				//console.log("Load block " , blockToLoad);
			 }
            else {
				//console.log("Block is already load" , blockToLoad, idBlocks );
				blockInfo = this.blocks[idBlocks];
			 }
			 yInBlock= y %rowsPerStrip ; 
		}
        else if (this.hasTileOffset()) {
			 offsetValues = fileDirectory.TileOffsets.values;
			 var tileLength = fileDirectory.TileLength.values[0];
			 var tileWidth = fileDirectory.TileWidth.values[0];
			 var iTile= Math.floor(x/tileWidth);
			 var jTile= Math.floor(y/tileLength);
			 var TilesAcross = Math.ceil(this.imageWidth  / tileWidth);
			 blockToLoad = jTile * TilesAcross + iTile;
			 blockWidth = tileWidth;
			 
			 var idBlocks = this.isBlockLoaded( offsetValues[blockToLoad]);
            if (idBlocks == -1) {
				blockByteCountValues = fileDirectory.TileByteCounts.values;
				blockInfo = this.decodeBlock(offsetValues[blockToLoad], blockByteCountValues[blockToLoad],decompressionModule);
				this.addBlock(blockToLoad,blockInfo );	
				//console.log("Load block " , blockToLoad);
			 }
            else {
				//console.log("Block is already load" , blockToLoad, idBlocks );
				blockInfo = this.blocks[idBlocks];
			 }
			 xInBlock= x %tileWidth ; 
			 yInBlock= y %tileLength ; 
		}
		var indice = yInBlock*blockWidth+xInBlock;
		return blockInfo.value[indice];
	},
	
	/* Test getPixelValueOnDemand
	*  start implementation : 
	*  1 -  check if the block is loaded  if not load the block
	*  2 - get the pixel value in the block
	*/
	getPixelValueOnDemand: function(x,y) {
		if(this.planarConfiguration!=1)
			throw("Other Planar Configuration is not yet implemented"); 
	
   	
		if (this.isPixelArea)
		{
			return this.getClosestPixelValue(x,y);
		}
		
		/* Calcul de l'interpolation 
		var ix= Math.floor(x);
		var iy= Math.floor(y);
		var  a1 = this.getPixelValueOnDemand(ix, iy);
        var  a2 = this.getPixelValueOnDemand(ix + 1, iy);
        var  a3 = this.getPixelValueOnDemand(ix + 1, iy + 1);
        var  a4 = this.getPixelValueOnDemand(ix, iy + 1);
	    // Avant d'inerpoler  : vérifier si on a les même valeurs 
	
		// puis calculer l'interpolation en tre 4 val (formule ?) 
		*/
		
		// retourne la valeur du pixel le plus proche 
		var ix= Math.floor(x+0.5);
		var iy= Math.floor(y+0.5);
		return this.getClosestPixelValue(ix, iy);
        
		
	},
	
	/** get the CRS code */
	getCRSCode: function() {
		var CRSCode = 0;
		if (this.geoKeys.hasOwnProperty('GTModelTypeGeoKey') == false)
			return 0; 
		if (this.getModelTypeName( this.geoKeys.GTModelTypeGeoKey.value )=='ModelTypeGeographic' 
		 && this.geoKeys.hasOwnProperty('GeographicTypeGeoKey'))
			CRSCode =this.geoKeys['GeographicTypeGeoKey'].value ;
		
		else if (this.getModelTypeName( this.geoKeys.GTModelTypeGeoKey.value )=='ModelTypeProjected'  &&
				 this.geoKeys.hasOwnProperty('ProjectedCSTypeGeoKey'))
			CRSCode =this.geoKeys['ProjectedCSTypeGeoKey'].value ;
        else if (this.getModelTypeName(this.geoKeys.GTModelTypeGeoKey.value) == 'user-defined') {
			if (this.geoKeys.hasOwnProperty('ProjectedCSTypeGeoKey'))
                CRSCode = this.geoKeys['ProjectedCSTypeGeoKey'].value;
            else if (this.geoKeys.hasOwnProperty('GeographicTypeGeoKey'))
					CRSCode =this.geoKeys['GeographicTypeGeoKey'].value ;
				else	
					// Littel Hack for 3857
					if (this.geoKeys.hasOwnProperty('GTCitationGeoKey') && 
					this.geoKeys['GTCitationGeoKey'].value.search("WGS_1984_Web_Mercator_Auxiliary_Sphere")!=-1)
					CRSCode = 3857;
				else
					this.consoleCRSProperty();
		
		}
		return CRSCode;
	},
	
	/** get the CRS code */
	consoleCRSProperty: function() {
			//GeoTIFF Configuration GeoKeys
			var Configuration_GeoKeys = [1024,1026];
			// Geographic CS Parameter GeoKeys
			var GeographicCS_GeoKeys = [2048,2061];
			// Projected CS Parameter GeoKeys
			var ProjectedCS_GeoKeys = [3072,3073];
			//Projection Definition GeoKeys
			var Projection_GeoKeys = [3074,3094];
			//Vertical CS Parameter Keys
			var Vertical_GeoKeys = [4096,4099];
			this.test_consoleGeoKeys("GeoTIFF Configuration GeoKeys",Configuration_GeoKeys);
			this.test_consoleGeoKeys("Geographic CS Parameter GeoKeys",GeographicCS_GeoKeys);
			this.test_consoleGeoKeys("Projected CS Parameter GeoKeys",ProjectedCS_GeoKeys);
			this.test_consoleGeoKeys("Projection Definition GeoKeys",Projection_GeoKeys);
			this.test_consoleGeoKeys("Vertical CS Parameter Keys",Vertical_GeoKeys);
	},
	
	/** show consoleGeokey  */
	test_consoleGeoKeys: function(Label,GeoKeyTab) {
		console.log(Label);
        for (var i = GeoKeyTab[0]; i <= GeoKeyTab[1]; i++) {
				var geoKeyName = this.getGeoKeyName( i );
				if (this.geoKeys.hasOwnProperty(geoKeyName))
					console.log(geoKeyName + " " + this.geoKeys[geoKeyName].value );
			}
	},
	
	/** isPixelArea */
	isPixelArea: function() {
		if (this.geoKeys.hasOwnProperty('GTRasterTypeGeoKey') == false)
			return true; // default 
		if (this.getRasterTypeName( this.geoKeys.GTRasterTypeGeoKey.value )=='RasterPixelIsArea')
			return true; 
		
		return false;
	},

	/**
	 * Get the pixel value 
	 * Ex : var pixels = parse.parseTIFF(response);
	 *      var pixel = parse.getPixelValue(pixels,i,j);
	 */		
	getPixelValue: function(buffer,x,y) {
        if (this.getPlanarConfiguration() != 1) {
	 		throw("Other Planar Configuration is not yet implemented"); 
        }
	
        var value = [];
        if (x < 0 || x >= this.imageWidth || y < 0 || y >= this.imageLength) {
		return value;
        }

	var indice = this.samplesPerPixel*(y*this.imageWidth+x);
        for (var i = 0; i < this.samplesPerPixel; i++) {
			//console.log(x,y,this.samplesPerPixel,i,buffer[indice+i] ) ;
            value[i] = buffer[indice + i]; // don't use array.push in big loops
		 }
	return value;
    },

    getLowResPixelValue: function (buffer, x, y) {
        if (this.getPlanarConfiguration() != 1) {
            throw("Other Planar Configuration is not yet implemented");
        }

        var value = [];
        if (x < 0 || x >= this.imageWidth || y < 0 || y >= this.imageLength) {
            return value;
        }

        var indice1 = this.samplesPerPixel * (y * this.imageWidth + x);
        var offsetX = (x < this.imageWidth ? x + 1 : x);
        var indice2 = this.samplesPerPixel * (y * this.imageWidth + offsetX );
        var indice3 = this.samplesPerPixel * (y * this.imageWidth + x);
        var indice4 = this.samplesPerPixel * ((y < this.imageLength ? y + 1 : y) * this.imageWidth + offsetX);
        for (var i = 0; i < this.samplesPerPixel; i++) {
            var averageValue = (buffer[indice1+i] +  buffer[indice2+i] +  buffer[indice3+i]+  buffer[indice4+i]) / 4;
            value[i] = Math.round(averageValue);
        }
        return value;
    },

	/**
	 * This function display the tiff into a canvas 
	 */		

	toCanvas: function (canvas, xmin,ymin, xmax, ymax,vmin,vmax) {
		var mycanvas = canvas || document.createElement('canvas');

        if (mycanvas.getContext == null) {
			throw RangeError("No Context for canvas");
		}
		
		var ctx = mycanvas.getContext("2d");
		mycanvas.width = xmax-xmin;
		mycanvas.height = ymax-xmin;
		var pixrgba= [];
		// Set a default fill style.	
		ctx.fillStyle = this.makeRGBAFillValue(255, 255, 255, 0);
        for (var y = ymin; y < ymax; y++) {
            for (var x = xmin; x < xmax; x++) {
				var pixSample = this.getPixelValueOnDemand(x,y);
                if (pixSample != 'undefined') {
					if (vmin!='undefined' && vmax!='undefined')
						pixrgba= this.getMinMaxPixelValue(pixSample,vmin,vmax);
					else
						pixrgba= this.getRGBAPixelValue(pixSample);
				}
				else
					pixrgba = [255,0,0,1];
				ctx.fillStyle = this.makeRGBAFillValue(pixrgba[0], pixrgba[1],pixrgba[2],pixrgba[3]);
				//ctx.fillStyle = this.makeRGBAFillValue(0, 0,248,1);
				ctx.fillRect(x-xmin, y-ymin, 1, 1);
			}
		}
		return mycanvas;
	},

	/** Compute or retreive a PixelScale / Resolution or CellSize */
    getPixelSize: function () {
		 var pixel_scale = ['undefined','undefined'];
		 var fileDirectory = this.fileDirectories[0];
		 if (typeof(fileDirectory.ModelPixelScale) != 'undefined' && fileDirectory.ModelPixelScale != null &&
			typeof(fileDirectory.ModelPixelScale.values) != 'undefined' && fileDirectory.ModelPixelScale.values != null)
				return fileDirectory.ModelPixelScale.values;
	
		var p0=this.ImageToPCS(0,0);
		var p1=this.ImageToPCS(1,0);
		var p2=this.ImageToPCS(0,1);
		if (p0[0]==0 || p1[0]==0 || p2[0]==0)
		return pixel_scale;
		
		var c_pixel_scale = [p1[1]-p0[1],p2[2]-p0[2]];
		return c_pixel_scale;
	},
	
/**
 * See GeoTiff geo_trans.c
 */	
	GTIFTiepointTranslate : function( gcp_count, x, y , directTransfo) { 
    var fileDirectory = this.fileDirectories[0];
    var modelTiepoint = fileDirectory.ModelTiepoint.values;
    /* I would appreciate a _brief_ block of code for doing second order
       polynomial regression here! */
    return [0 , x , y];
    },
	
	/**
	* return a BBox of the Image
	*/
	GetBBox: function( ) {
		var pCRS = this.getCRSCode();
		
		var ul=  this.ImageToPCS(0,0);
		var ur=  this.ImageToPCS(this.imageWidth,0);
		var ll=  this.ImageToPCS(0,this.imageLength);
		var lr=  this.ImageToPCS(this.imageWidth,this.imageLength);
        if (ul[0] != 1 || ur[0] != 1 || ll[0] != 1 || lr[0] != 1) {
			throw TypeError("BBox error");
		}
		
        // Create the BBox structure
        // Coord a counterclockWise
		var  lcoordinates=[];
		lcoordinates.push(ul.splice(1,2));
        lcoordinates.push(ll.splice(1, 2));
        lcoordinates.push(lr.splice(1, 2));
		lcoordinates.push(ur.splice(1,2));
		
		var projstring ='EPSG:' + pCRS.toString();
		var bbox = {
			'WKID': pCRS.toString(),
			'EPSG': projstring,
			'coord': lcoordinates,
			'ulidx': 0,
			'llidx': 1,
			'lridx': 2,
			'uridx': 3
		};
		return bbox;
	},

/**
 * Translate a pixel/line coordinates to projection coordinate .
 * See GeoTiff geo_trans.c
 */
	ImageToPCS: function( x, y ) {

    var     res = [0 , x , y];
    var     tiepoint_count, count, transform_count;
   
	var fileDirectory = this.fileDirectories[0];
	if (typeof(fileDirectory.ModelTiepoint) == 'undefined' || fileDirectory.ModelTiepoint == null ||
	    typeof(fileDirectory.ModelTiepoint.values) == 'undefined' || fileDirectory.ModelTiepoint.values == null)
	  tiepoint_count = 0;
        else {
	  
		var modelTiepoint = fileDirectory.ModelTiepoint.values;
		tiepoint_count= modelTiepoint.length;
	  }
	  
	if (typeof(fileDirectory.ModelPixelScale) == 'undefined' || fileDirectory.ModelPixelScale == null ||
	    typeof(fileDirectory.ModelPixelScale.values) == 'undefined' || fileDirectory.ModelPixelScale.values == null)
 	 count = 0;
        else {
	  var modelPixelScale = fileDirectory.ModelPixelScale.values;
	  count= modelPixelScale.length;
	  }
	 
	if (typeof(fileDirectory.ModelTransformation) == 'undefined' || fileDirectory.ModelTransformation == null||
	    typeof(fileDirectory.ModelTransformation.values) == 'undefined' || fileDirectory.ModelTransformation.values == null)
		transform_count = 0;
        else {
	  var modelTransformation = fileDirectory.ModelTransformation.values;
	  transform_count= modelTransformation.length;
	  }
   
	//--------------------------------------------------------------------
	//If the pixelscale count is zero, but we have tiepoints use      
	//the tiepoint based approach.                                    
	//--------------------------------------------------------------------
        if (tiepoint_count > 6 && count == 0) {
		console.log(" tiepoint_count " , tiepoint_count);
	
        res = this.GTIFTiepointTranslate( tiepoint_count / 6, x, y ,true);
    }

	//--------------------------------------------------------------------
	//If we have a transformation matrix, use it. 			
	//--------------------------------------------------------------------
        else if (transform_count == 16) {
		var transform = fileDirectory.ModelTransformation.values;
	
        var x_in = x;
		var y_in = y;

        x = x_in * transform[0] + y_in * transform[1] + transform[3];
        y = x_in * transform[4] + y_in * transform[5] + transform[7];
        
        res = [1 , x , y];
    } 

	//--------------------------------------------------------------------
	//For now we require one tie point, and a valid pixel scale.      
	//-------------------------------------------------------------------- 
        else if (count < 3 || tiepoint_count < 6) {
        res = [0 , x , y];
    } 

        else {
        var pixel_scale = fileDirectory.ModelPixelScale.values;
		var tiepoints = fileDirectory.ModelTiepoint.values;
		x = (x - tiepoints[0]) * pixel_scale[0] + tiepoints[3];
        y = (y - tiepoints[1]) * (-1 * pixel_scale[1]) + tiepoints[4];

        res = [1 , x, y ];
    }
    return res;
	},
	
 /**
 * Inverse GeoTransfom
 * See GeoTiff geo_trans.c
 */
	inv_geotransform: function( gt_in ) {
	var     gt_out = [0 , 0 , 0, 0 , 0 , 0];
	var	det, inv_det;

    /* we assume a 3rd row that is [0 0 1] */

    /* Compute determinate */

    det = gt_in[0] * gt_in[4] - gt_in[1] * gt_in[3];

    if( Math.abs(det) < 0.000000000000001 )
        return [0 , gt_out];

    inv_det = 1.0 / det;

    /* compute adjoint, and devide by determinate */

    gt_out[0] =  gt_in[4] * inv_det;
    gt_out[3] = -gt_in[3] * inv_det;

    gt_out[1] = -gt_in[1] * inv_det;
    gt_out[4] =  gt_in[0] * inv_det;

    gt_out[2] = ( gt_in[1] * gt_in[5] - gt_in[2] * gt_in[4]) * inv_det;
    gt_out[5] = (-gt_in[0] * gt_in[5] + gt_in[2] * gt_in[3]) * inv_det;

    return [1 ,gt_out];
    },

/**
 * Translate a projection coordinate to pixel/line coordinates.
 * See GeoTiff geo_trans.c
 */

  PCSToImage: function( x, y ) {
    var     res = [0 , x , y];
    var 	tiepoint_count, count, transform_count = 0;
   
// -------------------------------------------------------------------- 
//      Fetch tiepoints and pixel scale.                                
// -------------------------------------------------------------------- 
    var fileDirectory = this.fileDirectories[0];
	if (typeof(fileDirectory.ModelTiepoint) == 'undefined' || fileDirectory.ModelTiepoint == null ||
	    typeof(fileDirectory.ModelTiepoint.values) == 'undefined' || fileDirectory.ModelTiepoint.values == null)
	  tiepoint_count = 0;
        else {
	  
		var modelTiepoint = fileDirectory.ModelTiepoint.values;
		tiepoint_count= modelTiepoint.length;
	  }
	  
	if (typeof(fileDirectory.ModelPixelScale) == 'undefined' || fileDirectory.ModelPixelScale == null ||
	    typeof(fileDirectory.ModelPixelScale.values) == 'undefined' || fileDirectory.ModelPixelScale.values == null)
 	 count = 0;
        else {
	  var modelPixelScale = fileDirectory.ModelPixelScale.values;
	  count= modelPixelScale.length;
	  }
	 
	if (typeof(fileDirectory.ModelTransformation) == 'undefined' || fileDirectory.ModelTransformation == null||
	    typeof(fileDirectory.ModelTransformation.values) == 'undefined' || fileDirectory.ModelTransformation.values == null)
		transform_count = 0;
        else {
	  var modelTransformation = fileDirectory.ModelTransformation.values;
	  transform_count= modelTransformation.length;
	  }
// -------------------------------------------------------------------- 
//      If the pixelscale count is zero, but we have tiepoints use      
//      the tiepoint based approach.                                    
// -------------------------------------------------------------------- 
        if (tiepoint_count > 6 && count == 0) {
       res = this.GTIFTiepointTranslate( tiepoint_count / 6, x, y , false);
    }

// -------------------------------------------------------------------- 
//      Handle matrix - convert to "geotransform" format, invert and    
//      apply.                                                          
// -------------------------------------------------------------------- 
        else if (transform_count == 16) {
		var transform = fileDirectory.ModelTransformation.values;
	
        var x_in = x;
		var y_in = y;

        var	gt_in = [0,0,0,0,0,0];
        
        gt_in[0] = transform[0];
        gt_in[1] = transform[1];
        gt_in[2] = transform[3];
        gt_in[3] = transform[4];
        gt_in[4] = transform[5];
        gt_in[5] = transform[7];

		var result = this.inv_geotransform( gt_in );
		
        if( !result[0])
            res = [0 , x , y];
            else {
			var gt_out=result[1];
            x = x_in * gt_out[0] + y_in * gt_out[1] + gt_out[2];
            y = x_in * gt_out[3] + y_in * gt_out[4] + gt_out[5];
            
            res = [1 , x , y];
        }
    }

// -------------------------------------------------------------------- 
//      For now we require one tie point, and a valid pixel scale.      
// -------------------------------------------------------------------- 
        else if (count >= 3 && tiepoint_count >= 6) {
        var pixel_scale = fileDirectory.ModelPixelScale.values;
		var tiepoints = fileDirectory.ModelTiepoint.values;
		x = (x - tiepoints[3]) / pixel_scale[0] + tiepoints[0];
        y = (y - tiepoints[4]) / (-1 * pixel_scale[1]) + tiepoints[1];

        res = [1 , x , y];
    }

    return res;
}
};
