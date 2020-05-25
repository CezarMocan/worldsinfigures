import React from 'react'
import Style from '../static/styles/main.less'
import classnames from 'classnames'
import * as d3 from 'd3'
import Dropzone from 'react-dropzone'
import DeepDiff from 'deep-diff'
import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles';  
import { withMainContext, sleep, RENDERERS } from '../context/MainContext'
import shortid from 'shortid'
import * as EventsHelper from '../modules/MouseEventsHelper'
import { getImageData } from './Renderer/RenderHelper'
import { createAndDownloadImage, createAndDownloadSvg, createAndDownloadText, Zipper } from '../modules/DownloadHelper'
import ControlPanel from '../components/ControlPanel'
import { renderLayersToCanvas, renderLayersToSVG } from './Renderer'

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
    state = {
      isCanvasResizing: RESIZING.NO,
      canvasDisplayWidth: CANVAS_WIDTH,
      canvasDisplayHeight: CANVAS_HEIGHT,
      imageChanged: false
    }

    constructor(props) {
      super(props)
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

    // Layer rendering
    renderMap = (withCleanSurface = false, optProjectionAttributes) => {
      const projectionAttributes = optProjectionAttributes || this.props.projectionAttributes
      const { layers, renderOptions } = this.props  

      let canvasAttributes = {
        canvasWidth: this.canvasWidth,
        canvasHeight: this.canvasHeight,
        canvasTX: this.canvasTranslate.dx,
        canvasTY: this.canvasTranslate.dy
      }
    
      if (!this.rasterData || withCleanSurface) {
        this.rasterData = getImageData(this._image, this.secondaryCanvasContext, this.canvasWidth, this.canvasHeight)
      }
      renderLayersToCanvas(this._canvas, this._canvas2, this.rasterData, layers, projectionAttributes, canvasAttributes, renderOptions)
      renderLayersToSVG(SVG_ID, layers, projectionAttributes, canvasAttributes, renderOptions)
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

    onAnimate = async (animationOptions) => {
      const { updateStateObject, projectionAttributes } = this.props
      let projAttr = { ...projectionAttributes }
      projAttr.rotateX = animationOptions.x.start
      projAttr.rotateY = animationOptions.y.start
      projAttr.rotateZ = animationOptions.z.start
      const mapping = { 'x': 'rotateX', 'y': 'rotateY', 'z': 'rotateZ' }
      
      let zip = new Zipper()
      let filenameIndex = 0

      for (let isDone = false; !isDone; isDone) {
        isDone = true
        this.renderMap(false, projAttr)
        await zip.addImage(filenameIndex, this._canvas, this._svg)

        let axes = ['x', 'y', 'z']
        axes.forEach(axis => {
          if (!animationOptions[axis].active) return
          let currAttr = mapping[axis]
          projAttr[currAttr] += animationOptions[axis].increment
          if (projAttr[currAttr] <= animationOptions[axis].start + animationOptions[axis].total)
            isDone = false
        })

        await sleep(0.05)
        filenameIndex++
      }

      await zip.complete()
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
        const { renderer } = this.props
        const currCanvas = renderer == RENDERERS.canvas ? this._canvas : this._svg
        if (EventsHelper.eventOnLeftRightBorder(evt, currCanvas, BORDER_HOVER_THRESHOLD)) return
        if (EventsHelper.eventOnTopBottomBorder(evt, currCanvas, BORDER_HOVER_THRESHOLD)) return
        this.isCanvasTouching = true
        this.lastCanvasTouch = { x: evt.clientX, y: evt.clientY }
        this.canvasTranslate = { dx: 0, dy: 0 }
        currCanvas.style.cursor = 'grabbing'
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
            this.renderMap()    
        }, 0)
        // this._canvas.style.cursor = 'grabbing'
    } 

    onCanvasMouseUp = (evt) => {
        this.isCanvasTouching = false
        this.lastCanvasTouch = { x: evt.clientX, y: evt.clientY }
        const { projectionAttributes, updateStateObject, renderer } = this.props
        const currCanvas = renderer == RENDERERS.canvas ? this._canvas : this._svg
        updateStateObject(
          'projectionAttributes',
          { 
            translateX: projectionAttributes.translateX + this.canvasTranslate.dx,
            translateY: projectionAttributes.translateY + this.canvasTranslate.dy 
          })
        currCanvas.style.cursor = 'grab'
        this.canvasTranslate = { dx: 0, dy: 0 }
    }


    // Mouse events related to resizing the canvas

    onWindowMouseDown = (evt) => {
        const { renderer } = this.props
        const currCanvas = renderer == RENDERERS.canvas ? this._canvas : this._svg
        evt.stopPropagation()
        this.lastWindowTouch = { x: evt.clientX, y: evt.clientY }
        if (EventsHelper.eventOnLeftBorder(evt, currCanvas, BORDER_HOVER_THRESHOLD)) {
            this.setState({ isCanvasResizing: RESIZING.HORIZONTAL_LEFT })
        } else if (EventsHelper.eventOnRightBorder(evt, currCanvas, BORDER_HOVER_THRESHOLD)) {
            this.setState({ isCanvasResizing: RESIZING.HORIZONTAL_RIGHT })
        } else if (EventsHelper.eventOnTopBorder(evt, currCanvas, BORDER_HOVER_THRESHOLD)) {
            this.setState({ isCanvasResizing: RESIZING.VERTICAL_TOP })
        } else if (EventsHelper.eventOnBottomBorder(evt, currCanvas, BORDER_HOVER_THRESHOLD)) {
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
        const { renderer } = this.props
        const currCanvas = renderer == RENDERERS.canvas ? this._canvas : this._svg
        const { isCanvasResizing } = this.state

        if (isCanvasResizing == RESIZING.NO) {
            if (EventsHelper.eventOnLeftRightBorder(evt, currCanvas, 10)) {
              currCanvas.style.cursor = 'ew-resize'
            } else if (EventsHelper.eventOnTopBottomBorder(evt, currCanvas, 10)) {
              currCanvas.style.cursor = 'ns-resize'
            } else if (this.isCanvasTouching) {
              currCanvas.style.cursor = 'grabbing'
            } else {
              currCanvas.style.cursor = 'grab'
            }
            return
        }

        let { canvasDisplayWidth, canvasDisplayHeight } = this.state

        if (isCanvasResizing == RESIZING.HORIZONTAL_LEFT || isCanvasResizing == RESIZING.HORIZONTAL_RIGHT) {
            const delta = evt.clientX - this.lastWindowTouch.x
            const sgn = (isCanvasResizing == RESIZING.HORIZONTAL_LEFT) ? -1 : 1
            canvasDisplayWidth += 2 * delta * sgn
        } else if (isCanvasResizing == RESIZING.VERTICAL_TOP || isCanvasResizing == RESIZING.VERTICAL_BOTTOM) {
            const delta = evt.clientY - this.lastWindowTouch.y
            const sgn = (isCanvasResizing == RESIZING.VERTICAL_TOP) ? -1 : 1
            canvasDisplayHeight += 2 * delta * sgn
        }

        // d3.select(`#${SVG_ID}`).attr("width", this._canvas.width)
        // d3.select(`#${SVG_ID}`).attr("height", this._canvas.height)

        this.lastWindowTouch = { x: evt.clientX, y: evt.clientY }
        this.setState({ canvasDisplayWidth, canvasDisplayHeight })
    }
    render() {    
        const { imageChanged } = this.state
        const { canvasDisplayHeight, canvasDisplayWidth } = this.state
        const { ready, renderer } = this.props

        if (!ready) return null

        const canvasCls = classnames({ 'main-canvas': true, 'hidden': renderer != RENDERERS.canvas })
        const svgCls = classnames({ 'svg-canvas': true, 'hidden': renderer != RENDERERS.svg })

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
                                        <img ref={this.onImageRef} onLoad={this.onImageLoad} className="hidden"/>
                                        <canvas width={canvasDisplayWidth} height={canvasDisplayHeight} ref={this.onSecondaryCanvasRef} className="secondary-canvas hidden"></canvas>
                                      </div>

                                      <div className="main-canvas-and-size-container">
                                        <div className="canvas-size-container"> {canvasDisplayWidth} x {canvasDisplayHeight} </div>
                                        <div>
                                          <canvas 
                                            width={canvasDisplayWidth}
                                            height={canvasDisplayHeight}
                                            ref={this.onCanvasRef}
                                            className={canvasCls}
                                            onMouseDown={this.onCanvasMouseDown}
                                            onMouseUp={this.onCanvasMouseUp}
                                            onMouseMove={this.onCanvasMouseMove}>
                                          </canvas>                                        
                                          <svg
                                            ref={this.onSvgRef}
                                            className={svgCls}
                                            id={SVG_ID}
                                            width={canvasDisplayWidth}
                                            height={canvasDisplayHeight}
                                            onMouseDown={this.onCanvasMouseDown}
                                            onMouseUp={this.onCanvasMouseUp}
                                            onMouseMove={this.onCanvasMouseMove}  
                                            version="1.1" 
                                            xmlns="http://www.w3.org/2000/svg" >
                                          </svg>
                                        </div>
                                        
                                      </div>
                                    </div>
                                  </div>

                                  <ControlPanel 
                                    onDownload={this.onDownload}
                                    onAnimate={this.onAnimate.bind(this)}
                                  />
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
    renderer: context.renderer,
    ready: context.ready,

    // Actions
    loadLayers: context.action.loadLayers,
    updateStateObject: context.action.updateStateObject,
    parseStateForDownload: context.action.parseStateForDownload
}))(Main)