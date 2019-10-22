import MessagingService from '../services/messaging.service'
import GraphqlService from '../services/graphql.service'
import DatabaseService from '../services/database.service'
import { browserHistory } from '../services/browser-history.service'
import moment from 'moment'
import EventService from '../services/event.service'
import { updateLoading, updateError } from './'

export function fetchNotifications(userId, page) {
  return async (dispatch, getState) => {
    dispatch(updateLoading(true))
    dispatch(updateError(null))

    try {
      const notifications = await GraphqlService.getInstance().notifications(userId, page)

      dispatch(updateLoading(false))
      dispatch({
        type: 'NOTIFICATIONS',
        payload: notifications.data.notifications,
      })
    } catch (e) {
      dispatch(updateLoading(false))
      dispatch(updateError(e))
    }
  }
}

export function updateNotificationRead(notificationId, read) {
  return async (dispatch, getState) => {
    const { room } = getState()
    const roomId = room.id

    dispatch(updateLoading(true))
    dispatch(updateError(null))

    try {
      await GraphqlService.getInstance().updateNotificationRead(notificationId, read)

      dispatch(updateLoading(false))
      dispatch({
        type: 'UPDATE_NOTIFICATION_READ',
        payload: { notificationId, read },
      })
    } catch (e) {
      dispatch(updateLoading(false))
      dispatch(updateError(e))
    }
  }
}
