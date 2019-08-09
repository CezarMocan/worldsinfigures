import React from 'react'

export default class ProjectionItem extends React.Component {
    render() {
        const { displayName, flagEmoji, genderEmoji, year } = this.props
        return (
            <div className="projection-item">
                <div className="projection-item-datum">{displayName}</div>
                <div className="projection-item-datum">
                    {flagEmoji}&ensp;{genderEmoji}—{year}
                </div>
            </div>
        )
    }
}