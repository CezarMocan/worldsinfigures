import React from 'react'
import MainContextProvider from '../context/MainContext'
import Main from '../components/Main'
import Header from '../components/Head'


export default class Index extends React.PureComponent {
    render() {
        return (
          <>
            <MainContextProvider>            
              <Header/>      
              <Main/>                     
            </MainContextProvider>
          </>
        )
    }
}