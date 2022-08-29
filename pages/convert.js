import Style from '../static/styles/convert.less'
import React from 'react'
import Dropzone from 'react-dropzone'
import * as d3 from 'd3'
import MenuItem from '@material-ui/core/MenuItem'
import FormControl from '@material-ui/core/FormControl'
import Select from '@material-ui/core/Select'
import SliderWithInput from '../components/SliderWithInput'
import FormGroup from '@material-ui/core/FormGroup'
import FormControlLabel from '@material-ui/core/FormControlLabel'
import Checkbox from '@material-ui/core/Checkbox'
import { svgToGeoJson } from '../modules/SvgToGeojson'
import { drawGeoJsonSvg } from '../components/Renderer/RenderHelper'
import { createAndDownloadText } from '../modules/DownloadHelper'
import shortid from 'shortid'
import { projectionsList, projectionsMap } from '../modules/Projections'
import ProjectionItem from '../components/ProjectionItem'
import ProjectionsDropdown from '../components/ControlPanel/ProjectionsDropdown'
import { duplicateOnHemispheres } from '../modules/GeoJsonHelper'

const SVG_ID = 'projected-svg'
const ACCURACY = 2
const STYLE_ATTRIBUTES = ['stroke', 'lineWidth', 'fill', 'fillMode']

export default class Convert extends React.Component {
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
    translateY: 0,
    preserveOriginalStyle: true,
    duplicateHemispheres: false
  }
  constructor(props) {
    super(props)
  }

  componentDidMount() {
    document.body.style.overflow = "scroll"
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
    // let node = $('svg')[0]
    createAndDownloadText(this.state.filename, JSON.stringify(this.geojson))
  }

  generateSVGPreview = () => {
    let node = this._svgContainer.children[0]
    if (!node) return
    const { projection, projectionTo, lineDivisions, scale, paddingX, paddingY, translateX, translateY, preserveOriginalStyle, duplicateHemispheres } = this.state
    const styleAttributes = preserveOriginalStyle ? STYLE_ATTRIBUTES : []

    const options = {
      projectionId: projection,
      scale,
      padding: { x: paddingX, y: paddingY },
      translate: { x: translateX, y: translateY },
      lineDivisions,
      attributes: styleAttributes
    }

    // this.geojson = svgToGeoJson(node, projection, scale, {x: paddingX, y: paddingY }, lineDivisions, styleAttributes)
    this.geojson = svgToGeoJson(node, options)
    const geojsonToRender = duplicateHemispheres ? duplicateOnHemispheres(this.geojson) : this.geojson
    const p = projectionsMap[projectionTo].fn()
    const svgGenerator = d3.geoPath().projection(p)
    d3.select(`#${SVG_ID}`).selectAll('*').remove()
    drawGeoJsonSvg(geojsonToRender, svgGenerator, SVG_ID, {lineWidth: 2, color: 'black'}, preserveOriginalStyle)
    drawGeoJsonSvg(d3.geoGraticule()(), svgGenerator, SVG_ID, {lineWidth: 0.5, color: 'red'}, preserveOriginalStyle)
  }

  generateLayerData = () => {
    const { filename, preserveOriginalStyle, duplicateHemispheres } = this.state
    return {
      __html: `
      &emsp;${shortid().replace(/\W/g, "")}: { // You can replace this ID with something legible, as long as it's different from all others in the file.<br/>
      &emsp;&emsp;visible: false,<br/>
      &emsp;&emsp;type: layerTypes.VECTOR,<br/>
      &emsp;&emsp;url: '/static/geo/${filename}',<br/>
      &emsp;&emsp;preserveOriginalStyle: ${preserveOriginalStyle},<br/>
      &emsp;&emsp;displayName: '${filename.substr(0, filename.indexOf('.'))}', // Or however you want to see it in the layer list.<br/>
      &emsp;&emsp;style: {<br/>
        &emsp;&emsp;&emsp;lineWidth: 2,<br/>
        &emsp;&emsp;&emsp;color: 'rgba(255, 255, 255, 1)',<br/>
        &emsp;&emsp;&emsp;fillMode: false,<br/>
        &emsp;&emsp;&emsp;dashed: false<br/>
        &emsp;&emsp;},<br/>
        &emsp;&emsp;duplicateHemispheres: ${duplicateHemispheres}<br/>
        &emsp;}`
    }
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

  onPreserveOriginalStyleChange = (event) => {
    this.setState({ preserveOriginalStyle: event.target.checked })
  }

  onDuplicateHemispheresChange = (event) => {
    this.setState({ duplicateHemispheres: event.target.checked })
  }

  onSvgRef = (p) => {
    this._svg = p
  }

  componentDidUpdate() {
    this.generateSVGPreview()
  }

  render() {
    const { hasFile, filename, projection, projectionTo, lineDivisions, scale, paddingX, paddingY, translateX, translateY, preserveOriginalStyle, duplicateHemispheres } = this.state
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
        
        { hasFile && <h3 className="convert-step-title">Step 2: Preview the SVG</h3> }
        <div className="convert-page-svg-container">
          <span ref={p => this._svgContainer = p} id="svg"></span>
        </div>
        { hasFile && 
          <>
            <h3 className="convert-step-title">Step 3: Choose base projection and configure</h3> 
            <div style={{display: 'flex', flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
              <div style={{marginRight: '20px'}}>
                <h3 className="convert-step-title">Base Projection</h3> 
                <ProjectionsDropdown value={projection} onChange={this.onProjectionSelectionUpdate}/>
              </div>
              <div>
                <h3 className="convert-step-title">Preview Projected With... </h3> 
                <ProjectionsDropdown value={projectionTo} onChange={this.onProjectionToSelectionUpdate}/>
              </div>
            </div>
            <div className="sliders" style={{ width: '100%' }}>
              <SliderWithInput label="Divisions" min={2} max={500} initialValue={lineDivisions} onValueChange={this.onLineDivisionsChange}/>
              <SliderWithInput label="Scale" min={25} max={750} initialValue={scale} onValueChange={this.onScaleChange}/>
              <SliderWithInput label="Bounds X" min={-500} max={500} initialValue={paddingX} onValueChange={this.onPaddingXChange}/>
              <SliderWithInput label="Bounds Y" min={-500} max={500} initialValue={paddingY} onValueChange={this.onPaddingYChange}/>
              <SliderWithInput label="Translate X" min={-500} max={500} initialValue={translateX} onValueChange={this.onTranslateXChange}/>
              <SliderWithInput label="Translate Y" min={-500} max={500} initialValue={translateY} onValueChange={this.onTranslateYChange}/>
              <FormGroup row>
                <FormControlLabel
                  control={ <Checkbox color="default" checked={preserveOriginalStyle} onChange={this.onPreserveOriginalStyleChange} /> }
                  label="Preserve original style"
                />        
              </FormGroup>
              <div style={{marginBottom: '20px'}}>
                Choose whether you want to import the original style of the SVG, or apply a simple fill or stroke from the layer JSON configuration.
                Preserving the original style currently works for simple fills and strokes, but makes the style non-editable from the main interface.
                I recommend using this option for SVGs that have more complex shapes, or that use both fills and strokes. For line work (such as Gedymin heads),
                it might be better to disable this option and control the line color from the software's interface.
              </div>
              <FormGroup row>
                <FormControlLabel
                  control={ <Checkbox color="default" checked={duplicateHemispheres} onChange={this.onDuplicateHemispheresChange} /> }
                  label="Duplicate in hemispheres"
                />        
              </FormGroup>
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
          </>
        }
        { hasFile && <h3 className="convert-step-title">Step 4: Download</h3> }
        { hasFile && 
          <div className="convert-button" onClick={this.generateSVG}>
            <div>Convert to GeoJSON and download</div>
          </div>
        }

        { hasFile && 
          <>
            <h3 className="convert-step-title"> Step 5 (optional): Test the result</h3> 
            <p className="convert-instructions">You can use a tool like <a href="http://geojson.io" target="__blank">geojson.io</a> to try rendering the downloaded <span className="code">{filename}</span> file on a map and see if the conversion was done properly.</p>
          </>
        }


        { hasFile && 
          <>
            <h3 className="convert-step-title"> Step 6: Move the file</h3> 
            <p className="convert-instructions">Place the downloaded <span  className="code">{filename}</span> file inside the <span className="code">static/geo/</span> folder of the website repository.</p>
          </>
        }

        { hasFile && 
          <>
            <h3 className="convert-step-title"> Step 7: Expose it as a layer</h3> 
            <p className="convert-instructions">Open the <span className="code">data/LayerData.js</span> file in the website repository, and add the following inside the <span className="code">defaultLayers</span> object:</p>
            <p> <span className="code" dangerouslySetInnerHTML={this.generateLayerData()}>
            </span> </p>
          </>
        }

        { hasFile && 
          <>
            <h3 className="convert-step-title"> Step 8: Commit the changes to Git</h3> 
            <p className="convert-instructions">Bring everything into version control by running the following three commands from the website's root folder:</p>
            <p className="convert-instructions"><span className="code">git add .</span></p>
            <p className="convert-instructions"><span className="code">git commit -a -m 'Added new GeoJSON file'</span></p>
            <p className="convert-instructions"><span className="code">git push origin master</span></p>
          </>
        }

        { hasFile && 
          <>
            <h3 className="convert-step-title"> Step 9: Redeploy</h3> 
            <p className="convert-instructions">Restart the server or redeploy, using the website main instructions on Github.</p>
          </>
        }


      </div>
    )
  }

}