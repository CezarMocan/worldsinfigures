import React from 'react'
import * as d3 from 'd3'
import cloneDeep from 'clone-deep'
import gcd from 'gcd'
import { defaultLayers, layerTypes } from '../data/LayerData'
import { duplicateOnHemispheres } from '../modules/GeoJsonHelper'
import { prepareLayersForExport } from './MainContextHelper'

export const sleep = (s) => new Promise((res, rej) => setTimeout(res, s * 1000))

const MainContext = React.createContext()

export const PROJECTION_ATTRIBUTES = 'projectionAttributes'
export const RENDER_OPTIONS = 'renderOptions'
export const DOWNLOAD_OPTIONS = 'downloadOptions'
export const RENDERERS = {
  canvas: 'CANVAS',
  svg: 'SVG'
}
export const INITIAL_CANVAS_WIDTH = 1920
export const INITIAL_CANVAS_HEIGHT = 1080

const INITIAL_STORAGE_STATE = {
  version: 1,

  canvasAttributes: {
    canvasRatioLocked: true,
    canvasRatioWidth: INITIAL_CANVAS_WIDTH / gcd(INITIAL_CANVAS_WIDTH, INITIAL_CANVAS_HEIGHT),
    canvasRatioHeight: INITIAL_CANVAS_HEIGHT / gcd(INITIAL_CANVAS_WIDTH, INITIAL_CANVAS_HEIGHT),
    canvasDisplayPercentage: 50,
    canvasDisplayWidth: INITIAL_CANVAS_WIDTH,
    canvasDisplayHeight: INITIAL_CANVAS_HEIGHT,
    canvasRatioIndex: 1000
  },

  projectionAttributes: {
    scale: 100,
    rotateX: 0,
    rotateY: 0,
    rotateZ: 0,
    translateX: 50,
    translateY: 50,
    projection: 'geoEquirectangular',
  },

  renderOptions: {
    clipToEarthBounds: false,
    tileVectors: false,
  },

  downloadOptions: {
    png: true,
    svg: true,
    config: true
  },

  animateOptions: {
    imagesPerArchive: 250
  }

  // layers: { ...defaultLayers  }
}

const STORAGE_KEY = '__WORLDVIEWS__'
const getStoredState = () => {
  if (process.browser) {
    if (!window) return INITIAL_STORAGE_STATE

    if (!window.localStorage.getItem(STORAGE_KEY)) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_STORAGE_STATE))
    }

    const state = JSON.parse(window.localStorage.getItem(STORAGE_KEY))
    if (state.version == INITIAL_STORAGE_STATE.version) {
      return state
    }
  }
  
  return INITIAL_STORAGE_STATE
}


export default class MainContextProvider extends React.Component {
    state = {
      ...getStoredState(),
      action: this,
      // layers: { ...defaultLayers  },
      layers: {},
      renderer: RENDERERS.canvas,
      ready: false
    }

    getStateItemsToStore = (state) => {
      return {
        version: state.version,
        canvasAttributes: state.canvasAttributes,
        projectionAttributes: state.projectionAttributes,
        renderOptions: state.renderOptions,
        downloadOptions: state.downloadOptions,
        animateOptions: state.animateOptions
        // layers: state.layers
      }
    }

    updateState = (newState) => {
      this.setState(newState, () => {
        if (process.browser) {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.getStateItemsToStore(this.state)))
        }
      })
    }

    // Loading raster and vector data
    loadLayers = async () => {
      let errorKeys = []
      const loadedLayers = { ...defaultLayers } //cloneDeep(this.state.layers)

      for (let key of Object.keys(loadedLayers)) {
        const l = loadedLayers[key]
        let hasError = false
        if (l.type === layerTypes.VECTOR) {
          if (l.generatorFunction) {
            l.geojsonObject = l.generatorFunction()
          } else {
            let loadedJson
            try {
              loadedJson = await d3.json(l.url)
            } catch (e) {
              console.error('Caught an error in loading JSON: ', l.url)
              console.error('Corresponding layer will not be shown.')
              console.error(e)
              hasError = true
              errorKeys.push(key)
            }
            if (!hasError)
              l.geojsonObject = l.jsonToGeojsonFn ? l.jsonToGeojsonFn(loadedJson) : loadedJson
          }
          if (!hasError && l.duplicateHemispheres) {
            l.geojsonObject = duplicateOnHemispheres(l.geojsonObject)
          }
        } else if (l.type === layerTypes.RASTER) {

        }
      }

      errorKeys.forEach(k => {
        delete loadedLayers[k]
      })
      this.updateState({ layers: loadedLayers, ready: true })
    }

    addLayer = (name, layerType, geojson) => {
      const layer = {
        visible: true,
        type: layerType,
        duplicateHemispheres: false,
        preserveOriginalStyle: true,
        displayName: name,
        style: { lineWidth: 2, color: 'blue' },
        geojsonObject: geojson
      }
      const { layers } = this.state
      this.updateState({ 
        layers: {
          ...layers,
          [name]: layer
        }
      })
    }


    updateStateObject = (itemName, newAttributes) => {
      let attributes = { ...this.state[itemName]}
      for (let k in newAttributes) {
        attributes[k] = newAttributes[k]
      }
      this.updateState({ [itemName]: { ...attributes } })
    }

    updateStateItem = (itemName, newValue) => {
      this.updateState({ [itemName]: newValue })
    }

    updateCanvasRatioLocked = (newLocked) => {
      this.updateState({
        ...this.state,
        canvasAttributes: {
          ...this.state.canvasAttributes,
          canvasRatioLocked: newLocked
        }
      })
    }

    updateCanvasDisplayPercentage = (newPercentage) => {
      const { canvasDisplayPercentage } = this.state.canvasAttributes
      const ratio = newPercentage / canvasDisplayPercentage
      const { scale } = this.state.projectionAttributes
      this.updateState({
        ...this.state,
        canvasAttributes: {
          ...this.state.canvasAttributes,
          canvasDisplayPercentage: newPercentage
        },
        projectionAttributes: {
          ...this.state.projectionAttributes,
          scale: scale * ratio
        }
      })
    }

    updateCanvasWidth = (newWidth) => {
      const { canvasRatioLocked, canvasRatioWidth, canvasRatioHeight, canvasDisplayHeight } = this.state.canvasAttributes
      const g = gcd(canvasDisplayHeight, newWidth)
      this.updateState({
        ...this.state,
        canvasAttributes: {
          ...this.state.canvasAttributes,
          canvasDisplayWidth: newWidth,
          canvasDisplayHeight: canvasRatioLocked ? (newWidth * canvasRatioHeight / canvasRatioWidth) : canvasDisplayHeight,
          canvasRatioWidth: canvasRatioLocked ? canvasRatioWidth : (newWidth / g),
          canvasRatioHeight: canvasRatioLocked ? canvasRatioHeight : (canvasDisplayHeight / g)
        }
      })
    }

    updateCanvasHeight = (newHeight) => {
      const { canvasRatioLocked, canvasRatioWidth, canvasRatioHeight, canvasDisplayWidth } = this.state.canvasAttributes
      const g = gcd(canvasDisplayWidth, newHeight)
      this.updateState({
        ...this.state,
        canvasAttributes: {
          ...this.state.canvasAttributes,
          canvasDisplayHeight: newHeight,
          canvasDisplayWidth: canvasRatioLocked ? (newHeight * canvasRatioWidth / canvasRatioHeight) : canvasDisplayWidth,
          canvasRatioWidth: canvasRatioLocked ? canvasRatioWidth : (canvasDisplayWidth / g),
          canvasRatioHeight: canvasRatioLocked ? canvasRatioHeight : (newHeight / g)
        }
      })
    }

    updateCanvasRatio = (newRatioWidth, newRatioHeight, newRatioIndex) => {
      const g = gcd(newRatioHeight, newRatioWidth)
      const currHeight = this.state.canvasAttributes.canvasDisplayHeight
      this.updateState({
        ...this.state,
        canvasAttributes: {
          ...this.state.canvasAttributes,
          canvasRatioWidth: newRatioWidth / g,
          canvasRatioHeight: newRatioHeight / g,
          canvasDisplayWidth: currHeight * (newRatioWidth / newRatioHeight),
          canvasRatioIndex: newRatioIndex
        }
      })
    }

    updateLayerVisibility = (layerName, visible) => {
      this.updateState({
        ...this.state,
        layers: {
          ...this.state.layers,
          [layerName]: {
            ...this.state.layers[layerName],
            visible
          }
        }
      })
    }

    updateLayerColor = (layerName, color) => {
      this.updateState({
        ...this.state,
        layers: {
          ...this.state.layers,
          [layerName]: {
            ...this.state.layers[layerName],
            style: {
              ...this.state.layers[layerName].style,
              color
            }
          }
        }
      })
    }

    parseStateForDownload = () => {
      const { layers, projectionAttributes, renderOptions } = this.state

      const stateToExport = {
        projectionAttributes,
        renderOptions,
        layers: prepareLayersForExport(layers)
      }

      return JSON.stringify(stateToExport, null, 4)
    }

    render() {
        const context = { ...this.state }
        const { children } = this.props

        return (
            <MainContext.Provider value={context}>
                { children }
            </MainContext.Provider>
        )
    }
}

export const withMainContext = (mapping) => Component => props => {
    return (
        <MainContext.Consumer>
            {(context) => <Component {...props} {...mapping(context, props)}/>}
        </MainContext.Consumer>
    )
}