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
import { projectionsList, projectionsMap } from '../modules/Projections'
import SliderWithInput from '../components/SliderWithInput'

const RESIZING = {
    NO: 0,
    HORIZONTAL: 1,
    VERTICAL: 2
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
        console.log('Loading json...')
        this.cablesMapGeoJson = await d3.json('/static/misc/cable-geo.json')
        this.allRedLineMapGeoJson = await d3.json('/static/misc/all-red-line-geo.json')
        const w50m = await d3.json('/static/misc/world-110m.json')
        this.worldGeoJson = topojson.feature(w50m, w50m.objects.countries)
        console.log('Loaded!: ', this.geoJson)
    }
    get canvasContext() {
        return this._canvas.getContext('2d')
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

        const { rendersImage, rendersGraticule, rendersSubmarineCables, rendersWorldMap, rendersAllRedLine } = this.state

        if (!this.sourceData || withCleanSurface) {
            this.canvasContext.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
            this.canvasContext.save()
            this.canvasContext.drawImage(this._image, 0, 0, dx, dy, 0, 0, this.canvasWidth, this.canvasHeight)
            this.canvasContext.restore()
            this.sourceData = this.canvasContext.getImageData(0, 0, this.canvasWidth, this.canvasHeight).data
        }

        if (rendersImage) {
            this.target = this.canvasContext.createImageData(this.canvasWidth, this.canvasHeight)
            let targetData = this.target.data
    
            const t1 = new Date().getTime()
    
            for (var y = 0, i = -1; y <= this.canvasHeight; y += 1) {
                for (var x = 0; x <= this.canvasWidth; x += 1) {
                  const _x = x
                  const _y = y
                  var p = this.projection.invert([_x, _y])
                  if (!p) continue
                  let λ = p[0], φ = p[1];
    
                  i = y * (this.canvasWidth) * 4 + x * 4 - 1
    
                  if (λ > 180 || λ < -180 || φ > 90 || φ < -90) { 
                    targetData[++i] = 128;
                    targetData[++i] = 128;
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
    
            this.canvasContext.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
            this.canvasContext.putImageData(this.target, 0, 0);    
        } else {
            this.canvasContext.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
            this.canvasContext.save()
            this.canvasContext.fillStyle = 'rgba(64, 62, 62, 1)'
            this.canvasContext.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
            this.canvasContext.restore()
        }

        var geoGenerator = d3.geoPath()
            .projection(this.projection)
            .context(this.canvasContext);
    
        // Graticule
        if (rendersGraticule)
            // this.drawGeoJson(d3.geoGraticule()(), geoGenerator, this.canvasContext, 1, '#ccc', false, true)
            this.drawGeoJsonTiled(this.projections, d3.geoGraticule()(), this.canvasContext, 1, '#ccc', false, true)

        // World map
        if (rendersWorldMap)
            // this.drawGeoJson(this.worldGeoJson, geoGenerator, this.canvasContext, 0.5, 'rgba(255, 230, 220, 0.2)', true)
            this.drawGeoJsonTiled(this.projections, this.worldGeoJson, this.canvasContext, 0.5, 'rgba(255, 230, 220, 0.2)', true)

        // Cables map
        if (rendersSubmarineCables) {
            this.drawGeoJsonTiled(this.projections, this.cablesMapGeoJson, this.canvasContext, 0.5, '#fdd', false)
        }

        // All red line map
        if (rendersAllRedLine) {
            this.drawGeoJsonTiled(this.projections, this.allRedLineMapGeoJson, this.canvasContext, 2, 'rgba(255, 64, 64, 0.8)', false, false)
            // this.drawGeoJson(this.allRedLineMapGeoJson, this.canvasContext, 2, 'rgba(255, 64, 64, 0.8)', false, false)
        }
    }
    drawGeoJsonTiled(projections, geoJson, context, lineWidth, color, fillMode, dashed = false) {
        projections.forEach(projection => {
            const { p, offsetX, offsetY } = projection
            const generator = d3.geoPath().projection(p).context(context)
            this.drawGeoJson(geoJson, generator, context, lineWidth, color, fillMode, dashed)
        })
    }
    drawGeoJson(geoJson, geoGenerator, context, lineWidth, color, fillMode, dashed = false) {
        context.save()
        context.lineWidth = lineWidth;
        context.strokeStyle = color;
        context.fillStyle = color;
        if (dashed) context.setLineDash([2, 2])
        context.beginPath()
        geoGenerator(geoJson)
        if (fillMode)
            context.fill()
        else
            context.stroke()
        context.restore()
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
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
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
    createAndDownloadText(filename, text) {
        console.log('createAndDownloadText')
        var element = document.createElement('a');
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
        element.setAttribute('download', filename);
      
        element.style.display = 'none';
        document.body.appendChild(element);
      
        element.click();
      
        document.body.removeChild(element);
      }
    onDownloadClick = () => {
        console.log('onDownloadClick')
        const uid = shortid()
        const projectionId = `${this.state.projection}-${uid}`        
        const dataURL = this._canvas.toDataURL('image/png')
        this._downloadButton.download = `${projectionId}.png`
        this._downloadButton.href = dataURL
        this.createAndDownloadText(`${projectionId}.txt`, JSON.stringify(this.state, null, 4))
    }
    componentDidUpdate(oldProps, oldState) {
        const { scale, rotateX, rotateY, rotateZ, translateX, translateY, isCanvasResizing, projection } = this.state
        const { rendersImage, rendersGraticule, rendersSubmarineCables, rendersWorldMap, rendersAllRedLine } = this.state
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
            this.lastWindowTouch = { x: evt.clientX, y: evt.clientY }
        } else if (isCanvasResizing == RESIZING.VERTICAL) {
            this._canvas.height += evt.clientY - this.lastWindowTouch.y
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
        const { rendersGraticule, rendersSubmarineCables, rendersWorldMap, rendersAllRedLine, rendersImage } = this.state
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
                                    width={600}
                                    height={300}
                                    ref={this.onCanvasRef}
                                    className="main-canvas"
                                    onMouseDown={this.onCanvasMouseDown}
                                    onMouseUp={this.onCanvasMouseUp}
                                    onMouseMove={this.onCanvasMouseMove}                    
                                >
                                </canvas>

                                <a href="#" ref={(r) => {this._downloadButton = r}} onClick={this.onDownloadClick} download="">
                                    <Button variant="outlined">
                                        Download
                                    </Button>
                                </a>

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
                                        control={ <Checkbox color="white" checked={rendersWorldMap} onChange={this.handleCheckboxChange('rendersWorldMap')} value="rendersWorldMap" /> }
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