import React from 'react'
import { connect } from 'react-redux'
import { Router, Route, Link, withRouter, Switch } from 'react-router-dom'
import { browserHistory } from '../services/browser-history.service'
import AuthService from '../services/auth.service'
import styled from 'styled-components'
import PropTypes from 'prop-types'
import { initialize, fetchUser, closeAppModal, closeAppPanel } from '../actions'
import GraphqlService from '../services/graphql.service'
import CookieService from '../services/cookies.service'
import { Avatar, Loading, Error, Notification } from '@weekday/elements'
import { API_HOST, PUBLIC_VAPID_KEY, PN } from '../environment'
import ChannelsComponent from '../components/channels.component'
import ChannelComponent from '../components/channel.component'
import PanelAppComponent from '../components/panel-app.component'
import PanelAttachmentsComponent from '../components/panel-attachments.component'
import AppModal from '../modals/app.modal'
import DockComponent from '../components/dock.component'
import ToolbarComponent from '../components/toolbar.component'
import { askPushNotificationPermission, urlBase64ToUint8Array } from '../helpers/util'
import EventService from '../services/event.service'

const AppContainer = styled.div`
  background-color: white;
  background-size: contain;
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0px;
  left: 0px;
`

const App = styled.div`
  width: 100%;
  height: 100%;
  flex: 1;
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

class AppPage extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      teams: [],
      userId: null,
      pushNotifications: false,
    }

    this.onAppMessageReceived = this.onAppMessageReceived.bind(this)
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
    this.checkPushNotification()
  }

  async checkPushNotification() {
    const pnPermissions = await navigator.permissions.query({ name: 'notifications' })

    // If they've been asked'
    if (CookieService.getCookie(PN)) {
      this.setState({ pushNotifications: false })
      if (pnPermissions.state == 'granted') {
        this.subscribePushNotification()
      }
    }

    // If they haven't - then ask them
    // Ideally we want to check right away
    // But Google LightHouse will moan about first having to
    // reposnd to a user gesture - so always show them the UI
    if (!CookieService.getCookie(PN)) this.setState({ pushNotifications: true })
  }

  async subscribePushNotification() {
    if ('serviceWorker' in navigator) {
      try {
        const register = await navigator.serviceWorker.register('/sw.js', { scope: '/' })
        let serviceWorker

        if (register.installing) {
          serviceWorker = register.installing
        } else if (register.waiting) {
          serviceWorker = register.waiting
        } else if (register.active) {
          serviceWorker = register.active
        }

        if (serviceWorker) {
          if (serviceWorker.state == 'activated') {
            this.subscribeUser()
          }

          serviceWorker.addEventListener('statechange', e => {
            if (e.target.state == 'activated') {
              this.subscribeUser()
            }
          })
        }
      } catch (e) {
        console.error('Could not register service worker', e)
      }
    } else {
      console.error('Service workers are not supported in this browser')
    }
  }

  async subscribeUser() {
    const { userId } = this.state
    const registrations = await navigator.serviceWorker.getRegistrations()

    registrations.map(async register => {
      const parts = register.active.scriptURL.split('/')
      const path = parts[parts.length - 1]

      if (path == 'sw.js') {
        // Subscribe to the PNs
        const subscription = await register.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY),
        })

        // Join - we're not using this for anything yet
        // But we will
        await fetch(API_HOST + '/pn/subscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            subscription,
            userId,
          }),
        })
      }
    })
  }

  pushNotifications() {
    if ('PushManager' in window) {
      askPushNotificationPermission()
        .then(res => {
          CookieService.setCookie('PN', 'YES')
          this.setState({ pushNotifications: false })
          this.subscribePushNotification()
        })
        .catch(err => {
          CookieService.setCookie('PN', 'NO')
          this.setState({ pushNotifications: false })
        })
    }
  }

  dismissPushNotifications() {
    CookieService.setCookie('PN', 'NO')
    this.setState({ pushNotifications: false })
  }

  // prettier-ignore
  render() {
    if (!this.props.user.id) return <Loading show={true} />

    return (
      <AppContainer>
        <Loading show={this.props.common.loading} />
        <Error message={this.props.common.error} />

        {!this.props.common.connected &&
          <Notification text="Connecting..." />
        }

        {this.props.app.modal &&
          <AppModal
            action={this.props.app.modal}
            onClose={this.props.closeAppModal}
          />
        }

        {this.state.pushNotifications &&
          <Notification
            text="Push notifications are disabled."
            actionText="Enable"
            onActionClick={this.pushNotifications.bind(this)}
            onDismissClick={this.dismissPushNotifications.bind(this)}
          />
        }

        <Router history={browserHistory}>
          <App className="row">
            <Route path="/app" component={DockComponent} />
            <Route path="/app/team/:teamId" component={ChannelsComponent} />
            <Route path="/app/team/:teamId/channel/:channelId" component={ChannelComponent} />
            <Route
              path="/app/team/:teamId/channel/:channelId"
              render={props => {
                if (!this.props.app.panel) return null

                return (
                  <PanelAppComponent
                    action={this.props.app.panel}
                    onClose={this.props.closeAppPanel}
                  />
                )
              }}
            />
            <Route path="/app/team/:teamId/channel/:channelId/attachments" component={PanelAttachmentsComponent} />
            <Route path="/app/team/:teamId/channel/:channelId" component={ToolbarComponent} />
          </App>
        </Router>
      </AppContainer>
    );
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
