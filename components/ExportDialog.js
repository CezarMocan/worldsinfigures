import React from 'react'

export default class ExportDialog extends React.Component {
    render() {
        const { currentFrame, totalFrames, canvas } = this.props
        const src = canvas.toDataURL('image/png')
        return (
          <div className="export-modal-container">
            <div>
              <h1> Rendering: {parseInt(currentFrame / totalFrames * 100)}% ({currentFrame} / {totalFrames}) </h1>              
            </div>
            <div>
              <img src={src} style={{width: '300px', height: 'auto'}}/>
            </div>
          </div>
        )
    }
}