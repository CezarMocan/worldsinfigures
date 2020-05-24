import { layerTypes } from '../../data/LayerData'
import { projectionsList, projectionsMap } from '../../modules/Projections'
import { getImageData, projectImageData, drawGeoJsonTiledCanvas, drawGeoJsonTiledSvg } from './RenderHelper'

export const getProjectionFromState = (projectionAttributes, canvasAttributes, offsetFactor = { x: 0, y: 0 }) => {
  let { scale, rotateX, rotateY, rotateZ, translateX, translateY, projection } = projectionAttributes
  const { canvasWidth, canvasHeight, canvasTX, canvasTY } = canvasAttributes
  const tX = translateX + (canvasTX || 0)
  const tY = translateY + (canvasTY || 0)
  const offsetXValue = offsetFactor.x * (2 * Math.PI * scale)
  const offsetYValue = offsetFactor.y * (Math.PI * scale)

  let proj = projectionsMap[projection].fn()

  if (proj.scale) proj = proj.scale(scale)
  if (proj.translate) proj = proj.translate([offsetXValue + canvasWidth / 2 + canvasWidth * (tX - 50) / 50, offsetYValue + canvasHeight / 2 + canvasHeight * (tY - 50) / 50])
  if (proj.rotate) proj = proj.rotate([rotateX, rotateY, rotateZ])
  if (proj.precision) proj = proj.precision(0.01)

  return proj
}

export const getTiledProjections = (projectionAttributes, canvasAttributes, renderOptions) => {
  let mainProjection = getProjectionFromState(projectionAttributes, canvasAttributes)
  let tiledProjections = []
  let minX = 0, maxX = 0, minY = 0, maxY = 0        
  
  if (renderOptions.tileVectors) {
    minX = minY = -1
    maxX = maxY = 1
  }

  for (let offsetX = minX; offsetX <= maxX; offsetX++) {
    for (let offsetY = minY; offsetY <= maxY; offsetY++) {
      let p = getProjectionFromState(projectionAttributes, canvasAttributes, { x: offsetX, y: offsetY })
      tiledProjections.push({ offsetX, offsetY, p })
    }
  }

  return { mainProjection, tiledProjections }
}

export const renderLayersToCanvas = (targetCanvas, bufferCanvas, rasterData, layers, projectionAttributes, canvasAttributes, renderOptions) => {
  const { mainProjection, tiledProjections } = getTiledProjections(projectionAttributes, canvasAttributes, renderOptions)

  const canvasWidth = targetCanvas.width, canvasHeight = targetCanvas.height      
  const canvasContext = targetCanvas.getContext('2d')
  const bufferContext = bufferCanvas.getContext('2d')

  // Clear canvas
  canvasContext.clearRect(0, 0, canvasWidth, canvasHeight);
  canvasContext.save()

  // Clip to earth bounds
  if (renderOptions.clipToEarthBounds) {
    const clipGenerator = d3.geoPath().projection(mainProjection).context(canvasContext)
    canvasContext.beginPath()
    clipGenerator({type: "Sphere"}) 
    canvasContext.clip()    
  }

  // Draw raster image
  if (layers.mainImage.visible) {
      const projectedImageData = projectImageData(rasterData, mainProjection, canvasContext, canvasWidth, canvasHeight)            
      bufferContext.clearRect(0, 0, canvasWidth, canvasHeight);
      bufferContext.putImageData(projectedImageData, 0, 0);    
      canvasContext.drawImage(bufferCanvas, 0, 0)
  }

  // Draw vector layers on top of raster image
  Object.values(layers).forEach(l => {
    if (l.type != layerTypes.VECTOR || !l.visible) return
    drawGeoJsonTiledCanvas(tiledProjections, l.geojsonObject, canvasContext, l.style)
  })

  canvasContext.restore()
}

export const renderLayersToSVG = (svgId, layers, projectionAttributes, canvasAttributes, renderOptions) => {
  const { mainProjection, tiledProjections } = getTiledProjections(projectionAttributes, canvasAttributes, renderOptions)

  // Clear SVG
  d3.select(`#${svgId}`).selectAll('*').remove()

  Object.values(layers).forEach(l => {
    if (l.type != layerTypes.VECTOR) return
    if (!l.visible) return
    drawGeoJsonTiledSVG(tiledProjections, l.geojsonObject, svgId, l.style)
  })
}