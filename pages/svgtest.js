import Style from '../static/styles/convert.less'
import React from 'react'
import * as d3 from 'd3'
import Dropzone from 'react-dropzone'
import cloneDeep from 'clone-deep'
import MenuItem from '@material-ui/core/MenuItem'
import FormControl from '@material-ui/core/FormControl'
import Select from '@material-ui/core/Select'
import { svgToGeoJson } from '../modules/SvgToGeojson'
import { drawGeoJsonSvg } from '../components/Renderer/RenderHelper'
import { projectionsList, projectionsMap } from '../modules/Projections'
import ProjectionItem from '../components/ProjectionItem'

const SVG_ID = 'projected-svg'

export default class Convert extends React.Component {
  state = {
    hasFile: false,
    filename: '__empty__',
    originalName: '__empty__',
    projection: 'geoEquirectangular',
    projectionTo: 'geoEquirectangular'
  }
  constructor(props) {
    super(props)
  }

  componentDidMount() {
    
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
    const { projection, projectionTo } = this.state
    let geojson = svgToGeoJson(node, projection, 500)

    const newGeoJson = cloneDeep(geojson)
    const p = projectionsMap[projectionTo].fn()
    const svgGenerator = d3.geoPath().projection(p)
    d3.select(`#${SVG_ID}`).selectAll('*').remove()
    drawGeoJsonSvg(newGeoJson, svgGenerator, SVG_ID, {lineWidth: 2, color: 'black'})
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

  onSvgRef = (p) => {
    this._svg = p
  }

  render() {
    const { projection, projectionTo } = this.state
    return (
      <div className="convert-page-container">
        <div className="convert-title">
          <h2>Convert SVG to GeoJSON</h2>
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
        <>
          <h3 className="convert-step-title">Step 3: Choose base projection</h3> 
            <div className="controls projection">
                <FormControl className="form-control projection-form">
                    <Select
                        value={projection}
                        onChange={this.onProjectionSelectionUpdate}
                    >
                        { projectionsList.map(p => (
                            <MenuItem key={p.id} value={p.id}>
                                <ProjectionItem displayName={p.displayName} flagEmoji={p.flagEmoji} genderEmoji={p.genderEmoji} year={p.year}/>
                            </MenuItem>
                            )) 
                        }
                    </Select>
                </FormControl>
            </div>
        </>
        <>
          <h3 className="convert-step-title">Step 4: Choose projection to: </h3> 
            <div className="controls projection">
                <FormControl className="form-control projection-form">
                    <Select
                        value={projectionTo}
                        onChange={this.onProjectionToSelectionUpdate}
                    >
                        { projectionsList.map(p => (
                            <MenuItem key={p.id} value={p.id}>
                                <ProjectionItem displayName={p.displayName} flagEmoji={p.flagEmoji} genderEmoji={p.genderEmoji} year={p.year}/>
                            </MenuItem>
                            )) 
                        }
                    </Select>
                </FormControl>
            </div>
        </>
        <h3 className="convert-step-title">Step 5: Download</h3>

        <div className="convert-button" onClick={this.generateSVG}>
          <div>Convert to GeoJSON and download</div>
        </div>

        <svg
          ref={this.onSvgRef}
          id={SVG_ID}
          width={1000}
          height={500}
          version="1.1" 
          xmlns="http://www.w3.org/2000/svg" ></svg>


      </div>
    )
  }

}