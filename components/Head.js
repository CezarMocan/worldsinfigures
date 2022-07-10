import React from 'react'
import Link from 'next/link'
import Style from '../static/styles/home.less'
import Head from 'next/head'

export default class Header extends React.Component {
  render() {
    return (
    <Head>
      <title>Worlds In Figures</title>
      <meta property="og:title" content="Worlds In Figures" key="title" />
    </Head>
    )
  }
}