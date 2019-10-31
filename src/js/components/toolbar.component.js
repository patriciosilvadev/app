import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import PropTypes from 'prop-types'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

const Toolbar = styled.div`
  display: flex;
  height: 100%;
  position: relative;
  background: white;
  background: white;
  border-left: 1px solid #f1f3f5;
`

const IconContainer = styled.div`
  padding: 15px;
`

export default function ToolbarComponent(props) {
  return null

  // prettier-ignore
  return (
    <Toolbar className="column">
      <IconContainer>
      </IconContainer>
    </Toolbar>
  )
}

ToolbarComponent.propTypes = {}
