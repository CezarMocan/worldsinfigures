import React from 'react'

const sleep = (s) => new Promise((res, rej) => setTimeout(res, s * 1000))

const MainContext = React.createContext()

export const PROJECTION_ATTRIBUTES = 'projectionAttributes'
export const RENDER_OPTIONS = 'renderOptions'

export default class MainContextProvider extends React.Component {
    state = {
      action: this,

      projectionAttributes: {
        scale: 100,
        rotateX: 0,
        rotateY: 0,
        rotateZ: 0,
        translateX: 50,
        translateY: 50,
        projection: 'geoEquirectangular',
      },

      renderOptions: {
        clipToEarthBounds: false,
        tileVectors: false,
      }
    }    

    updateStateObject = (itemName, newAttributes) => {
      let attributes = { ...this.state[itemName]}
      for (let k in newAttributes) {
        attributes[k] = newAttributes[k]
      }
      this.setState({ [itemName]: { ...attributes } })
    }

    updateStateItem = (itemName, newValue) => {
      this.setState({ [itemName]: newValue })
    }

    render() {
        const context = { ...this.state }
        const { children } = this.props

        return (
            <MainContext.Provider value={context}>
                { children }
            </MainContext.Provider>
        )
    }
}

export const withMainContext = (mapping) => Component => props => {
    return (
        <MainContext.Consumer>
            {(context) => <Component {...props} {...mapping(context, props)}/>}
        </MainContext.Consumer>
    )
}