import MessagingService from '../services/messaging.service'
import GraphqlService from '../services/graphql.service'
import DatabaseService from '../services/database.service'
import { browserHistory } from '../services/browser-history.service'
import moment from 'moment'
import EventService from '../services/event.service'
import CookiesService from '../services/cookies.service'
import { showLocalPushNotification } from '../helpers/util'

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

export function initialize(userId) {
  return async (dispatch, getState) => {
    // Join our single room for us
    MessagingService.getInstance().join(userId)

    // Handle incoming messages
    MessagingService.getInstance().client.on('system', system => console.log('SYSTEM: ', system))
    MessagingService.getInstance().client.on('joinRoom', async ({ roomId }) => {
      // If this user is already in this room, then don't do anything
      if (!!getState().rooms.filter(r => r.id == roomId).flatten()) return

      // Get the room data
      const room = await GraphqlService.getInstance().room(roomId)
      if (!room.data.room) return

      // Joing the room SOCKET
      MessagingService.getInstance().join(roomId)

      // Create the room in the store
      // They may or may not be a member of it (irrelevant if it's public)
      dispatch({ type: 'CREATE_ROOM', payload: room.data.room })
    })
    MessagingService.getInstance().client.on('leaveRoom', ({ roomId }) => {
      // Unsub from this SOCKET
      MessagingService.getInstance().leave(roomId)

      // And then remove it
      dispatch({ type: 'DELETE_ROOM', payload: { roomId } })
    })
    MessagingService.getInstance().client.on('leaveRoomTeam', ({ roomId }) => {
      const userId = getState().common.user.id
      const room = getState().rooms.filter(r => r.id == roomId)
      const isMember = room.members.filter(m => m.user.id == userId)

      // If they are a member, then they have a right to be a here
      // Don't make them leave
      if (isMember) return

      // Unsub from this SOCKET
      MessagingService.getInstance().leave(roomId)

      // And then remove it
      dispatch({ type: 'DELETE_ROOM', payload: { roomId } })
    })
    MessagingService.getInstance().client.on('joinTeam', async ({ teamId }) => {
      // If this user is already in this team, then don't do anything
      if (!!getState().teams.filter(t => t.id == teamId).flatten()) return

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
        const isStarred = getState().common.user.starred.indexOf(roomId) != -1
        const isArchived = getState().common.user.archived.indexOf(roomId) != -1
        const isCurrentRoom = roomId == getState().room.id

        // Don't do a PN or unread increment if we are on the same room
        // as the message
        if (isArchived || isStarred || isCurrentRoom) return

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
    DatabaseService.getInstance().unread('5db7e3d88476242154d43183', '5db87f04db059a6d8dc8d068')
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
