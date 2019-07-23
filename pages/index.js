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
import { projectionsList, projectionsMap } from '../modules/Projections'
import SliderWithInput from '../components/SliderWithInput'

export default class Index extends React.Component {
    constructor(props) {
        super(props)
        this.onImageLoad = this.onImageLoad.bind(this)
        this._canvasWidth = 500
        this._canvasHeight = 400
        this.state = {
            scale: 16,
            rotateX: 0,
            rotateY: 0,
            rotateZ: 0,
            translateX: 0,
            translateY: 0,
            // projection: 'geoPierceQuincuncial'
            projection: 'geoEquirectangular'
        }
    }
    get canvasContext() {
        return this._canvas.getContext('2d')
    }
    renderMap() {
        const dx = this._image.width
        const dy = this._image.height

        if (!this.sourceData) {
            this.canvasContext.clearRect(0, 0, this._canvasWidth, this._canvasHeight);
            this.canvasContext.save()
            this.canvasContext.drawImage(this._image, 0, 0, dx, dy, 0, 0, this._canvasWidth, this._canvasHeight)
            this.canvasContext.restore()
            this.sourceData = this.canvasContext.getImageData(0, 0, this._canvasWidth, this._canvasHeight).data
        }

        this.target = this.canvasContext.createImageData(this._canvasWidth, this._canvasHeight)
        let targetData = this.target.data

        const t1 = new Date().getTime()

        const eqProj = projectionsMap['geoEquirectangular'].fn()
                        .scale(100)
                        .translate([this._canvasWidth / 2, this._canvasHeight / 2])

        for (var y = 0, i = -1; y < this._canvasHeight; ++y) {
            for (var x = 0; x < this._canvasWidth; ++x) {
              const _x = (x / this._canvasWidth - 0.5) * 3 * (360 / Math.PI)
              const _y = (y / this._canvasHeight - 0.5) * 3 * (360 / Math.PI)
              var p = this.projection.invert([_x, _y])
              if (!p) continue
              let λ = p[0], φ = p[1];
              if (λ > 180 || λ < -180 || φ > 90 || φ < -90) { 
                targetData[++i] = 128;
                targetData[++i] = 128;
                targetData[++i] = 128;
                targetData[++i] = 255;  
                continue
                //   i += 4; continue; 
              }
              var q = (((90 - φ) / 180 * this._canvasHeight | 0) * this._canvasWidth + ((180 + λ) / 360 * this._canvasWidth | 0) << 2)
              if (x < 5 || y < 5 || x > this._canvasWidth - 5 || y > this._canvasHeight - 5) {
                targetData[++i] = 0;
                targetData[++i] = 0;
                targetData[++i] = 255;
                targetData[++i] = 255;  
              } else {
                targetData[++i] = this.sourceData[q];
                targetData[++i] = this.sourceData[++q];
                targetData[++i] = this.sourceData[++q];
                targetData[++i] = 255;  
              }
            }
          }        

        const t2 = new Date().getTime()

        this.canvasContext.clearRect(0, 0, this._canvasWidth, this._canvasHeight);
        this.canvasContext.putImageData(this.target, 0, 0);

        var projection = this.projection
            // .translate([this._canvasWidth / 2, this._canvasHeight / 2])
            // .scale(this._canvasWidth / (2 * Math.PI));

        var geoGenerator = d3.geoPath()
            .projection(projection)
            .context(this.canvasContext)
        // var geoCircle = d3.geoCircle().radius(10).precision(1);
        var geoGraticule = d3.geoGraticule();
        this.canvasContext.strokeStyle = '#ccc';
        this.canvasContext.fillStyle = 'none';
        this.canvasContext.setLineDash([1,1]);
        // this.canvasContext.beginPath();
        // geoGenerator(geoGraticule());
        // this.canvasContext.stroke();      


        const t3 = new Date().getTime()

        console.log('1: ', t2 - t1, '2: ', t3 - t2)

    }
    updateProjection() {
        const { scale, rotateX, rotateY, rotateZ, translateX, translateY, projection } = this.state
        //d3GeoProjection.geoAiry()
        //d3GeoProjection.geoBonne().parallel(45)
        //d3GeoProjection.geoEckert1()
        //d3GeoProjection.geoPierceQuincuncial()
        const currentProjection = projectionsMap[projection]
        // console.log('Current projection is: ', currentProjection, scale)
        this.projection = currentProjection.fn()
        if (this.projection.scale) this.projection = this.projection.scale(3 * scale)
        if (this.projection.translate) this.projection = this.projection.translate([this._canvasWidth / 2 + this._canvasWidth * (translateX - 50) / 50, this._canvasHeight / 2 + this._canvasHeight * (translateY - 50) / 50])
        if (this.projection.rotate) this.projection = this.projection.rotate([rotateX, rotateY, rotateZ])
        if (this.projection.precision) this.projection = this.projection.precision(1)
        // this.path = d3Geo.geoPath(this.projection)//.projection(this.projection)
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
    onDownloadClick = () => {
        console.log('Clicked download!')
        const dataURL = this._canvas.toDataURL('image/png')
        this._downloadButton.href = dataURL
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
    render() {
        const { scale, rotateX, rotateY, rotateZ, translateX, translateY, projection } = this.state
        return (
            <div>
                <Dropzone onDrop={this.onNewFile}>
                {({getRootProps, getInputProps}) => (
                    <section>
                    <div {...getRootProps()}>
                        <input {...getInputProps()} />
                        <p>Drag 'n' drop some files here, or click to select files</p>
                    </div>
                    </section>
                )}
                </Dropzone>
                <img 
                    ref={this.onImageRef}
                    onLoad={this.onImageLoad}
                    style={{display: 'none'}}
                />
                <canvas 
                    width={this._canvasWidth}
                    height={this._canvasHeight}
                    ref={this.onCanvasRef}
                >
                </canvas>
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
                <a href="#" ref={(r) => {this._downloadButton = r}} onClick={this.onDownloadClick} className="button" id="btn-download" download="‹$%€›ﬁﬂ1‹€‹⁄0⁄€›.png">Download</a>
            </div>
        )
    }
}