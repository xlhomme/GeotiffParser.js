

	var map = 'undefined'; 
	function loadMap()
	{
		map = new ol.Map({
        layers: [
          new ol.layer.Tile({
            source: new ol.source.OSM()
          })
        ],
        target: 'map',
        view: new ol.View({
          center: ol.proj.transform([0, 30], 'EPSG:4326', 'EPSG:3857'),
          zoom: 3
        })
      });
		
	}
	