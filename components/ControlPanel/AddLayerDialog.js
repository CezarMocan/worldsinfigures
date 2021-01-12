import React from 'react'
import * as d3 from 'd3'
import Dropzone from 'react-dropzone'
import Button from '@material-ui/core/Button'
import SliderWithInput from '../../components/SliderWithInput'
import { withMainContext } from '../../context/MainContext'
import { svgToGeoJson } from '../../modules/SvgToGeojson'
import { drawGeoJsonSvg } from '../../components/Renderer/RenderHelper'
import { projectionsList, projectionsMap } from '../../modules/Projections'
import ProjectionsDropdown from './ProjectionsDropdown'
import { layerTypes } from '../../data/LayerData'

const SVG_ID = 'projected-svg'
const ACCURACY = 2
const STYLE_ATTRIBUTES = ['stroke', 'lineWidth', 'fill', 'fillMode']

class AddLayerDialog extends React.Component {
  state = {
    hasFile: false,
    filename: '__empty__',
    originalName: '__empty__',
    projection: 'geoEquirectangular',
    projectionTo: 'geoEquirectangular',
    lineDivisions: 100,
    scale: 200,
    paddingX: 10,
    paddingY: 10,
    translateX: 0,
    translateY: 0
  }

  uploadSVG = (files) => {
    const file = files[0]
    const reader = new FileReader()
    const { projection } = this.state
    reader.addEventListener("load", () => {
      this._svgContainer.innerHTML = reader.result
      this.setState({ 
        hasFile: true,
        originalName: file.name,
        filename: `${file.name}-${projection}.geojson`
      })
    }, false)
    if (file) reader.readAsText(file)    
  }

  generateSVG = () => {
    let node = this._svgContainer.children[0]
    if (!node) return
    const { projection, projectionTo, lineDivisions, scale, paddingX, paddingY, translateX, translateY } = this.state

    const options = {
      projectionId: projection,
      scale,
      padding: { x: paddingX, y: paddingY },
      translate: { x: translateX, y: translateY },
      lineDivisions,
      attributes: STYLE_ATTRIBUTES
    }

    this.geojson = svgToGeoJson(node, options)

    const p = projectionsMap[projectionTo].fn()
    const svgGenerator = d3.geoPath().projection(p)
    d3.select(`#${SVG_ID}`).selectAll('*').remove()
    drawGeoJsonSvg(this.geojson, svgGenerator, SVG_ID, {lineWidth: 2, color: 'black'}, true)
    drawGeoJsonSvg(d3.geoGraticule()(), svgGenerator, SVG_ID, {lineWidth: 0.5, color: 'red'})
  }

  onAddLayer = () => {
    let node = this._svgContainer.children[0]
    if (!node) return
    const { originalName } = this.state
    const { addLayer } = this.props
    addLayer(originalName, layerTypes.VECTOR, this.geojson)
    const { onClose } = this.props
    console.log('on close: ', onClose)
    if (onClose) onClose()
  }

  onProjectionSelectionUpdate = (event) => {
    this.setState({ 
      projection: event.target.value,
      filename: `${this.state.originalName}-${event.target.value}.geojson`
    })
  }

  onProjectionToSelectionUpdate = (event) => {
    this.setState({ 
      projectionTo: event.target.value,
    })
  }

  onLineDivisionsChange = (newValue) => {
    this.setState({ lineDivisions: newValue })
  }

  onScaleChange = (newValue) => {
    this.setState({ scale: newValue })
  }

  onPaddingXChange = (newValue) => {
    this.setState({ paddingX: newValue })
  }

  onPaddingYChange = (newValue) => {
    this.setState({ paddingY: newValue })
  }

  onTranslateXChange = (newValue) => {
    this.setState({ translateX: newValue })
  }

  onTranslateYChange = (newValue) => {
    this.setState({ translateY: newValue })
  }
  onSvgRef = (p) => {
    this._svg = p
  }

  componentDidUpdate() {
    this.generateSVG()
  }

  render() {
    const { projection, projectionTo, lineDivisions, scale, paddingX, paddingY, translateX, translateY } = this.state
    return (
      <div className="add-layer-container">
        <h3 className="convert-first-step-title">Upload a file</h3> 
        <p className="convert-instructions">Before uploading, make sure to run <span className="code">Object -> Path -> Clean-up</span> in Illustrator, in order to avoid rendering bugs.</p>
        <Dropzone onDrop={this.uploadSVG} multiple={false}>
          {({getRootProps, getInputProps}) => (
            <div className="convert-dropzone" {...getRootProps()}>
              <input {...getInputProps()} accept=".svg"/>
              <div>Drop SVG file here, or click to open the upload dialog</div>  
            </div>
          )}
        </Dropzone>
        
        <h3 className="convert-step-title">Preview the SVG</h3>
        <div className="convert-page-svg-container">
          <span ref={p => this._svgContainer = p} id="svg"></span>
        </div>
        <div style={{display: 'flex', flexDirection: 'row' }}>
          <div style={{marginRight: '20px'}}>
            <h3 className="convert-step-title">Base Projection</h3> 
            <ProjectionsDropdown value={projection} onChange={this.onProjectionSelectionUpdate}/>
          </div>
          <div>
            <h3 className="convert-step-title">Preview Projected With... </h3> 
            <ProjectionsDropdown value={projectionTo} onChange={this.onProjectionToSelectionUpdate}/>
          </div>
        </div>
        <div className="sliders">
          <SliderWithInput label="Divisions" min={2} max={500} initialValue={lineDivisions} onValueChange={this.onLineDivisionsChange}/>
          <SliderWithInput label="Scale" min={25} max={750} initialValue={scale} onValueChange={this.onScaleChange}/>
          <SliderWithInput label="Bounds X" min={-500} max={500} initialValue={paddingX} onValueChange={this.onPaddingXChange}/>
          <SliderWithInput label="Bounds Y" min={-500} max={500} initialValue={paddingY} onValueChange={this.onPaddingYChange}/>
          <SliderWithInput label="Translate X" min={-500} max={500} initialValue={translateX} onValueChange={this.onTranslateXChange}/>
          <SliderWithInput label="Translate Y" min={-500} max={500} initialValue={translateY} onValueChange={this.onTranslateYChange}/>
        </div>
        <div className="convert-page-svg-container">
          <svg
            ref={this.onSvgRef}
            id={SVG_ID}
            version="1.1"
            viewBox="0 0 1000 500"
            xmlns="http://www.w3.org/2000/svg" >
            
          </svg>
        </div>
        
        <div className="convert-button-container">
          <a href="#" onClick={this.onAddLayer}>
            <Button variant="outlined"> Add layer </Button>
          </a>                    
        </div>

      </div>
    )
  }
}

export default withMainContext((context, props) => ({
  // Actions
  addLayer: context.action.addLayer,
}))(AddLayerDialog)

