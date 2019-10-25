import MessagingService from '../services/messaging.service'
import GraphqlService from '../services/graphql.service'
import DatabaseService from '../services/database.service'
import { browserHistory } from '../services/browser-history.service'
import moment from 'moment'
import EventService from '../services/event.service'
import CookiesService from '../services/cookies.service'
import { showLocalPushNotification } from '../helpers/util'

export function registerDockPlugin(plugin) {
  return {
    type: 'REGISTER_DOCK_PLUGIN',
    payload: plugin,
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

export function updateUserStatus(status) {
  return async (dispatch, getState) => {
    const { team, common } = getState()
    const userId = common.user.id
    const teamId = team.id

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

export function initialize(ids) {
  return async (dispatch, getState) => {
    // Join all these SocketIO rooms
    MessagingService.getInstance().initialize([...ids, getState().common.user.id])

    // Handle incoming messages
    MessagingService.getInstance().client.on('system', system => console.log('SYSTEM: ', system))
    MessagingService.getInstance().client.on('joinRoom', async ({ roomId }) => {
      const room = await GraphqlService.getInstance().room(roomId)
      if (!room.data.room) return
      MessagingService.getInstance().join(roomId)
      dispatch({ type: 'CREATE_ROOM', payload: room.data.room })
    })
    MessagingService.getInstance().client.on('leaveRoom', ({ roomId }) => {
      MessagingService.getInstance().leave(roomId)
      dispatch({ type: 'DELETE_ROOM', payload: { roomId } })
    })
    MessagingService.getInstance().client.on('joinTeam', async ({ teamId }) => {
      const team = await GraphqlService.getInstance().team(teamId)
      if (!team.data.team) return
      MessagingService.getInstance().join(teamId)
      dispatch({ type: 'CREATE_TEAM', payload: team.data.team })
    })
    MessagingService.getInstance().client.on('leaveTeam', ({ teamId }) => {
      MessagingService.getInstance().leave(teamId)
      dispatch({ type: 'DELETE_TEAM', payload: { teamId } })
    })
    MessagingService.getInstance().client.on('sync', ({ action }) => {
      dispatch(action)

      // Handle any reads/unreads here for the DB
      if (action.type == 'CREATE_ROOM_MESSAGE') {
        const { roomId, teamId, message } = action.payload

        // Don't do a PN or unread increment if we are on the same room
        // as the message
        if (roomId == getState().room.id) return

        // Trigger a push notification
        showLocalPushNotification('New Message', message)

        // Create an unread marker
        // Channel will be null, which is good
        DatabaseService.getInstance().unread(teamId, roomId)
      }
    })

    // Heartbeat - we send our updates to the current team
    setInterval(() => {
      const { team, common } = getState()
      const teamId = team.id
      const userId = common.user.id
      const heartbeat = new Date()

      dispatch({
        type: 'UPDATE_USER_PRESENCE',
        payload: {
          userId,
          heartbeat,
        },
        sync: teamId,
      })
    }, 1000)

    // Get unread count
    DatabaseService.getInstance()
      .database.allDocs({ include_docs: true })
      .then(({ rows }) => {
        dispatch({ type: 'UPDATE_UNREAD', payload: rows })
      })
      .catch(err => {
        dispatch({ type: 'UPDATE_ERROR', payload: 'allDocs DB error' })
      })

    // If anything changes
    // Update the rooms list
    DatabaseService.getInstance()
      .database.changes({
        live: true,
        since: 'now',
      })
      .on('change', docs => {
        DatabaseService.getInstance()
          .database.allDocs({ include_docs: true })
          .then(({ rows }) => {
            dispatch({ type: 'UPDATE_UNREAD', payload: rows })
          })
          .catch(err => {
            dispatch({ type: 'UPDATE_ERROR', payload: 'allDocs DB error' })
          })
      })
      .on('error', err => {
        dispatch({ type: 'UPDATE_ERROR', payload: 'changes DB error' })
      })

    // TODO: Debug
    DatabaseService.getInstance().unread('5ce12ae5ffd420dc2f5a6878', '5cbb6dd5d446d5774bba598a')
  }
}

export function updateLoading(payload) {
  return {
    type: 'UPDATE_LOADING',
    payload: !!payload,
  }
}

export function updateError(payload) {
  if (payload) console.error(payload)

  return {
    type: 'UPDATE_ERROR',
    payload: payload,
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
