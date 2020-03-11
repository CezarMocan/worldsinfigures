import Style from '../static/styles/convert.less'
import React from 'react'
import Dropzone from 'react-dropzone'
import MenuItem from '@material-ui/core/MenuItem'
import FormControl from '@material-ui/core/FormControl'
import Select from '@material-ui/core/Select'
import { svgToGeoJson } from '../modules/SvgToGeojson'
import { createAndDownloadText } from '../modules/DownloadHelper'
import shortid from 'shortid'
import { projectionsList, projectionsMap } from '../modules/Projections'
import ProjectionItem from '../components/ProjectionItem'

export default class Convert extends React.Component {
  state = {
    hasFile: false,
    filename: '__empty__',
    originalName: '__empty__',
    projection: 'geoEquirectangular'
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
    // let node = $('svg')[0]
    let node = this._svgContainer.children[0]
    // let bounds = [[90, 180], [-90, -180]]
    let bounds = [[0, 1000], [500, 0]]
    const { projection } = this.state
    let geojson = svgToGeoJson(bounds, node, projection, 20)

    createAndDownloadText(this.state.filename, JSON.stringify(geojson))
  }

  generateLayerData = () => {
    const { filename } = this.state
    return {
      __html: `
      &emsp;${shortid().replace(/\W/g, "")}: { // You can replace this ID with something legible, as long as it's different from all others in the file.<br/>
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

  onProjectionSelectionUpdate = (event) => {
    this.setState({ 
      projection: event.target.value,
      filename: `${this.state.originalName}-${event.target.value}.geojson`
    })
  }

  render() {
    const { hasFile, filename, projection } = this.state
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
            <p className="convert-instructions">You can use a tool like <a href="http://geojson.io" target="__blank">geojson.io</a> to try rendering the downloaded <span class="code">{filename}</span> file on a map and see if the conversion was done properly.</p>
          </>
        }


        { hasFile && 
          <>
            <h3 className="convert-step-title"> Step 6: Move the file</h3> 
            <p className="convert-instructions">Place the downloaded <span class="code">{filename}</span> file inside the <span class="code">static/geo/</span> folder of the website repository.</p>
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