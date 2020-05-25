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
import { API_HOST, PUBLIC_VAPID_KEY, NODE_ENV, SENTRY_DSN } from './environment'
import { sync } from './middleware/sync'
import AuthPage from './pages/auth.page'
import TeamPage from './pages/team.page'
import AppPage from './pages/app.page'
import ChannelPage from './pages/channel.page'
import AuthService from './services/auth.service'
import common from './reducers/common'
import team from './reducers/team'
import teams from './reducers/teams'
import presences from './reducers/presences'
import channel from './reducers/channel'
import app from './reducers/app'
import channels from './reducers/channels'
import user from './reducers/user'
import notifications from './reducers/notifications'
import { createLogger } from 'redux-logger'
import moment from 'moment'
import './environment'
import './helpers/extensions'
import '../assets/logo.svg'
import '../assets/icon.svg'
import '../assets/favicon.png'
import '../assets/team-onboarding.png'
import '../assets/upgrade.png'
import '../assets/downgrade.png'
import '../styles/index.css'
import '../../node_modules/emoji-mart/css/emoji-mart.css'
import '../.htaccess'
import Zero from '@joduplessis/zero'
import AccountService from './services/account.service'
import * as Sentry from '@sentry/browser'

// Set up Sentry
if (NODE_ENV == 'production') Sentry.init({ dsn: SENTRY_DSN })

// Register our account service - only 1 for now
// See usage in account.modal
Zero.container().inject('AccountService', AccountService)

// Redux logger
const logger = createLogger({
  collapsed: true,
})

// Redux with our middlewares
const store = createStore(
  combineReducers({
    common,
    team,
    teams,
    channel,
    channels,
    presences,
    notifications,
    user,
    app,
  }),
  applyMiddleware(thunk, sync)
  //applyMiddleware(thunk, sync, logger)
)

ReactDOM.render(
  <Provider store={store}>
    <Router history={browserHistory}>
      {/* Check if user is logged in */}
      {/* Direct to the right place */}
      <Route
        path="/"
        render={props => {
          const { pathname } = window.location
          const isElectron = pathname.split('/')[pathname.split('/').length - 1] == 'index.html'
          const isRoot = pathname == '/'

          if (isElectron || isRoot) {
            AuthService.currentAuthenticatedUser()
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
      <Route path="/t/:slug" component={TeamPage} />
      <Route path="/c/:shortcode" component={ChannelPage} />
      <Route path="/app" component={AppPage} />
    </Router>
  </Provider>,
  document.getElementById('root')
)
