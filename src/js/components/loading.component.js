import styled from 'styled-components'
import React from 'react'
import PropTypes from 'prop-types'

const Overlay = styled.div`
  position: absolute;
  width: 100%;
  height: 99.5%;
  bottom: 0px;
  left: 0px;
  z-index: 9999;
  background: rgba(255, 255, 255, 0.1);
  visibility: hidden;
  opacity: 0;
  transition: visibility 0s, opacity 0.25s linear;

  &.show {
    position: absolute;
    left: 0px;
    width: 100%;
    height: 99.5%;
    bottom: 0px;
    visibility: visible;
    opacity: 1;
    transition: visibility 0s, opacity 0.1s linear;
    z-index: 10000;
  }
`
// prettier-ignore
const Loading = styled.div`
  position: absolute;
  top: 0px;
  left: 0px;
  width: 100%;
  height: 0%;
  background: rgba(255, 255, 255, 0.5);
  z-index: 10000;
  display: flex;
  flex-direction: column;
  align-items: center;
  align-content: center;
  justify-content: center;
  visibility: hidden;
  opacity: 0;
  transition: height 0.25s, visibility 0s, opacity 0.25s linear;

  background: linear-gradient(90deg, #3d9ee1, #a63de1, #3d9fe1);
  background-size: 600% 600%;

  -webkit-animation: AnimationName 2s ease infinite;
  -moz-animation: AnimationName 2s ease infinite;
  animation: AnimationName 2s ease infinite;

  @-webkit-keyframes AnimationName {
      0%{background-position:84% 0%}
      50%{background-position:17% 100%}
      100%{background-position:84% 0%}
  }
  @-moz-keyframes AnimationName {
      0%{background-position:84% 0%}
      50%{background-position:17% 100%}
      100%{background-position:84% 0%}
  }
  @keyframes AnimationName {
      0%{background-position:84% 0%}
      50%{background-position:17% 100%}
      100%{background-position:84% 0%}
  }

  &.show {
    position: absolute;
    top: 0px;
    left: 0px;
    width: 100%;
    height: 0.5%;
    visibility: visible;
    opacity: 1;
    transition: height 0.25s, visibility 0s, opacity 0.1s linear;
    z-index: 10000;
  }
`

export default function LoadingComponent({ show }) {
  // prettier-ignore
  return (
    <React.Fragment>
      <Loading className={`loading ${show ? "show" : ""}`} />
      <Overlay className={`loading ${show ? "show" : ""}`} />
    </React.Fragment>
  )
}

LoadingComponent.propTypes = {
  show: PropTypes.bool,
}
