import MessagingService from '../services/messaging.service'
import GraphqlService from '../services/graphql.service'
import DatabaseService from '../services/database.service'
import { browserHistory } from '../services/browser-history.service'
import moment from 'moment'
import EventService from '../services/event.service'
import { updateLoading, updateError } from './'

export function hydrateMeet(meet) {
  return {
    type: 'MEET',
    payload: meet,
  }
}

export function hydrateMeetMessages(messages) {
  return {
    type: 'MEET_MESSAGES',
    payload: { messages },
  }
}

export function updateMeetAddMessage(meetId, message, channelId) {
  return {
    type: 'UPDATE_MEET_ADD_MESSAGE',
    payload: { message, meetId },
    sync: channelId,
  }
}
