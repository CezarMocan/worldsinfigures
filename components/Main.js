import React from 'react'
import Style from '../static/styles/main.less'
import classnames from 'classnames'
import Dropzone from 'react-dropzone'
import DeepDiff from 'deep-diff'
import Modal from '@material-ui/core/Modal'
import Backdrop from '@material-ui/core/Backdrop'
import Fade from '@material-ui/core/Fade'
import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles';  
import { withMainContext, sleep, RENDERERS } from '../context/MainContext'
import shortid from 'shortid'
import * as EventsHelper from '../modules/MouseEventsHelper'
import { getImageData } from './Renderer/RenderHelper'
import { createAndDownloadImage, createAndDownloadSvg, createAndDownloadText, Zipper } from '../modules/DownloadHelper'
import ControlPanel from '../components/ControlPanel'
import { renderLayersToCanvas, renderLayersToSVG } from './Renderer'
import ExportDialog from './ExportDialog'

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
const BORDER_HOVER_THRESHOLD = 10

class Main extends React.PureComponent {
    state = {
      isCanvasResizing: RESIZING.NO,
      imageChanged: false,
      renderingModalOpen: false,
      renderingTotalFrames: 0,
      renderingCurrentFrame: 0
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
      if (!i) return
      this._image = i
      this._image.src="/static/images/test.png" 
    }
    onImageLoad = () => { this.renderMap(this._canvas, this._canvas2, true) }
    onCanvasRef = (c) => { this._canvas = c }
    onSecondaryCanvasRef = (c) => { this._canvas2 = c }
    onExportCanvasRef = (c) => { this._exportCanvas = c }
    onExportBufferCanvasRef = (c) => { this._exportBufferCanvas = c }
    onSvgRef = (s) => { this._svg = s }


    // Convenience getters
    get canvasContext() { return this._canvas.getContext('2d') }
    get secondaryCanvasContext() { return this._canvas2.getContext('2d') }
    get canvasWidth() { return this._canvas.width }
    get canvasHeight() { return this._canvas.height }
    get exportCanvasWidth() { return this._exportCanvas.width }
    get exportCanvasHeight() { return this._exportCanvas.height }

    // Layer rendering
    renderMap = (canvas, bufferCanvas, withCleanSurface = false, optProjectionAttributes) => {
      const projectionAttributes = optProjectionAttributes || this.props.projectionAttributes
      const { layers, renderOptions } = this.props  

      let canvasAttributes = {
        canvasWidth: canvas.width,
        canvasHeight: canvas.height,
        canvasTX: this.canvasTranslate.dx,
        canvasTY: this.canvasTranslate.dy
      }
    
      // Canvas rendering
      if (!this.rasterData || withCleanSurface) {
        this.rasterData = getImageData(this._image, bufferCanvas.getContext('2d'), canvas.width, canvas.height)
      }
      renderLayersToCanvas(canvas, bufferCanvas, this.rasterData, layers, projectionAttributes, canvasAttributes, renderOptions)

      // SVG rendering
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
          // const withCleanSurface = (this.state.isCanvasResizing != oldState.isCanvasResizing)
          const withCleanSurface = true
          this.renderMap(this._canvas, this._canvas2, withCleanSurface)
        }, 0)        
      }
    }

    // Image downloading
    onDownload = () => {        
        const { projectionAttributes, canvasAttributes } = this.props
        let projAttr = { ...projectionAttributes }
        projAttr.scale *= (100 / canvasAttributes.canvasDisplayPercentage);

        this.renderMap(this._exportCanvas, this._exportBufferCanvas, true, projAttr)

        const uid = shortid()
        const { parseStateForDownload } = this.props
        const projectionId = `${projectionAttributes.projection}-${uid}`
        const { downloadOptions } = this.props
        if (downloadOptions.png) createAndDownloadImage(`${projectionId}.png`, this._exportCanvas)
        if (downloadOptions.svg) createAndDownloadSvg(`${projectionId}.svg`, this._svg)
        if (downloadOptions.config) createAndDownloadText(`${projectionId}.txt`, parseStateForDownload())
    }

    onAnimate = async (animationOptions) => {
      const { updateStateObject, projectionAttributes, canvasAttributes, animateOptions } = this.props
      let projAttr = { ...projectionAttributes }
      projAttr.rotateX = animationOptions.x.start
      projAttr.rotateY = animationOptions.y.start
      projAttr.rotateZ = animationOptions.z.start

      projAttr.scale *= (100 / canvasAttributes.canvasDisplayPercentage);
      const mapping = { 'x': 'rotateX', 'y': 'rotateY', 'z': 'rotateZ' }
      
      let totalSteps = 0
      if (animationOptions.x.active) totalSteps = Math.max(totalSteps, Math.ceil(animationOptions.x.total / animationOptions.x.increment))
      if (animationOptions.y.active) totalSteps = Math.max(totalSteps, Math.ceil(animationOptions.y.total / animationOptions.y.increment))
      if (animationOptions.z.active) totalSteps = Math.max(totalSteps, Math.ceil(animationOptions.z.total / animationOptions.z.increment))

      this.setState({
        renderingModalOpen: true,
        renderingTotalFrames: totalSteps
      })

      let zip = new Zipper()
      let filenameIndex = 0
      
      const zipName = {
        root: new Date().getTime(),
        index: 1
      }

      for (let isDone = false; !isDone; isDone) {
        isDone = true
        this.renderMap(this._exportCanvas, this._exportBufferCanvas, true, projAttr)
        await zip.addImage(filenameIndex, this._exportCanvas, this._svg)

        this.setState({ renderingCurrentFrame: filenameIndex + 1 })

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
        if (filenameIndex % animateOptions.imagesPerArchive == 0) {
          await zip.complete(`anim-${zipName.root}-part-${zipName.index}`)
          zip = new Zipper()
          zipName.index++
        }
      }

      await zip.complete(`anim-${zipName.root}-part-${zipName.index}`)

      this.setState({ renderingModalOpen: false })
    }

    onRenderingModalOpen = () => {
      this.setState({ renderingModalOpen: true })
    }
    onRenderingModalClose = () => {
      this.setState({ renderingModalOpen: false })
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
            this.renderMap(this._canvas, this._canvas2, false)    
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

    render() {    
        const { imageChanged, renderingModalOpen, renderingCurrentFrame, renderingTotalFrames } = this.state
        const { canvasAttributes } = this.props
        const { canvasDisplayHeight, canvasDisplayWidth, canvasRatioWidth, canvasRatioHeight, canvasDisplayPercentage } = canvasAttributes
        const canvasRenderWidth = canvasDisplayWidth * canvasDisplayPercentage / 100
        const canvasRenderHeight = canvasDisplayHeight * canvasDisplayPercentage / 100

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
                                    <a href="https://en.wikipedia.org/wiki/Piratbyrån#Kopimi" target="__blank">                                        
                                      <img className="kopimi-logo" src="static/images/kopimi.png"/>
                                    </a>
                                    <div className="canvas-container" {...getRootProps()}>
                                      <div className="hidden-elements">
                                        <input {...getInputProps()} />
                                        <img ref={this.onImageRef} onLoad={this.onImageLoad} className="hidden"/>
                                        <canvas width={canvasRenderWidth} height={canvasRenderHeight} ref={this.onSecondaryCanvasRef} className="secondary-canvas hidden"></canvas>

                                        <canvas width={canvasDisplayWidth} height={canvasDisplayHeight} ref={this.onExportCanvasRef} className="export-render-canvas hidden"></canvas>
                                        <canvas width={canvasDisplayWidth} height={canvasDisplayHeight} ref={this.onExportBufferCanvasRef} className="export-buffer-canvas hidden"></canvas>
                                      </div>

                                      <div className="main-canvas-and-size-container">
                                        <div className="canvas-size-container"> {canvasRenderWidth} x {canvasRenderHeight} ({canvasDisplayWidth} x {canvasDisplayHeight} @ {canvasDisplayPercentage}%) | Aspect ratio – {canvasRatioWidth}:{canvasRatioHeight} </div>
                                        <div>
                                          <canvas 
                                            width={canvasRenderWidth}
                                            height={canvasRenderHeight}
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
                                            width={canvasRenderWidth}
                                            height={canvasRenderHeight}
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
                    <Modal
                      aria-labelledby="transition-modal-title"
                      aria-describedby="transition-modal-description"
                      open={renderingModalOpen}
                      onClose={this.onRenderingModalClose}
                      closeAfterTransition
                      BackdropComponent={Backdrop}
                      BackdropProps={{ timeout: 500 }}
                      style={{display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Fade in={renderingModalOpen}>
                        <ExportDialog onClose={this.onRenderingModalClose} currentFrame={renderingCurrentFrame} totalFrames={renderingTotalFrames} canvas={this._exportCanvas}/>
                      </Fade>
                    </Modal>

                </div>
            </MuiThemeProvider>
        )
    }
}

export default withMainContext((context, props) => ({
    // Properties
    projectionAttributes: context.projectionAttributes,
    canvasAttributes: context.canvasAttributes,
    renderOptions: context.renderOptions,
    downloadOptions: context.downloadOptions,
    animateOptions: context.animateOptions,
    layers: context.layers,
    renderer: context.renderer,
    ready: context.ready,

    // Actions
    loadLayers: context.action.loadLayers,
    updateCanvasWidth: context.action.updateCanvasWidth,
    updateCanvasHeight: context.action.updateCanvasHeight,
    updateStateObject: context.action.updateStateObject,
    parseStateForDownload: context.action.parseStateForDownload
}))(Main)