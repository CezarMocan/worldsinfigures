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
import Typography from '@material-ui/core/Typography';
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
import AspectRatiosDropdown from './AspectRatiosDropdown'

class ControlPanel extends React.Component {
    state = {
      animationOptions: {
        x: { active: true, increment: 5, total: 360 },
        y: { active: true, increment: 5, total: 360 },
        z: { active: true, increment: 5, total: 360 },
      },
      canvasAttributes: { canvasRatioIndex: 1000 },      
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
    resetProjectionAttributes = () => {
      const { updateStateObject } = this.props
      updateStateObject('projectionAttributes', {           
        scale: 200 * this.state.canvasAttributes.canvasDisplayPercentage / 100,
        rotateX: 0,
        rotateY: 0,
        rotateZ: 0,
        translateX: 50,
        translateY: 50
      })
    }
    onAnimationOptionsUpdate = (axisName, propertyName, eventProp) => event => {
      const { updateStateObject } = this.props
      if (propertyName == 'start') {
        const mapping = { 'x': 'rotateX', 'y': 'rotateY', 'z': 'rotateZ' }
        updateStateObject('projectionAttributes', { [mapping[axisName]]: parseFloat(event.target[eventProp]) })
      }
      this.setState({
        animationOptions: {
          ...this.state.animationOptions,
          [axisName]: {
            ...this.state.animationOptions[axisName],
            [propertyName]: eventProp == 'value' ? parseFloat(event.target[eventProp]) : event.target[eventProp]
          }
        }
      })
    }
    onCanvasWidthUpdate = (event) => {
      if (event.target.value === this.state.canvasDisplayWidth) return
      const isLocked = this.props.canvasAttributes.canvasRatioLocked
      const ratio = this.props.canvasAttributes.canvasRatioWidth / this.props.canvasAttributes.canvasRatioHeight
      this.setState({
        canvasAttributes: {
          ...this.state.canvasAttributes,
          canvasDisplayWidth: event.target.value,
          // canvasDisplayHeight: isLocked ? event.target.value * ratio : this.state.canvasAttributes.canvasDisplayHeight,
        }
      })
    } 
    onCanvasHeightUpdate = (event) => {
      if (event.target.value === this.state.canvasDisplayHeight) return
      this.setState({
        canvasAttributes: {
          ...this.state.canvasAttributes,
          canvasDisplayHeight: event.target.value
        }
      })
    }
    updateCanvasWidth = () => {
      const { updateCanvasWidth } = this.props
      updateCanvasWidth(this.state.canvasAttributes.canvasDisplayWidth)
    }
    updateCanvasHeight = () => {
      const { updateCanvasHeight } = this.props
      updateCanvasHeight(this.state.canvasAttributes.canvasDisplayHeight)
    }
    onCanvasDisplayPercentageUpdate = (event) => {
      this.setState({
        canvasAttributes: {
          ...this.state.canvasAttributes,
          canvasDisplayPercentage: event.target.value
        }
      })
    }
    updateCanvasDisplayPercentage = () => {
      const { updateCanvasDisplayPercentage } = this.props
      updateCanvasDisplayPercentage(this.state.canvasAttributes.canvasDisplayPercentage)
    }
    onCanvasRatioWidthUpdate = (event) => {
      if (event.target.value === this.state.canvasRatioWidth) return
      this.setState({
        canvasAttributes: {
          ...this.state.canvasAttributes,
          canvasRatioWidth: event.target.value
        }
      })
    }
    onCanvasRatioHeightUpdate = (event) => {
      if (event.target.value === this.state.canvasRatioHeight) return
      this.setState({
        canvasAttributes: {
          ...this.state.canvasAttributes,
          canvasRatioHeight: event.target.value
        }
      })
    }
    updateCanvasRatio = () => {
      const { updateCanvasRatio } = this.props
      updateCanvasRatio(this.state.canvasAttributes.canvasRatioWidth, this.state.canvasAttributes.canvasRatioHeight, this.state.canvasAttributes.canvasRatioIndex)
    }
    onCanvasRatioLockedUpdate = (event) => {
      const { updateCanvasRatioLocked } = this.props
      updateCanvasRatioLocked(event.target.checked)
    }
    onCanvasRatioDropdownSelect = (ratio) => {
      let newState = { canvasRatioIndex: ratio.index }
      if (ratio.w != null && ratio.h != null) {
        newState.canvasRatioWidth = ratio.w
        newState.canvasRatioHeight = ratio.h
      }
      this.setState({
        canvasAttributes: {
          ...this.state.canvasAttributes,
          ...newState
        }
      }, () => {
        this.updateCanvasRatio()
      })
    }
    onAnimateClick = () => {
      const { onAnimate } = this.props
      const { animationOptions } = this.state
      animationOptions.x.start = this.props.projectionAttributes.rotateX
      animationOptions.y.start = this.props.projectionAttributes.rotateY
      animationOptions.z.start = this.props.projectionAttributes.rotateZ
      onAnimate(animationOptions)
    }
    onAddLayerModalOpen = () => {
      this.setState({ addLayerModalOpen: true })
    }
    onAddLayerModalClose = () => {
      this.setState({ addLayerModalOpen: false })
    }
    componentWillMount() {
      this.setState({
        canvasAttributes: { ...this.props.canvasAttributes }
      })
    }
    componentWillReceiveProps(newProps) {
      this.setState({
        canvasAttributes: { ...newProps.canvasAttributes }
      })      
    }
    render() {
      const { projectionAttributes, renderOptions, downloadOptions, layers } = this.props              
      const { scale, rotateX, rotateY, rotateZ, translateX, translateY, projection } = projectionAttributes
      const { clipToEarthBounds, tileVectors } = renderOptions
      const { animationOptions, addLayerModalOpen, canvasAttributes } = this.state

      const rasterLayers = Object.keys(layers).reduce((acc, k) => { 
        if (layers[k].type == layerTypes.RASTER) acc[k] = layers[k]
        return acc
      }, {})
      const vectorLayers = Object.keys(layers).reduce((acc, k) => { 
        if (layers[k].type == layerTypes.VECTOR) acc[k] = layers[k]
        return acc
      }, {})

      return (
        <div className="all-controls-container">
          <div className="controls canvas" style={{ marginTop: '10px' }}>
            <Typography variant="body2" style={{ fontSize: '14pt', marginLeft: '-3px' }}>🏁</Typography>
            <h1 style={{ fontSize: '24pt'}}> Worlds In Figures </h1>
            <div className="canvas-options">
                <Typography variant="body2" style={{ fontSize: '11pt' }}>Set the canvas width and height below, with the full resolution you need for exporting. Then, set the Display percentage to something lower than 100% in order to fit the canvas onto the screen, and achieve faster rendering.</Typography>
            </div>
            <Typography variant="body2" style={{ fontSize: '14pt', marginTop: '10px', marginLeft: '-3px' }}>🏁</Typography>
          </div>          
          <div className="controls canvas">
            <h1> Canvas Dimensions</h1>
            <div className="canvas-options">
              <FormGroup style={{marginBottom: '15px'}}>
                <Typography variant="body2">Set the canvas width and height below, with the full resolution you need for exporting. Then, set the Display percentage to something lower than 100% in order to fit the canvas onto the screen, and achieve faster rendering.</Typography>
                <FormGroup row className="justify-space-between">
                  <FormGroup row className="align-items-center">
                    <div className="item-option-container input-right-aligned"> <TextField label="Width" value={canvasAttributes.canvasDisplayWidth} size="small" onChange={this.onCanvasWidthUpdate} onBlur={this.updateCanvasWidth}/> </div>
                    <div style={{display: 'flex', alignItems: 'center', margin: '0 10px 0 5px', paddingTop: '10px', fontSize: '6pt' }}>✕</div>
                    <div className="item-option-container"> <TextField label="Height" value={canvasAttributes.canvasDisplayHeight} size="small" onChange={this.onCanvasHeightUpdate} onBlur={this.updateCanvasHeight} /> </div>
                    <div style={{display: 'flex', alignItems: 'center', margin: '0 10px 0 5px', paddingTop: '10px', fontSize: '6pt' }}>@</div>
                    <div className="item-option-container"> <TextField label="Display" value={canvasAttributes.canvasDisplayPercentage} size="small" onChange={this.onCanvasDisplayPercentageUpdate} onBlur={this.updateCanvasDisplayPercentage} /> </div>
                    <div style={{display: 'flex', alignItems: 'center', margin: '0 10px 0 5px', paddingTop: '10px', fontSize: '6pt' }}>%</div>
                  </FormGroup>
                </FormGroup>
              </FormGroup>

              <FormGroup>
                <div>
                  <Typography variant="body2" disabled={!canvasAttributes.canvasRatioLocked}>You can select a pre-defined aspect ratio below.</Typography>
                </div>

                <div className="aspect-ratios-dropdown" style={{marginBottom: '5px'}}>
                  <FormGroup row className="align-items-center">
                    <FormControlLabel
                      control={ <Checkbox color="primary" size="small" checked={canvasAttributes.canvasRatioLocked} onChange={this.onCanvasRatioLockedUpdate} /> }
                      label="Lock Aspect Ratio"
                    />        
                    <AspectRatiosDropdown value={canvasAttributes.canvasRatioIndex} disabled={!canvasAttributes.canvasRatioLocked} onChange={this.onCanvasRatioDropdownSelect}/>
                  </FormGroup>                  
                </div>

                <div>
                  <Typography variant="body2">Or set a custom one.</Typography>
                </div>

                <FormGroup row className="align-items-center">                 
                  <div className="item-option-container input-right-aligned"> <TextField disabled={!canvasAttributes.canvasRatioLocked} value={canvasAttributes.canvasRatioWidth} size="small" onChange={this.onCanvasRatioWidthUpdate} /> </div>
                  <div style={{display: 'flex', alignItems: 'center', margin: '0 10px 0 5px', paddingTop: '10px', fontSize: '9pt' }}>:</div>
                  <div className="item-option-container"> <TextField disabled={!canvasAttributes.canvasRatioLocked} value={canvasAttributes.canvasRatioHeight} size="small" onChange={this.onCanvasRatioHeightUpdate} /> </div>
                  <div className="set-ratio-button">
                    <a href="#" onClick={this.updateCanvasRatio}> <Button disabled={!canvasAttributes.canvasRatioLocked} variant="outlined"> Set Custom Aspect Ratio </Button> </a>
                  </div>                 
                </FormGroup>
              </FormGroup>
            </div>
          </div>

          <div className="controls sliders">
            <h1> Projection </h1>
            <Typography variant="body2" style={{ marginBottom: '5px' }}>Set the canvas width and height below, with the full resolution you need for exporting. Then, set the Display percentage to something lower than 100% in order to fit the canvas onto the screen, and achieve faster rendering.</Typography>
            <ProjectionsDropdown value={projection} onChange={this.onProjectionSelectionUpdate}/>
            <Typography variant="body2" style={{ marginBottom: '5px' }}>Set the canvas width and height below, with the full resolution you need for exporting. Then, set the Display percentage to something lower than 100% in order to fit the canvas onto the screen, and achieve faster rendering.</Typography>
            <SliderWithInput label="Scale" min={3} max={500} initialValue={scale} onValueChange={this.onSliderProjectionAttributeUpdate('scale')}/>
            <SliderWithInput label="X Rotation" min={0} max={360} step={2.5} initialValue={rotateX} onValueChange={this.onSliderProjectionAttributeUpdate('rotateX')}/>
            <SliderWithInput label="Y Rotation" min={0} max={360} step={2.5} initialValue={rotateY} onValueChange={this.onSliderProjectionAttributeUpdate('rotateY')}/>
            <SliderWithInput label="Z Rotation" min={0} max={360} step={2.5} initialValue={rotateZ} onValueChange={this.onSliderProjectionAttributeUpdate('rotateZ')}/>
            <SliderWithInput label="X Offset" min={0} max={200} initialValue={translateX} onValueChange={this.onSliderProjectionAttributeUpdate('translateX')}/>
            <SliderWithInput label="Y Offset" min={0} max={200} initialValue={translateY} onValueChange={this.onSliderProjectionAttributeUpdate('translateY')}/>
            <Typography variant="body2" style={{ marginBottom: '10px', marginTop: '10px' }}>Reset the projection settings to their defaults by pressing the button below.</Typography>
            <a href="#" onClick={this.resetProjectionAttributes}> <Button variant="outlined"> Reset Parameters </Button> </a>
          </div>

          {/* <div className="controls rendering">
            <h1> Rendering </h1>
            <FormGroup row>
              
              <FormControlLabel
                control={ <Checkbox color="primary" checked={tileVectors} onChange={this.onCheckboxRenderOptionsUpdate('tileVectors')} /> }
                label="Vector Tiling (experimental)"
              />
            </FormGroup>
          </div> */}


          <div className="controls checkboxes">
            <h1> Custom Image </h1>
            <Typography variant="body2" style={{ marginBottom: '10px' }}>Set the canvas width and height below, with the full resolution you need for exporting. Then, set the Display percentage to something lower than 100% in order to fit the canvas onto the screen, and achieve faster rendering.</Typography>
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
             <Typography variant="body2" style={{ marginBottom: '5px', marginTop: '5px' }}>Upload your own image by dragging and dropping a new one on top of the canvas.</Typography>
             <FormControlLabel
                control={ <Checkbox color="default" checked={clipToEarthBounds} onChange={this.onCheckboxRenderOptionsUpdate('clipToEarthBounds')} /> }
                label="Clip image to Earth bounds"
              />
          </div>

          <div className="controls checkboxes">
            <h1> Visualization </h1>
            <Typography variant="body2" style={{ marginBottom: '10px' }}>Set the canvas width and height below, with the full resolution you need for exporting. Then, set the Display percentage to something lower than 100% in order to fit the canvas onto the screen, and achieve faster rendering.</Typography>            
            { Object.keys(vectorLayers).map(k => {
              const l = vectorLayers[k]
              return (
                <LayerItem
                  key={`layer-${k}`}
                  visible={l.visible}
                  color={l.style && l.style.color}     
                  preserveOriginalStyle={l.preserveOriginalStyle}                                                         
                  onVisibilityUpdate={this.onLayerToggleUpdate(k)}
                  onColorChange={this.onLayerColorUpdate(k)}
                  label={l.displayName}
                />
              )
            })}
            {/* <a href="#" onClick={this.onAddLayerModalOpen}>
              <Button variant="outlined" style={{ marginTop: '10px' }}>
                Add vector layer
              </Button>
            </a> */}
          </div>

          <div className="controls download">
            <h1> Export </h1>
            <div className="download-options">
              <FormGroup row>
                <FormControlLabel
                  control={ <Checkbox color="default" size="small" checked={downloadOptions.png} onChange={this.onDownloadOptionsUpdate('png')} /> }
                  label="PNG"
                />        
                <FormControlLabel
                  control={ <Checkbox color="primary" size="small" checked={downloadOptions.svg} onChange={this.onDownloadOptionsUpdate('svg')} /> }
                  label="SVG"
                />        
                <FormControlLabel
                  control={ <Checkbox color="secondary" size="small" checked={downloadOptions.config} onChange={this.onDownloadOptionsUpdate('config')} /> }
                  label="CFG"
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

          <div className="controls animate">
            <h1> Animate </h1>
            <div className="animate-options">
              <Typography variant="body2">If animating more than 250 frames, each batch of 250 will be split into its own archive, meaning that multiple browser download dialogues will show up throughout the rendering process.</Typography>
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

          {/* <div className="controls tools">
            <h1> Tools </h1>
            <a href="/convert" target="__blank">
              <Button variant="outlined">
                SVG to GeoJSON
              </Button>
            </a>
          </div> */}

          <div className="controls tools">
            <h1> Credits </h1>
            <div style={{display: 'flex', flexDirection: 'row', justifyContent: 'space-between'}}>
              <div><Typography variant="body2"><a href="https://evan-roth.com/" target="_blank">Evan Roth</a> (concept and creative direction)</Typography></div>
              <div><Typography variant="body2">👨🏼 🇺🇸 </Typography></div>              
            </div>
            <div style={{display: 'flex', flexDirection: 'row', justifyContent: 'space-between', marginBottom: '10px'}}>
              <div><Typography variant="body2"><a href="https://cezar.io/" target="_blank">Cezar Mocan</a> (software development)</Typography></div>
              <div><Typography variant="body2">👨🏼 🇷🇴 </Typography></div>              
            </div>
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
              <AddLayerDialog onClose={this.onAddLayerModalClose}/>
            </Fade>
          </Modal>

        </div>
      )
    }
}

export default withMainContext((context, props) => ({
    // Properties
    canvasAttributes: context.canvasAttributes,
    projectionAttributes: context.projectionAttributes,
    renderOptions: context.renderOptions,
    downloadOptions: context.downloadOptions,
    layers: context.layers,

    // Actions
    updateStateObject: context.action.updateStateObject,
    updateLayerVisibility: context.action.updateLayerVisibility,
    updateLayerColor: context.action.updateLayerColor,
    updateCanvasRatioLocked: context.action.updateCanvasRatioLocked,
    updateCanvasWidth: context.action.updateCanvasWidth,
    updateCanvasHeight: context.action.updateCanvasHeight,
    updateCanvasDisplayPercentage: context.action.updateCanvasDisplayPercentage,
    updateCanvasRatio: context.action.updateCanvasRatio
}))(ControlPanel)

