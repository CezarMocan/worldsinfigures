import React from 'react'
import MenuItem from '@material-ui/core/MenuItem'
import ProjectionItem from '../../components/ProjectionItem'
import FormControl from '@material-ui/core/FormControl'
import Select from '@material-ui/core/Select'
import { projectionsList, projectionsMap } from '../../modules/Projections'

export default class ProjectionsDropdown extends React.Component {
    onProjectionSelectionUpdate = (e) => {
      const { onChange } = this.props
      if (onChange) onChange(e)
    }
    render() {
        const { value } = this.props
        return (
          <div className="controls projection">
            <FormControl className="form-control projection-form">
                <Select
                    value={value}
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
        )
    }
}