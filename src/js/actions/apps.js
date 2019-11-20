import MessagingService from '../services/messaging.service'
import GraphqlService from '../services/graphql.service'
import DatabaseService from '../services/database.service'
import { browserHistory } from '../services/browser-history.service'
import moment from 'moment'
import EventService from '../services/event.service'
import { updateLoading, updateError } from './'

export function updateApp(appId, updatedApp) {
  return {
    type: 'UPDATE_APP',
    payload: { ...updatedApp, appId },
    sync: appId,
  }
}

export function deleteApp(appId, sync) {
  return {
    type: 'DELETE_APP',
    payload: { appId },
    sync: sync ? appId : null,
  }
}

export function hydrateApp(apps) {
  return {
    type: 'APPS',
    payload: apps,
  }
}

export function createApp(app) {
  return {
    type: 'CREATE_APP',
    payload: app,
  }
}
