import React from 'react'
import Style from '../static/styles/main.less'
import Link from 'next/link'
import classnames from 'classnames'
import * as d3 from 'd3'
import * as d3Geo from "d3-geo"
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
import shortid from 'shortid'
import { coordEach } from '@turf/meta'
import cloneDeep from 'clone-deep'
import { projectionsList, projectionsMap } from '../modules/Projections'
import { graticuleStyle, worldMapStyle, submarineCablesStyle, allRedLineStyle, gedyminHeadStyle, twoGedyminHeadsStyle, tissotStyle } from '../modules/LayerStyles'
import SliderWithInput from '../components/SliderWithInput'

const RESIZING = {
    NO: 0,
    HORIZONTAL: 1,
    VERTICAL: 2
}

const SVG_ID = 'svgProjection'
const CANVAS_WIDTH = 600
const CANVAS_HEIGHT = 300

const layerTypes = {
    RASTER: 'RASTER',
    VECTOR: 'VECTOR'
}

const defaultLayers = {
    mainImage: {
        visible: true,
        type: layerTypes.RASTER,
        imageObject: null,
        path: '/static/images/test.png'
    },
    graticule: {
        visible: false,
        type: layerTypes.VECTOR,
        geojsonObject: null,
        generatorFunction: d3.geoGraticule(),
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
        path: '/static/misc/world-110m.json',
        geojsonObject: null,
        style: {
            lineWidth: 1,
            color: '#ccc',
            fillMode: false,
            dashed: true        
        }
    },
    submarineCables: {
        visible: false,
        type: layerTypes.VECTOR,
        path: '/static/misc/cable-geo.json',
        geojsonObject: null,
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
        path: '/static/misc/all-red-line-geo.json',
        geojsonObject: null,
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
        path: '/static/misc/face-geo.json',
        geojsonObject: null,
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
        path: '/static/misc/two-faces.topojson',
        geojsonObject: null,
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
        path: '/static/misc/tissot.topojson',
        geojsonObject: null,
        style: {
            lineWidth: 0.5,
            color: 'rgba(255, 230, 255, 0.2)',
            fillMode: true,
            dashed: false
        }        
    }
}

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
            rendersImage: true,
            rendersGraticule: false,
            rendersWorldMap: false,
            rendersSubmarineCables: false,
            rendersAllRedLine: false,
            rendersGedyminHead: false,
            rendersTwoGedyminHeads: false,
            rendersTissot: false,
            isCanvasResizing: RESIZING.NO,
        }

        this.lastWindowTouch = { x: 0, y: 0 }

        this.isCanvasTouching = false
        this.lastCanvasTouch = { x: 0, y: 0 }
        this.canvasTranslate = { dx: 0, dy: 0 }
        this.canvasTouchThrottleTime = 0

        this.loadGeoJson()
    }
    async loadGeoJson() {
        this.cablesMapGeoJson = await d3.json('/static/misc/cable-geo.json')
        this.allRedLineMapGeoJson = await d3.json('/static/misc/all-red-line-geo.json')
        this.gedyminHeadGeoJson = await d3.json('/static/misc/face-geo.json')

        const tissot = await d3.json('/static/misc/tissot.topojson')
        this.tissotGeoJson = topojson.feature(tissot, tissot.objects.tissot)

        const twoHeads = await d3.json('/static/misc/two-faces.topojson')
        this.twoGedyminHeadsGeoJson = topojson.feature(twoHeads, twoHeads.objects.gedymin)

        const w50m = await d3.json('/static/misc/world-110m.json')
        this.worldGeoJson = topojson.feature(w50m, w50m.objects.countries)

        console.log('Loaded geojson files!')
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
        const dx = this._image.width
        const dy = this._image.height

        const { rendersImage, 
            rendersGraticule, 
            rendersSubmarineCables, 
            rendersWorldMap, 
            rendersAllRedLine, 
            rendersGedyminHead,
            rendersTwoGedyminHeads,
            rendersTissot } = this.state

        if (!this.sourceData || withCleanSurface) {
            this.secondaryCanvasContext.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
            this.secondaryCanvasContext.save()
            this.secondaryCanvasContext.drawImage(this._image, 0, 0, dx, dy, 0, 0, this.canvasWidth, this.canvasHeight)
            this.secondaryCanvasContext.restore()
            this.sourceData = this.secondaryCanvasContext.getImageData(0, 0, this.canvasWidth, this.canvasHeight).data
        }

        this.canvasContext.clearRect(0, 0, this.canvasWidth, this.canvasHeight);

        // Clear SVG
        d3.select(`#${SVG_ID}`).selectAll('*').remove()

        this.canvasContext.save()

        // Circle
        if (false) {
            var circle = d3.geoCircle().center([-30.1278, 51.5074]).radius(15)()
            this.drawGeoJsonTiled(this.projections, circle, 
                { rendersCanvas: true, context: this.canvasContext },
                { rendersSvg: true, svgId: SVG_ID },
                allRedLineStyle)
                
            console.log('Circle is: ', circle)

            const projection = this.projections[0].p

            this.canvasContext.beginPath()
            let firstDone = false

            coordEach(circle, (point) => {
                const pr = projection(point)
                console.log('1: ', point, '2: ', pr)
                if (!firstDone) {
                    this.canvasContext.moveTo(pr[0], pr[1])
                    firstDone = true
                } else {
                    this.canvasContext.lineTo(pr[0], pr[1])
                }
            })

            // this.canvasContext.clip()
            this.canvasContext.stroke()
        }

        if (rendersImage) {
            this.target = this.canvasContext.createImageData(this.canvasWidth, this.canvasHeight)
            let targetData = this.target.data
    
            for (var y = 0, i = -1; y <= this.canvasHeight; y += 1) {
                for (var x = 0; x <= this.canvasWidth; x += 1) {
                  const _x = x
                  const _y = y
                  var p = this.projection.invert([_x, _y])
                  if (!p) continue
                  let λ = p[0], φ = p[1];
    
                  i = y * (this.canvasWidth) * 4 + x * 4 - 1

                //   λ = ((λ + 36000000180) % 360) - 180
                //   φ = ((φ + 36000000090) % 180) - 90
    
                  if (λ > 180 || λ < -180 || φ > 90 || φ < -90) { 
                    targetData[++i] = 0;
                    targetData[++i] = 0;
                    targetData[++i] = 128;
                    targetData[++i] = 255;  
                    continue
                  }
                  var q = (((90 - φ) / 180 * this.canvasHeight | 0) * this.canvasWidth + ((180 + λ) / 360 * this.canvasWidth | 0) << 2)
                    targetData[++i] = this.sourceData[q];
                    targetData[++i] = this.sourceData[++q];
                    targetData[++i] = this.sourceData[++q];
                    targetData[++i] = 255;  
                }
              }        
            
            this.secondaryCanvasContext.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
            this.secondaryCanvasContext.putImageData(this.target, 0, 0);    
            this.canvasContext.drawImage(this._canvas2, 0, 0)
        } else {
            this.canvasContext.save()
            this.canvasContext.fillStyle = 'rgba(64, 62, 62, 1)'
            this.canvasContext.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
            this.canvasContext.restore()
        }
    
        // Graticule
        if (rendersGraticule) {
            const graticule = d3.geoGraticule()()
            this.drawGeoJsonTiled(this.projections, 
                graticule, 
                { rendersCanvas: true, context: this.canvasContext },
                { rendersSvg: true, svgId: SVG_ID },
                graticuleStyle
            )
        }

        // World map
        if (rendersWorldMap) {
            this.drawGeoJsonTiled(this.projections, 
                this.worldGeoJson, 
                { rendersCanvas: true, context: this.canvasContext },
                { rendersSvg: true, svgId: SVG_ID },
                worldMapStyle
            )
        }

        // Cables map
        if (rendersSubmarineCables) {
            this.drawGeoJsonTiled(this.projections, 
                this.cablesMapGeoJson, 
                { rendersCanvas: true, context: this.canvasContext },
                { rendersSvg: true, svgId: SVG_ID },
                submarineCablesStyle
            )
        }

        // All red line map
        if (rendersAllRedLine) {
            this.drawGeoJsonTiled(this.projections, 
                this.allRedLineMapGeoJson, 
                { rendersCanvas: true, context: this.canvasContext },
                { rendersSvg: true, svgId: SVG_ID },
                allRedLineStyle
            )
        }

        // One gedymin head
        if (rendersGedyminHead) {
            this.drawGeoJsonTiled(this.projections, 
                this.gedyminHeadGeoJson, 
                { rendersCanvas: true, context: this.canvasContext },
                { rendersSvg: true, svgId: SVG_ID },
                gedyminHeadStyle
            )
        }

        // Two gedymin heads
        if (rendersTwoGedyminHeads) {
            this.drawGeoJsonTiled(this.projections, 
                this.twoGedyminHeadsGeoJson, 
                { rendersCanvas: true, context: this.canvasContext },
                { rendersSvg: true, svgId: SVG_ID },
                twoGedyminHeadsStyle
            )
        }

        // Tissot indicatrices
        if (rendersTissot) {
            this.drawGeoJsonTiled(this.projections, 
                this.tissotGeoJson, 
                { rendersCanvas: true, context: this.canvasContext },
                { rendersSvg: true, svgId: SVG_ID },
                tissotStyle
            )
        }

        this.canvasContext.restore()

    }
    drawGeoJsonTiled(projections, geoJson, canvasOptions, svgOptions, drawingOptions) {
        projections.forEach(projection => {
            const { p, offsetX, offsetY } = projection

            const newGeoJson = cloneDeep(geoJson)
            // coordEach(newGeoJson, (pointCoords) => {
            //     const newCoords = [pointCoords[0] + 45 * offsetX, pointCoords[1] + 360 * offsetY]
            //     pointCoords[0] = newCoords[0]
            //     pointCoords[1] = newCoords[1]
            // })

            // console.log('new g: ', offsetX, offsetY, newGeoJson)

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

        // proj = proj.clipAngle(90)

        return proj
    }
    updateProjection() {
        this.projection = this.getProjectionFromState(0, 0)
        this.projections = []
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
    onProjectionSelectChange = (event, newValue) => {
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
    onDownloadClick = () => {
        const uid = shortid()
        const projectionId = `${this.state.projection}-${uid}`        
        this.createAndDownloadImage(`${projectionId}.png`, this._canvas)
        this.createAndDownloadSvg(`${projectionId}.svg`, this._svg)
        this.createAndDownloadText(`${projectionId}.txt`, JSON.stringify(this.state, null, 4))
    }
    componentDidUpdate(oldProps, oldState) {
        const { scale, rotateX, rotateY, rotateZ, translateX, translateY, isCanvasResizing, projection } = this.state
        const { rendersImage, rendersGraticule, rendersSubmarineCables, rendersWorldMap, rendersAllRedLine, rendersGedyminHead, rendersTwoGedyminHeads, rendersTissot } = this.state
        if (scale != oldState.scale ||
            rotateX != oldState.rotateX ||
            rotateY != oldState.rotateY ||
            rotateZ != oldState.rotateZ ||
            translateX != oldState.translateX ||
            translateY != oldState.translateY ||
            projection != oldState.projection ||
            rendersImage != oldState.rendersImage ||
            rendersGraticule != oldState.rendersGraticule ||
            rendersSubmarineCables != oldState.rendersSubmarineCables ||
            rendersAllRedLine != oldState.rendersAllRedLine ||
            rendersGedyminHead != oldState.rendersGedyminHead ||
            rendersTwoGedyminHeads != oldState.rendersTwoGedyminHeads ||
            rendersTissot != oldState.rendersTissot ||
            rendersWorldMap != oldState.rendersWorldMap ||
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
    handleCheckboxChange = propName => event => {
        this.setState({ ...this.state, [propName]: event.target.checked })
    }
    onNewFile = (files) => {
        const file = files[0]
        const reader = new FileReader()
        reader.addEventListener("load", () => {
            this._image.src = reader.result
        }, false)

        if (file) reader.readAsDataURL(file)
    }

    eventOnLeftRightBorder = (evt, el, thresh) => {
        const br = el.getBoundingClientRect()
        const { clientX, clientY } = evt
        return (Math.abs(clientX - br.right) < thresh || Math.abs(clientX - br.left) < thresh)
    }

    eventOnTopBottomBorder = (evt, el, thresh) => {
        const br = el.getBoundingClientRect()
        const { clientX, clientY } = evt
        return (Math.abs(clientY - br.top) < thresh || Math.abs(clientY - br.bottom) < thresh)
    }

    onCanvasMouseDown = (evt) => {
        if (this.eventOnLeftRightBorder(evt, this._canvas, 10)) return
        if (this.eventOnTopBottomBorder(evt, this._canvas, 10)) return
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
        if (this.eventOnLeftRightBorder(evt, this._canvas, 10)) {
            this.setState({ isCanvasResizing: RESIZING.HORIZONTAL })
        } else if (this.eventOnTopBottomBorder(evt, this._canvas, 10)) {
            this.setState({ isCanvasResizing: RESIZING.VERTICAL })
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
        if (isCanvasResizing == RESIZING.HORIZONTAL) {
            this._canvas.width += evt.clientX - this.lastWindowTouch.x
            this._canvas2.width = this._canvas.width
            d3.select(`#${SVG_ID}`).attr("width", this._canvas.width)
            this.lastWindowTouch = { x: evt.clientX, y: evt.clientY }
        } else if (isCanvasResizing == RESIZING.VERTICAL) {
            this._canvas.height += evt.clientY - this.lastWindowTouch.y
            this._canvas2.height = this._canvas.height
            d3.select(`#${SVG_ID}`).attr("height", this._canvas.height)
            this.lastWindowTouch = { x: evt.clientX, y: evt.clientY }
        } else if (isCanvasResizing == RESIZING.NO) {
            if (this.eventOnLeftRightBorder(evt, this._canvas, 10)) {
                this._canvas.style.cursor = 'ew-resize'
            } else if (this.eventOnTopBottomBorder(evt, this._canvas, 10)) {
                this._canvas.style.cursor = 'ns-resize'
            } else {
                this._canvas.style.cursor = 'grab'
            }    
        }
    }
    render() {
        const { scale, rotateX, rotateY, rotateZ, translateX, translateY, projection } = this.state
        const { rendersGraticule, rendersSubmarineCables, rendersWorldMap, rendersAllRedLine, rendersGedyminHead, rendersTwoGedyminHeads, rendersTissot, rendersImage } = this.state
        return (
            <div
                onMouseDown={this.onWindowMouseDown}
                onMouseUp={this.onWindowMouseUp}
                onMouseMove={this.onWindowMouseMove}
            >
                <Dropzone onDrop={this.onNewFile} multiple={false} noClick={true} noKeyboard={true}>
                    {({getRootProps, getInputProps}) => (
                        <section>
                            <div {...getRootProps()}>
                                <input {...getInputProps()} />
                                <img 
                                    ref={this.onImageRef}
                                    onLoad={this.onImageLoad}
                                    style={{display: 'none'}}
                                />
                                <canvas 
                                    width={CANVAS_WIDTH}
                                    height={CANVAS_HEIGHT}
                                    ref={this.onCanvasRef}
                                    className="main-canvas"
                                    onMouseDown={this.onCanvasMouseDown}
                                    onMouseUp={this.onCanvasMouseUp}
                                    onMouseMove={this.onCanvasMouseMove}                    
                                >
                                </canvas>
                                <canvas
                                    width={CANVAS_WIDTH}
                                    height={CANVAS_HEIGHT}
                                    ref={this.onSecondaryCanvasRef}
                                    className="secondary-canvas"
                                >

                                </canvas>

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

                                <div className="controls download">
                                    <a href="#" ref={(r) => {this._downloadButton = r}} onClick={this.onDownloadClick} download="">
                                        <Button variant="outlined">
                                            Download
                                        </Button>
                                    </a>
                                </div>

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
                                <div className="controls sliders">
                                    <SliderWithInput label="Scale" min={3} max={500} initialValue={scale} onValueChange={this.onScaleSliderChange}/>
                                    <SliderWithInput label="X Rotation" min={0} max={360} step={2.5} initialValue={rotateX} onValueChange={this.onRotateXSliderChange}/>
                                    <SliderWithInput label="Y Rotation" min={0} max={360} step={2.5} initialValue={rotateY} onValueChange={this.onRotateYSliderChange}/>
                                    <SliderWithInput label="Z Rotation" min={0} max={360} step={2.5} initialValue={rotateZ} onValueChange={this.onRotateZSliderChange}/>
                                    <SliderWithInput label="X Offset" min={0} max={200} initialValue={translateX} onValueChange={this.onTranslateXSliderChange}/>
                                    <SliderWithInput label="Y Offset" min={0} max={200} initialValue={translateY} onValueChange={this.onTranslateYSliderChange}/>
                                </div>

                                <div className="controls checkboxes">
                                <FormGroup row>
                                <FormControlLabel
                                        control={ <Checkbox color="default" checked={rendersImage} onChange={this.handleCheckboxChange('rendersImage')} value="rendersImage" /> }
                                        label="Image"
                                    />
                                    <FormControlLabel
                                        control={ <Checkbox color="default" checked={rendersGraticule} onChange={this.handleCheckboxChange('rendersGraticule')} value="rendersGraticule" /> }
                                        label="Graticule"
                                    />
                                    <FormControlLabel
                                        control={ <Checkbox checked={rendersSubmarineCables} onChange={this.handleCheckboxChange('rendersSubmarineCables')} value="rendersSubmarineCables" /> }
                                        label="Submarine Cables"
                                    />
                                    <FormControlLabel
                                        control={ <Checkbox checked={rendersAllRedLine} onChange={this.handleCheckboxChange('rendersAllRedLine')} value="rendersAllRedLine" /> }
                                        label="All Red Line"
                                    />
                                    <FormControlLabel
                                        control={ <Checkbox color="primary" checked={rendersGedyminHead} onChange={this.handleCheckboxChange('rendersGedyminHead')} value="rendersGedyminHead" /> }
                                        label="Gedymin Head"
                                    />
                                    <FormControlLabel
                                        control={ <Checkbox color="primary" checked={rendersTwoGedyminHeads} onChange={this.handleCheckboxChange('rendersTwoGedyminHeads')} value="rendersTwoGedyminHeads" /> }
                                        label="Two Gedymin Heads"
                                    />
                                    <FormControlLabel
                                        control={ <Checkbox color="primary" checked={rendersTissot} onChange={this.handleCheckboxChange('rendersTissot')} value="rendersTissot" /> }
                                        label="Tissot Indicatrices"
                                    />
                                    <FormControlLabel
                                        control={ <Checkbox checked={rendersWorldMap} onChange={this.handleCheckboxChange('rendersWorldMap')} value="rendersWorldMap" /> }
                                        label="World Map"
                                    />
                                </FormGroup>
                                </div>
                            </div>
                        </section>
                    )}
                </Dropzone>
            </div>
        )
    }
}