import React from 'react'
import { Visibility, VisibilityOff } from '@material-ui/icons'
import { GithubPicker, MaterialPicker } from 'react-color'
import { colors } from '../data/Colors'

export default class LayerItem extends React.Component {
    state = {
      colorPickerOpen: false,
      strokePickerOpen: false
    }
    onColorClick = (e) => {
      this.setState({ colorPickerOpen: !this.state.colorPickerOpen })
    }
    onColorChange = (color, e) => {
      const { onColorChange } = this.props
      if (onColorChange) onColorChange(color.hex)
    }
    onVisibilityClick = (e) => {
      const { visible, onVisibilityUpdate } = this.props
      if (onVisibilityUpdate) onVisibilityUpdate(!visible)
    }
    render() {
        const { visible, label, color, preserveOriginalStyle } = this.props
        const { colorPickerOpen } = this.state
        return (
            <div className="layer-item">
              <div className="layer-item-label">{label}</div>
              <div className="layer-item-controls">
              { !preserveOriginalStyle && color &&
                <div className="layer-items-control-fill" onClick={this.onColorClick} style={{ backgroundColor: color }}>
                  { colorPickerOpen && <div className="color-picker-container">
                    <GithubPicker colors={colors} onChangeComplete={this.onColorChange}/>
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