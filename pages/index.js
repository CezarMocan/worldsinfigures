import React from 'react'
import MainContextProvider from '../context/MainContext'
import Main from '../components/Main'

export default class Index extends React.PureComponent {
    render() {
        return (
          <MainContextProvider>
            <Main/>
          </MainContextProvider>
        )
    }
}