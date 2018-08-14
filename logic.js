// Store our API endpoint inside queryUrl
var queryUrl = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson";

var queryUrl2 = "https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_plates.json";


// Perform a GET request to the query URL
d3.json(queryUrl, function(data) {
  // Once we get a response, send the data.features object to the createFeatures function
  createFeatures(data.features);
});

function createFeatures(earthquakeData) {

  // Define a function we want to run once for each feature in the features array
  // Give each feature a popup describing the place and time of the earthquake
  function onEachFeature(feature, layer) {
    layer.bindPopup("<h3>" + feature.properties.place +
      "</h3><hr><p>" + new Date(feature.properties.time) + "</p>");
  }

//--------------------------------------------
//            circleMarker
//--------------------------------------------

  // Create a GeoJSON layer containing the features array on the earthquakeData object
  // Run the onEachFeature function once for each piece of data in the array
  // reference code:https://leafletjs.com/examples/geojson/

  var earthquakes = L.geoJSON(earthquakeData, {
    onEachFeature: onEachFeature,
    
    pointToLayer: function (feature, latlng) {

       //Set Circle Markers color to orange-green transition, higher mag -> redish, lower mag -> green
        var color;
        var r = Math.trunc(150+feature.properties.mag*40);
        var g = Math.trunc(255-feature.properties.mag*40);
        var b = 0;
        color= "rgb("+r+" ,"+g+","+ b+")"


      //Set Circle markers size
      var geojsonMarkerOptions = {
        radius: feature.properties.mag*5,
        fillColor: color,
        color: "black",
        weight: 1,
        opacity: 1,
        fillOpacity: 0.8
      };

      return L.circleMarker(latlng, geojsonMarkerOptions);
    }

  });

  // Sending our earthquakes layer to the createMap function
  createMap(earthquakes);
}

function createMap(earthquakes) {

  // Define streetmap and darkmap layers
  var satellite = L.tileLayer("https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}", {
    attribution: "Map data &copy; <a href=\"https://www.openstreetmap.org/\">OpenStreetMap</a> contributors, <a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"https://www.mapbox.com/\">Mapbox</a>",
    maxZoom: 18,
    id: "mapbox.satellite",
    accessToken: API_KEY
  });

  var greyscale = L.tileLayer("https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}", {
    attribution: "Map data &copy; <a href=\"https://www.openstreetmap.org/\">OpenStreetMap</a> contributors, <a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"https://www.mapbox.com/\">Mapbox</a>",
    maxZoom: 18,
    id: "mapbox.light",
    accessToken: API_KEY
  });

  var outdoors = L.tileLayer("https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}", {
    attribution: "Map data &copy; <a href=\"https://www.openstreetmap.org/\">OpenStreetMap</a> contributors, <a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"https://www.mapbox.com/\">Mapbox</a>",
    maxZoom: 18,
    id: "mapbox.outdoors",
    accessToken: API_KEY
  });

  // Define a baseMaps object to hold our base layers
  var baseMaps = {
    "Satellite": satellite,
    "Greyscale": greyscale,
    "Outdoors": outdoors
  };
  // Initialize all of the LayerGroups we'll be using
  var faultlines = new L.LayerGroup();

  // Create overlay object to hold our overlay layer
  var overlayMaps = {
    "Earthquakes": earthquakes,
    "Fault lines": faultlines,
  };

  //Load faultlines layer data
  d3.json(queryUrl2, function(d) {

    L.geoJson(d, {
      color: "#FFC403",
      weight: 2,
      "fillOpacity": 0
    })
    .addTo(faultlines);
  });

  
  // Create our map, giving it the streetmap and earthquakes layers to display on load
  var myMap = L.map("map", {
    center: [
      37.09, -95.71
    ],
    zoom: 4,
    layers: [greyscale, earthquakes]
  });

  // Create a layer control
  // Pass in our baseMaps and overlayMaps
  // Add the layer control to the map
  L.control.layers(baseMaps, overlayMaps, {
    collapsed: false
  }).addTo(myMap);


//--------------------------------------------
//            Legend
//--------------------------------------------

  //legend reference code: https://leafletjs.com/examples/choropleth/

  function getColor(d) {
    return d <1 ? 'rgb(70,255,0)' :
          d <2 ? 'rgb(150,235,0)' :
          d <3 ? 'rgb(200,220,0)' :
          d <4 ? 'rgb(220,170,0)' :
          d <5 ? 'rgb(235,140,0)' :
                  'rgb(255,50,0)' ;

  }


  var legend = L.control({position: 'bottomright'});

  legend.onAdd = function (map) {

      var div = L.DomUtil.create('div', 'info legend'),
          grades = [0, 1, 2, 3, 4, 5],
          labels = [];

          div.innerHTML+='Magnitude<br><hr>'

      // loop through our density intervals and generate a label with a colored square for each interval
      for (var i = 0; i < grades.length; i++) {
          div.innerHTML +=
              '<i style="background:' + getColor(grades[i] + 1) + '"></i> ' +
              grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] + '<br>' : '+');
      }

      return div;
  };

  legend.addTo(myMap);
}
