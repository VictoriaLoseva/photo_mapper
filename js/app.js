


//Create vectorLayer for showing the photo positions
function selectPhotosByTimeRange(timeRangeStart, timeRangeEnd) {
    markerVectorSource = new ol.source.Vector();

    selected = photo_data.filter(photo => photo.datetime > timeRangeStart && photo.datetime < timeRangeEnd);

    for (const index in selected) {
        photo = selected[index];
        photoTime = new Date(photo.datetime);
        const marker = new ol.Feature({
            geometry: new ol.geom.Point(ol.proj.fromLonLat([photo.coords[0], photo.coords[1]])),
            time: photo.datetime,
            path: photo.path,
            width: photo.width,
            length: photo.length
        });
        markerVectorSource.addFeature(marker);
    }
    return markerVectorSource;
}

function createMarkerLayer (timeRangeStart, timeRangeEnd) {
    return new ol.layer.Vector({
    source: selectPhotosByTimeRange(timeRangeStart, timeRangeEnd),
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
}

const firstDay = photo_data[0].datetime;
const lastDay = photo_data[photo_data.length-1].datetime;

var markerLayer = createMarkerLayer(firstDay, lastDay);


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
     view: new ol.View(),
    overlays: [popup_overlay]
});

map.getView().fit(markerLayer.getSource().getExtent(), {maxZoom: 10, duration:1000});

//Add on-click handler 
map.on('click', function(event) {
    const feature = map.forEachFeatureAtPixel(event.pixel, function(feature) {
        return feature;
    });
    if (feature) {
        aspect_ratio = feature.get('width') / feature.get('length');
        photo_popup_inner.innerHTML = `
            <img src="${feature.get('path')}" width=${200 * aspect_ratio} margin="auto">
            `;
        photo_popup_inner.style.display = 'block';
        popup_overlay.setPosition(event.coordinate);
    }
    else {
        photo_popup_inner.style.display = 'None'
    }
        
});

//Make the timeline buttons
const uniqueDates = [...new Set(photo_data.map(photo => new Date(photo.datetime).setHours(0,0,0)))];
uniqueDates.slice(0, uniqueDates.length)

function handleDaySelection(clickedButton, selectedDate) { 
    if (selectedDate == "Clear") {
        selectedDate = firstDay;
        selectedDateEnd = lastDay;
    }
    else {
        selectedDateEnd = new Date(selectedDate);
        selectedDateEnd.setDate(selectedDate.getDate() + 1);
    }
    console.log(selectedDate, selectedDateEnd)
    const selectedPhotos = createMarkerLayer(selectedDate, selectedDateEnd); 
    map.removeLayer(markerLayer)
    markerLayer = selectedPhotos;
    map.addLayer(markerLayer)
    map.getView().fit(markerLayer.getSource().getExtent(), {maxZoom: 12.5, duration:500, padding: [10,10,10,10]})

}

uniqueDates.forEach((date, index) => {
    const button = document.createElement('button');
    date = new Date(date);
    button.className = 'button-80';
    button.textContent = `Day ${index + 1}`;    
    button.addEventListener('click', function() {
        handleDaySelection(button, date);
    });
    document.getElementById("timeline").appendChild(button);
})

const clear_button = document.createElement('button');
clear_button.className = 'button-80';
clear_button.textContent = "Clear";
clear_button.addEventListener('click', function() {
    handleDaySelection(clear_button, "Clear");
});
document.getElementById("timeline").appendChild(clear_button);