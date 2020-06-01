/*
Code taken and adapted from here: https://github.com/davecranwell/svg-to-geojson/
*/

import { applyPolyfill } from '../modules/PathDataPolyfill'
import { scaleLinear } from 'd3-scale'
import { projectionsList, projectionsMap } from '../modules/Projections'

const dist = (v1, v2) => {
  return Math.sqrt(Math.pow(v1[0] - v2[0], 2) + Math.pow(v1[1] - v2[1], 2))
}

export const reducePathSegCurveComplexity = (pathSegList = [], complexity = 5) => {
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
      } else if (seg.type === 'L') {
        tmpPathLength = dist(seg.values, lastSeg.values)
        lengthStep = Math.ceil(tmpPathLength / complexity);

        for (d = lengthStep, len = tmpPathLength; d <= len; d += lengthStep) {
          const frac = d / tmpPathLength
          point = {
            x: (seg.values[0] - lastSeg.values[0]) * frac + lastSeg.values[0],
            y: (seg.values[1] - lastSeg.values[1]) * frac + lastSeg.values[1]
          }

          newSegs.push({
              type: 'L',
              values: [
                  point.x,
                  point.y,
              ],
          });
        }
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
export const getSVGDimensions = (svgNode) => {
  let viewBox;
  let width;
  let height;

  // Check for width/height attrs
  width = parseInt(svgNode.getAttribute('width'), 10);
  height = parseInt(svgNode.getAttribute('height'), 10);

  // Fall back on viewBox
  if (typeof width !== 'number' || isNaN(width) || typeof height !== 'number' || isNaN(height)) {
      viewBox = svgNode.getAttribute('viewBox');
      if (!viewBox) return false;
      let x, y
      [x, y, width, height] = viewBox.split(/\s+/);
  }

  return { width: parseInt(width), height: parseInt(height) };
}

/**
* Converts SVG Path and Rect elements into a GeoJSON FeatureCollection
* @param  {Array} bounds: Array of lat/lon arrays e.g [[n,e],[s,w]]
* @param  {DOM Node} svgNode
* @return {GeoJson Object}
*/
export const svgToGeoJson = (svgNode, projectionId, complexity = 5, attributes = [], multiplier = 1) => {
  applyPolyfill()
  const geoJson = {
      type: 'FeatureCollection',
      features: [],
  };

  const pBounds = projectionsMap[projectionId].fn()
  // Split bounds into nw/se to create d3 scale of NESW maximum values
  const ne = pBounds([165, 85])
  const sw = pBounds([-165, -85])

  const svgDims = getSVGDimensions(svgNode);
  const mapX = scaleLinear().domain([0, svgDims.width]).range([parseFloat(sw[0]), parseFloat(ne[0])]);
  const mapY = scaleLinear().domain([0, svgDims.height]).range([parseFloat(ne[1]), parseFloat(sw[1])]);
  // const mapX = scaleLinear().range([-10, 10]);
  // const mapY = scaleLinear().range([-10, 10]);

  // Limit the elements we're interested in. We don't want 'defs' or 'g' for example
  const elems = svgNode.querySelectorAll('path, rect, polygon, circle, ellipse, polyline');

  // Set SVG's width/height as d3 scale's domain,
//   mapX.domain([0, svgDims.width]);
//   mapY.domain([0, svgDims.height]);

[].forEach.call(elems, (elem, index) => {
      // if (index != 2) return
      const mappedCoords = [];
      
      console.log('elem is: ', elem, window.getComputedStyle(elem))
      /**
       * Normalize element path: get path in array of X/Y absolute coords.
       * This uses a polyfill for SVG 2 getPathData() which was recently
       * taken out of Chrome, with no replacement.
       *
       * We also reduce its complexity, converting curves (C) into Lines (L)
       * with a complexity factor (second param) dictating how many lines
       * each curve should be converted to.
       */
      const pathData = reducePathSegCurveComplexity(
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
      })

      const projection = projectionsMap[projectionId].fn()
      coords.forEach((coord) => {        
          coord[0] = mapX(coord[0])
          coord[1] = mapY(coord[1])
          const newCoords = projection.invert(coord)
          mappedCoords.push(newCoords);
      });

      var properties = {};
      const computedStyles = window.getComputedStyle(elem)
      attributes.forEach((attr) => {
          var value = computedStyles[attr]
          if (value) properties[attr] = value;
      });

    //   let isLineString = elem.tagName === 'polyline'
        let isLineString = true

      geoJson.features.push({
          type: 'Feature',
          properties: properties,
          geometry: {
              type: isLineString ? 'LineString' : 'Polygon',
              coordinates: isLineString ? mappedCoords : [mappedCoords],
          },
      });

      console.log(geoJson)
  });

  return geoJson;
}
