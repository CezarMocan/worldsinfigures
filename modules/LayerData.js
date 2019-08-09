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
        imageObject: null,
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
    worldMap: {
        visible: false,
        type: layerTypes.VECTOR,
        url: '/static/misc/world-110m.json',
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
        url: '/static/misc/cable-geo.json',
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
        visible: false,
        type: layerTypes.VECTOR,
        url: '/static/misc/all-red-line-geo.json',
        geojsonObject: null,
        displayName: 'All Red Line',
        style: {
            lineWidth: 2,
            color: 'rgba(255, 64, 64, 0.8)',
            fillMode: false,
            dashed: false
        }
    },
    gedyminHead: {
        visible: false,
        type: layerTypes.VECTOR,
        url: '/static/misc/face-geo.json',
        geojsonObject: null,
        displayName: 'Gedymin Head',
        style: {
            lineWidth: 2,
            color: 'rgba(64, 64, 255, 0.8)',
            fillMode: false,
            dashed: false
        }
    },
    twoGedyminHeads: {
        visible: false,
        type: layerTypes.VECTOR,
        url: '/static/misc/two-faces.topojson',
        jsonToGeojsonFn: (json) => topojson.feature(json, json.objects.gedymin),
        geojsonObject: null,
        displayName: 'Two Gedymin Heads',
        style: {
            lineWidth: 2,
            color: 'rgba(255, 255, 64, 0.8)',
            fillMode: false,
            dashed: false
        }
    },
    tissot: {
        visible: false,
        type: layerTypes.VECTOR,
        url: '/static/misc/tissot.topojson',
        jsonToGeojsonFn: (json) => topojson.feature(json, json.objects.tissot),
        geojsonObject: null,
        displayName: 'Tissot Indicatrices',
        style: {
            lineWidth: 0.5,
            color: 'rgba(255, 230, 255, 0.2)',
            fillMode: true,
            dashed: false
        }        
    }
}

export const propertiesExcludedFromExport = ['jsonToGeojsonFn', 'geojsonObject', 'imageObject']