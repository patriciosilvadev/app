import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import styled from 'styled-components'
import ModalPortal from '../portals/modal.portal'
import PropTypes from 'prop-types'
import { Button, Modal } from '@yack/elements'
import { IconComponent } from './icon.component'
import PanelComponent from './panel.component'

export default function PanelAppComponent(props) {
  const user = useSelector(state => state.user)
  const channel = useSelector(state => state.channel)
  const dispatch = useDispatch()
  const [url, setUrl] = useState(props.action.payload.url)

  // If a user has submitted a command
  // then this will be attached to the webhook, panel or modal
  useEffect(() => {
    // If the user has already added a query string
    if (props.action.payload.url.indexOf('?') == -1) {
      setUrl(`${props.action.payload.url}?token=${props.action.token}&userId=${user.id}${props.action.userCommand ? '&userCommand=' + props.action.userCommand : ''}`)
    } else {
      setUrl(`${props.action.payload.url}&token=${props.action.token}&userId=${user.id}${props.action.userCommand ? '&userCommand=' + props.action.userCommand : ''}`)
    }
  }, [props.action])

  return (
    <PanelComponent title={props.action.name} onClose={props.onClose}>
      <Iframe border="0" src={url} width="100%" height="100%"></Iframe>
    </PanelComponent>
  )
}

PanelAppComponent.propTypes = {
  onClose: PropTypes.func,
  action: PropTypes.any,
}

const Iframe = styled.iframe`
  border: none;
`
