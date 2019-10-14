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
import { API_HOST } from './environment'
import { sync } from './middleware/sync'
import AuthPage from './pages/auth.page'
import ConfirmPage from './pages/confirm.page'
import AppPage from './pages/app.page'
import './helpers/extensions'
import '../styles/index.css'
import '../styles/fonts.css'
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
import logger from 'redux-logger'

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(registration => console.log('SW registered.', registration))
      .catch(error => console.log('No registration failed'))
  })
}

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
    //logger
  )
)

// Plugin framework setup
window.__REDUX_STORE_HOOK__ = store
window.React = React

// Setup GraphQL
const apollo = new ApolloClient({
  link: new HttpLink({ uri: API_HOST }),
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
