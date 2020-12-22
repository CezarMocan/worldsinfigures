import React from 'react'
import { Visibility, VisibilityOff } from '@material-ui/icons'
import { GithubPicker, MaterialPicker } from 'react-color'
import Slider from '@material-ui/core/Slider'
import { colors } from '../data/Colors'
import colorParse from 'color'

const getColor = (color, opacity) => {

  return color + parseInt(255 * opacity / 100).toString(16).toUpperCase()
}

export default class LayerItem extends React.Component {
    state = {
      colorPickerOpen: false,
      strokePickerOpen: false,
      opacity: 100,
      color: "#ffffff"
    }
    onColorClick = (e) => {
      this.setState({ colorPickerOpen: !this.state.colorPickerOpen })
    }
    onColorChange = (color, e) => {
      const { onColorChange } = this.props
      this.setState({ color: color.hex }, () => {
        const { color, opacity } = this.state
        if (onColorChange) onColorChange(getColor(color, opacity))
      })
    }
    onOpacityChange = (event, newValue) => {
      const { onColorChange } = this.props
      this.setState({ opacity: newValue }, () => {
        const { color, opacity } = this.state
        if (onColorChange) onColorChange(getColor(color, opacity))
      })
    }
    onVisibilityClick = (e) => {
      const { visible, onVisibilityUpdate } = this.props
      if (onVisibilityUpdate) onVisibilityUpdate(!visible)
    }
    componentWillMount() {
      if (!this.props.color) return
      const { color } = this.props
      let opacity = colorParse(color).alpha() * 100
      let hex = colorParse(color).hex()
      this.setState({
        opacity,
        color: hex
      })
    }
    render() {
        const { visible, label, color, preserveOriginalStyle } = this.props
        const { colorPickerOpen, opacity } = this.state
        return (
            <div className="layer-item">
              <div className="layer-item-label">{label}</div>
              <div className="layer-item-controls">
              { !preserveOriginalStyle && color &&
                <div className="layer-items-control-fill" onClick={this.onColorClick} style={{ backgroundColor: color }}>
                  { colorPickerOpen && <div className="color-picker-container">
                    <GithubPicker colors={colors} onChangeComplete={this.onColorChange}/>
                    <div className="color-picker-opacity-slider">
                      <Slider value={opacity} onChange={this.onOpacityChange} aria-labelledby="continuous-slider" valueLabelDisplay="auto" defaultValue={100} />
                    </div>
                  </div>}
                </div>
              }
                <div className="layer-items-controls-visibility" onClick={this.onVisibilityClick}>
                  { !visible && <VisibilityOff/> }
                  { visible && <Visibility/> }
                </div>
              </div>              
            </div>
        )
    }
}