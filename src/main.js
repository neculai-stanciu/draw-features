import 'ol/ol.css';
import Draw from 'ol/interaction/Draw';
import Map from 'ol/Map';
import View from 'ol/View';
import ImageLayer from 'ol/layer/Image';
import Projection from 'ol/proj/Projection';
import { getCenter } from 'ol/extent';
import Static from 'ol/source/ImageStatic';
import { Vector as VectorSource } from 'ol/source';
import { Vector as VectorLayer } from 'ol/layer';
import { Feature } from 'ol';
import { GeoJSON } from 'ol/format'
import Style from 'ol/style/Style';
import Stroke from 'ol/style/Stroke';
import Select from 'ol/interaction/Select';
// import Fill from 'ol/style/Fill';


const typeSelect = document.getElementById('type');
let modeTypeId = 'modeType';
const modeTypeSelect = document.getElementById(modeTypeId);
const featuresWriteBtn = document.getElementById('features-write');
const floor1Btn = document.getElementById('floor1Btn');
const featuresTextarea = document.getElementsByClassName('features-content')[0];

let modeType;
const updateButtons = function(type, firstUpdate) {
  modeType = type;
  modeTypeSelect.value = type;

  if (type === 'normal') {
   featuresWriteBtn.disabled = true; 
   typeSelect.disabled = true;
   featuresTextarea.readOnly = false;
  } else if(type === 'edit') {
   featuresWriteBtn.disabled = false; 
   typeSelect.disabled = false;
   featuresTextarea.readonly = true;
  }
}

updateButtons('normal', true);
modeTypeSelect.addEventListener('change', (_e) => {
  updateButtons(modeTypeSelect.value);
  console.log("modeTypeSelect ", modeTypeSelect.value);
});

document.getElementById("features-save").addEventListener('click',(_e) => {
  let dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(featuresTextarea.value);
  let dlAnchorElem = document.getElementById('downloadAnchorElem');
  dlAnchorElem.setAttribute("href",     dataStr     );
  dlAnchorElem.setAttribute("download", "scene.json");
  dlAnchorElem.click();
});

const extent = [0, 0, 1024, 968];
const projection = new Projection({
  code: 'xkcd-image',
  units: 'pixels',
  extent: extent,
});
const imageLayer = new ImageLayer({
  source: new Static({
    attributions: '© <a href="https://xkcd.com/license.html">xkcd</a>',
    url: 'https://imgs.xkcd.com/comics/online_communities.png',
    projection: projection,
    imageExtent: extent,
  })
});



const polygon = {"type":"FeatureCollection","features":[{"type":"Feature","geometry":{"type":"Polygon","coordinates":[[[305,499.71665954589844],[439,511.71665954589844],[416,456.71665954589844],[281,409.71665954589844],[305,499.71665954589844]]]},"properties":null}]};

const imageView = new View({
  projection: projection,
  center: getCenter(extent),
  zoom: 2,
  maxZoom: 8,
})

const floorLayer = new VectorLayer({
  source: new VectorSource({
    features: new GeoJSON().readFeatures(polygon)
  })
})

const source = new VectorSource({
  wrapX: false,
  features: new GeoJSON().readFeatures(polygon)
});
const vector = new VectorLayer({
  source: source,
});

const map = new Map({
  layers: [imageLayer, vector],
  target: 'map',
  view: imageView, 
});

const selected = new Style({
  stroke: new Stroke({
    color: 'rgba(255, 0, 0, 0.7)',
    width: 2,
  }),
});
function selectStyle(feature) {
  const color = feature.get('COLOR') || '#eeeeee';
  // selected.getFill().setColor(color);
  return selected;
}

let selectInteraction = new Select({
  style: selectStyle 
});

map.addInteraction(selectInteraction);

let displayFeatureInfo = function(pixel) {
  let features = [];
  map.forEachFeatureAtPixel(pixel, function(feature, _layer) {
    features.push(feature);
  });
  if(features.length > 0) {
    if(!features[0].getId()) {
      let featureId = prompt("What whould be the id of this object: ");
      features[0].setId(new String(featureId));
    }
    let geom = [];
    geom.push(new Feature(features[0].getGeometry().clone()));

    const writer = new GeoJSON();
    const geoJsonStr = JSON.parse(writer.writeFeatures(geom));
    alert("Selected feature" + JSON.stringify(geoJsonStr.features[0], null, 2));
  }
}

map.on('click', function(evt){
   if(modeType === 'normal') {
     const pixel = evt.pixel
     displayFeatureInfo(pixel)
   }
})


featuresWriteBtn.addEventListener('click', (_e) => {
  let geom = [];
  const features = vector.getSource().forEachFeature(function(feature){
    geom.push(new Feature(
      feature
        .getGeometry()
        .clone()
        // .transform('ESPG:3857', 'ESPG:4326')
    ));
  });
  const writer = new GeoJSON();
  const geoJsonObj = JSON.parse(writer.writeFeatures(geom));
  featuresTextarea.value = JSON.stringify(geoJsonObj, null, 2);
});

floor1Btn.addEventListener('click', (_e) => {
    map.addLayer(floorLayer)
})

let draw; // global so we can remove it later
function addInteraction() {
  const value = typeSelect.value;
  if (value !== 'None') {
    draw = new Draw({
      source: source,
      type: typeSelect.value,
    });
    map.addInteraction(draw);
  }
}

/**
 * Handle change event.
 */
typeSelect.onchange = function () {
  map.removeInteraction(draw);
  addInteraction();
};

document.getElementById('undo').addEventListener('click', function () {
  draw.removeLastPoint();
});

addInteraction();
