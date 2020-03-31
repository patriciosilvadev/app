import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import styled from 'styled-components'
import PropTypes from 'prop-types'
import { openApp } from '../actions'
import { IconComponent } from '../components/icon.component'
import ModalPortal from '../portals/modal.portal'
import { Button, Modal } from '@tryyack/elements'
import { APPSTORE_URL } from '../environment'
import AuthService from '../services/auth.service'

export default function ToolbarComponent(props) {
  const [buttons, setButtons] = useState([])
  const [store, setStore] = useState(false)
  const [url, setUrl] = useState(false)
  const user = useSelector(state => state.user)
  const channel = useSelector(state => state.channel)
  const team = useSelector(state => state.team)
  const dispatch = useDispatch()

  const handleAppStoreClick = async () => {
    const { token } = await AuthService.currentAuthenticatedUser()
    const appstoreUrl = `${APPSTORE_URL}?userId=${user.id}&teamId=${team.id}&channelId=${channel.id}&jwt=${token}`

    setStore(true)
    setUrl(appstoreUrl)
  }

  const handleActionClick = async action => {
    dispatch(openApp(action))
  }

  // Load all our toolbar actions
  useEffect(() => {
    const appButtons = []

    setButtons(appButtons)

    // TODO: Debugging - remove
    // handleAppStoreClick()

    channel.apps
      .filter(app => app.active)
      .map(app => {
        if (!app.app.tools) return
        if (app.app.tools.length == 0) return

        // Add the channel app details to each button so we can
        // pass them to the action _ for meta data
        app.app.tools.map(tool => {
          appButtons.push({
            ...tool,
            action: {
              ...tool.action,
              token: app.token,
            },
          })
        })
      })

    setButtons(appButtons)
  }, [channel.apps])

  return (
    <Toolbar className="column">
      {store && (
        <ModalPortal>
          <Modal title="Appstore" width="80%" height="90%" header={true} onClose={() => setStore(false)}>
            <Iframe border="0" src={url ? url : null} width="100%" height="100%"></Iframe>
          </Modal>
        </ModalPortal>
      )}

      {buttons.map((button, index) => {
        return (
          <AppIconContainer key={index} onClick={() => handleActionClick(button.action)}>
            <AppIconImage image={button.icon} />
          </AppIconContainer>
        )
      })}

      <div className="flexer" />

      <AppIconContainer onClick={handleAppStoreClick}>
        <IconComponent icon="yack" size={20} color="#666" />
      </AppIconContainer>
    </Toolbar>
  )
}

ToolbarComponent.propTypes = {}

const Toolbar = styled.div`
  align-items: center;
  height: 100%;
  position: relative;
  border-left: 1px solid #eaedef;
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
  background-repeat: no-repeat;
  background-image: url(${props => props.image});
`

const Iframe = styled.iframe`
  border: none;
`
