import React from 'react'
import Link from 'next/link'
import classnames from 'classnames'
import * as d3 from 'd3'
import * as d3Geo from "d3-geo"
import * as d3GeoProjection from "d3-geo-projection"
import Style from '../static/styles/main.less'
import * as topojson from 'topojson'

export default class Index extends React.Component {
    constructor(props) {
        super(props)
        this.onImageLoad = this.onImageLoad.bind(this)
        this._canvasWidth = 1000
        this._canvasHeight = 1000
    }
    get canvasContext() {
        return this._canvas.getContext('2d')
    }
    componentDidMount() {
        // console.log('svg: ', this._svg)
        const svg = d3.select("svg")
        const width = +svg.attr("width")
        const height = +svg.attr("height")
        let g = svg.append("g").attr("transform", "rotate(90 480,480)");

        var projection = d3GeoProjection.geoPierceQuincuncial() // N.B. geoPeirceQuincuncial in 1.1+
        .scale(214)
        .translate([width / 2, height / 2])
        .rotate([0, 0, 45])
        .precision(0.1);
    
        var path = d3.geoPath()
            .projection(projection);
        
        var graticule = d3.geoGraticule();

        console.log('Graticule: ', graticule, path)
        
        // g.append("image")
        // .attr("xlink:href", "/static/images/test.png")
        // .attr("height", 480)
        // .attr("width", 480)
        // .attr("x", 0)
        // .attr("y", 0)
        // .attr("d", path);

        g.append("path")
        .datum(graticule)
        .attr("class", "graticule")
        .attr("d", path);
    
        g.append("path")
        .datum({type: "Sphere"})
        .attr("class", "sphere")
        .attr("d", path)
        .attr("fill", "none")
        .attr("stroke", "blue");


        console.log('bounce')
            
        d3.json("/static/misc/world-50m.json").then(function(world, error) {
                console.log('d3.json inside', error)
            if (error) throw error;
            
            console.log('lalala: ', topojson.feature(world, world.objects.land))

        //     g.insert("path", ".graticule")
        //     .datum(topojson.feature(world, world.objects.land))
        //     .attr("class", "land")
        //     .attr("d", path);
        
            // g.insert("path", ".graticule")
            // .datum(topojson.mesh(world, world.objects.countries, function(a, b) { return a !== b; }))
            // .attr("class", "boundary")
            // .attr("d", path);
        });

        d3.xml("/static/images/test.svg").then(function(img, error) {
            console.log('d3.xml inside', error)
        if (error) throw error;
        
        console.log('lalala: ', img.documentElement)
        
        g.append("svg")
            .datum(img.documentElement)
            .attr("class", "pizda")
            .attr("d", path);
        });

    }
    onImageLoad() {
    }
    render() {
        return (
            <div>
                <svg width="960" height="960" ref={(s) => this._svg = s}></svg>
            </div>
        )
    }
}