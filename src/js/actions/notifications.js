import MessagingService from '../services/messaging.service'
import GraphqlService from '../services/graphql.service'
import DatabaseService from '../services/database.service'
import { browserHistory } from '../services/browser-history.service'
import moment from 'moment'
import EventService from '../services/event.service'
import { updateLoading, updateError } from './'

export function updateNotifications(notifications) {
  return {
    type: 'NOTIFICATIONS',
    payload: notifications,
  }
}

export function updateNotificationRead(notificationId, read) {
  return {
    type: 'UPDATE_NOTIFICATION_READ',
    payload: { notificationId, read },
  }
}
