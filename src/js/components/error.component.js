import styled from 'styled-components'
import React from 'react'
import PropTypes from 'prop-types'

const Error = styled.div`
  position: absolute;
  top: 0px;
  left: 0px;
  width: 100%;
  height: 30px;
  background: #ee716c;
  z-index: 10000;
  display: flex;
  flex-direction: column;
  align-items: center;
  align-content: center;
  justify-content: center;
  visibility: hidden;
  opacity: 0;
  transition: visibility 0s, opacity 0.25s linear;

  &.show {
    position: absolute;
    top: 0px;
    left: 0px;
    width: 100%;
    height: 30px;
    visibility: visible;
    opacity: 1;
    transition: visibility 0s, opacity 0.1s linear;
    z-index: 10000;
  }
`

const Text = styled.div`
  color: white;
  font-size: 12px;
  font-weight: 700;
`

export default function ErrorComponent(props) {
  const show = !!props.message

  // prettier-ignore
  return (
    <Error className={`loading ${show ? "show" : ""}`}>
      <Text>{typeof(props.message) == "string" ? props.message : "There has been an error"}</Text>
    </Error>
  )
}

ErrorComponent.propTypes = {
  message: PropTypes.any,
}
