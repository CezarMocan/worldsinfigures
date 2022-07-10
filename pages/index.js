import React from 'react'
import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";
import MainContextProvider from '../context/MainContext'
import Homepage from '../components/Homepage'
import Main from '../components/Main'
import Tutorial from '../components/Tutorial'

export default class Index extends React.PureComponent {
    render() {
        return (
          <MainContextProvider>            
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Homepage/>}/>
                <Route path="/software" element={<Main/>}/>
                <Route path="/tutorial" element={<Tutorial/>}/>
              </Routes>
              
            </BrowserRouter>            
          </MainContextProvider>
        )
    }
}