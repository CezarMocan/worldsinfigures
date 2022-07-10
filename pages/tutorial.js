import React from 'react'
import ReactPlayer from 'react-player'

export default class Index extends React.PureComponent {
    render() {
        return (
          <ReactPlayer url="http://www.evan-roth.com/transfer/worlds-in-figures/Worlds-In-Figures-01_15-rf29.mp4" controls={true} pip={false} width="100vw" height="100vh" />
        )
    }
}