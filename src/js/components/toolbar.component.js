import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import styled from 'styled-components'
import PropTypes from 'prop-types'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { openApp } from '../actions'

const Toolbar = styled.div`
  display: flex;
  height: 100%;
  position: relative;
  background: white;
  background: white;
  border-left: 1px solid #f1f3f5;
`

const AppIconContainer = styled.div`
  padding: 5px;
  margin: 15px;
  cursor: pointer;
  opacity: 1;
  transition: opacity 0.25s;

  &:hover {
    opacity: 0.8;
  }
`

const AppIconImage = styled.div`
  width: 20px;
  height: 20px;
  overflow: hidden;
  background-size: contain;
  background-position: center center;
  background-color: transparent;
  background-image: url(${props => props.image});
`

export default function ToolbarComponent(props) {
  const room = useSelector(state => state.room)
  const [actions, setActions] = useState([])
  const user = useSelector(state => state.user)
  const dispatch = useDispatch()

  const handleActionClick = async (action, payload = null) => {
    dispatch(openApp(action, payload))
  }

  // Load all our toolbar actions
  useEffect(() => {
    room.apps.map(app => {
      if (!app.active) return
      if (!app.app.tools) return
      if (app.app.tools.length == 0) return

      setActions(app.app.tools)
    })
  }, [room.apps])

  // prettier-ignore
  return (
    <Toolbar className="column">
      {actions.map((action, index) => {
        return (
          <AppIconContainer key={index} onClick={() => handleActionClick(action)}>
            <AppIconImage image={action.icon} />
          </AppIconContainer>
        )
      })}
    </Toolbar>
  )
}

ToolbarComponent.propTypes = {}
