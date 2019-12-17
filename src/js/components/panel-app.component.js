import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import styled from 'styled-components'
import ModalPortal from '../portals/modal.portal'
import PropTypes from 'prop-types'
import { Button, Modal } from '@weekday/elements'
import { IconComponent } from './icon.component'

const Iframe = styled.iframe`
  border: none;
`

const Container = styled.div`
  display: flex;
  width: 300px;
  height: 100%;
  border-left: 1px solid #f1f3f5;
`

const Header = styled.div`
  width: 100%;
  background: transparent;
  border-bottom: 1px solid #f1f3f5;
  background: white;
  padding 15px 25px 15px 25px;
  display: flex;
`

const HeaderTitle = styled.div`
  font-size: 20px;
  font-weight: 600;
  font-style: normal;
  color: #040b1c;
  transition: opacity 0.5s;
  display: inline-block;
  margin-bottom: 2px;
  width: max-content;
  flex: 1;
`

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
      setUrl(`${props.action.payload.url}?token=${props.token}&userId=${user.id}${props.action.userCommand ? '&userCommand=' + props.action.userCommand : ''}`)
    } else {
      setUrl(`${props.action.payload.url}&token=${props.token}&userId=${user.id}${props.action.userCommand ? '&userCommand=' + props.action.userCommand : ''}`)
    }
  }, [])

  // prettier-ignore
  return (
    <Container className="column">
      <Header className="row">
        <HeaderTitle>
          {props.action.name}
        </HeaderTitle>
        <IconComponent
          icon="x"
          size={25}
          color="#040b1c"
          className="mr-5 button"
          onClick={props.onClose}
        />
      </Header>
      <Iframe
        border="0"
        src={url}
        width="100%"
        height="100%">
      </Iframe>
    </Container>
  )
}

PanelAppComponent.propTypes = {
  onClose: PropTypes.func,
  action: PropTypes.any,
}
