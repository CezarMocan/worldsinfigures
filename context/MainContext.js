import React from 'react'

const sleep = (s) => new Promise((res, rej) => setTimeout(res, s * 1000))

const MainContext = React.createContext()

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
      }
    }    

    updateProjectionAttributes(newAttributes) {
      let projectionAttributes = { ...this.state.projectionAttributes }
      for (let k in newAttributes) {
        currAttributes[k] = newAttributes[k]
      }
      this.setState(projectionAttributes)
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