import MessagingService from '../services/messaging.service'
import GraphqlService from '../services/graphql.service'
import DatabaseService from '../services/database.service'
import { browserHistory } from '../services/browser-history.service'
import moment from 'moment'
import EventService from '../services/event.service'

export function createDockPlugin(plugin) {
  return {
    type: 'CREATE_DOCK_PLUGIN',
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
        payload: {
          room: roomId,
          user: userId,
          starred,
        },
      })
    } catch (e) {
      dispatch(updateLoading(false))
      dispatch(updateError(e))
    }
  }
}

export function initialize(ids) {
  return async (dispatch, getState) => {
    MessagingService.getInstance().initialize([...ids, getState().common.user.id])
    MessagingService.getInstance().client.on('system', system => console.log('SYSTEM: ', system))
    MessagingService.getInstance().client.on('sync', ({ action }) => {
      dispatch(action)

      // Handle any reads/unreads here for the DB
      if (action.type == 'CREATE_ROOM_MESSAGE') {
        const { room, team } = action.payload

        // Don't do anything if we are on the right room
        if (room == getState().room.id) return

        // Create an unread marker
        // Channel will be null, which is good
        DatabaseService.getInstance().unread(team, room)
      }
    })

    MessagingService.getInstance().client.on('leaveRoom', ({ roomId }) => {
      MessagingService.getInstance().leave(roomId)
      dispatch({ type: 'DELETE_ROOM', payload: roomId })
    })

    MessagingService.getInstance().client.on('leaveTeam', ({ teamId }) => {
      MessagingService.getInstance().leave(teamId)
      dispatch({ type: 'DELETE_TEAM', payload: teamId })
    })

    MessagingService.getInstance().client.on('joinRoom', async ({ roomId }) => {
      MessagingService.getInstance().join(roomId)
      const room = await GraphqlService.getInstance().room(id)
      dispatch({ type: 'CREATE_ROOM', payload: room.data.room })
    })

    MessagingService.getInstance().client.on('joinTeam', async ({ teamId }) => {
      MessagingService.getInstance().join(teamId)
      const team = await GraphqlService.getInstance().team(id)
      dispatch({ type: 'CREATE_ROOM', payload: team.data.team })
    })

    DatabaseService.getInstance()
      .database.allDocs({ include_docs: true })
      .then(({ rows }) => {
        dispatch({ type: 'UPDATE_UNREAD', payload: rows })
      })
      .catch(err => {
        dispatch({ type: 'UPDATE_ERROR', payload: 'allDocs DB error' })
      })

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
    // DatabaseService.getInstance().unread('5ca1e41c05ac7cdbc80c5351', '5cbb6dd5d446d5774bba598a')
    // DatabaseService.getInstance().unread('5ca1e41c05ac7cdbc80c5351', '5cae0db41ba84ec5b2377a8c')
    // DatabaseService.getInstance().unread('5ca1e41c05ac7cdbc80c5351', '5d054a66af06e24fecbb8022')
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
