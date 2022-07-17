import React from 'react'
import ReactPlayer from 'react-player'
import Style from '../static/styles/home.less'

export default class Index extends React.PureComponent {
    render() {
        return (
          <ReactPlayer url="https://www.evan-roth.com/transfer/worlds-in-figures/Worlds-In-Figures-01_20-Hbd-1080p-RF22.mp4" controls={true} pip={false} width="100vw" height="100vh" style={{backgroundColor: 'black'}}/>
        )
    }
}