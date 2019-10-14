import React from 'react'
import LoadingComponent from '../components/loading.component'
import ErrorComponent from '../components/error.component'
import { connect } from 'react-redux'
import { Router, Route, Link, withRouter, Switch } from 'react-router-dom'
import { browserHistory } from '../services/browser-history.service'
import AuthService from '../services/auth.service'
import styled from 'styled-components'
import PropTypes from 'prop-types'
import { initialize, fetchUser } from '../actions'
import RoomsPartial from '../partials/rooms.partial'
import RoomPartial from '../partials/room.partial'
import DockPartial from '../partials/dock.partial'
import ToolbarPartial from '../partials/toolbar.partial'
import MembersPartial from '../partials/members.partial'
import GraphqlService from '../services/graphql.service'
import NotificationComponent from '../components/notification.component'
import CookieService from '../services/cookies.service'
import { askPushNotificationPermission } from '../helpers/util'

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
      pushNotifications: false,
    }

    this.dismissPushNotifications = this.dismissPushNotifications.bind(this)
  }

  async componentDidUpdate(prevProps) {
    const current = this.props.common.user.id
    const prev = prevProps.common.user.id

    if (!current || !prev) return
    if (current != prev) this.fetchData(current)
  }

  async componentDidMount() {
    try {
      const { token } = await AuthService.currentAuthenticatedUser()
      const { sub } = AuthService.parseJwt(token)

      this.fetchData(sub)
    } catch (e) {
      this.props.history.push('/auth')
    }
  }

  async fetchData(userId) {
    this.props.fetchUser(userId)

    const joins = await GraphqlService.getInstance().joins(userId)
    const ids = joins.data.joins.map(join => join.id)

    this.props.initialize(ids)
    this.checkPushNotification()
  }

  checkPushNotification() {
    // If they've interacted with the notification bar in any way
    // Don't bother them again
    if (CookieService.getCookie('PN') == 'YES') this.setState({ pushNotifications: false })
    if (CookieService.getCookie('PN') == 'NO') this.setState({ pushNotifications: false })

    // If they haven't - then ask them
    if (!CookieService.getCookie('PN')) this.pushNotifications()
  }

  pushNotifications() {
    if ('PushManager' in window) {
      askPushNotificationPermission()
        .then(res => {
          CookieService.setCookie('PN', 'YES')
          this.setState({ pushNotifications: false })
        })
        .catch(err => {
          this.setState({ pushNotifications: true })
        })
    }
  }

  dismissPushNotifications() {
    CookieService.setCookie('PN', 'NO')
    this.setState({ pushNotifications: false })
  }

  // prettier-ignore
  render() {
    if (!this.props.common.user.id) return <LoadingComponent show={true} />

    return (
      <App className="column align-items-start app-page">
        <LoadingComponent show={this.props.common.loading} />
        <ErrorComponent message={this.props.common.error} />

        {this.state.pushNotifications &&
          <NotificationComponent
            text="Push notifications are disabled. You will not receive any notifications in the background."
            actionText={null}
            onDismissClick={this.dismissPushNotifications}
            onActionClick={this.askPushNotifications}
          />
        }

        <Router history={browserHistory}>
          <div className="row w-100 h-100 align-items-start align-content-start justify-content-start flex-1">
            <Route path="/app" component={DockPartial} />
            <Route path="/app/team/:teamId" component={RoomsPartial} />
            <Route path="/app/team/:teamId/room/:roomId" component={RoomPartial} />
            <Route path="/app/team/:teamId/room/:roomId/members" component={MembersPartial} />
            <Route path="/app/team/:teamId/room/:roomId" component={ToolbarPartial} />
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
  initialize: ids => initialize(ids),
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
