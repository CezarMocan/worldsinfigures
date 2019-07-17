import React from 'react'
import Link from 'next/link'
import classnames from 'classnames'
import d3 from 'd3'
import * as d3Geo from "d3-geo"
import * as d3GeoProjection from "d3-geo-projection"
import Slider from '@material-ui/core/Slider'
import Style from '../static/styles/main.less'

export default class Index extends React.Component {
    constructor(props) {
        super(props)
        this.onImageLoad = this.onImageLoad.bind(this)
        this._canvasWidth = 500
        this._canvasHeight = 400
        this.state = {
            scale: 100,
            rotateX: 10,
            rotateY: 20,
            rotateZ: 25,
            translateX: 50,
            translateY: 50
        }
    }
    get canvasContext() {
        return this._canvas.getContext('2d')
    }
    renderMap() {
        console.log('fdsf')
        const dx = this._image.width
        const dy = this._image.height
        console.log('Loaded image: ', dx, dy)

        if (!this.sourceData) {
            this.canvasContext.save()
            // this.canvasContext.scale(0.5, 0.5)
            this.canvasContext.drawImage(this._image, 0, 0, dx, dy, 0, 0, this._canvasWidth, this._canvasHeight)
            this.canvasContext.restore()

            this.sourceData = this.canvasContext.getImageData(0, 0, dx, dy).data
            this.target = this.canvasContext.createImageData(this._canvasWidth, this._canvasHeight)
        }
        let targetData = this.target.data

        const t1 = new Date().getTime()

        for (var y = 0, i = -1; y < this._canvasHeight; ++y) {
            for (var x = 0; x < this._canvasWidth; ++x) {
              var p = this.projection.invert([x, y]), λ = p[0], φ = p[1];
              if (λ > 180 || λ < -180 || φ > 90 || φ < -90) { i += 4; continue; }
              var q = (((90 - φ) / 180 * dy | 0) * dx + ((180 + λ) / 360 * dx | 0) << 2)
              targetData[++i] = this.sourceData[q];
              targetData[++i] = this.sourceData[++q];
              targetData[++i] = this.sourceData[++q];
              targetData[++i] = 255;
            }
          }        

        const t2 = new Date().getTime()

        this.canvasContext.clearRect(0, 0, this._canvasWidth, this._canvasHeight);
        this.canvasContext.putImageData(this.target, 0, 0);

        const t3 = new Date().getTime()

        console.log('1: ', t2 - t1, '2: ', t3 - t2)
    }
    updateProjection() {
        const { scale, rotateX, rotateY, rotateZ, translateX, translateY } = this.state
        //d3GeoProjection.geoAiry()
        this.projection = d3GeoProjection.geoPierceQuincuncial() // N.B. geoPeirceQuincuncial in 1.1+
            .scale(scale)
            .translate([this._canvasWidth * (translateX - 50) / 50, this._canvasHeight * (translateY - 50) / 50])
            .rotate([rotateX, rotateY, rotateZ])
            .precision(0.1);
        this.path = d3Geo.geoPath(this.projection)//.projection(this.projection)
    }
    componentDidMount() {
        this.updateProjection()
    }
    onImageLoad() {
        this.renderMap()
    }
    onScaleSliderChange = (event, newValue) => {
        this.setState({
            scale: newValue
        })
    }
    onRotateXSliderChange = (event, newValue) => {
        this.setState({
            rotateX: newValue
        })
    }
    onRotateYSliderChange = (event, newValue) => {
        this.setState({
            rotateY: newValue
        })
    }
    onRotateZSliderChange = (event, newValue) => {
        this.setState({
            rotateZ: newValue
        })
    }
    onTranslateXSliderChange = (event, newValue) => {
        this.setState({
            translateX: newValue
        })
    }
    onTranslateYSliderChange = (event, newValue) => {
        this.setState({
            translateY: newValue
        })
    }
    componentDidUpdate() {
        this.updateProjection()
        this.renderMap()
    }
    onImageRef = (i) => {
        this._image = i
        this._image.src="/static/images/test_small.png" 
    }
    onCanvasRef = (c) => {
        this._canvas = c
    }
    render() {
        const { scale, rotateX, rotateY, rotateZ, translateX, translateY } = this.state
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
                <div className="sliders">
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