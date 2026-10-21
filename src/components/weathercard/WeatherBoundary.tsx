'use client'

import { Component, type ReactNode } from 'react'
import Recovery from '@/components/recovery/Recovery'

interface Props {
  children: ReactNode
}

export default class WeatherBoundary extends Component<Props, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidUpdate(previous: Props) {
    if (this.state.failed && previous.children !== this.props.children) this.setState({ failed: false })
  }

  render() {
    if (this.state.failed) return <Recovery message="Weather could not be displayed. Try again or search for another city." />
    return this.props.children
  }
}
