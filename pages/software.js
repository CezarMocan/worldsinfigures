import React from 'react'
import MainContextProvider from '../context/MainContext'
import Main from '../components/Main'
import Header from '../components/Head'


export default class Index extends React.PureComponent {
  componentDidMount() {
    document.body.style.overflow = "hidden"
  }
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