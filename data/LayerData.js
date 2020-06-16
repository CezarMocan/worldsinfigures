import * as d3 from 'd3'
import * as topojson from 'topojson'

export const layerTypes = {
    RASTER: 'RASTER',
    VECTOR: 'VECTOR'
}

export const defaultLayers = {
    mainImage: {
        visible: true,
        type: layerTypes.RASTER,
        url: '/static/images/test.png',
        displayName: 'Image'
    },
    graticule: {
        visible: false,
        type: layerTypes.VECTOR,
        geojsonObject: null,
        generatorFunction: d3.geoGraticule(),
        displayName: 'Graticule',
        style: {
            lineWidth: 1,
            color: '#ccc',
            fillMode: false,
            dashed: true        
        }
    },
    tissot: {
        visible: false,
        type: layerTypes.VECTOR,
        url: '/static/geo/tissot.topojson',
        jsonToGeojsonFn: (json) => topojson.feature(json, json.objects.tissot),
        geojsonObject: null,
        displayName: 'Tissot Indicatrices',
        style: {
            lineWidth: 0.5,
            color: 'rgba(255, 230, 255, 0.2)',
            fillMode: true,
            dashed: false
        } 
    },
    worldMap: {
        visible: false,
        type: layerTypes.VECTOR,
        url: '/static/geo/world-110m.topojson',
        jsonToGeojsonFn: (json) => topojson.feature(json, json.objects.countries),
        geojsonObject: null,
        displayName: 'World Map',
        style: {
            lineWidth: 0.5,
            color: 'rgba(255, 230, 220, 0.2)',
            fillMode: true,
            dashed: false
        }
    },
    submarineCables: {
        visible: false,
        type: layerTypes.VECTOR,
        url: '/static/geo/cable-geo.geojson',
        geojsonObject: null,
        displayName: 'Submarine Cables',
        style: {
            lineWidth: 0.5,
            color: '#fdd',
            fillMode: false,
            dashed: false        
        }
    },
    allRedLine: {
        visible: true,
        type: layerTypes.VECTOR,
        url: '/static/geo/all-red-line-geo.geojson',
        geojsonObject: null,
        displayName: 'All Red Line',
        style: {
            lineWidth: 2,
            color: 'rgba(255, 64, 64, 0.8)',
            fillMode: false,
            dashed: false
        }
    },
    originalTwoGedymin: {
        visible: false,
        type: layerTypes.VECTOR,
        url: '/static/geo/two-faces.topojson',
        jsonToGeojsonFn: (json) => topojson.feature(json, json.objects.gedymin),
        geojsonObject: null,
        displayName: '[ORIGINAL] 2 Gedymin Heads',
        style: {
            lineWidth: 2,
            color: 'rgba(255, 255, 64, 0.8)',
            fillMode: false,
            dashed: false
        }
    },
    gedyminHead: {
        visible: false,
        type: layerTypes.VECTOR,
        url: '/static/geo/face-geo.geojson',
        geojsonObject: null,
        displayName: 'Gedymin Head',
        style: {
            lineWidth: 2,
            color: 'rgba(64, 64, 255, 0.8)',
            fillMode: false,
            dashed: false
        },
        duplicateHemispheres: false
    },
    duplicatedSingleGedyminHead: {
        visible: false,
        type: layerTypes.VECTOR,
        url: '/static/geo/face-geo.geojson',
        geojsonObject: null,
        displayName: '[**NEW**] Duplicated single Gedymin Head',
        style: {
            lineWidth: 2,
            color: 'rgba(255, 64, 255, 0.8)',
            fillMode: false,
            dashed: false
        },
        duplicateHemispheres: true
    },
    Gy0lx8IQ8: { // You can replace this ID with something legible, as long as it's different from all others in the file.
      visible: false,
      type: layerTypes.VECTOR,
      url: '/static/geo/michele-ver-29.svg-geoLittrow.geojson',
      displayName: 'michele-ver-29.svg-geoLittrow', // Or however you want to see it in the layer list.
      style: {
       lineWidth: 1,
       color: 'rgba(255, 255, 255, 1)',
       fillMode: false,
       dashed: false
      },
      duplicateHemispheres: false
     },
    Gy0lx8IQ8b: { // You can replace this ID with something legible, as long as it's different from all others in the file.
      visible: false,
      type: layerTypes.VECTOR,
      url: '/static/geo/michele-ver-29.svg-geoRobinson.geojson',
      displayName: 'michele-ver-29.svg-geoRobinson', // Or however you want to see it in the layer list.
      style: {
       lineWidth: 1,
       color: 'rgba(255, 255, 255, 1)',
       fillMode: false,
       dashed: false
      },
      duplicateHemispheres: false
     },
     Gy0lx8IQ8e: { // You can replace this ID with something legible, as long as it's different from all others in the file.
      visible: false,
      type: layerTypes.VECTOR,
      url: '/static/geo/michele-ver-29.svg-geoBoggs.geojson',
      displayName: 'michele-ver-29.svg-geoBoggs', // Or however you want to see it in the layer list.
      style: {
       lineWidth: 1,
       color: 'rgba(255, 255, 255, 1)',
       fillMode: false,
       dashed: false
      },
      duplicateHemispheres: false
     },
    Gy0lx8IQ8f: { // You can replace this ID with something legible, as long as it's different from all others in the file.
      visible: false,
      type: layerTypes.VECTOR,
      url: '/static/geo/michele-ver-29.svg-geoMercator.geojson',
      displayName: 'michele-ver-29.svg-geoMercator', // Or however you want to see it in the layer list.
      style: {
       lineWidth: 1,
       color: 'rgba(255, 255, 255, 1)',
       fillMode: false,
       dashed: false
      },
      duplicateHemispheres: false
     },
    Gy0lx8IQ8g: { // You can replace this ID with something legible, as long as it's different from all others in the file.
      visible: true,
      type: layerTypes.VECTOR,
      url: '/static/geo/michele-ver-29.svg-geoEquirectangular.geojson',
      displayName: 'michele-ver-29.svg-geoEquirectangular', // Or however you want to see it in the layer list.
      style: {
       lineWidth: 1,
       color: 'rgba(255, 255, 255, 1)',
       fillMode: false,
       dashed: false
      },
      duplicateHemispheres: false
     },
    Gy0lx8IQ8h: { // You can replace this ID with something legible, as long as it's different from all others in the file.
      visible: true,
      type: layerTypes.VECTOR,
      url: '/static/geo/michele-double-ver-29.svg-geoEquirectangular.geojson',
      displayName: 'michele-double-ver-29.svg-geoEquirectangular', // Or however you want to see it in the layer list.
      style: {
       lineWidth: 1,
       color: 'rgba(255, 255, 0, 1)',
       fillMode: false,
       dashed: false
      },
      duplicateHemispheres: false
     }
}

export const propertiesExcludedFromExport = ['jsonToGeojsonFn', 'geojsonObject', 'imageObject']