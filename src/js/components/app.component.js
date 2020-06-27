import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import styled from 'styled-components'
import ModalPortal from '../portals/modal.portal'
import PropTypes from 'prop-types'
import { Button, Modal } from '@tryyack/elements'
import { IconComponent } from './icon.component'
import PanelComponent from './panel.component'

export default function AppComponent(props) {
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
    <Container className="column">
      <Header className="row">
        <HeaderTitle>{props.action.name}</HeaderTitle>
        <Tooltip>App</Tooltip>
        <div className="flexer"></div>
        <IconComponent icon="x" size={25} color="#040b1c" className="mr-5 button" onClick={props.onClose} />
      </Header>
      <IframeContainer>
        <Iframe border="0" src={url} width="100%" height="100%"></Iframe>
      </IframeContainer>
    </Container>
  )
}

AppComponent.propTypes = {
  onClose: PropTypes.func,
  action: PropTypes.any,
}

const Iframe = styled.iframe`
  border: none;
`

const IframeContainer = styled.div`
  flex: 1;
  position: relative;
  overflow: hidden;
  width: 100%;
`

const Container = styled.div`
  display: flex;
  flex-direction: column;
  width: 400px;
  height: 100%;
  border-left: 1px solid #f1f3f5;
`

const Header = styled.div`
  width: 100%;
  border-bottom: 1px solid #eaedef;
  position: relative;
  z-index: 5;
  padding 0px 25px 0px 25px;
  height: 75px;
  display: flex;
`

const HeaderTitle = styled.div`
  font-size: 18px;
  font-weight: 400;
  font-style: normal;
  color: #040b1c;
  transition: opacity 0.5s;
  display: inline-block;
  padding-right: 10px;
`

const Tooltip = styled.span`
  font-size: 10px;
  z-index: 2;
  position: relative;
  font-weight: 600;
  color: #adb5bd;
  background: #f2f3f5;
  border-radius: 5px;
  padding: 7px;
  text-transform: uppercase;
`
