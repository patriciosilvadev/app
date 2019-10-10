import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import PropTypes from 'prop-types'

const Container = styled.div`
  background: white;
  width: 30px;
  position: relative;
  height: 17px;
  border: 1px solid #F1F3F5;
  box-shadow: 0px 0px 16px -9px rgba(0,0,0,0.75);
  cursor: pointer;
  overflow: hidden;
  border-radius: 100px;
`

const Toggle = styled.div`
  position: absolute;
  top: 0px;
  left: ${props => props.on ? "13px" : "0px"};
  background-color: ${props => props.on ? "#007af5" : "#e8ecee"};
  border-radius: 50%;
  transition: left 0.5s, background-color 0.5s;
  width: 15px;
  height: 15px;
`

export default function ToggleComponent(props) {
  const [on, setOn] = useState(props.on)

  useEffect(() => setOn(props.on), [props.on])

  return (
    <Container on={on} onClick={() => {
      props.onChange(!on)
      setOn(!on)
    }}>
      <Toggle on={on} />
    </Container>
  )
}

ToggleComponent.propTypes = {
  on: PropTypes.bool,
  onChange: PropTypes.func,
}
