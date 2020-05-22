import React from 'react'
import Style from '../static/styles/main.less'
import * as d3 from 'd3'
import Dropzone from 'react-dropzone'
import MenuItem from '@material-ui/core/MenuItem'
import FormControl from '@material-ui/core/FormControl'
import FormGroup from '@material-ui/core/FormGroup'
import FormControlLabel from '@material-ui/core/FormControlLabel'
import Select from '@material-ui/core/Select'
import Button from '@material-ui/core/Button'
import Checkbox from '@material-ui/core/Checkbox'
import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles';  
import { withMainContext } from '../context/MainContext'
import shortid from 'shortid'
import cloneDeep from 'clone-deep'
import * as EventsHelper from '../modules/MouseEventsHelper'
import { projectionsList, projectionsMap } from '../modules/Projections'
import { defaultLayers, layerTypes, propertiesExcludedFromExport } from '../data/LayerData'
import { getImageData, projectImageData, drawGeoJsonCanvas, drawGeoJsonSvg } from '../modules/RenderHelper'
import { createAndDownloadImage, createAndDownloadSvg, createAndDownloadText } from '../modules/DownloadHelper'
import { duplicateOnHemispheres } from '../modules/GeoJsonHelper'
import SliderWithInput from '../components/SliderWithInput'
import ProjectionItem from '../components/ProjectionItem'
import LayerItem from '../components/LayerItem'

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
            scale: 100,
            rotateX: 0,
            rotateY: 0,
            rotateZ: 0,
            translateX: 50,
            translateY: 50,
            projection: 'geoEquirectangular',
            clipToEarthBounds: false,
            tileVectors: false,
            isCanvasResizing: RESIZING.NO,
            canvasDisplayWidth: CANVAS_WIDTH,
            canvasDisplayHeight: CANVAS_HEIGHT,
            layers: { ...defaultLayers  },
            downloadOptions: {
                png: true,
                svg: true,
                config: true
            },
            imageChanged: false
        }

        this.lastWindowTouch = { x: 0, y: 0 }
        this.isCanvasTouching = false
        this.lastCanvasTouch = { x: 0, y: 0 }
        this.canvasTranslate = { dx: 0, dy: 0 }
        this.canvasTouchThrottleTime = 0

        this.loadLayers()
    }

    // Loading raster and vector data
    async loadLayers() {
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
                if (l.duplicateHemispheres)
                    l.geojsonObject = duplicateOnHemispheres(l.geojsonObject)
            } else if (l.type === layerTypes.RASTER) {

            }
        }

        this.setState({ layers: loadedLayers })
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
    renderMap(withCleanSurface = false) {
        // Get image pixels if the image was updated or if we're just getting started
        if (!this.sourceData || withCleanSurface) {
            this.sourceData = getImageData(this._image, this.secondaryCanvasContext, this.canvasWidth, this.canvasHeight)
        }

        // Clear canvas
        this.canvasContext.clearRect(0, 0, this.canvasWidth, this.canvasHeight);

        // Clear SVG
        d3.select(`#${SVG_ID}`).selectAll('*').remove()

        this.canvasContext.save()

        // Clip to earth sphere bounds, if the option is active
        const { clipToEarthBounds } = this.state
        if (clipToEarthBounds) {
            const proj = this.projections.find(p => p.offsetX == 0 && p.offsetY == 0)
            const clipGenerator = d3.geoPath().projection(proj.p).context(this.canvasContext)
            this.canvasContext.beginPath()
            clipGenerator({type: "Sphere"}) 
            this.canvasContext.clip()    
        }

        // Draw raster image
        if (this.state.layers.mainImage.visible) {
            const projectedImageData = projectImageData(this.sourceData, this.projection, this.canvasContext, this.canvasWidth, this.canvasHeight)            
            this.secondaryCanvasContext.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
            this.secondaryCanvasContext.putImageData(projectedImageData, 0, 0);    
            this.canvasContext.drawImage(this._canvas2, 0, 0)
        }

        // Draw vector layers on top of raster image
        const { layers } = this.state
        Object.values(layers).forEach(l => {
            if (l.type != layerTypes.VECTOR) return
            if (!l.visible) return
            this.drawGeoJsonTiled(
                this.projections, 
                l.geojsonObject,
                { rendersCanvas: true, context: this.canvasContext },
                { rendersSvg: true, svgId: SVG_ID },
                l.style
            )
        })

        this.canvasContext.restore()
    }
    drawGeoJsonTiled(projections, geoJson, canvasOptions, svgOptions, drawingOptions) {
        projections.forEach(projection => {
            const { p, offsetX, offsetY } = projection

            const newGeoJson = cloneDeep(geoJson)

            if (canvasOptions.rendersCanvas) {
                const canvasGenerator = d3.geoPath().projection(p)
                const { context } = canvasOptions
                drawGeoJsonCanvas(newGeoJson, canvasGenerator, context, drawingOptions)
            }

            if (svgOptions.rendersSvg) {
                const svgGenerator = d3.geoPath().projection(p)
                const { svgId } = svgOptions
                drawGeoJsonSvg(newGeoJson, svgGenerator, svgId, drawingOptions)
            }
        })
    }
    getProjectionFromState(offsetXFactor, offsetYFactor) {
        let { scale, rotateX, rotateY, rotateZ, translateX, translateY, projection } = this.state
        translateX += (this.canvasTranslate.dx || 0)
        translateY += (this.canvasTranslate.dy || 0)
        const currentProjection = projectionsMap[projection]
        let proj = currentProjection.fn()

        if (proj.scale) proj = proj.scale(scale)

        const offsetXValue = offsetXFactor * (2 * Math.PI * scale)
        const offsetYValue = offsetYFactor * (Math.PI * scale)
        if (proj.translate) proj = proj.translate([offsetXValue + this.canvasWidth / 2 + this.canvasWidth * (translateX - 50) / 50, offsetYValue + this.canvasHeight / 2 + this.canvasHeight * (translateY - 50) / 50])

        if (proj.rotate) proj = proj.rotate([rotateX, rotateY, rotateZ])

        if (proj.precision) proj = proj.precision(0.01)

        return proj
    }
    updateProjection() {
        this.projection = this.getProjectionFromState(0, 0)
        this.projections = []
        let minX = 0, maxX = 0, minY = 0, maxY = 0        
        
        const { tileVectors } = this.state
        if (tileVectors) {
            minX = minY = -1
            maxX = maxY = 1
        }

        for (let i = minX; i <= maxX; i++) {
            for (let j = minY; j <= maxY; j++) {
                let projection = this.getProjectionFromState(i, j)
                this.projections.push({
                    offsetX: i,
                    offsetY: j,
                    p: projection
                })
            }
        }
    }
    componentDidMount() {
        this.updateProjection()
    }
    componentDidUpdate(oldProps, oldState) {
        const renderRelatedState = ['scale', 'rotateX', 'rotateY', 'rotateZ', 'translateX', 
            'translateY', 'isCanvasResizing', 'projection', 'clipToEarthBounds', 'tileVectors',
            'layers']

        let needsReRender = renderRelatedState.reduce((acc, p) => {
            return (acc || (this.state[p] != oldState[p]))
        }, false)

        if (needsReRender) {
            setTimeout(() => {
                this.updateProjection()
                const withCleanSurface = (this.state.isCanvasResizing != oldState.isCanvasResizing)
                this.renderMap(withCleanSurface)    
            }, 0)        
        }
    }

    // Handling updates to right-side panel options

    onProjectionSelectionUpdate = (event) => {
        this.setState({ projection: event.target.value })
    }
    onSliderUpdate = sliderName => newValue => {
        this.setState({ [sliderName]: newValue })
    }
    onLayerToggleUpdate = layerName => newVisible => {
        this.setState({
            ...this.state,
            layers: {
                ...this.state.layers,
                [layerName]: {
                    ...this.state.layers[layerName],
                    visible: newVisible
                }
            }
        })
    }
    onLayerColorUpdate = layerName => newColor => {
        this.setState({
            ...this.state,
            layers: {
                ...this.state.layers,
                [layerName]: {
                    ...this.state.layers[layerName],
                    style: {
                        ...this.state.layers[layerName].style,
                        color: newColor
                    }
                }
            }
        })
    }
    onCheckboxUpdate = optionName => event => {
        this.setState({ [optionName]: event.target.checked })
    }
    onDownloadOptionsUpdate = optionName => event => {
        this.setState({
            ...this.state,
            downloadOptions: {
                ...this.state.downloadOptions,
                [optionName]: event.target.checked
            }
        })
    }
    // Image downloading

    parseStateForDownload(state) {
        const layersSimplified = Object.keys(state.layers).reduce((acc, k) => {
            const layer = state.layers[k]
            acc[k] = {}
            Object.keys(layer).forEach(lk => {
                if (propertiesExcludedFromExport.indexOf(lk) != -1) return
                acc[k][lk] = layer[lk]
            })
            return acc
        }, {})

        const stateSimplified = {
            ...state,
            layers: layersSimplified
        }

        return JSON.stringify(stateSimplified, null, 4)
    }
    onDownloadClick = () => {
        const uid = shortid()
        const projectionId = `${this.state.projection}-${uid}`
        const { downloadOptions } = this.state
        if (downloadOptions.png) createAndDownloadImage(`${projectionId}.png`, this._canvas)
        if (downloadOptions.svg) createAndDownloadSvg(`${projectionId}.svg`, this._svg)
        if (downloadOptions.config) createAndDownloadText(`${projectionId}.txt`, this.parseStateForDownload(this.state))
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
        this.setState({
            translateX: this.state.translateX + this.canvasTranslate.dx,
            translateY: this.state.translateY + this.canvasTranslate.dy,
        }, () => {
            this._canvas.style.cursor = 'grab'
            this.canvasTranslate = { dx: 0, dy: 0 }
        })
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
        const { scale, rotateX, rotateY, rotateZ, translateX, translateY, projection } = this.state
        const { clipToEarthBounds, tileVectors, imageChanged } = this.state
        const { layers } = this.state
        const { canvasDisplayHeight, canvasDisplayWidth } = this.state
        const { downloadOptions } = this.state

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
                                                            xmlns="http://www.w3.org/2000/svg" 
                                                        >
                                                        </svg>
                                                    </div>
                                                </div>

                                                <div className="main-canvas-and-size-container">
                                                    <div className="canvas-size-container">
                                                        {canvasDisplayWidth} x {canvasDisplayHeight}
                                                    </div>
                                                    <canvas 
                                                        width={CANVAS_WIDTH}
                                                        height={CANVAS_HEIGHT}
                                                        ref={this.onCanvasRef}
                                                        className="main-canvas"
                                                        onMouseDown={this.onCanvasMouseDown}
                                                        onMouseUp={this.onCanvasMouseUp}
                                                        onMouseMove={this.onCanvasMouseMove}                    
                                                    ></canvas>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="all-controls-container">
                                            <h1> Projection </h1>
                                            <div className="controls projection">
                                                <FormControl className="form-control projection-form">
                                                    <Select
                                                        value={projection}
                                                        onChange={this.onProjectionSelectionUpdate}
                                                    >
                                                        { projectionsList.map(p => (
                                                            <MenuItem key={p.id} value={p.id}>
                                                                <ProjectionItem displayName={p.displayName} flagEmoji={p.flagEmoji} genderEmoji={p.genderEmoji} year={p.year}/>
                                                            </MenuItem>
                                                            )) 
                                                        }
                                                    </Select>
                                                </FormControl>
                                            </div>
                                            <h1> Parameters </h1>
                                            <div className="controls sliders">
                                                <SliderWithInput label="Scale" min={3} max={500} initialValue={scale} onValueChange={this.onSliderUpdate('scale')}/>
                                                <SliderWithInput label="X Rotation" min={0} max={360} step={2.5} initialValue={rotateX} onValueChange={this.onSliderUpdate('rotateX')}/>
                                                <SliderWithInput label="Y Rotation" min={0} max={360} step={2.5} initialValue={rotateY} onValueChange={this.onSliderUpdate('rotateY')}/>
                                                <SliderWithInput label="Z Rotation" min={0} max={360} step={2.5} initialValue={rotateZ} onValueChange={this.onSliderUpdate('rotateZ')}/>
                                                <SliderWithInput label="X Offset" min={0} max={200} initialValue={translateX} onValueChange={this.onSliderUpdate('translateX')}/>
                                                <SliderWithInput label="Y Offset" min={0} max={200} initialValue={translateY} onValueChange={this.onSliderUpdate('translateY')}/>
                                            </div>

                                            <h1> Rendering </h1>
                                            <div className="controls rendering">
                                                <FormGroup row>
                                                    <FormControlLabel
                                                        control={ <Checkbox color="default" checked={clipToEarthBounds} onChange={this.onCheckboxUpdate('clipToEarthBounds')} /> }
                                                        label="Clipping"
                                                    />        
                                                    <FormControlLabel
                                                        control={ <Checkbox color="primary" checked={tileVectors} onChange={this.onCheckboxUpdate('tileVectors')} /> }
                                                        label="Vector Tiling (experimental)"
                                                    />
                                                </FormGroup>
                                            </div>

                                            <h1> Layers </h1>
                                            <div className="controls checkboxes">
                                                { Object.keys(layers).map(k => {
                                                    const l = layers[k]
                                                    return (
                                                        <LayerItem
                                                            key={`layer-${k}`}
                                                            visible={l.visible}
                                                            color={l.style && l.style.color}                                                            
                                                            onVisibilityUpdate={this.onLayerToggleUpdate(k)}
                                                            onColorChange={this.onLayerColorUpdate(k)}
                                                            label={l.displayName}
                                                        />
                                                    )
                                                })}

                                            </div>

                                            <h1> Export </h1>
                                            <div className="controls download">
                                                <div className="download-options">
                                                    <FormGroup row>
                                                        <FormControlLabel
                                                            control={ <Checkbox color="default" checked={downloadOptions.png} onChange={this.onDownloadOptionsUpdate('png')} /> }
                                                            label="PNG"
                                                        />        
                                                        <FormControlLabel
                                                            control={ <Checkbox color="primary" checked={downloadOptions.svg} onChange={this.onDownloadOptionsUpdate('svg')} /> }
                                                            label="SVG"
                                                        />        
                                                        <FormControlLabel
                                                            control={ <Checkbox color="secondary" checked={downloadOptions.config} onChange={this.onDownloadOptionsUpdate('config')} /> }
                                                            label="CONFIG"
                                                        />        
                                                    </FormGroup>
                                                </div>

                                                <div className="download-button">
                                                    <a href="#" ref={(r) => {this._downloadButton = r}} onClick={this.onDownloadClick}>
                                                        <Button variant="outlined">
                                                            Download
                                                        </Button>
                                                    </a>
                                                </div>
                                            </div>

                                            <h1> Tools </h1>
                                            <div className="controls tools">
                                                <a href="/convert" target="__blank">
                                                    <Button variant="outlined">
                                                        SVG to GeoJSON
                                                    </Button>
                                                </a>
                                            </div>

                                        </div>
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

    // Actions
    updateProjectionAttributes: context.action.updateProjectionAttributes,
}))(Main)