import React from 'react'
import { withMainContext } from '../context/MainContext'

class ControlPanel extends React.Component {
    state = {
    }
    render() {
    }
}

export default withMainContext((context, props) => ({
    // isAboutPageOpen: context.isAboutPageOpen,

    // getCurrentProjectBlocks: context.action.getCurrentProjectBlocks,
}))(ControlPanel)

