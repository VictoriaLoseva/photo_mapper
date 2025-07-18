// import Map from 'ol/Map.js';
// import View from 'ol/View.js';
// import OSM from 'ol/source/OSM.js';
// import TileLayer from 'ol/layer/Tile.js';


//Create vectorLayer for showing the photo positions


function selectPhotosByTimeRange(timeRangeStart, timeRangeEnd) {
    markerVectorSource = new ol.source.Vector();
    for (const index in photo_data) {
        photo = photo_data[index]

        const marker = new ol.Feature({
            geometry: new ol.geom.Point(ol.proj.fromLonLat([photo.coords[0], photo.coords[1]])),
            time: new Date(photo.time),
            path: photo.path,
            width: photo.width,
            length: photo.length

        });

        markerVectorSource.addFeature(marker);
    }
    return markerVectorSource;

}

const markerLayer = new ol.layer.Vector({
    source: selectPhotosByTimeRange(0,0),
    style: new ol.style.Style({
        image: new ol.style.Circle({
            radius: 8,
            fill: new ol.style.Fill({
                color: '#ff4444'
            }),
            stroke: new ol.style.Stroke({
                color: '#ffffff',
                width: 2
            })
        })
    })
});


//Create the popup element
const photo_popup_inner = document.createElement('div');
photo_popup_inner.id = 'photo_popup_inner';

const popup_overlay = new ol.Overlay({
    element: photo_popup_inner,
    positioning: 'bottom-center',
    autoPan: true,
    autoPanAnimation: {
        duration: 250
    },
    style: new ol.style.Style({})
});

//create map 
mapLayer = new ol.layer.Tile({
                source: new ol.source.XYZ({
                url: 'https://{a-c}.tile.opentopomap.org/{z}/{x}/{y}.png',
                attributions: '© OpenTopoMap (CC-BY-SA)'
            })
        });

//Combine everything into a map element centered on tahoe
var map = new ol.Map({
    target: 'map',
    layers: [
        mapLayer,
        markerLayer
    ],
    view: new ol.View({
        center: ol.proj.fromLonLat([-120.0324,39.0968]),
        zoom: 10
    }),
    overlays: [popup_overlay]
});


//Add on-click handler 
map.on('click', function(event) {
    const feature = map.forEachFeatureAtPixel(event.pixel, function(feature) {
        return feature;
    });
    if (feature) {
        aspect_ratio = feature.get('width') / feature.get('length');
        console.log(aspect_ratio)
        photo_popup_inner.innerHTML = `
            <img src="${feature.get('path')}" width=${200 * aspect_ratio} margin="auto">
            `;
        photo_popup_inner.style.display = 'block';
        popup_overlay.setPosition(event.coordinate);

        // markerVectorSource.addFeature(new ol.Feature({geometry: new ol.geom.Point(ol.proj.fromLonLat([-120.0324,39.0968]))}));
    }
    else {
        photo_popup_inner.style.display = 'None'
    }
        
});