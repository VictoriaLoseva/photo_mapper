
var map; 
var markerLayer; 


directoryInput = document.getElementById("directoryInput");



directoryInput.addEventListener('change', async function(event) {
    if(map instanceof ol.Map) {map.removeLayer(markerLayer)}
    photo_data = await processFiles(event.target.files);
    photo_data.sort((photoA, photoB) => photoA.datetime - photoB.datetime);

    if(map instanceof ol.Map) {
        console.log("not first map")
        markerLayer = createMarkerLayer(photo_data[0].datetime, photo_data[photo_data.length - 1].datetime);
        map.addLayer(markerLayer);
        map.getView().fit(markerLayer.getSource().getExtent(), {maxZoom: 10, duration:1000});
        document.getElementById("timeline").innerHTML = ""
        makeTimeline();

    }
    else {
        console.log("first map")
        markerLayer = createMarkerLayer(photo_data[0].datetime, photo_data[photo_data.length - 1].datetime);
        console.log("made", markerLayer.getSource().getFeatures().length, "markers");
        map = createMap();
        makeTimeline();
       
    }
   
})


function createMap() {
    //get tiles for map layer
    mapLayer = new ol.layer.Tile({
                    source: new ol.source.XYZ({
                    url: 'https://{a-c}.tile.opentopomap.org/{z}/{x}/{y}.png',
                    attributions: '© OpenTopoMap (CC-BY-SA)'
                })
            });
    markerLayer = createMarkerLayer(photo_data[0].datetime, photo_data[photo_data.length - 1].datetime);

    //Create the popup element
    photo_popup_inner = document.createElement('div');
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

    //Combine into a map
    map = new ol.Map({
        target: 'map',
        layers: [
            mapLayer,
            markerLayer
        ],
        view: new ol.View({center: [0,0], zoom: 1}),
        overlays: [popup_overlay]
    });

    console.log(markerLayer.getSource().getExtent())
    map.getView().fit(markerLayer.getSource().getExtent(), {maxZoom: 10, duration:1000});

    //Add on-click handler 
    map.on('click', function(event) {
        photo_popup_inner = document.getElementById("photo_popup_inner")
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
            console.log(feature.get('path'));
        }
        else {
            photo_popup_inner.style.display = 'None'
        }
            
    });

    return map;
}

function createMarkerLayer (timeRangeStart, timeRangeEnd) {
    selected = photo_data.filter(photo => photo.datetime >= timeRangeStart && photo.datetime <= timeRangeEnd);
    console.log("selected ", selected.length, " photos in time range");
    return new ol.layer.Vector({
        source: createVectorSource(selected),
        style:  new ol.style.Style({
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

function convertDMSToDecimal(dms, ref) {
    if (!dms || dms.length !== 3) {return null};

    const degrees = dms[0].numerator / dms[0].denominator;
    const minutes = dms[1].numerator / dms[1].denominator;
    const seconds = dms[2].numerator / dms[2].denominator;

    let decimal = degrees + (minutes / 60) + (seconds / 3600);

    if (ref === 'S' || ref === 'W') {
        decimal *= -1;
    }
    return decimal;
}

function getDataPromise(file) {
  return new Promise((resolve, reject) => {
    EXIF.getData(file, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
}


async function processFiles(files) {
    if (files.length === 0) return;
    
    document.getElementById("directoryInfo").innerText = ""

    
    // Filter for image files
    const imageFiles = Array.from(files).filter(file => 
        file.type.endsWith('jpeg')
    );
    
    if (imageFiles.length === 0) {
        directoryInfo.textContent = 'No image files found in selected directory.';
        return;
    }
    
    // Update directory info
    directoryInfo.textContent = `Found ${imageFiles.length} images in selected directory.`;

    // progressBar = document.getElementById("progressBar"); 
    // document.getElementById("directorySelectionContainer").appendChild(progressBar);
    // progressBar.className = "progressBar";


    photosFromFile = new Array();
    console.log(imageFiles.length);

    let i = 0;
    // Process each image file
    for (const imFile of imageFiles) {
        // console.log("processing ", JSON.stringify(imFile.webkitRelativePath))

        await getDataPromise(imFile) ;

        document.getElementById("directoryInputLabelProgress").style.width = (i+1)/imageFiles.length*100 + '%';
        directoryInfo.textContent = `Found ${imageFiles.length} images in selected directory.\n 
                                     Processed ${i} images.`;
        i++;


        const latitude = EXIF.getTag(imFile, "GPSLatitude");
        const longitude = EXIF.getTag(imFile, "GPSLongitude");
        const latitudeRef = EXIF.getTag(imFile, "GPSLatitudeRef"); // 'N' or 'S'
        const longitudeRef = EXIF.getTag(imFile, "GPSLongitudeRef"); // 'E' or 'W'

        dateEXIF = EXIF.getTag(imFile, "DateTimeOriginal")

        if (latitude && longitude) {
            const decimalLatitude = convertDMSToDecimal(latitude, latitudeRef);
            const decimalLongitude = convertDMSToDecimal(longitude, longitudeRef);
            // console.log(decimalLatitude, decimalLongitude);
            image = {coords: [decimalLatitude, decimalLongitude], 
                        path: URL.createObjectURL(imFile),
                        datetime: new Date(dateEXIF.split(' ')[0].replace(/:/g, '-') + 'T' + dateEXIF.split(' ')[1]) , 
                        width: EXIF.getTag(imFile, "ImageWidth"), 
                        length: EXIF.getTag(imFile, "ImageHeight")};
            photosFromFile.push(image);
            // console.log("pushed an image: ", JSON.stringify(image));
        }
    }
    
    if (photosFromFile.length == 0) {
        console.log("No photos with GPS data found");
    }
    else {
        directoryInfo.textContent = `Found ${photosFromFile.length} GPS-tagged images in selected directory.`;
    }

    console.log("All files processed:", photosFromFile);
    
    return photosFromFile;
}


//Create vectorLayer for showing the photo positions
function createVectorSource(selected) {
    let markerVectorSource = new ol.source.Vector();
    for (const index in selected) {
        photo = selected[index];
        photoTime = photo.datetime;
        console.log(photo.coords);
        console.log(typeof(photo.coords[0]));
        const marker = new ol.Feature({
            geometry: new ol.geom.Point(ol.proj.fromLonLat([photo.coords[1], photo.coords[0]])),
            time: photo.datetime,
            path: photo.path,
            width: photo.width,
            length: photo.length,
            coords: photo.coords
        });
        marker.getGeometry().computeExtent();
        markerVectorSource.addFeature(marker);
        
    }
    console.log("markerVectorSource has ", markerVectorSource.getFeatures().length, ": ");
    console.log(markerVectorSource);
    
    return markerVectorSource;
}


function makeTimeline() {
    //Make the timeline buttons
    const uniqueDates = [...new Set(photo_data.map(photo => new Date(photo.datetime).setHours(0,0,0)))];
    uniqueDates.slice(0, uniqueDates.length)
    uniqueDates.sort((dateA, dateB) => dateA - dateB);

    function handleDaySelection(clickedButton, selectedDate) { 
        if (selectedDate == "Clear") {
            selectedDate = uniqueDates[0];
            selectedDateEnd = uniqueDates[uniqueDates.length -1];
        }
        else {
            selectedDateEnd = new Date(selectedDate);
            selectedDateEnd.setDate(selectedDate.getDate() + 1);
        }
        map.removeLayer(markerLayer)
        markerLayer = createMarkerLayer(selectedDate, selectedDateEnd); 
        map.addLayer(markerLayer);
        map.getView().fit(markerLayer.getSource().getExtent(), {maxZoom: 12.5, duration:500, padding: [50,50,50,50]})

    }

    uniqueDates.forEach((date, index) => {
        const button = document.createElement('button');
        date = new Date(date);
        button.className = 'button-80';
        button.textContent = `Day ${index + 1}`;    
        button.addEventListener('click', function() {handleDaySelection(button, date)});
        document.getElementById("timeline").appendChild(button);
    })

    const clear_button = document.createElement('button');
    clear_button.className = 'button-80';
    clear_button.textContent = "Clear";
    clear_button.addEventListener('click', function() {
        handleDaySelection(clear_button, "Clear");
    });
    document.getElementById("timeline").appendChild(clear_button);
    document.getElementById("timelineContainer").style.display = "block";
}