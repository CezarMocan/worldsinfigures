import React from 'react'
import Style from '../static/styles/main.less'
import * as d3 from 'd3'
import Dropzone from 'react-dropzone'
import DeepDiff from 'deep-diff'
import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles';  
import { withMainContext } from '../context/MainContext'
import shortid from 'shortid'
import cloneDeep from 'clone-deep'
import * as EventsHelper from '../modules/MouseEventsHelper'
import { projectionsList, projectionsMap } from '../modules/Projections'
import { layerTypes } from '../data/LayerData'
import { getImageData, projectImageData, drawGeoJsonCanvas, drawGeoJsonSvg } from './Renderer/RenderHelper'
import { createAndDownloadImage, createAndDownloadSvg, createAndDownloadText } from '../modules/DownloadHelper'
import ControlPanel from '../components/ControlPanel'

const theme = createMuiTheme({
    typography: { 
       fontSize: 10
    }
 }) 

const RESIZING = {
    NO: 0,
    HORIZONTAL_LEFT: 1,
    HORIZONTAL_RIGHT: 2,
    VERTICAL_TOP: 3,
    VERTICAL_BOTTOM: 4
}

const SVG_ID = 'svgProjection'
const CANVAS_WIDTH = 450
const CANVAS_HEIGHT = 600
const BORDER_HOVER_THRESHOLD = 10

class Main extends React.PureComponent {
    constructor(props) {
      super(props)
      this.state = {
        isCanvasResizing: RESIZING.NO,
        canvasDisplayWidth: CANVAS_WIDTH,
        canvasDisplayHeight: CANVAS_HEIGHT,
        imageChanged: false
      }

      this.lastWindowTouch = { x: 0, y: 0 }
      this.isCanvasTouching = false
      this.lastCanvasTouch = { x: 0, y: 0 }
      this.canvasTranslate = { dx: 0, dy: 0 }
      this.canvasTouchThrottleTime = 0
    }

    // Callbacks for when DOM objects are created
    onImageRef = (i) => {
        this._image = i
        this._image.src="/static/images/test.png" 
    }
    onImageLoad = () => { this.renderMap(true) }
    onCanvasRef = (c) => { this._canvas = c }
    onSecondaryCanvasRef = (c) => { this._canvas2 = c }
    onSvgRef = (s) => { this._svg = s }


    // Convenience getters
    get canvasContext() { return this._canvas.getContext('2d') }
    get secondaryCanvasContext() { return this._canvas2.getContext('2d') }
    get canvasWidth() { return this._canvas.width }
    get canvasHeight() { return this._canvas.height }

    updateRasterData() {
      this.rasterData = getImageData(this._image, this.secondaryCanvasContext, this.canvasWidth, this.canvasHeight)
    }

    renderLayersToCanvas(targetCanvas, bufferCanvas, projection, allProjections, rasterData, layers, renderOptions) {
      const canvasWidth = targetCanvas.width, canvasHeight = targetCanvas.height      
      const canvasContext = targetCanvas.getContext('2d')
      const bufferContext = bufferCanvas.getContext('2d')

      // Clear canvas
      canvasContext.clearRect(0, 0, canvasWidth, canvasHeight);
      canvasContext.save()

      // Clip to earth bounds
      if (renderOptions.clipToEarthBounds) {
        const clipGenerator = d3.geoPath().projection(projection).context(canvasContext)
        canvasContext.beginPath()
        clipGenerator({type: "Sphere"}) 
        canvasContext.clip()    
      }

      // Draw raster image
      if (layers.mainImage.visible) {
          const projectedImageData = projectImageData(rasterData, projection, canvasContext, canvasWidth, canvasHeight)            
          bufferContext.clearRect(0, 0, canvasWidth, canvasHeight);
          bufferContext.putImageData(projectedImageData, 0, 0);    
          canvasContext.drawImage(bufferCanvas, 0, 0)
      }

      // Draw vector layers on top of raster image
      Object.values(layers).forEach(l => {
        if (l.type != layerTypes.VECTOR || !l.visible) return
        this.drawGeoJsonTiledCanvas(allProjections, l.geojsonObject, canvasContext, l.style)
      })

      canvasContext.restore()
    }

    renderLayersToSVG(svgId, layers, allProjections) {
      // Clear SVG
      d3.select(`#${svgId}`).selectAll('*').remove()

      Object.values(layers).forEach(l => {
        if (l.type != layerTypes.VECTOR) return
        if (!l.visible) return
        this.drawGeoJsonTiledSVG(allProjections, l.geojsonObject, svgId, l.style)
      })
    }
    drawGeoJsonTiledCanvas(projections, geoJson, context, drawingOptions) {
        projections.forEach(projection => {
          const { p, offsetX, offsetY } = projection
          const newGeoJson = cloneDeep(geoJson)
          const canvasGenerator = d3.geoPath().projection(p)
          drawGeoJsonCanvas(newGeoJson, canvasGenerator, context, drawingOptions)
        })
    }
    drawGeoJsonTiledSVG(projections, geoJson, svgId, drawingOptions) {
      projections.forEach(projection => {
        const { p, offsetX, offsetY } = projection
        const newGeoJson = cloneDeep(geoJson)
        const svgGenerator = d3.geoPath().projection(p)
        const { svgId } = svgOptions
        drawGeoJsonSvg(newGeoJson, svgGenerator, svgId, drawingOptions)
      })
    }

    // Layer rendering
    renderMap(withCleanSurface = false) {
      if (!this.rasterData || withCleanSurface) this.updateRasterData()
      const { layers, renderOptions } = this.props
      this.renderLayersToCanvas(this._canvas, this._canvas2, this.projection, this.projections, this.rasterData, layers, renderOptions)
      this.renderLayersToSVG(SVG_ID, layers, this.projections)
    }
  
    getProjectionFromState(projectionAttributes, canvasAttributes, offsetFactor) {
        let { scale, rotateX, rotateY, rotateZ, translateX, translateY, projection } = projectionAttributes
        const { canvasWidth, canvasHeight, canvasTX, canvasTY } = canvasAttributes
        const tX = translateX + (canvasTX || 0)
        const tY = translateY + (canvasTY || 0)
        const offsetXValue = offsetFactor.x * (2 * Math.PI * scale)
        const offsetYValue = offsetFactor.y * (Math.PI * scale)

        let proj = projectionsMap[projection].fn()

        if (proj.scale) proj = proj.scale(scale)
        if (proj.translate) proj = proj.translate([offsetXValue + canvasWidth / 2 + canvasWidth * (tX - 50) / 50, offsetYValue + canvasHeight / 2 + canvasHeight * (tY - 50) / 50])
        if (proj.rotate) proj = proj.rotate([rotateX, rotateY, rotateZ])
        if (proj.precision) proj = proj.precision(0.01)

        return proj
    }
    updateProjection() {
        let { projectionAttributes } = this.props
        let canvasAttributes = {
          canvasWidth: this.canvasWidth,
          canvasHeight: this.canvasHeight,
          canvasTX: this.canvasTranslate.dx,
          canvasTY: this.canvasTranslate.dy
        }

        this.projection = this.getProjectionFromState(projectionAttributes, canvasAttributes, { x: 0, y: 0 })
        this.projections = []
        let minX = 0, maxX = 0, minY = 0, maxY = 0        
        
        const { renderOptions } = this.props
        if (renderOptions.tileVectors) {
          minX = minY = -1
          maxX = maxY = 1
        }

        for (let i = minX; i <= maxX; i++) {
          for (let j = minY; j <= maxY; j++) {
            let projection = this.getProjectionFromState(projectionAttributes, canvasAttributes, { x: i, y: j })
            this.projections.push({
              offsetX: i,
              offsetY: j,
              p: projection
            })
          }
        }
    }
    componentDidMount() {
        const { loadLayers } = this.props
        loadLayers()
    }
    componentDidUpdate(oldProps, oldState) {
      if (!this.props.ready) return
      const renderRelatedState = ['isCanvasResizing', 'layers']
      const renderRelatedProps = ['projectionAttributes', 'renderOptions', 'layers', 'ready']

      let needsReRenderState = renderRelatedState.reduce((acc, p) => {
          let different = !!!(DeepDiff(this.state[p], oldState[p]))
          return (acc || different)
      }, false)

      let needsReRenderProps = renderRelatedProps.reduce((acc, p) => {
          let different = !!!(DeepDiff(this.props[p], oldProps[p]))
          return (acc || different)
      }, false)

      let needsReRender = (needsReRenderState || needsReRenderProps)

      if (needsReRender) {
          setTimeout(() => {
              this.updateProjection()
              const withCleanSurface = (this.state.isCanvasResizing != oldState.isCanvasResizing)
              this.renderMap(withCleanSurface)    
          }, 0)        
      }
    }

    // Image downloading
    onDownload = () => {
        const uid = shortid()
        const { projectionAttributes, parseStateForDownload } = this.props
        const projectionId = `${projectionAttributes.projection}-${uid}`
        const { downloadOptions } = this.props
        if (downloadOptions.png) createAndDownloadImage(`${projectionId}.png`, this._canvas)
        if (downloadOptions.svg) createAndDownloadSvg(`${projectionId}.svg`, this._svg)
        if (downloadOptions.config) createAndDownloadText(`${projectionId}.txt`, parseStateForDownload())
    }

    // Callback for a new image layer (when an image is dropped)
    onNewFile = (files) => {
        this.setState({ imageChanged: true }, () => {
            const file = files[0]
            const reader = new FileReader()
            reader.addEventListener("load", () => {
                this._image.src = reader.result
            }, false)
            if (file) reader.readAsDataURL(file)    
        })
    }


    // Mouse events on top of the canvas: dragging the image
    onCanvasMouseDown = (evt) => {
        if (EventsHelper.eventOnLeftRightBorder(evt, this._canvas, BORDER_HOVER_THRESHOLD)) return
        if (EventsHelper.eventOnTopBottomBorder(evt, this._canvas, BORDER_HOVER_THRESHOLD)) return
        this.isCanvasTouching = true
        this.lastCanvasTouch = { x: evt.clientX, y: evt.clientY }
        this.canvasTranslate = { dx: 0, dy: 0 }
        this._canvas.style.cursor = 'grabbing'
    }

    onCanvasMouseMove = (evt) => {
        if (!this.isCanvasTouching) return
        const now = new Date().getTime()
        if (now - this.canvasTouchThrottleTime < 66) return
        this.canvasTouchThrottleTime = now

        const dx = (evt.clientX - this.lastCanvasTouch.x) / this.canvasWidth * 35
        const dy = (evt.clientY - this.lastCanvasTouch.y) / this.canvasHeight * 45
        this.lastCanvasTouch = { x: evt.clientX, y: evt.clientY }
        this.canvasTranslate.dx += dx
        this.canvasTranslate.dy += dy
        setTimeout(() => {
            this.updateProjection()
            this.renderMap()    
        }, 0)
        this._canvas.style.cursor = 'grabbing'
    } 

    onCanvasMouseUp = (evt) => {
        this.isCanvasTouching = false
        this.lastCanvasTouch = { x: evt.clientX, y: evt.clientY }
        const { projectionAttributes, updateStateObject } = this.props
        updateStateObject(
          'projectionAttributes',
          { 
            translateX: projectionAttributes.translateX + this.canvasTranslate.dx,
            translateY: projectionAttributes.translateY + this.canvasTranslate.dy 
          })
        this._canvas.style.cursor = 'grab'
        this.canvasTranslate = { dx: 0, dy: 0 }
    }


    // Mouse events related to resizing the canvas

    onWindowMouseDown = (evt) => {
        evt.stopPropagation()
        this.lastWindowTouch = { x: evt.clientX, y: evt.clientY }
        if (EventsHelper.eventOnLeftBorder(evt, this._canvas, BORDER_HOVER_THRESHOLD)) {
            this.setState({ isCanvasResizing: RESIZING.HORIZONTAL_LEFT })
        } else if (EventsHelper.eventOnRightBorder(evt, this._canvas, BORDER_HOVER_THRESHOLD)) {
            this.setState({ isCanvasResizing: RESIZING.HORIZONTAL_RIGHT })
        } else if (EventsHelper.eventOnTopBorder(evt, this._canvas, BORDER_HOVER_THRESHOLD)) {
            this.setState({ isCanvasResizing: RESIZING.VERTICAL_TOP })
        } else if (EventsHelper.eventOnBottomBorder(evt, this._canvas, BORDER_HOVER_THRESHOLD)) {
            this.setState({ isCanvasResizing: RESIZING.VERTICAL_BOTTOM })
        } else {
        }
    } 
    onWindowMouseUp = (evt) => {
        evt.stopPropagation()
        this.setState({ isCanvasResizing: RESIZING.NO })
    }
    onWindowMouseMove = (evt) => {
        evt.stopPropagation()
        const { isCanvasResizing } = this.state

        if (isCanvasResizing == RESIZING.NO) {
            if (EventsHelper.eventOnLeftRightBorder(evt, this._canvas, 10)) {
                this._canvas.style.cursor = 'ew-resize'
            } else if (EventsHelper.eventOnTopBottomBorder(evt, this._canvas, 10)) {
                this._canvas.style.cursor = 'ns-resize'
            } else {
                this._canvas.style.cursor = 'grab'
            }
            return
        }

        if (isCanvasResizing == RESIZING.HORIZONTAL_LEFT || isCanvasResizing == RESIZING.HORIZONTAL_RIGHT) {
            const delta = evt.clientX - this.lastWindowTouch.x
            const sgn = (isCanvasResizing == RESIZING.HORIZONTAL_LEFT) ? -1 : 1
            this._canvas.width += 2 * delta * sgn
        } else if (isCanvasResizing == RESIZING.VERTICAL_TOP || isCanvasResizing == RESIZING.VERTICAL_BOTTOM) {
            const delta = evt.clientY - this.lastWindowTouch.y
            const sgn = (isCanvasResizing == RESIZING.VERTICAL_TOP) ? -1 : 1
            this._canvas.height += 2 * delta * sgn
        }

        this._canvas2.width = this._canvas.width
        this._canvas2.height = this._canvas.height

        d3.select(`#${SVG_ID}`).attr("width", this._canvas.width)
        d3.select(`#${SVG_ID}`).attr("height", this._canvas.height)

        this.lastWindowTouch = { x: evt.clientX, y: evt.clientY }

        this.setState({
            canvasDisplayWidth: this._canvas.width,
            canvasDisplayHeight: this._canvas.height
        })
    }
    render() {    
        const { imageChanged } = this.state
        const { canvasDisplayHeight, canvasDisplayWidth } = this.state
        const { ready } = this.props

        if (!ready) return null

        return (
            <MuiThemeProvider theme={theme}>
                <div onMouseDown={this.onWindowMouseDown}
                  onMouseUp={this.onWindowMouseUp}
                  onMouseMove={this.onWindowMouseMove} >
                    <Dropzone onDrop={this.onNewFile} multiple={false} noClick={true} noKeyboard={true}>
                        {({getRootProps, getInputProps}) => (
                            <section>
                              <div className="header">
                              
                              </div>
                              
                              <div className="content">
                                <div className="all-screen-container">

                                  <div className="all-rendering-container checkerboard-background">
                                    <a href="http://www.kopimi.com/" target="__blank">                                        
                                      <img className="kopimi-logo" src="static/images/kopimi.png"/>
                                    </a>
                                    { !imageChanged &&
                                      <div className="canvas-instructions">
                                        Change the image by dragging and dropping a new one on top of the canvas.
                                      </div>
                                    }
                                    <div className="canvas-container" {...getRootProps()}>
                                      <div className="hidden-elements">
                                        <input {...getInputProps()} />
                                        <img ref={this.onImageRef} onLoad={this.onImageLoad} style={{display: 'none'}}/>
                                        <canvas width={CANVAS_WIDTH} height={CANVAS_HEIGHT} ref={this.onSecondaryCanvasRef} className="secondary-canvas"></canvas>
                                        <div id="svgContainer" className="svg-container">
                                          <svg
                                            ref={this.onSvgRef}
                                            id={SVG_ID}
                                            width={CANVAS_WIDTH}
                                            height={CANVAS_HEIGHT}
                                            version="1.1" 
                                            xmlns="http://www.w3.org/2000/svg" >
                                          </svg>
                                        </div>
                                      </div>

                                      <div className="main-canvas-and-size-container">
                                        <div className="canvas-size-container"> {canvasDisplayWidth} x {canvasDisplayHeight} </div>
                                        <canvas 
                                          width={CANVAS_WIDTH}
                                          height={CANVAS_HEIGHT}
                                          ref={this.onCanvasRef}
                                          className="main-canvas"
                                          onMouseDown={this.onCanvasMouseDown}
                                          onMouseUp={this.onCanvasMouseUp}
                                          onMouseMove={this.onCanvasMouseMove}>
                                        </canvas>
                                      </div>
                                    </div>
                                  </div>

                                  <ControlPanel onDownload={this.onDownload}/>
                                </div>
                              </div>
                            </section>
                    )}
                    </Dropzone>
                </div>
            </MuiThemeProvider>
        )
    }
}

export default withMainContext((context, props) => ({
    // Properties
    projectionAttributes: context.projectionAttributes,
    renderOptions: context.renderOptions,
    downloadOptions: context.downloadOptions,
    layers: context.layers,
    ready: context.ready,

    // Actions
    loadLayers: context.action.loadLayers,
    updateStateObject: context.action.updateStateObject,
    parseStateForDownload: context.action.parseStateForDownload
}))(Main)