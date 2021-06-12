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
        preserveOriginalStyle: false,
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
        preserveOriginalStyle: false,
        style: {
            lineWidth: 0.5,
            color: 'rgba(255, 230, 255, 0.2)',
            fillMode: true,
            dashed: false
        } 
    },
    worldMap: {
        visible: true,
        type: layerTypes.VECTOR,
        url: '/static/geo/world-110m.topojson',
        jsonToGeojsonFn: (json) => topojson.feature(json, json.objects.land),
        geojsonObject: null,
        displayName: 'World Map',
        preserveOriginalStyle: false,
        style: {
            lineWidth: 0.5,
            color: 'rgba(255, 255, 255, 0.2)',
            fillMode: true,
            dashed: false
        }
    },
		greatLakes: {
				visible: true,
				type: layerTypes.VECTOR,
				url: '/static/geo/greatlakes.geojson',
				geojsonObject: null,        
				displayName: 'Great Lakes',
				preserveOriginalStyle: false,
				style: {
						lineWidth: 0.5,
						color: '#88f',
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
        preserveOriginalStyle: false,
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
        preserveOriginalStyle: false,
        style: {
            lineWidth: 2,
            color: 'rgba(255, 64, 64, 0.8)',
            fillMode: false,
            dashed: false
        }
    },
    //CENTERED HEAD (LEFT FACING)
    Gy0lx8IQ8g: { // You can replace this ID with something legible, as long as it's different from all others in the file.
      visible: true,
      type: layerTypes.VECTOR,
      url: '/static/geo/michele-ver-29.svg-geoEquirectangular.geojson',
      displayName: 'Centered Head (left)', // michele-ver-29.svg-geoEquirectangular
      preserveOriginalStyle: false,
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
      displayName: 'Centered Head x 2 (left)', // michele-double-ver-29.svg-geoEquirectangular
      preserveOriginalStyle: false,
      style: {
       lineWidth: 1,
       color: 'rgba(255, 255, 0, 1)',
       fillMode: false,
       dashed: false
      },
      duplicateHemispheres: false
     },
    //CENTER HEAD (RIGHT FACING)
	wBKu11Jm: { // You can replace this ID with something legible, as long as it's different from all others in the file.
	  visible: false,
	  type: layerTypes.VECTOR,
	  url: '/static/geo/michele-ver-29-right-facing.svg-geoEquirectangular.geojson',
	  preserveOriginalStyle: false,
	  displayName: 'Center Head (right)', // michele-ver-29-right-facing
	  style: {
	   lineWidth: 1,
	   color: 'rgba(255, 255, 255, 1)',
	   fillMode: false,
	   dashed: false
	  },
	  duplicateHemispheres: false
	 },
	t4E_Oi9YL6: { // You can replace this ID with something legible, as long as it's different from all others in the file.
	  visible: false,
	  type: layerTypes.VECTOR,
	  url: '/static/geo/michele-double-ver-29-right-facing.svg-geoEquirectangular.geojson',
	  preserveOriginalStyle: false,
	  displayName: 'Center Head X 2 (right)', // michele-double-ver-29-right-facing
	  style: {
	   lineWidth: 1,
	   color: 'rgba(255, 255, 0, 1)',
	   fillMode: false,
	   dashed: false
	  },
	  duplicateHemispheres: false
	 },
    //WEST HEAD (LEFT FACING)
	AqO7s4VoA: { // You can replace this ID with something legible, as long as it's different from all others in the file.
	  visible: false,
	  type: layerTypes.VECTOR,
	  url: '/static/geo/michele-single-ver-29-LEFT-7.svg-geoEquirectangular.geojson',
	  preserveOriginalStyle: false,
	  displayName: 'West Head (left)', // michele-single-ver-29-LEFT-7
	  style: {
	   lineWidth: 1,
	   color: 'rgba(255, 255, 255, 1)',
	   fillMode: false,
	   dashed: false
	  },
	  duplicateHemispheres: false
	 },
	pGTjD4fL7: { // You can replace this ID with something legible, as long as it's different from all others in the file.
	  visible: false,
	  type: layerTypes.VECTOR,
	  url: '/static/geo/michele-double-ver-29-LEFT-7.svg-geoEquirectangular.geojson',
	  preserveOriginalStyle: false,
	  displayName: 'West Head x 2 (left)', // michele-double-ver-29-LEFT-7
	  style: {
	   lineWidth: 1,
	   color: 'rgba(255, 255, 0, 1)',
	   fillMode: false,
	   dashed: false
	  },
	  duplicateHemispheres: false
	 },
	//WEST HEAD (RIGHT FACING)
	Aer8TGHnqG: { // You can replace this ID with something legible, as long as it's different from all others in the file.
	  visible: false,
	  type: layerTypes.VECTOR,
	  url: '/static/geo/michele-single-ver-29-LEFT-7-RIGHT-FACING.svg-geoEquirectangular.geojson',
	  preserveOriginalStyle: false,
	  displayName: 'West Head (right)', // michele-single-ver-29-LEFT-7-RIGHT-FACING
	  style: {
	   lineWidth: 1,
	   color: 'rgba(255, 255, 255, 1)',
	   fillMode: false,
	   dashed: false
	  },
	  duplicateHemispheres: false
	 },
	NNWWU_VlEs: { // You can replace this ID with something legible, as long as it's different from all others in the file.
	  visible: false,
	  type: layerTypes.VECTOR,
	  url: '/static/geo/michele-double-ver-29-LEFT-7-right-facing.svg-geoEquirectangular.geojson',
	  preserveOriginalStyle: false,
	  displayName: 'West Head x 2 (right)', // michele-double-ver-29-LEFT-7-right-facing
	  style: {
	   lineWidth: 1,
	   color: 'rgba(255, 255, 0, 1)',
	   fillMode: false,
	   dashed: false
	  },
	  duplicateHemispheres: false
	 },
	//EAST HEAD (LEFT FACING)
	MDnprMLBe: { // You can replace this ID with something legible, as long as it's different from all others in the file.
	  visible: false,
	  type: layerTypes.VECTOR,
	  url: '/static/geo/michele-single-ver-29-RIGHT-7.svg-geoEquirectangular.geojson',
	  preserveOriginalStyle: false,
	  displayName: 'East Head (left)', // michele-single-ver-29-RIGHT-7
	  style: {
	   lineWidth: 1,
	   color: 'rgba(255, 255, 255, 1)',
	   fillMode: false,
	   dashed: false
	  },
	  duplicateHemispheres: false
	 },
	JA1ETIc1g: { // You can replace this ID with something legible, as long as it's different from all others in the file.
	  visible: false,
	  type: layerTypes.VECTOR,
	  url: '/static/geo/michele-double-ver-29-RIGHT-7.svg-geoEquirectangular.geojson',
	  preserveOriginalStyle: false,
	  displayName: 'East Head x 2 (left)', // michele-double-ver-29-RIGHT-7
	  style: {
	   lineWidth: 1,
	   color: 'rgba(255, 255, 0, 1)',
	   fillMode: false,
	   dashed: false
	  },
	  duplicateHemispheres: false
	 },
	//EAST HEAD (RIGHT FACING)
	IOPcXaTZYO: { // You can replace this ID with something legible, as long as it's different from all others in the file.
	  visible: false,
	  type: layerTypes.VECTOR,
	  url: '/static/geo/michele-single-ver-29-RIGHT-7-right-facing.svg-geoEquirectangular.geojson',
	  preserveOriginalStyle: false,
	  displayName: 'East Head (right)', // michele-single-ver-29-RIGHT-7-right-facing
	  style: {
	   lineWidth: 1,
	   color: 'rgba(255, 255, 255, 1)',
	   fillMode: false,
	   dashed: false
	  },
	  duplicateHemispheres: false
	 },
	X4bAnXcIk1: { // You can replace this ID with something legible, as long as it's different from all others in the file.
	  visible: false,
	  type: layerTypes.VECTOR,
	  url: '/static/geo/michele-double-ver-29-RIGHT-7-facing-right.svg-geoEquirectangular.geojson',
	  preserveOriginalStyle: false,
	  displayName: 'East Head x 2 (right)', // michele-double-ver-29-RIGHT-7-facing-right
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