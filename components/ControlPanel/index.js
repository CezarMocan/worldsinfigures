import React from 'react'
import { makeStyles } from '@material-ui/core/styles'
import Input from '@material-ui/core/Input'
import TextField from '@material-ui/core/TextField';
import MenuItem from '@material-ui/core/MenuItem'
import FormControl from '@material-ui/core/FormControl'
import FormGroup from '@material-ui/core/FormGroup'
import FormControlLabel from '@material-ui/core/FormControlLabel'
import Select from '@material-ui/core/Select'
import Button from '@material-ui/core/Button'
import Checkbox from '@material-ui/core/Checkbox'
import Modal from '@material-ui/core/Modal'
import Backdrop from '@material-ui/core/Backdrop'
import Fade from '@material-ui/core/Fade'
import { projectionsList } from '../../modules/Projections'
import { withMainContext } from '../../context/MainContext'
import SliderWithInput from '../../components/SliderWithInput'
import ProjectionItem from '../../components/ProjectionItem'
import LayerItem from '../../components/LayerItem'
import { layerTypes } from '../../data/LayerData'
import AddLayerDialog from './AddLayerDialog'
import ProjectionsDropdown from './ProjectionsDropdown'

class ControlPanel extends React.Component {
    state = {
      animationOptions: {
        x: { active: true, start: 0, increment: 5, total: 360 },
        y: { active: true, start: 0, increment: 5, total: 360 },
        z: { active: true, start: 0, increment: 5, total: 360 },
      },
      addLayerModalOpen: false
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
      updateLayerColor(layerName, newColor)      
    }
    onDownloadOptionsUpdate = optionName => event => {
      const { updateStateObject } = this.props
      updateStateObject('downloadOptions', { [optionName]: event.target.checked })
    }
    onDownloadClick = () => {
      const { onDownload } = this.props
      onDownload()
    }
    onAnimationOptionsUpdate = (axisName, propertyName, eventProp) => event => {
      const { updateStateObject } = this.props
      if (propertyName == 'start') {
        const mapping = { 'x': 'rotateX', 'y': 'rotateY', 'z': 'rotateZ' }
        updateStateObject('projectionAttributes', { [mapping[axisName]]: parseInt(event.target[eventProp]) })
      }
      this.setState({
        animationOptions: {
          ...this.state.animationOptions,
          [axisName]: {
            ...this.state.animationOptions[axisName],
            [propertyName]: eventProp == 'value' ? parseInt(event.target[eventProp]) : event.target[eventProp]
          }
        }
      })
    }
    onAnimateClick = () => {
      const { onAnimate } = this.props
      const { animationOptions } = this.state
      onAnimate(animationOptions)
    }
    onAddLayerModalOpen = () => {
      this.setState({ addLayerModalOpen: true })
    }
    onAddLayerModalClose = () => {
      this.setState({ addLayerModalOpen: false })
    }
    render() {
      const { projectionAttributes, renderOptions, downloadOptions, layers } = this.props        
      const { scale, rotateX, rotateY, rotateZ, translateX, translateY, projection } = projectionAttributes
      const { clipToEarthBounds, tileVectors } = renderOptions
      const { animationOptions, addLayerModalOpen } = this.state

      const rasterLayers = Object.keys(layers).reduce((acc, k) => { 
        if (layers[k].type == layerTypes.RASTER) acc[k] = layers[k]
        return acc
      }, {})
      const vectorLayers = Object.keys(layers).reduce((acc, k) => { 
        if (layers[k].type == layerTypes.VECTOR) acc[k] = layers[k]
        return acc
      }, {})

      console.log('vector layers: ', vectorLayers)

      return (
        <div className="all-controls-container">
          <h1> Projection </h1>
          <ProjectionsDropdown value={projection} onChange={this.onProjectionSelectionUpdate}/>

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


          <h1> Raster Layers </h1>

          <div className="controls checkboxes">
            { Object.keys(rasterLayers).map(k => {
              const l = rasterLayers[k]
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

          <h1> Vector Layers </h1>

          <div className="controls checkboxes">
            { Object.keys(vectorLayers).map(k => {
              const l = vectorLayers[k]
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
          <a href="#" onClick={this.onAddLayerModalOpen}>
            <Button variant="outlined">
              Add vector layer
            </Button>
          </a>

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

          <h1> Animate </h1>

          <div className="controls animate">
            <div className="animate-options">
              <FormGroup row>
                <Checkbox color="primary" checked={animationOptions.x.active} onChange={this.onAnimationOptionsUpdate('x', 'active', 'checked')} label="Active"/>
                <div className="axis-option-container label"><span>X-axis</span></div>
                <div className="axis-option-container"> <TextField label="Start" value={projectionAttributes.rotateX} size="small" onChange={this.onAnimationOptionsUpdate('x', 'start', 'value')}/> </div>
                <div className="axis-option-container"> <TextField label="Increment" defaultValue="5" size="small" onChange={this.onAnimationOptionsUpdate('x', 'increment', 'value')} /> </div>
                <div className="axis-option-container"> <TextField label="Total" defaultValue="360" size="small" onChange={this.onAnimationOptionsUpdate('x', 'total', 'value')} /> </div>
              </FormGroup>

              <FormGroup row>
                <Checkbox color="primary" checked={animationOptions.y.active} onChange={this.onAnimationOptionsUpdate('y', 'active', 'checked')} label="Active"/>
                <div className="axis-option-container label"><span>Y-axis</span></div>
                <div className="axis-option-container"> <TextField label="Start" value={projectionAttributes.rotateY} size="small" onChange={this.onAnimationOptionsUpdate('y', 'start', 'value')}/> </div>
                <div className="axis-option-container"> <TextField label="Increment" defaultValue="5" size="small" onChange={this.onAnimationOptionsUpdate('y', 'increment', 'value')} /> </div>
                <div className="axis-option-container"> <TextField label="Total" defaultValue="360" size="small" onChange={this.onAnimationOptionsUpdate('y', 'total', 'value')} /> </div>
              </FormGroup>

              <FormGroup row>
                <Checkbox color="primary" checked={animationOptions.z.active} onChange={this.onAnimationOptionsUpdate('z', 'active', 'checked')} label="Active"/>
                <div className="axis-option-container label"><span>Z-axis</span></div>
                <div className="axis-option-container"> <TextField label="Start" value={projectionAttributes.rotateZ} size="small" onChange={this.onAnimationOptionsUpdate('z', 'start', 'value')} /> </div>
                <div className="axis-option-container"> <TextField label="Increment" defaultValue="5" size="small" onChange={this.onAnimationOptionsUpdate('z', 'increment', 'value')} /> </div>
                <div className="axis-option-container"> <TextField label="Total" defaultValue="360" size="small" onChange={this.onAnimationOptionsUpdate('z', 'total', 'value')} /> </div>
              </FormGroup>

            </div>

            <div className="animate-button">
              <a href="#" ref={(r) => {this._downloadButton = r}} onClick={this.onAnimateClick}>
                <Button variant="outlined">
                  Animate!
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

          <Modal
            aria-labelledby="transition-modal-title"
            aria-describedby="transition-modal-description"
            open={addLayerModalOpen}
            onClose={this.onAddLayerModalClose}
            closeAfterTransition
            BackdropComponent={Backdrop}
            BackdropProps={{ timeout: 500 }}
            style={{display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <Fade in={addLayerModalOpen}>
              <AddLayerDialog/>
            </Fade>
          </Modal>

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

