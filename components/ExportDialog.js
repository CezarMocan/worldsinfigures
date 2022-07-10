import React from 'react'

export default class ExportDialog extends React.Component {
    src = ''
    render() {
        const { currentFrame, totalFrames, canvas } = this.props
        if (totalFrames < 200 || currentFrame % 10 == 0) {
          this.src = canvas.toDataURL('image/png')
        }
        const isZipping = (currentFrame >= totalFrames)
        return (
          <div className="export-modal-container">
            <div>
              { !isZipping &&
                <h1> Rendering: {parseInt(currentFrame / totalFrames * 100)}% ({currentFrame} / {totalFrames}) </h1>              
              }
              { isZipping &&
                <h1> Archiving... Please wait for the browser download dialog without closing this page. </h1>              
              }
            </div>
            <div>
              <img src={this.src} style={{width: '50%', height: 'auto'}}/>
            </div>
          </div>
        )
    }
}