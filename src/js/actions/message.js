import MessagingService from '../services/messaging.service'
import GraphqlService from '../services/graphql.service'
import DatabaseService from '../services/database.service'
import { browserHistory } from '../services/browser-history.service'
import moment from 'moment'
import EventService from '../services/event.service'
import { updateLoading, updateError } from './'

export function hydrateMessage(message) {
  return {
    type: 'MESSAGE',
    payload: message,
  }
}

export function updateMessage(messageId, updatedMessage, channelId) {
  return {
    type: 'UPDATE_MESSAGE',
    payload: { ...updatedMessage, messageId },
    sync: channelId,
  }
}

export function updateMessageAddSubmessage(messageId, message, channelId) {
  return {
    type: 'UPDATE_MESSAGE_ADD_MESSAGE',
    payload: { message, messageId },
    sync: channelId,
  }
}

export function updateMessageDeleteSubmessage(messageId, channelId) {
  return {
    type: 'UPDATE_MESSAGE_DELETE_MESSAGE',
    payload: { messageId },
    sync: channelId,
  }
}

export function updateMessageUpdateSubmessage(messageId, message, channelId) {
  return {
    type: 'UPDATE_MESSAGE_UPDATE_MESSAGE',
    payload: { message, messageId },
    sync: channelId,
  }
}
