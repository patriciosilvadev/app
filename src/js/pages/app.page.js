import React from 'react'
import { connect } from 'react-redux'
import { Router, Route, Link, withRouter, Switch } from 'react-router-dom'
import { browserHistory } from '../services/browser-history.service'
import AuthService from '../services/auth.service'
import styled from 'styled-components'
import PropTypes from 'prop-types'
import { initialize, fetchUser, closeAppModal, closeAppPanel } from '../actions'
import GraphqlService from '../services/graphql.service'
import * as PresenceService from '../services/presence.service'
import CookieService from '../services/storage.service'
import { Avatar, Loading, Error, Notification } from '@tryyack/elements'
import { API_HOST, PUBLIC_VAPID_KEY, PN } from '../environment'
import ChannelsComponent from '../components/channels.component'
import ChannelComponent from '../components/channel.component'
import PanelAppComponent from '../components/panel-app.component'
import PanelAttachmentsComponent from '../components/panel-attachments.component'
import AppModal from '../modals/app.modal'
import DockComponent from '../components/dock.component'
import ToolbarComponent from '../components/toolbar.component'
import { showLocalPushNotification, urlBase64ToUint8Array } from '../helpers/util'
import EventService from '../services/event.service'
import * as PnService from '../services/pn.service'

class AppPage extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      teams: [],
      userId: null,
      pushNotificationsNotification: false,
    }

    this.onAppMessageReceived = this.onAppMessageReceived.bind(this)
    this.dismissPushNotifications = this.dismissPushNotifications.bind(this)
    this.handlePushNotificationsSetup = this.handlePushNotificationsSetup.bind(this)
    this.checkPushNotificationsAreEnabled = this.checkPushNotificationsAreEnabled.bind(this)
  }

  async componentDidUpdate(prevProps) {
    if (!this.props.user.id) return null
    if (!prevProps.user.id) return null

    const current = this.props.user.id
    const prev = prevProps.user.id

    if (!current || !prev) return
    if (current != prev) this.fetchData(current)
  }

  async componentDidMount() {
    try {
      const { token } = await AuthService.currentAuthenticatedUser()
      const { userId } = AuthService.parseJwt(token)

      this.setState({ userId })
      this.fetchData(userId)

      // This is sent from the app iframes in panels/modals
      window.addEventListener('message', this.onAppMessageReceived, false)
    } catch (e) {
      this.props.history.push('/auth')
    }
  }

  componentWillUnmount() {
    window.removeEventListener('message', this.onAppMessageReceived, false)
  }

  onAppMessageReceived(event) {
    if (!event.data) return
    if (!event.data.type) return
    if (!event.data.content) return

    // AUTO_ADJUST_MESSAGE_HEIGHT -> message.component
    // APP_PANEL -> common (action)
    // APP_MODAL -> common (action)
    EventService.getInstance().emit(event.data.type, event.data.content)
  }

  async fetchData(userId) {
    this.props.fetchUser(userId)
    this.props.initialize(userId)

    this.setupServiceWorker()

    // Touch this users last seen date
    await PresenceService.updateUserPresence(userId)
  }

  async setupServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const register = await navigator.serviceWorker.register('/sw.js', { scope: '/' })
        let serviceWorker

        if (register.installing) {
          serviceWorker = register.installing
        } else if (register.waiting) {
          // Service worker goes into waiting
          // TODO: Maybe in future show button that sends message to sw
          serviceWorker = register.waiting

          // For now - force it
          serviceWorker.postMessage('SKIP_WAITING')
        } else if (register.active) {
          serviceWorker = register.active
        }

        if (serviceWorker) {
          if (serviceWorker.state == 'activated') {
            this.checkPushNotificationsAreEnabled()
          }
        }

        // Triggered by the skipWaiting()
        serviceWorker.addEventListener('statechange', async e => {
          try {
            if (e.target.state == 'activated') {
              this.checkPushNotificationsAreEnabled()
            }
          } catch (e) {
            console.log(e)
          }
        })
      } catch (e) {
        console.log(e)
      }
    } else {
      console.log('Service workers are not supported in this browser')
    }
  }

  async checkPushNotificationsAreEnabled() {
    const { state } = await navigator.permissions.query({ name: 'notifications' })
    const cookie = CookieService.getStorage('PN')

    if (state == 'granted') {
      CookieService.setStorage('PN', 'YES')
      this.setState({ pushNotificationsNotification: false })

      // Now get their device ID
      PnService.subscribeUser()
    } else if (state == 'denied') {
      CookieService.setStorage('PN', 'NO')
      this.setState({ pushNotificationsNotification: false })
    } else {
      CookieService.deleteStorage('PN')
      this.setState({ pushNotificationsNotification: true })
    }
  }

  async handlePushNotificationsSetup() {
    if ('PushManager' in window) {
      const permission = await PnService.askPushNotificationPermission()
      const cookie = CookieService.getStorage('PN')

      // If they have granted us permission
      if (permission == 'granted') {
        CookieService.setStorage('PN', 'YES')
        this.setState({ pushNotificationsNotification: false })

        // Now get their device ID
        PnService.subscribeUser()
      } else {
        CookieService.setStorage('PN', 'NO')
        this.setState({ pushNotificationsNotification: false })
      }
    }
  }

  async dismissPushNotifications() {
    CookieService.setStorage('PN', 'NO')
    this.setState({ pushNotificationsNotification: false })
  }

  render() {
    if (!this.props.user.id) return <Loading show={true} />

    return (
      <AppContainer className="column">
        <Loading show={this.props.common.loading} />
        <Error message={this.props.common.error} theme="solid" />

        {!this.props.common.connected && <Notification theme="solid" text="Connecting..." />}
        {this.props.app.modal && <AppModal action={this.props.app.modal} onClose={this.props.closeAppModal} />}

        {this.state.pushNotificationsNotification && (
          <Notification text="Push notifications are disabled" actionText="Enable" onActionClick={this.handlePushNotificationsSetup} onDismissIconClick={this.dismissPushNotifications} theme="solid" />
        )}

        {/*
        <Notification
          text="Yack is currently is QA/testing mode - please click on the link to report bugs"
          actionText="support@yack.co"
          onDismissIconClick={null}
          theme="dark-pink"
          onActionClick={() => {
            window.location.href = 'mailto:support@yack.co?subject=I%20found%20a%20bug&body=Please%20add%20as%20much%20detail%20as%20you%20can%20here...'
          }}
        />
        */}

        <App className="row">
          <Router history={browserHistory}>
            <Route path="/app" component={DockComponent} />
            <Route path="/app/team/:teamId" component={ChannelsComponent} />
            <Route path="/app/team/:teamId/channel/:channelId" component={ChannelComponent} />
          </Router>
        </App>
      </AppContainer>
    )
  }
}

AppPage.propTypes = {
  common: PropTypes.any,
  user: PropTypes.any,
  app: PropTypes.any,
  initialize: PropTypes.func,
  fetchUser: PropTypes.func,
  closeAppModal: PropTypes.func,
  closeAppPanel: PropTypes.func,
}

const mapDispatchToProps = {
  initialize: userId => initialize(userId),
  fetchUser: userId => fetchUser(userId),
  closeAppModal: () => closeAppModal(),
  closeAppPanel: () => closeAppPanel(),
}

const mapStateToProps = state => {
  return {
    common: state.common,
    user: state.user,
    app: state.app,
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(AppPage)

const AppContainer = styled.div`
  background-color: #202027;
  background-color: white;
  background-size: contain;
  width: 100%;
  height: 100%;
  overflow: hidden;
  align-content: stretch;
`

const App = styled.div`
  flex: 1;
  overflow: hidden;
  width: 100%;
`

const Loader = () => (
  <div className="react-fragment-loader">
    <div className="react-fragment-spinner">
      <div />
      <div />
      <div />
      <div />
    </div>
  </div>
)
