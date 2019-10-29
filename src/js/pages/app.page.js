import React from 'react'
import { connect } from 'react-redux'
import { Router, Route, Link, withRouter, Switch } from 'react-router-dom'
import { browserHistory } from '../services/browser-history.service'
import AuthService from '../services/auth.service'
import styled from 'styled-components'
import PropTypes from 'prop-types'
import { initialize, fetchUser } from '../actions'
import GraphqlService from '../services/graphql.service'
import CookieService from '../services/cookies.service'
import { Avatar, Loading, Error, Notification } from '@weekday/elements'
import { API_HOST, PUBLIC_VAPID_KEY } from '../environment'
import RoomsComponent from '../components/rooms.component'
import RoomComponent from '../components/room.component'
import DockComponent from '../components/dock.component'
import ToolbarComponent from '../components/toolbar.component'
import { askPushNotificationPermission, urlBase64ToUint8Array } from '../helpers/util'

const App = styled.div`
  background-color: white;
  background-size: contain;
  width: 100%;
  height: 100%;
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
  }

  async componentDidUpdate(prevProps) {
    if (!this.props.common.user) return null
    if (!prevProps.common.user) return null

    const current = this.props.common.user.id
    const prev = prevProps.common.user.id

    if (!current || !prev) return
    if (current != prev) this.fetchData(current)
  }

  async componentDidMount() {
    try {
      const { token } = await AuthService.currentAuthenticatedUser()
      const { userId } = AuthService.parseJwt(token)

      this.setState({ userId })
      this.fetchData(userId)
    } catch (e) {
      this.props.history.push('/auth')
    }
  }

  async fetchData(userId) {
    this.props.fetchUser(userId)
    this.props.initialize()
    this.checkPushNotification()
  }

  checkPushNotification() {
    // If they've been asked'
    if (CookieService.getCookie('PN')) this.setState({ pushNotifications: false })

    // If they haven't - then ask them
    // Ideally we want to check right away
    // But Google LightHouse will moan about first having to
    // reposnd to a user gesture - so always show them the UI
    if (!CookieService.getCookie('PN')) this.setState({ pushNotifications: true })
  }

  async subscribePushNotification() {
    if ('serviceWorker' in navigator) {
      try {
        // Register our SW
        const register = await navigator.serviceWorker.register('/sw.pn.js', { scope: '/' })
        const { userId } = this.state

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
      } catch (e) {
        console.error('Could not register service worker', e)
      }
    } else {
      console.error('Service workers are not supported in this browser');
    }
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
    if (!this.props.common.user) return <Loading show={true} />
    if (!this.props.common.user.id) return <Loading show={true} />

    return (
      <App className="column align-items-start app-page">
        <Loading show={this.props.common.loading} />
        <Error message={this.props.common.error} />

        {this.state.pushNotifications &&
          <Notification
            text="Push notifications are disabled."
            actionText="Enable"
            onActionClick={this.pushNotifications.bind(this)}
            onDismissClick={this.dismissPushNotifications.bind(this)}
          />
        }

        <Router history={browserHistory}>
          <div className="row w-100 h-100 align-items-start align-content-start justify-content-start flex-1">
            <Route path="/app" component={DockComponent} />
            <Route path="/app/team/:teamId" component={RoomsComponent} />
            <Route path="/app/team/:teamId/room/:roomId" component={RoomComponent} />
            <Route path="/app/team/:teamId/room/:roomId" component={ToolbarComponent} />
          </div>
        </Router>
      </App>
    );
  }
}

AppPage.propTypes = {
  common: PropTypes.any,
  initialize: PropTypes.func,
  fetchUser: PropTypes.func,
}

const mapDispatchToProps = {
  initialize: () => initialize(),
  fetchUser: userId => fetchUser(userId),
}

const mapStateToProps = state => {
  return {
    common: state.common,
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(AppPage)
