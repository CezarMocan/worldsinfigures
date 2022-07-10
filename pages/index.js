import React from 'react'
import Link from 'next/link'
import Style from '../static/styles/home.less'
import Header from '../components/Head'

export default class Index extends React.PureComponent {
    render() {
        return (
          <>
            <Header/>
            <div className='container'>
              <div className='section software'>
                <Link href="/software">Software</Link>
              </div>
              <div className='section tutorial'>
                <Link href="/tutorial">Tutorial</Link>
              </div>
            </div>
          </>
        )
    }
}