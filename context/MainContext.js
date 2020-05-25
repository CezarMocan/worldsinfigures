import React from 'react'
import * as d3 from 'd3'
import cloneDeep from 'clone-deep'
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

export default class MainContextProvider extends React.Component {
    state = {
      action: this,

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

      layers: { ...defaultLayers  },

      downloadOptions: {
        png: true,
        svg: true,
        config: true
      },

      renderer: RENDERERS.canvas,

      ready: false
    }

    // Loading raster and vector data
    loadLayers = async () => {
      const loadedLayers = cloneDeep(this.state.layers)

      for (let key of Object.keys(loadedLayers)) {
        const l = loadedLayers[key]
        if (l.type === layerTypes.VECTOR) {
          if (l.generatorFunction) {
            l.geojsonObject = l.generatorFunction()
          } else {
            const loadedJson = await d3.json(l.url)
            l.geojsonObject = l.jsonToGeojsonFn ? l.jsonToGeojsonFn(loadedJson) : loadedJson
          }
          if (l.duplicateHemispheres) {
            l.geojsonObject = duplicateOnHemispheres(l.geojsonObject)
          }
        } else if (l.type === layerTypes.RASTER) {

        }
      }
      this.setState({ layers: loadedLayers, ready: true })
    }


    updateStateObject = (itemName, newAttributes) => {
      let attributes = { ...this.state[itemName]}
      for (let k in newAttributes) {
        attributes[k] = newAttributes[k]
      }
      this.setState({ [itemName]: { ...attributes } })
    }

    updateStateItem = (itemName, newValue) => {
      this.setState({ [itemName]: newValue })
    }

    updateLayerVisibility = (layerName, visible) => {
      this.setState({
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
      this.setState({
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