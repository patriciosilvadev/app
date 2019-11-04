import MessagingService from '../services/messaging.service'
import GraphqlService from '../services/graphql.service'
import DatabaseService from '../services/database.service'
import { browserHistory } from '../services/browser-history.service'
import moment from 'moment'
import EventService from '../services/event.service'
import CookiesService from '../services/cookies.service'
import { showLocalPushNotification } from '../helpers/util'
import { updateRoomDeleteTyping } from './room'
import { addPresence, deletePresence } from './presences'

export function updateUserMuted(userId, roomId, muted) {
  return async (dispatch, getState) => {
    dispatch(updateLoading(true))
    dispatch(updateError(null))

    try {
      await GraphqlService.getInstance().updateUserMuted(userId, roomId, muted)

      dispatch(updateLoading(false))
      dispatch({
        type: 'UPDATE_USER_MUTED',
        payload: { roomId, muted },
      })
    } catch (e) {
      dispatch(updateLoading(false))
      dispatch(updateError(e))
    }
  }
}

export function updateUserArchived(userId, roomId, archived) {
  return async (dispatch, getState) => {
    dispatch(updateLoading(true))
    dispatch(updateError(null))

    try {
      await GraphqlService.getInstance().updateUserArchived(userId, roomId, archived)

      dispatch(updateLoading(false))
      dispatch({
        type: 'UPDATE_USER_ARCHIVED',
        payload: { roomId, archived },
      })
    } catch (e) {
      dispatch(updateLoading(false))
      dispatch(updateError(e))
    }
  }
}

export function updateUserStarred(userId, roomId, starred) {
  return async (dispatch, getState) => {
    dispatch(updateLoading(true))
    dispatch(updateError(null))

    try {
      await GraphqlService.getInstance().updateUserStarred(userId, roomId, starred)

      dispatch(updateLoading(false))
      dispatch({
        type: 'UPDATE_USER_STARRED',
        payload: { roomId, starred },
      })
    } catch (e) {
      dispatch(updateLoading(false))
      dispatch(updateError(e))
    }
  }
}

export function updateUserStatus(userId, teamId, status) {
  return async (dispatch, getState) => {
    dispatch(updateLoading(true))
    dispatch(updateError(null))

    try {
      await GraphqlService.getInstance().updateUser(userId, { status })

      dispatch(updateLoading(false))

      // Update the user on our side
      dispatch({
        type: 'UPDATE_USER',
        payload: { status },
      })

      // Update the room excerpt every else
      dispatch({
        type: 'UPDATE_ROOM_USER_STATUS',
        payload: { userId, status },
        sync: teamId,
      })
    } catch (e) {
      dispatch(updateLoading(false))
      dispatch(updateError(e))
    }
  }
}

export function fetchUser(userId) {
  return async (dispatch, getState) => {
    dispatch(updateLoading(true))
    dispatch(updateError(null))

    try {
      const user = await GraphqlService.getInstance().user(userId)

      dispatch(updateLoading(false))
      dispatch({
        type: 'USER',
        payload: user.data.user,
      })
    } catch (e) {
      dispatch(updateLoading(false))
      dispatch(updateError(e))
    }
  }
}

export function updateUser(updatedUser) {
  return { 
    type: 'UPDATE_USER',
    payload: updatedUser
  }
}
