import MessagingService from '../services/messaging.service'
import GraphqlService from '../services/graphql.service'
import DatabaseService from '../services/database.service'
import { browserHistory } from '../services/browser-history.service'
import moment from 'moment'
import EventService from '../services/event.service'
import { updateLoading, updateError } from './common'

export function hydrateRooms(rooms) {
  return {
    type: 'ROOMS',
    payload: rooms,
  }
}
