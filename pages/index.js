import React from 'react'
import Style from '../static/styles/main.less'
import Link from 'next/link'
import classnames from 'classnames'
import * as d3 from 'd3'
import * as d3Geo from "d3-geo"
import Dropzone from 'react-dropzone'
import Slider from '@material-ui/core/Slider'
import InputLabel from '@material-ui/core/InputLabel'
import MenuItem from '@material-ui/core/MenuItem'
import FormHelperText from '@material-ui/core/FormHelperText'
import FormControl from '@material-ui/core/FormControl'
import Select from '@material-ui/core/Select'
import Button from '@material-ui/core/Button'
import shortid from 'shortid'
import { projectionsList, projectionsMap } from '../modules/Projections'
import SliderWithInput from '../components/SliderWithInput'

export default class Index extends React.Component {
    constructor(props) {
        super(props)
        this.onImageLoad = this.onImageLoad.bind(this)
        this.state = {
            scale: 16,
            rotateX: 0,
            rotateY: 0,
            rotateZ: 0,
            translateX: 0,
            translateY: 0,
            // projection: 'geoPierceQuincuncial'
            projection: 'geoEquirectangular',
            canvasWidth: 700,
            canvasHeight: 400
        }
    }
    get canvasContext() {
        return this._canvas.getContext('2d')
    }
    get canvasWidth() {
        return this.state.canvasWidth
    }
    get canvasHeight() {
        return this.state.canvasHeight
    }
    renderMap() {
        const dx = this._image.width
        const dy = this._image.height

        if (!this.sourceData) {
            this.canvasContext.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
            this.canvasContext.save()
            this.canvasContext.drawImage(this._image, 0, 0, dx, dy, 0, 0, this.canvasWidth, this.canvasHeight)
            this.canvasContext.restore()
            this.sourceData = this.canvasContext.getImageData(0, 0, this.canvasWidth, this.canvasHeight).data
        }

        this.target = this.canvasContext.createImageData(this.canvasWidth, this.canvasHeight)
        let targetData = this.target.data

        const t1 = new Date().getTime()

        for (var y = 0, i = -1; y < this.canvasHeight; y += 1) {
            for (var x = 0; x < this.canvasWidth; x += 1) {
              const _x = (x / this.canvasWidth - 0.5) * 3 * (360 / Math.PI)
              const _y = (y / this.canvasHeight - 0.5) * 3 * (360 / Math.PI)
              i = y * (this.canvasWidth) * 4 + x * 4 - 1

              var p = this.projection.invert([_x, _y])
              if (!p) continue
              let λ = p[0], φ = p[1];
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

        const t2 = new Date().getTime()

        this.canvasContext.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
        this.canvasContext.putImageData(this.target, 0, 0);

        const t3 = new Date().getTime()

        console.log('1: ', t2 - t1, '2: ', t3 - t2)

    }
    updateProjection() {
        const { scale, rotateX, rotateY, rotateZ, translateX, translateY, projection } = this.state
        const currentProjection = projectionsMap[projection]
        this.projection = currentProjection.fn()
        if (this.projection.scale) this.projection = this.projection.scale(3 * scale)
        if (this.projection.translate) this.projection = this.projection.translate([this.canvasWidth / 2 + this.canvasWidth * (translateX - 50) / 50, this.canvasHeight / 2 + this.canvasHeight * (translateY - 50) / 50])
        if (this.projection.rotate) this.projection = this.projection.rotate([rotateX, rotateY, rotateZ])
        if (this.projection.precision) this.projection = this.projection.precision(1)
    }
    componentDidMount() {
        this.updateProjection()
    }
    onImageLoad() {
        this.sourceData = null
        this.renderMap()
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
        var element = document.createElement('a');
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
        element.setAttribute('download', filename);
      
        element.style.display = 'none';
        document.body.appendChild(element);
      
        element.click();
      
        document.body.removeChild(element);
      }
    onDownloadClick = () => {
        const uid = shortid()
        const projectionId = `${this.state.projection}-${uid}`        
        const dataURL = this._canvas.toDataURL('image/png')
        this._downloadButton.download = `${projectionId}.png`
        this._downloadButton.href = dataURL
        this.createAndDownloadText(`${projectionId}.txt`, JSON.stringify(this.state, null, 4))
    }
    componentDidUpdate() {
        setTimeout(() => {
            this.updateProjection()
            this.renderMap()    
        }, 0)
    }
    onImageRef = (i) => {
        this._image = i
        this._image.src="/static/images/test_small.png" 
    }
    onCanvasRef = (c) => {
        this._canvas = c
    }
    onNewFile = (files) => {
        const file = files[0]
        const reader = new FileReader()
        reader.addEventListener("load", () => {
            this._image.src = reader.result
        }, false)

        if (file) reader.readAsDataURL(file)
    }
    onCanvasMouseDown = (evt) => {

    } 
    onCanvasMouseUp = (evt) => {

    }
    onCanvasMouseMove = (evt) => {
        
    }
    render() {
        const { scale, rotateX, rotateY, rotateZ, translateX, translateY, projection } = this.state
        return (
            <div>
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
                                    width={this.canvasWidth}
                                    height={this.canvasHeight}
                                    ref={this.onCanvasRef}
                                    onMouseDown={this.onCanvasMouseDown}
                                    onMouseUp={this.onCanvasMouseUp}
                                    onMouseMove={this.onCanvasMouseMove}
                                    className="main-canvas"
                                >
                                </canvas>

                                <a href="#" ref={(r) => {this._downloadButton = r}} onClick={this.onDownloadClick} download="">
                                    <Button onClick={this.onDownloadClick} variant="outlined">
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

                            </div>
                        </section>
                    )}
                </Dropzone>
            </div>
        )
    }
}