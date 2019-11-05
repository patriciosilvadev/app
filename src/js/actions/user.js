import MessagingService from '../services/messaging.service'
import GraphqlService from '../services/graphql.service'
import DatabaseService from '../services/database.service'
import { browserHistory } from '../services/browser-history.service'
import moment from 'moment'
import EventService from '../services/event.service'
import CookiesService from '../services/cookies.service'
import { showLocalPushNotification } from '../helpers/util'
import { updateLoading, updateError, addPresence, deletePresence, updateRoomDeleteTyping } from './'

export function updateUserStarred(roomId, starred) {
  return {
    type: 'UPDATE_USER_STARRED',
    payload: { roomId, starred },
  }
}

export function updateUserMuted(userId, roomId, muted) {
  return {
    type: 'UPDATE_USER_MUTED',
    payload: { roomId, muted },
  }
}

export function updateUserArchived(userId, roomId, archived) {
  return {
    type: 'UPDATE_USER_ARCHIVED',
    payload: { roomId, archived },
  }
}

export function updateUserStatus(status) {
  return {
    type: 'UPDATE_USER',
    payload: { status },
  }
}

export function updateRoomUserStatus(userId, teamId, status) {
  return {
    type: 'UPDATE_ROOM_USER_STATUS',
    payload: { userId, status },
    sync: teamId,
  }
}

export function updateUser(updatedUser) {
  return {
    type: 'UPDATE_USER',
    payload: updatedUser
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
