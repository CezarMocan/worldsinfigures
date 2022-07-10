import React from 'react'
import MenuItem from '@material-ui/core/MenuItem'
import ProjectionItem from '../../components/ProjectionItem'
import FormControl from '@material-ui/core/FormControl'
import Select from '@material-ui/core/Select'
import { projectionsList, projectionsMap } from '../../modules/Projections'

const aspectRatiosList = [
  { h: 1, w: 1 },
  { h: 13, w: 15 },
  { h: 6, w: 7 },
  { h: 4, w: 5 },
  { h: 28, w: 37 },
  { h: 3, w: 4 },
  { h: 8, w: 11 },
  { h: 18, w: 25 },
  { h: 5, w: 7 },
  { h: 7, w: 10 },
  { h: 15, w: 22 },
  { h: 2, w: 3 },
  { h: 16, w: 25 },
  { h: 7, w: 11 },
  { h: 11, w: 18 },
  { h: 3, w: 5 },
  { h: 4, w: 7 },
  { h: 189, w: 335 },
  { h: 11, w: 20 },
  { h: 19, w: 36 },
  { h: 10, w: 19 },
  { h: 1, w: 2 },
  { h: 11, w: 28 },
  { h: null, h: null } // Option for "Custom"
]

export default class AspectRatiosDropdown extends React.Component {
    onAspectRatioSelectionUpdate = (e) => {
      const { onChange } = this.props
      if (onChange) onChange({ 
        ...aspectRatiosList[e.target.value],
        index: e.target.value
      })
    }
    render() {
        let { value, disabled = false } = this.props
        console.log('Value is: ', value)
        if (value > aspectRatiosList.length) value = aspectRatiosList.length - 1
        return (
          <div className="aspect-ratio-dropdown-container">
            <FormControl className="form-control projection-form">
                <Select
                    value={value}
                    onChange={this.onAspectRatioSelectionUpdate}
                    disabled={disabled}
                >
                    { aspectRatiosList.map((p, index) => (
                        <MenuItem key={`aspect-ratio-item-${index}`} value={index}>
                          <div className="aspect-ratio-item">
                            {p.w != null ? `${p.w}:${p.h}` : "Custom"}
                          </div>                            
                        </MenuItem>
                        )) 
                    }
                </Select>
            </FormControl>
          </div>
        )
    }
}