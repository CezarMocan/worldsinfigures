import React from 'react'
import MenuItem from '@material-ui/core/MenuItem'
import FormControl from '@material-ui/core/FormControl'
import FormGroup from '@material-ui/core/FormGroup'
import FormControlLabel from '@material-ui/core/FormControlLabel'
import Select from '@material-ui/core/Select'
import Button from '@material-ui/core/Button'
import Checkbox from '@material-ui/core/Checkbox'
import { projectionsList } from '../../modules/Projections'
import { withMainContext } from '../../context/MainContext'
import SliderWithInput from '../../components/SliderWithInput'
import ProjectionItem from '../../components/ProjectionItem'
import LayerItem from '../../components/LayerItem'

class ControlPanel extends React.Component {
    state = {
    }

    onProjectionSelectionUpdate = (event) => {
      const { updateStateObject } = this.props
      updateStateObject('projectionAttributes', { projection: event.target.value })
    }

    onSliderProjectionAttributeUpdate = sliderName => newValue => {
      const { updateStateObject } = this.props
      updateStateObject('projectionAttributes', { [sliderName]: newValue })
    }
    onCheckboxRenderOptionsUpdate = optionName => event => {
      const { updateStateObject } = this.props
      updateStateObject('renderOptions', { [optionName]: event.target.checked })
    }
    onLayerToggleUpdate = layerName => newVisible => {
      const { updateLayerVisibility } = this.props
      updateLayerVisibility(layerName, newVisible)
    }
    onLayerColorUpdate = layerName => newColor => {
      const { updateLayerColor } = this.props
      updateLayerColor(layerName, newVisible)      
    }
    onDownloadOptionsUpdate = optionName => event => {
      const { updateStateObject } = this.props
      updateStateObject('downloadOptions', { [optionName]: event.target.checked })
    }
    onDownloadClick = () => {
      const { onDownload } = this.props
      onDownload()
    }

    render() {
      const { projectionAttributes, renderOptions, downloadOptions, layers } = this.props        
      const { scale, rotateX, rotateY, rotateZ, translateX, translateY, projection } = projectionAttributes
      const { clipToEarthBounds, tileVectors } = renderOptions

      return (
        <div className="all-controls-container">
          <h1> Projection </h1>

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
                ))}
              </Select>
            </FormControl>
          </div>


          <h1> Parameters </h1>

          <div className="controls sliders">
            <SliderWithInput label="Scale" min={3} max={500} initialValue={scale} onValueChange={this.onSliderProjectionAttributeUpdate('scale')}/>
            <SliderWithInput label="X Rotation" min={0} max={360} step={2.5} initialValue={rotateX} onValueChange={this.onSliderProjectionAttributeUpdate('rotateX')}/>
            <SliderWithInput label="Y Rotation" min={0} max={360} step={2.5} initialValue={rotateY} onValueChange={this.onSliderProjectionAttributeUpdate('rotateY')}/>
            <SliderWithInput label="Z Rotation" min={0} max={360} step={2.5} initialValue={rotateZ} onValueChange={this.onSliderProjectionAttributeUpdate('rotateZ')}/>
            <SliderWithInput label="X Offset" min={0} max={200} initialValue={translateX} onValueChange={this.onSliderProjectionAttributeUpdate('translateX')}/>
            <SliderWithInput label="Y Offset" min={0} max={200} initialValue={translateY} onValueChange={this.onSliderProjectionAttributeUpdate('translateY')}/>
          </div>


          <h1> Rendering </h1>

          <div className="controls rendering">
            <FormGroup row>
              <FormControlLabel
                control={ <Checkbox color="default" checked={clipToEarthBounds} onChange={this.onCheckboxRenderOptionsUpdate('clipToEarthBounds')} /> }
                label="Clipping"
              />        
              <FormControlLabel
                control={ <Checkbox color="primary" checked={tileVectors} onChange={this.onCheckboxRenderOptionsUpdate('tileVectors')} /> }
                label="Vector Tiling (experimental)"
              />
            </FormGroup>
          </div>


          <h1> Layers </h1>

          <div className="controls checkboxes">
            { Object.keys(layers).map(k => {
              const l = layers[k]
              return (
                <LayerItem
                  key={`layer-${k}`}
                  visible={l.visible}
                  color={l.style && l.style.color}                                                            
                  onVisibilityUpdate={this.onLayerToggleUpdate(k)}
                  onColorChange={this.onLayerColorUpdate(k)}
                  label={l.displayName}
                />
              )
            })}
          </div>


          <h1> Export </h1>

          <div className="controls download">
            <div className="download-options">
              <FormGroup row>
                <FormControlLabel
                  control={ <Checkbox color="default" checked={downloadOptions.png} onChange={this.onDownloadOptionsUpdate('png')} /> }
                  label="PNG"
                />        
                <FormControlLabel
                  control={ <Checkbox color="primary" checked={downloadOptions.svg} onChange={this.onDownloadOptionsUpdate('svg')} /> }
                  label="SVG"
                />        
                <FormControlLabel
                  control={ <Checkbox color="secondary" checked={downloadOptions.config} onChange={this.onDownloadOptionsUpdate('config')} /> }
                  label="CONFIG"
                />        
              </FormGroup>
            </div>

            <div className="download-button">
              <a href="#" ref={(r) => {this._downloadButton = r}} onClick={this.onDownloadClick}>
                <Button variant="outlined">
                  Download
                </Button>
              </a>
            </div>
          </div>

          <h1> Tools </h1>

          <div className="controls tools">
            <a href="/convert" target="__blank">
              <Button variant="outlined">
                SVG to GeoJSON
              </Button>
            </a>
          </div>

        </div>
      )
    }
}

export default withMainContext((context, props) => ({
    // Properties
    projectionAttributes: context.projectionAttributes,
    renderOptions: context.renderOptions,
    downloadOptions: context.downloadOptions,
    layers: context.layers,

    // Actions
    updateStateObject: context.action.updateStateObject,
    updateLayerVisibility: context.action.updateLayerVisibility,
    updateLayerColor: context.action.updateLayerColor,
}))(ControlPanel)

