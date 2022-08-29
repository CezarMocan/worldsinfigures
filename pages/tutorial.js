import React from 'react'
import ReactPlayer from 'react-player'
import Style from '../static/styles/home.less'

export default class Index extends React.PureComponent {
    render() {
        return (
          <ReactPlayer 
            url="https://www.evan-roth.com/transfer/worlds-in-figures/Worlds-In-Figures-01_23-rf20.mp4"
            // url="/static/video/test-video.mp4"
            config={{
              file: {
                tracks: [
                  {
                    kind: "subtitles",
                    src: "/static/video/english.vtt",
                    srcLang: "en",
                    label: "English",
                    default: true
                  },
                  {
                    kind: "subtitles",
                    src: "/static/video/german.vtt",
                    srcLang: "de",
                    label: "Deutsch"
                  },
                ]                
              }
            }}
            controls={true} 
            pip={false} 
            width="100vw" 
            height="100vh" 
            style={{backgroundColor: 'black'}}
          />
        )
    }
}