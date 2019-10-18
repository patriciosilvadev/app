import React, { useEffect } from 'react'
import ReactDOM from 'react-dom'
import { createStore, applyMiddleware, combineReducers } from 'redux'
import { Provider } from 'react-redux'
import thunk from 'redux-thunk'
import { Router, Route } from 'react-router-dom'
import { browserHistory } from './services/browser-history.service'
import { ApolloProvider } from 'react-apollo'
import { ApolloClient } from 'apollo-client'
import { HttpLink } from 'apollo-link-http'
import { InMemoryCache } from 'apollo-cache-inmemory'
import { GRAPHQL_HOST, API_HOST, PUBLIC_VAPID_KEY } from './environment'
import { sync } from './middleware/sync'
import AuthPage from './pages/auth.page'
import ConfirmPage from './pages/confirm.page'
import AppPage from './pages/app.page'
import './helpers/extensions'
import '../styles/index.css'
// import '../styles/fonts.css'
import '../../node_modules/emoji-mart/css/emoji-mart.css'
import '../.htaccess'
import '../images/favicon.png'
import '../images/pattern.png'
import '../images/logo.png'
import common from './reducers/common'
import team from './reducers/team'
import teams from './reducers/teams'
import room from './reducers/room'
import rooms from './reducers/rooms'
import './environment'
import { createLogger } from 'redux-logger'
import {  askPushNotificationPermission, urlBase64ToUint8Array } from './helpers/util'

const logger = createLogger({
  collapsed: true
});

async function subscribePushNotification() {
  if ('serviceWorker' in navigator) {
    const register = await navigator.serviceWorker.register('/sw.js', {
      scope: '/'
    });

    // Subscribe to the PNs
    const subscription = await register.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY),
    });

    // Join - we're not using this for anything yet
    // But we will
    await fetch(API_HOST + '/subscribe', {
      method: 'POST',
      body: JSON.stringify(subscription),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } else {
    console.error('Service workers are not supported in this browser');
  }
}

subscribePushNotification().catch(error => console.error(error));

// Redux with our middlewares
const store = createStore(
  combineReducers({
    common,
    team,
    teams,
    room,
    rooms,
  }),
  applyMiddleware(
    thunk,
    sync,
    logger,
  )
)

// Plugin framework setup
window.__REDUX_STORE_HOOK__ = store
window.React = React

// Setup GraphQL
const apollo = new ApolloClient({
  link: new HttpLink({ uri: GRAPHQL_HOST }),
  cache: new InMemoryCache(),
})

// prettier-ignore
ReactDOM.render(
    <Provider store={store}>
      <ApolloProvider client={apollo}>
        <Router history={browserHistory}>
          <Route path="/auth" component={AuthPage} />
          <Route path="/confirm/:token" component={ConfirmPage} />
          <Route path="/app" component={AppPage} />
        </Router>
      </ApolloProvider>
    </Provider>, document.getElementById("root"))
