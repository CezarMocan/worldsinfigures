import React from 'react'
import Style from '../static/styles/main.less'
import Link from 'next/link'
import classnames from 'classnames'
import * as d3 from 'd3'
import * as d3Geo from "d3-geo"
import Slider from '@material-ui/core/Slider'
import InputLabel from '@material-ui/core/InputLabel'
import MenuItem from '@material-ui/core/MenuItem'
import FormHelperText from '@material-ui/core/FormHelperText'
import FormControl from '@material-ui/core/FormControl'
import Select from '@material-ui/core/Select'
import { projectionsList, projectionsMap } from '../modules/Projections'

export default class Index extends React.Component {
    constructor(props) {
        super(props)
        this.onImageLoad = this.onImageLoad.bind(this)
        this._canvasWidth = 500
        this._canvasHeight = 400
        this.state = {
            scale: 50,
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
        console.log('Loaded image: ', dx, dy)

        if (!this.sourceData) {
            this.canvasContext.save()
            // this.canvasContext.scale(0.5, 0.5)
            this.canvasContext.drawImage(this._image, 0, 0, dx, dy, 0, 0, this._canvasWidth, this._canvasHeight)

            this.canvasContext.restore()

            this.sourceData = this.canvasContext.getImageData(0, 0, dx, dy).data
        }
        this.target = this.canvasContext.createImageData(this._canvasWidth, this._canvasHeight)
        let targetData = this.target.data

        const t1 = new Date().getTime()

        for (var y = 0, i = -1; y < this._canvasHeight; ++y) {
            for (var x = 0; x < this._canvasWidth; ++x) {
              const _x = x / this._canvasWidth * (360 / Math.PI)
              const _y = y / this._canvasHeight * (360 / Math.PI)
              var p = this.projection.invert([_x, _y])
              if (!p) continue
              let λ = p[0], φ = p[1];
              if (λ > 180 || λ < -180 || φ > 90 || φ < -90) { i += 4; continue; }
              var q = (((90 - φ) / 180 * dy | 0) * dx + ((180 + λ) / 360 * dx | 0) << 2)
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
        this.canvasContext.beginPath();
        geoGenerator(geoGraticule());
        this.canvasContext.stroke();      


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
        console.log('Current projection is: ', currentProjection)
        this.projection = currentProjection.fn()
        if (this.projection.scale) this.projection = this.projection.scale(scale)
        if (this.projection.translate) this.projection = this.projection.translate([this._canvasWidth / 2 + this._canvasWidth * (translateX - 50) / 50, this._canvasHeight / 2 + this._canvasHeight * (translateY - 50) / 50])
        if (this.projection.rotate) this.projection = this.projection.rotate([rotateX, rotateY, rotateZ])
        if (this.projection.precision) this.projection = this.projection.precision(1)
        // this.path = d3Geo.geoPath(this.projection)//.projection(this.projection)
    }
    componentDidMount() {
        this.updateProjection()
    }
    onImageLoad() {
        this.renderMap()
    }
    onScaleSliderChange = (event, newValue) => {
        this.setState({ scale: newValue })
    }
    onRotateXSliderChange = (event, newValue) => {
        this.setState({ rotateX: newValue })
    }
    onRotateYSliderChange = (event, newValue) => {
        this.setState({ rotateY: newValue })
    }
    onRotateZSliderChange = (event, newValue) => {
        this.setState({ rotateZ: newValue })
    }
    onTranslateXSliderChange = (event, newValue) => {
        this.setState({ translateX: newValue })
    }
    onTranslateYSliderChange = (event, newValue) => {
        this.setState({ translateY: newValue })
    }
    onProjectionSelectChange = (event, newValue) => {
        const projection = event.target.value
        this.setState({ projection })
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
    render() {
        const { scale, rotateX, rotateY, rotateZ, translateX, translateY, projection } = this.state
        return (
            <div>
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
                    <Slider value={scale} onChange={this.onScaleSliderChange} aria-labelledby="continuous-slider" />
                    <Slider value={rotateX} onChange={this.onRotateXSliderChange} aria-labelledby="continuous-slider" />
                    <Slider value={rotateY} onChange={this.onRotateYSliderChange} aria-labelledby="continuous-slider" />
                    <Slider value={rotateZ} onChange={this.onRotateZSliderChange} aria-labelledby="continuous-slider" />
                    <Slider value={translateX} onChange={this.onTranslateXSliderChange} aria-labelledby="continuous-slider" />
                    <Slider value={translateY} onChange={this.onTranslateYSliderChange} aria-labelledby="continuous-slider" />
                </div>
            </div>
        )
    }
}