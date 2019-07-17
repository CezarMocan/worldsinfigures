import React from 'react'
import Link from 'next/link'
import classnames from 'classnames'
import d3 from 'd3'
import * as d3Geo from "d3-geo"
import * as d3GeoProjection from "d3-geo-projection"

export default class Index extends React.Component {
    constructor(props) {
        super(props)
        // this._canvas = React.createRef()
    }
    get canvasContext() {
        return this._canvas.getContext('2d')
    }
    componentDidMount() {
        console.log('Canvas is: ', this._canvas)
        console.log('Context: ', this.canvasContext)        
    }
    // onRef(c) {
    //     this._canvas = c
    //     console.log('Canvas is: ', this._canvas)
    //     console.log('Context: ', this.canvasContext)
    // }
    render() {
        return (
            <div>
                <p>Hello Next.js</p>
                <canvas 
                    width="960"
                    height="500"
                    ref={(c) => this._canvas = c}
                >
                </canvas>
            </div>
        )
    }
}