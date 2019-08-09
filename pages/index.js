import React from 'react'
import Style from '../static/styles/main.less'
import Link from 'next/link'
import classnames from 'classnames'
import * as d3 from 'd3'
import Dropzone from 'react-dropzone'
import * as topojson from 'topojson'
import Slider from '@material-ui/core/Slider'
import InputLabel from '@material-ui/core/InputLabel'
import MenuItem from '@material-ui/core/MenuItem'
import FormHelperText from '@material-ui/core/FormHelperText'
import FormControl from '@material-ui/core/FormControl'
import FormGroup from '@material-ui/core/FormGroup'
import FormControlLabel from '@material-ui/core/FormControlLabel'
import Select from '@material-ui/core/Select'
import Button from '@material-ui/core/Button'
import Checkbox from '@material-ui/core/Checkbox'
import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles';  
import shortid from 'shortid'
import { coordEach } from '@turf/meta'
import cloneDeep from 'clone-deep'
import { projectionsList, projectionsMap } from '../modules/Projections'
import { defaultLayers, layerTypes, propertiesExcludedFromExport } from '../modules/LayerData'
import SliderWithInput from '../components/SliderWithInput'
import { getImageData, projectImageData } from '../modules/RenderHelper'

const theme = createMuiTheme({
    typography: { 
       fontSize: '10pt'
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

export default class Index extends React.PureComponent {
    constructor(props) {
        super(props)
        this.onImageLoad = this.onImageLoad.bind(this)
        this.state = {
            scale: 100,
            rotateX: 0,
            rotateY: 0,
            rotateZ: 0,
            translateX: 50,
            translateY: 50,
            projection: 'geoEquirectangular',
            isCanvasResizing: RESIZING.NO,
            canvasDisplayWidth: CANVAS_WIDTH,
            canvasDisplayHeight: CANVAS_HEIGHT,
            layers: { ...defaultLayers  },
            downloadOptions: {
                png: true,
                svg: true,
                config: true
            }
        }

        this.lastWindowTouch = { x: 0, y: 0 }

        this.isCanvasTouching = false
        this.lastCanvasTouch = { x: 0, y: 0 }
        this.canvasTranslate = { dx: 0, dy: 0 }
        this.canvasTouchThrottleTime = 0

        this.loadLayers()
    }
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
            } else if (l.type === layerTypes.RASTER) {

            }
        }

        this.setState({ layers: loadedLayers })
    }    
    get canvasContext() {
        return this._canvas.getContext('2d')
    }
    get secondaryCanvasContext() {
        return this._canvas2.getContext('2d')
    }
    get canvasWidth() {
        return this._canvas.width
    }
    get canvasHeight() {
        return this._canvas.height
    }
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

        if (this.state.layers.mainImage.visible) {
            const projectedImageData = projectImageData(this.sourceData, this.projection, this.canvasContext, this.canvasWidth, this.canvasHeight)            
            this.secondaryCanvasContext.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
            this.secondaryCanvasContext.putImageData(projectedImageData, 0, 0);    
            this.canvasContext.drawImage(this._canvas2, 0, 0)
        } else {
            this.canvasContext.save()
            this.canvasContext.fillStyle = 'rgba(64, 62, 62, 1)'
            this.canvasContext.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
            this.canvasContext.restore()
        }

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
                this.drawGeoJsonCanvas(newGeoJson, canvasGenerator, context, drawingOptions)
            }

            if (svgOptions.rendersSvg) {
                const svgGenerator = d3.geoPath().projection(p)
                const { svgId } = svgOptions
                this.drawGeoJsonSvg(newGeoJson, svgGenerator, svgId, drawingOptions)
            }
        })
    }
    drawGeoJsonCanvas(geoJson, geoGenerator, context, options) {
        const { lineWidth = 1, color = 'black', fillMode = false, dashed = false } = options

        context.save()
        context.lineWidth = lineWidth;
        context.strokeStyle = color;
        context.fillStyle = color;
        if (dashed) context.setLineDash([2, 2])
        context.beginPath()
        geoGenerator.context(context)(geoJson)
        if (fillMode)
            context.fill()
        else
            context.stroke()
        context.restore()
    }
    drawGeoJsonSvg(geoJson, geoGenerator, svgId, options) {
        const { lineWidth = 1, color = 'black', fillMode = false, dashed = false } = options
        const svg = d3.select(`#${svgId}`)
        svg.append('path')
            .datum(geoJson)
            .attr("d", geoGenerator)
            .attr("fill", fillMode ? color : "none")
            .attr("stroke", fillMode ? "none" : color)
            .attr("stroke-dasharray", dashed ? "2, 2" : "")
            .attr("stroke-width", lineWidth)
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
        // const minX = -1, maxX = 1, minY = -1, maxY = 1
        const minX = 0, maxX = 0, minY = 0, maxY = 0

        for (let i = minX; i <= maxX; i++) {
            for (let j = minY; j <= maxY; j++) {
                // let projection = this.getProjectionFromState(i, j)
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
    onImageLoad() {
        this.renderMap(true)
    }
    onScaleSliderChange = (newValue) => {
        this.setState({ scale: newValue })
    }
    onRotateXSliderChange = (newValue) => {
        this.setState({ rotateX: newValue })
    }
    onRotateYSliderChange = (newValue) => {
        this.setState({ rotateY: newValue })
    }
    onRotateZSliderChange = (newValue) => {
        this.setState({ rotateZ: newValue })
    }
    onTranslateXSliderChange = (newValue) => {
        this.setState({ translateX: newValue })
    }
    onTranslateYSliderChange = (newValue) => {
        this.setState({ translateY: newValue })
    }
    onProjectionSelectChange = (event) => {
        const projection = event.target.value
        this.setState({ projection })
    }
    downloadContent(filename, href) {
        let element = document.createElement('a')

        element.href = href
        element.download = filename      
        element.style.display = 'none';

        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    }
    createAndDownloadText(filename, text) {
        const href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(text)
        this.downloadContent(filename, href)
    }
    createAndDownloadSvg(filename, svgRef) {
        const data = '<?xml version="1.0" encoding="utf-8"?>' + svgRef.outerHTML        
        var svgBlob = new Blob([data], { type:"image/svg+xml;charset=utf-8" })
        var svgUrl = URL.createObjectURL(svgBlob);
        this.downloadContent(filename, svgUrl)
    }
    createAndDownloadImage(filename, canvasRef) {
        const dataUrl = canvasRef.toDataURL('image/png')
        this.downloadContent(filename, dataUrl)
    }
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
        if (downloadOptions.png) this.createAndDownloadImage(`${projectionId}.png`, this._canvas)
        if (downloadOptions.svg) this.createAndDownloadSvg(`${projectionId}.svg`, this._svg)
        if (downloadOptions.config) this.createAndDownloadText(`${projectionId}.txt`, this.parseStateForDownload(this.state))
    }
    componentDidUpdate(oldProps, oldState) {
        const { scale, rotateX, rotateY, rotateZ, translateX, translateY, isCanvasResizing, projection } = this.state
        const { layers } = this.state
        if (scale != oldState.scale ||
            rotateX != oldState.rotateX ||
            rotateY != oldState.rotateY ||
            rotateZ != oldState.rotateZ ||
            translateX != oldState.translateX ||
            translateY != oldState.translateY ||
            projection != oldState.projection ||
            layers != oldState.layers ||
            isCanvasResizing != oldState.isCanvasResizing && !isCanvasResizing) {
                setTimeout(() => {
                    this.updateProjection()
                    const withCleanSurface = (isCanvasResizing != oldState.isCanvasResizing)
                    this.renderMap(withCleanSurface)    
                }, 0)        
        }    
    }
    onImageRef = (i) => {
        this._image = i
        this._image.src="/static/images/test.png" 
    }
    onCanvasRef = (c) => {
        this._canvas = c
    }
    onSecondaryCanvasRef = (c) => {
        this._canvas2 = c
    }
    onSvgRef = (s) => {
        this._svg = s
    }
    handleCheckboxChange = layerName => event => {
        this.setState({
            ...this.state,
            layers: {
                ...this.state.layers,
                [layerName]: {
                    ...this.state.layers[layerName],
                    visible: event.target.checked
                }
            }
        })
    }
    updateDownloadOptions = optionName => event => {
        this.setState({
            ...this.state,
            downloadOptions: {
                ...this.state.downloadOptions,
                [optionName]: event.target.checked
            }
        })
    }
    onNewFile = (files) => {
        const file = files[0]
        const reader = new FileReader()
        reader.addEventListener("load", () => {
            this._image.src = reader.result
        }, false)

        if (file) reader.readAsDataURL(file)
    }
    eventOnLeftBorder = (evt, el, thresh) => {
        const br = el.getBoundingClientRect()
        const { clientX, clientY } = evt
        return (Math.abs(clientX - br.left) < thresh)
    }
    eventOnRightBorder = (evt, el, thresh) => {
        const br = el.getBoundingClientRect()
        const { clientX, clientY } = evt
        return (Math.abs(clientX - br.right) < thresh)
    }
    eventOnLeftRightBorder = (evt, el, thresh) => {
        return (this.eventOnLeftBorder(evt, el, thresh) || this.eventOnRightBorder(evt, el, thresh))
    }
    eventOnTopBorder = (evt, el, thresh) => {
        const br = el.getBoundingClientRect()
        const { clientX, clientY } = evt
        return (Math.abs(clientY - br.top) < thresh)
    }

    eventOnBottomBorder = (evt, el, thresh) => {
        const br = el.getBoundingClientRect()
        const { clientX, clientY } = evt
        return (Math.abs(clientY - br.bottom) < thresh)
    }
    eventOnTopBottomBorder = (evt, el, thresh) => {
        return (this.eventOnTopBorder(evt, el, thresh) || this.eventOnBottomBorder(evt, el, thresh))
    }

    onCanvasMouseDown = (evt) => {
        if (this.eventOnLeftRightBorder(evt, this._canvas, BORDER_HOVER_THRESHOLD)) return
        if (this.eventOnTopBottomBorder(evt, this._canvas, BORDER_HOVER_THRESHOLD)) return
        this.isCanvasTouching = true
        this.lastCanvasTouch = { x: evt.clientX, y: evt.clientY }
        this.canvasTranslate = { dx: 0, dy: 0 }
        this._canvas.style.cursor = 'grabbing'
    }

    onCanvasMouseMove = (evt) => {
        if (!this.isCanvasTouching) return
        const now = new Date().getTime()
        if (now - this.canvasTouchThrottleTime < 100) return
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

    onWindowMouseDown = (evt) => {
        evt.stopPropagation()
        this.lastWindowTouch = { x: evt.clientX, y: evt.clientY }
        if (this.eventOnLeftBorder(evt, this._canvas, BORDER_HOVER_THRESHOLD)) {
            this.setState({ isCanvasResizing: RESIZING.HORIZONTAL_LEFT })
        } else if (this.eventOnRightBorder(evt, this._canvas, BORDER_HOVER_THRESHOLD)) {
            this.setState({ isCanvasResizing: RESIZING.HORIZONTAL_RIGHT })
        } else if (this.eventOnTopBorder(evt, this._canvas, BORDER_HOVER_THRESHOLD)) {
            this.setState({ isCanvasResizing: RESIZING.VERTICAL_TOP })
        } else if (this.eventOnBottomBorder(evt, this._canvas, BORDER_HOVER_THRESHOLD)) {
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
            if (this.eventOnLeftRightBorder(evt, this._canvas, 10)) {
                this._canvas.style.cursor = 'ew-resize'
            } else if (this.eventOnTopBottomBorder(evt, this._canvas, 10)) {
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
        const { layers } = this.state
        const { canvasDisplayHeight, canvasDisplayWidth } = this.state
        const { downloadOptions } = this.state

        return (
            <MuiThemeProvider theme={theme}>
                <div
                    onMouseDown={this.onWindowMouseDown}
                    onMouseUp={this.onWindowMouseUp}
                    onMouseMove={this.onWindowMouseMove}
                >
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
                                                        onChange={this.onProjectionSelectChange}
                                                    >
                                                        { projectionsList.map(p => <MenuItem key={p.id} value={p.id}>{p.displayName}</MenuItem>) }
                                                    </Select>
                                                </FormControl>
                                            </div>
                                            <h1> Parameters </h1>
                                            <div className="controls sliders">
                                                <SliderWithInput label="Scale" min={3} max={500} initialValue={scale} onValueChange={this.onScaleSliderChange}/>
                                                <SliderWithInput label="X Rotation" min={0} max={360} step={2.5} initialValue={rotateX} onValueChange={this.onRotateXSliderChange}/>
                                                <SliderWithInput label="Y Rotation" min={0} max={360} step={2.5} initialValue={rotateY} onValueChange={this.onRotateYSliderChange}/>
                                                <SliderWithInput label="Z Rotation" min={0} max={360} step={2.5} initialValue={rotateZ} onValueChange={this.onRotateZSliderChange}/>
                                                <SliderWithInput label="X Offset" min={0} max={200} initialValue={translateX} onValueChange={this.onTranslateXSliderChange}/>
                                                <SliderWithInput label="Y Offset" min={0} max={200} initialValue={translateY} onValueChange={this.onTranslateYSliderChange}/>
                                            </div>

                                            <h1> Layers </h1>
                                            <div className="controls checkboxes">
                                                <FormGroup row>
                                                    {
                                                        Object.keys(layers).map(k => {
                                                            const l = layers[k]
                                                            return (
                                                                <FormControlLabel
                                                                    key={`layer-${k}`}
                                                                    control={ <Checkbox color="default" checked={l.visible} onChange={this.handleCheckboxChange(k)} /> }
                                                                    label={l.displayName}
                                                                />        
                                                            )
                                                        })
                                                    }
                                                </FormGroup>
                                            </div>

                                            <h1> Export </h1>
                                            <div className="controls download">
                                                <div className="download-options">
                                                    <FormGroup column>
                                                        <FormControlLabel
                                                            control={ <Checkbox color="default" checked={downloadOptions.png} onChange={this.updateDownloadOptions('png')} /> }
                                                            label="PNG"
                                                        />        
                                                        <FormControlLabel
                                                            control={ <Checkbox color="primary" checked={downloadOptions.svg} onChange={this.updateDownloadOptions('svg')} /> }
                                                            label="SVG"
                                                        />        
                                                        <FormControlLabel
                                                            control={ <Checkbox color="secondary" checked={downloadOptions.config} onChange={this.updateDownloadOptions('config')} /> }
                                                            label="CONFIG"
                                                        />        
                                                    </FormGroup>
                                                </div>

                                                <div className="download-button">
                                                    <a href="#" ref={(r) => {this._downloadButton = r}} onClick={this.onDownloadClick} download="">
                                                        <Button variant="outlined">
                                                            Download
                                                        </Button>
                                                    </a>
                                                </div>
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