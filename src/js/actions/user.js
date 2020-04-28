import MessagingService from '../services/messaging.service'
import GraphqlService from '../services/graphql.service'
import DatabaseService from '../services/database.service'
import { browserHistory } from '../services/browser-history.service'
import moment from 'moment'
import EventService from '../services/event.service'
import CookiesService from '../services/cookies.service'
import { showLocalPushNotification } from '../helpers/util'
import { updateLoading, updateError, addPresence, deletePresence, updateChannelDeleteTyping } from './'

export function updateUserStarred(channelId, starred) {
  return {
    type: 'UPDATE_USER_STARRED',
    payload: { channelId, starred },
  }
}

export function updateUserMuted(userId, channelId, muted) {
  return {
    type: 'UPDATE_USER_MUTED',
    payload: { channelId, muted },
  }
}

export function updateUserArchived(userId, channelId, archived) {
  return {
    type: 'UPDATE_USER_ARCHIVED',
    payload: { channelId, archived },
  }
}

export function updateUserDnd(dnd, dndUntil) {
  return {
    type: 'UPDATE_USER',
    payload: { dnd, dndUntil },
  }
}

export function updateUserPresence(presence) {
  return {
    type: 'UPDATE_USER',
    payload: { presence },
  }
}

export function updateUserStatus(status) {
  return {
    type: 'UPDATE_USER',
    payload: { status },
  }
}

export function updateChannelUserStatus(userId, teamId, status) {
  return {
    type: 'UPDATE_CHANNEL_USER_STATUS',
    payload: { userId, status },
    sync: teamId,
  }
}

export function updateChannelUserPresence(userId, teamId, presence) {
  return {
    type: 'UPDATE_CHANNEL_USER_PRESENCE',
    payload: { userId, presence },
    sync: teamId,
  }
}

export function updateUser(updatedUser) {
  return {
    type: 'UPDATE_USER',
    payload: updatedUser,
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
