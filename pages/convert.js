/*
Code taken and adapted from here: https://github.com/davecranwell/svg-to-geojson/
*/
import Style from '../static/styles/convert.less'
import {applyPolyfill} from '../modules/PathDataPolyfill'
import React from 'react'
import Dropzone from 'react-dropzone'
import { scaleLinear } from 'd3-scale'
import { createAndDownloadText } from '../modules/DownloadHelper'
import TextSVG from '../components/TextSVG'
import shortid from 'shortid'

export default class Convert extends React.Component {
  state = {
    hasFile: false,
    filename: '__empty__'
  }
  constructor(props) {
    super(props)
  }

  reducePathSegCurveComplexity = (pathSegList = [], complexity = 5) => {
    const newSegs = [];
    let lastSeg;
  
    // Loop through segments, processing each
    pathSegList.forEach((seg) => {
        let tmpPath;
        let tmpPathLength;
        let lengthStep;
        let d;
        let len;
        let point;
  
        if (seg.type === 'C') {
            /**
             * Create new isolate path element with only this C (and a starting M) present,
             * so we only need to divide the curve itself (not whole svg's path)
             * into lines
             */
            tmpPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  
            const lastSegCoords = lastSeg.values.slice(-2).join(',');
  
            tmpPath.setAttribute('d', `M ${lastSegCoords}C${seg.values.join(',')}`);
  
            /**
             * step along its length at the provided sample rate, finding
             * the x,y at each point, creating an L command for each.
             */
            tmpPathLength = Math.ceil(tmpPath.getTotalLength());
            lengthStep = Math.ceil(tmpPathLength / complexity);
  
            // Can't do anything with zero-length curves
            if (!tmpPathLength || !lengthStep) return;
  
            for (d = lengthStep, len = tmpPathLength; d <= len; d += lengthStep) {
                point = tmpPath.getPointAtLength(d);
  
                newSegs.push({
                    type: 'L',
                    values: [
                        point.x,
                        point.y,
                    ],
                });
            }
  
            /**
             * Lastly, add an L at the final coords: We've divided a curve into N
             * items, sampling at each N along the length, but the loop ends
             * before it gets to the final point.
             *
             * The Normalized C command object provides these target coords
             * in 'values' positions 4 and 5.
             */
            newSegs.push({
                type: 'L',
                values: [
                    seg.values[4],
                    seg.values[5],
                ],
            });
        } else {
            // We don't care about non-curve commands.
            newSegs.push(seg);
        }
  
        /**
         * Record the segment just passed so its values can be used in determining
         * starting position of the next seg
         */
        lastSeg = seg;
    });
  
    return newSegs;
  }

/**
 * Return Width and Height dimensions from provided SVG file
 * @param  {[type]} svgNode
 * @return {Object}
 */
  getSVGDimensions = (svgNode) => {
    let viewBox;
    let width;
    let height;

    // Check for width/height attrs
    width = parseInt(svgNode.getAttribute('width'), 10);
    height = parseInt(svgNode.getAttribute('height'), 10);

    console.log('getSVGDimensions: ', width, height, svgNode)

    // Fall back on viewBox
    if (typeof width !== 'number' || isNaN(width) || typeof height !== 'number' || isNaN(height)) {
        viewBox = svgNode.getAttribute('viewBox');
        if (!viewBox) return false;
        let x, y
        [x, y, width, height] = viewBox.split(/\s+/);
    }

    console.log('wh: ', width, height)

    return { width: parseInt(width), height: parseInt(height) };
  }

/**
 * Converts SVG Path and Rect elements into a GeoJSON FeatureCollection
 * @param  {Array} bounds: Array of lat/lon arrays e.g [[n,e],[s,w]]
 * @param  {DOM Node} svgNode
 * @return {GeoJson Object}
 */
  svgToGeoJson = (bounds, svgNode, complexity = 5, attributes = [], multiplier = 1) => {
    const geoJson = {
        type: 'FeatureCollection',
        features: [],
    };

    // Split bounds into nw/se to create d3 scale of NESW maximum values
    const ne = bounds[0];
    const sw = bounds[1];

    const mapX = scaleLinear().range([parseFloat(sw[1]), parseFloat(ne[1])]);
    const mapY = scaleLinear().range([parseFloat(ne[0]), parseFloat(sw[0])]);
    const svgDims = this.getSVGDimensions(svgNode);

    console.log('Bounds: ', mapX(50), mapY(50), svgDims)

    // Limit the elements we're interested in. We don't want 'defs' or 'g' for example
    const elems = svgNode.querySelectorAll('path, rect, polygon, circle, ellipse, polyline');

    // Set SVG's width/height as d3 scale's domain,
    mapX.domain([0, svgDims.width]);
    mapY.domain([0, svgDims.height]);

  [].forEach.call(elems, (elem) => {
        const mappedCoords = [];
        /**
         * Normalize element path: get path in array of X/Y absolute coords.
         * This uses a polyfill for SVG 2 getPathData() which was recently
         * taken out of Chrome, with no replacement.
         *
         * We also reduce its complexity, converting curves (C) into Lines (L)
         * with a complexity factor (second param) dictating how many lines
         * each curve should be converted to.
         */
        const pathData = this.reducePathSegCurveComplexity(
            elem.getPathData({ normalize: true }), complexity
        );

        const coords = pathData.map((pathitem) => {
            if (pathitem.type === 'Z') {
                /**
                 * If Close Path command found, copy first pathData value
                 * into last position, as per GeoJSON requirements for
                 * closed polygons.
                 */
                return [pathData[0].values[0], pathData[0].values[1]];
            }

            return [pathitem.values[0], pathitem.values[1]];
        });

        coords.forEach((coord) => {          
            // Map points onto d3 scale
            mappedCoords.push([
                mapX(coord[0]) * multiplier,
                mapY(coord[1]) * multiplier,
            ]);
        });

        var properties = {};

        attributes.forEach(function (attr) {
            var value = elem.getAttribute(attr);
            if (value)
                properties[attr] = value;
        });

        geoJson.features.push({
            type: 'Feature',
            properties: properties,
            geometry: {
                type: (elem.tagName === 'polyline') ? 'LineString' : 'Polygon',
                coordinates: (elem.tagName === 'polyline') ? mappedCoords : [mappedCoords],
            },
        });
    });

    // console.log('geoJson: ', geoJson)

    return geoJson;
  }

  componentDidMount() {
    applyPolyfill()
  }

  uploadSVG = (files) => {
    const file = files[0]
    const reader = new FileReader()
    console.log('file is: ', file)
    reader.addEventListener("load", () => {
      this._svgContainer.innerHTML = reader.result
      this.setState({ 
        hasFile: true,
        filename: `${file.name}.geojson`
      })
    }, false)
    if (file) reader.readAsText(file)    
  }

  generateSVG = () => {
    // let node = $('svg')[0]
    let node = this._svgContainer.children[0]
    let bounds = [[90, 180], [-90, -180]]
    let geojson = this.svgToGeoJson(bounds, node)

    createAndDownloadText(this.state.filename, JSON.stringify(geojson))
  }

  generateLayerData = () => {
    const { filename } = this.state
    return {
      __html: `
      &emsp;${shortid()}: { // You can replace this ID with something legible, as long as it's different from all others in the file.<br/>
      &emsp;&emsp;visible: false,<br/>
      &emsp;&emsp;type: layerTypes.VECTOR,<br/>
      &emsp;&emsp;url: '/static/geo/${filename}',<br/>
      &emsp;&emsp;displayName: '${filename.substr(0, filename.indexOf('.'))}', // Or however you want to see it in the layer list.<br/>
      &emsp;&emsp;style: {<br/>
        &emsp;&emsp;&emsp;lineWidth: 2,<br/>
        &emsp;&emsp;&emsp;color: 'rgba(255, 255, 255, 1)',<br/>
        &emsp;&emsp;&emsp;fillMode: false,<br/>
        &emsp;&emsp;&emsp;dashed: false<br/>
        &emsp;&emsp;},<br/>
        &emsp;&emsp;duplicateHemispheres: false<br/>
        &emsp;}`
    }
  }

  render() {
    const { hasFile, filename } = this.state
    return (
      <div className="convert-page-container">
        <div className="convert-title">
          <h2>Convert SVG to GeoJSON</h2>
        </div>
        <h3 className="convert-step-title">Step 1: Upload a file</h3> 
        <Dropzone onDrop={this.uploadSVG} multiple={false}>
          {({getRootProps, getInputProps}) => (
            <div className="convert-dropzone" {...getRootProps()}>
              <input {...getInputProps()} />
              <div>Drop SVG file here, or click to open the upload dialog</div>  
            </div>
          )}
        </Dropzone>
        
        { hasFile && <h3 className="convert-step-title">Step 2: Preview the SVG</h3> }
        <div className="convert-page-svg-container">
          <span ref={p => this._svgContainer = p} id="svg"></span>
        </div>
        { hasFile && <h3 className="convert-step-title">Step 3: Download</h3> }
        { hasFile && 
          <div className="convert-button" onClick={this.generateSVG}>
            <div>Convert to GeoJSON and download</div>
          </div>
        }

        { hasFile && 
          <>
            <h3 className="convert-step-title"> Step 4: Move the file</h3> 
            <p className="convert-instructions">Place the downloaded <span class="code">{filename}</span> file inside the <span class="code">static/geo/</span> folder of the website repository.</p>
          </>
        }

        { hasFile && 
          <>
            <h3 className="convert-step-title"> Step 5: Expose it as a layer</h3> 
            <p className="convert-instructions">Open the <span className="code">data/LayerData.js</span> file in the website repository, and add the following inside the <span className="code">defaultLayers</span> object:</p>
            <p> <span className="code" dangerouslySetInnerHTML={this.generateLayerData()}>
            </span> </p>
          </>
        }

        { hasFile && 
          <>
            <h3 className="convert-step-title"> Step 6: Commit the changes to Git</h3> 
            <p className="convert-instructions">Bring everything into version control by running the following three commands from the website's root folder:</p>
            <p className="convert-instructions"><span className="code">git add .</span></p>
            <p className="convert-instructions"><span className="code">git commit -a -m 'Added new GeoJSON file'</span></p>
            <p className="convert-instructions"><span className="code">git push origin master</span></p>
          </>
        }

        { hasFile && 
          <>
            <h3 className="convert-step-title"> Step 7: Redeploy</h3> 
            <p className="convert-instructions">Restart the server or redeploy, using the website main instructions on Github.</p>
          </>
        }


      </div>
    )
  }

}