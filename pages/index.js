import React from 'react'
import Link from 'next/link'
import Style from '../static/styles/home.less'
import Header from '../components/Head'

const FORBIDDEN_COLORS = [5, 7]
const COLORS = [
  ['#2531f5', 'white'],
  ['#ef8732', 'blue'],
  ['#75fb4c', 'blue'],
  ['#964b00', 'blue'],
  ['#737f8f', 'blue'],
  ['#ffffff', 'blue'],
  ['#e93423', 'white'],
  ['#000000', 'white'],
  ['#ffff55', 'blue'],
  ['#8218f6', 'white'],
  ['#ed72b1', 'blue'],
  ['#75fbfe', 'blue']
]
const NO_COLORS = COLORS.length


export default class Index extends React.PureComponent {
    state = {
      color1: -1,
      color2: -1
    }

    getRandomColor() {
      let color = parseInt(Math.floor(Math.random() * NO_COLORS))
      while (FORBIDDEN_COLORS.includes(color))
        color = parseInt(Math.floor(Math.random() * NO_COLORS))
      return color
    }

    componentDidMount() {
      if (this.state.color1 >= 0) return
      let color1 = this.getRandomColor()
      let color2 = this.getRandomColor()
      while (color2 == color1) color2 = this.getRandomColor()
      this.setState({ color1, color2 })
    }

    render() {
      const { color1, color2 } = this.state
      if (color1 < 0) return null
        return (
          <>
            <Header/>
            <div className='container'>
              <div className='section' style={{backgroundColor: COLORS[color1][0] }}>
                <Link href="/software"><a style={{color: COLORS[color1][1] }}>Software</a></Link>
              </div>
              <div className='section' style={{backgroundColor: COLORS[color2][0]}}>
                <Link href="/tutorial" ><a style={{color: COLORS[color2][1] }}>Tutorial</a></Link>
              </div>
            </div>
          </>
        )
    }
}