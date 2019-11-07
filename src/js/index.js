import React, { useEffect } from 'react'
import ReactDOM from 'react-dom'
import { createStore, applyMiddleware, combineReducers } from 'redux'
import { Provider } from 'react-redux'
import thunk from 'redux-thunk'
import { Router, Route, Link } from 'react-router-dom'
import { browserHistory } from './services/browser-history.service'
import { ApolloProvider } from 'react-apollo'
import { ApolloClient } from 'apollo-client'
import { HttpLink } from 'apollo-link-http'
import { InMemoryCache } from 'apollo-cache-inmemory'
import { API_HOST, PUBLIC_VAPID_KEY } from './environment'
import { sync } from './middleware/sync'
import AuthPage from './pages/auth.page'
import JoinPage from './pages/join.page'
import ConfirmPage from './pages/confirm.page'
import AppPage from './pages/app.page'
import './helpers/extensions'
import '../styles/index.css'
import '../../node_modules/emoji-mart/css/emoji-mart.css'
import '../.htaccess'
import AuthService from './services/auth.service'
import common from './reducers/common'
import team from './reducers/team'
import teams from './reducers/teams'
import presences from './reducers/presences'
import room from './reducers/room'
import app from './reducers/app'
import rooms from './reducers/rooms'
import user from './reducers/user'
import notifications from './reducers/notifications'
import './environment'
import { createLogger } from 'redux-logger'

const logger = createLogger({
  collapsed: true,
})

// Redux with our middlewares
const store = createStore(
  combineReducers({
    common,
    team,
    teams,
    room,
    rooms,
    presences,
    notifications,
    user,
    app,
  }),
  applyMiddleware(thunk, sync)
)

// Setup GraphQL
const apollo = new ApolloClient({
  link: new HttpLink({ uri: API_HOST + '/graphql' }),
  cache: new InMemoryCache(),
})

// prettier-ignore
ReactDOM.render(
  <Provider store={store}>
    <ApolloProvider client={apollo}>
      <Router history={browserHistory}>
        {/* Check if user is logged in */}
        {/* Direct to the right place */}
        <Route
          path="/"
          render={props => {
            if (window.location.pathname == '/') {
              AuthService
              .currentAuthenticatedUser()
              .then(res => {
                const { token } = res
                const { sub } = AuthService.parseJwt(token)

                props.history.push('/app')
              })
              .catch(err => {
                props.history.push('/auth')
              })
            }
          }}
        />

        <Route path="/auth" component={AuthPage} />
        <Route path="/confirm/:email/:token" component={ConfirmPage} />
        <Route path="/join/:url" component={JoinPage} />
        <Route path="/app" component={AppPage} />
      </Router>
    </ApolloProvider>
  </Provider>, document.getElementById("root")
)
