import React from 'react'
import { Link } from "react-router-dom";

export default class Index extends React.PureComponent {
    render() {
        return (
          <div>
            <div>
              <Link to="/software">Software</Link>
            </div>
            <div>
              <Link to="/tutorial">Tutorial</Link>
            </div>
          </div>
        )
    }
}