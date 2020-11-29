import MessagingService from '../services/messaging.service'
import GraphqlService from '../services/graphql.service'
import DatabaseService from '../services/database.service'
import { browserHistory } from '../services/browser-history.service'
import moment from 'moment'
import EventService from '../services/event.service'
import { updateLoading, updateError } from './'

export function hydrateThreads(threads) {
  return {
    type: 'THREADS',
    payload: threads,
  }
}

export function createThread(channelId, thread) {
  return {
    type: 'CREATE_THREADS',
    payload: {
      channelId,
      thread,
    },
    sync: channelId,
  }
}

export function updateThread(channelId, thread) {
  return {
    type: 'UPDATE_THREADS',
    payload: {
      channelId,
      thread,
    },
    sync: channelId,
  }
}
