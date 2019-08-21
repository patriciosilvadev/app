import React from 'react'
import styled from 'styled-components'
import PropTypes from 'prop-types'

const Loading = styled.div`
  position: absolute;
  top: 0px;
  left: 0px;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.5);
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  align-content: center;
  justify-content: center;
`

const Spinner = styled.div`
  display: inline-block;
  position: relative;
  width: 20px;
  height: 20px;

  ${Spinner} div {
    box-sizing: border-box;
    display: block;
    position: absolute;
    width: 15px;
    height: 15px;
    margin: 2px;
    border: 2px solid #3d9ee1;
    border-radius: 50%;
    animation: spinner 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
    border-color: #3d9fe1 transparent transparent transparent;
  }

  ${Spinner} div:nth-child(1) {
    animation-delay: -0.45s;
  }

  ${Spinner} div:nth-child(2) {
    animation-delay: -0.3s;
  }

  ${Spinner} div:nth-child(3) {
    animation-delay: -0.15s;
  }

  @keyframes spinner {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`

export default function SpinnerComponent(props) {
  // prettier-ignore
  return <Loading><Spinner><div></div><div></div><div></div><div></div></Spinner></Loading>
}

SpinnerComponent.propTypes = {}
