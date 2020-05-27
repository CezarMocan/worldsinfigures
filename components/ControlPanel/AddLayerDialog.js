import React from 'react'
import * as d3 from 'd3'
import Dropzone from 'react-dropzone'
import cloneDeep from 'clone-deep'
import MenuItem from '@material-ui/core/MenuItem'
import FormControl from '@material-ui/core/FormControl'
import Select from '@material-ui/core/Select'
import SliderWithInput from '../../components/SliderWithInput'
import { withMainContext } from '../../context/MainContext'
import { svgToGeoJson } from '../../modules/SvgToGeojson'
import { drawGeoJsonSvg } from '../../components/Renderer/RenderHelper'
import { projectionsList, projectionsMap } from '../../modules/Projections'
import ProjectionsDropdown from './ProjectionsDropdown'
import { layerTypes } from '../../data/LayerData'

const SVG_ID = 'projected-svg'
const ACCURACY = 2

class AddLayerDialog extends React.Component {
  state = {
    hasFile: false,
    filename: '__empty__',
    originalName: '__empty__',
    projection: 'geoEquirectangular',
    projectionTo: 'geoEquirectangular',
    lineDivisions: 100
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
    const { projection, projectionTo, lineDivisions } = this.state
    let geojson = svgToGeoJson(node, projection, lineDivisions)

    const newGeoJson = cloneDeep(geojson)
    const p = projectionsMap[projectionTo].fn()
    const svgGenerator = d3.geoPath().projection(p)
    d3.select(`#${SVG_ID}`).selectAll('*').remove()
    drawGeoJsonSvg(newGeoJson, svgGenerator, SVG_ID, {lineWidth: 2, color: 'black'})
  }

  onAddLayer = () => {
    let node = this._svgContainer.children[0]
    if (!node) return
    const { projection, originalName, lineDivisions } = this.state
    let geojson = svgToGeoJson(node, projection, lineDivisions)

    const { addLayer } = this.props
    addLayer(originalName, layerTypes.VECTOR, geojson)
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

  onSvgRef = (p) => {
    this._svg = p
  }

  componentDidUpdate() {
    this.generateSVG()
  }

  render() {
    const { projection, projectionTo, lineDivisions } = this.state
    return (
      <div className="add-layer-container">
        <div className="convert-title">
          <h2>Add SVG layer</h2>
        </div>
        <h3 className="convert-step-title">Step 1: Upload a file</h3> 
        <p className="convert-instructions">Before uploading, make sure to run <span className="code">Object -> Path -> Clean-up</span> in Illustrator, in order to avoid rendering bugs.</p>
        <Dropzone onDrop={this.uploadSVG} multiple={false}>
          {({getRootProps, getInputProps}) => (
            <div className="convert-dropzone" {...getRootProps()}>
              <input {...getInputProps()} />
              <div>Drop SVG file here, or click to open the upload dialog</div>  
            </div>
          )}
        </Dropzone>
        
        <h3 className="convert-step-title">Step 2: Preview the SVG</h3>
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
        <h3 className="convert-step-title">Step 5: Download</h3>

        <div className="convert-button" onClick={this.onAddLayer}>
          <div>Add layer</div>
        </div>
        
      </div>
    )
  }
}

export default withMainContext((context, props) => ({
  // Actions
  addLayer: context.action.addLayer,
}))(AddLayerDialog)

