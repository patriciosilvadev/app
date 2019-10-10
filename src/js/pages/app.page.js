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
    }
  }

  async componentDidUpdate(prevProps) {
    const current = this.props.common.user.id
    const prev = prevProps.common.user.id

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
  }

  // prettier-ignore
  render() {
    if (!this.props.common.user.id) return <LoadingComponent show={true} />

    return (
      <App className="column align-items-start app-page">
        <LoadingComponent show={this.props.common.loading} />
        <ErrorComponent message={this.props.common.error} />

        <NotificationComponent
          text="Push notifications are disabled"
          actionText="Click here to enable them"
          onActionClick={() => {
            console.log("Cool")
          }}
        />

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
