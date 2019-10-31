import React, { useState, useRef, useEffect } from 'react'
import styled from 'styled-components'

const Container = styled.span`
  color: ${props => {
    switch (props.color) {
      case 'xxd':
        return '#202934'
      case 'xd':
        return '#5F6B7A'
      case 'd':
        return '#8895A7'
      case 'm':
        return '#B8C4CE'
      case 'l':
        return '#CFD6DE'
      case 'xl':
        return '#E1E7EB'
      case 'xxl':
        return '#F8F9FA'
      case 'highlight':
        return '#00a8ff'
      case 'danger':
        return '#DC2F30'
      default:
        return '#483545'
    }
  }};
  font-size: ${props => {
    switch (props.display) {
      case 'h1':
        return '22px'
      case 'h2':
        return '20px'
      case 'h3':
        return '18px'
      case 'h4':
        return '16px'
      case 'h5':
        return '14px'
      case 'p':
        return '14px'
      case 'a':
        return '14px'
      case 'small':
        return '10px'
      default:
        return '12px'
    }
  }};
  font-weight: ${props => {
    switch (props.display) {
      case 'h1':
        return '800'
      case 'h2':
        return '700'
      case 'h3':
        return '600'
      case 'h4':
        return '500'
      case 'h5':
        return '400'
      case 'p':
        return '500'
      case 'a':
        return '700'
      case 'small':
        return '500'
      default:
        return '500'
    }
  }};
`

export const Text = props => {
  return (
    <Container color={props.color} display={props.display} {...props}>
      {props.children}
    </Container>
  )
}
