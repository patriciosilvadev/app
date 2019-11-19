import MessagingService from '../services/messaging.service'
import GraphqlService from '../services/graphql.service'
import DatabaseService from '../services/database.service'
import { browserHistory } from '../services/browser-history.service'
import moment from 'moment'
import EventService from '../services/event.service'
import CookiesService from '../services/cookies.service'
import { showLocalPushNotification, logger } from '../helpers/util'
import { closeAppModal, closeAppPanel, openApp, createTeam, leaveTeam, createRoom, deleteRoom, updateRoomDeleteTyping, addPresence, deletePresence } from './'

export function initialize(userId) {
  return async (dispatch, getState) => {
    // General dispatch orientated
    EventService.getInstance().on('DISPATCH_APP_ACTION', data => {
      if (!data.action) return
      if (!data.action.type) return

      console.log('Received message: ', data)

      switch (data.action.type) {
        case 'modal':
          dispatch(openApp(data.action))
          break
        case 'panel':
          dispatch(openApp(data.action))
          break
        case 'modal-panel':
          dispatch(closeAppPanel())
          break
        case 'modal-close':
          dispatch(closeAppModal())
          break
      }

    });

    // Join our single room for us
    MessagingService.getInstance().join(userId)

    // Handle incoming messages
    MessagingService.getInstance().client.on('system', system =>  logger('SYSTEM: ', system))
    MessagingService.getInstance().client.on('joinRoom', async ({ roomId }) => {
      // If this user is already in this room, then don't do anything
      if (
        getState()
          .rooms.filter(r => r.id == roomId)
          .flatten()
      )
        return

      // Get the room data
      const room = await GraphqlService.getInstance().room(roomId)

      // If there is an error
      if (!room.data.room) return

      // Joing the room SOCKET
      MessagingService.getInstance().join(roomId)

      // Create the room in the store
      // They may or may not be a member of it (irrelevant if it's public)
      dispatch(createRoom(room.data.room))
    })
    MessagingService.getInstance().client.on('leaveRoom', ({ roomId }) => {
      // Unsub from this SOCKET
      MessagingService.getInstance().leave(roomId)

      // And then remove it - but just for us
      dispatch(deleteRoom(roomId, false))
    })
    MessagingService.getInstance().client.on('leaveRoomTeam', ({ roomId }) => {
      const userId = getState().user.id
      const room = getState()
        .rooms.filter(r => r.id == roomId)
        .flatten()

      // If they don't have this room
      if (!room) return

      // Check if they are a member
      const { members } = room

      // Check if this user is a member
      const isMember = members.filter(m => m.user.id == userId).flatten()

      // If they are a member, then they have a right to be a here
      // Don't make them leave
      if (isMember) return

      // Unsub from this SOCKET
      MessagingService.getInstance().leave(roomId)

      // And then remove it - just for us
      dispatch(deleteRoom(roomId, false))
    })
    MessagingService.getInstance().client.on('joinTeam', async ({ teamId }) => {
      // If this user is already in this team, then don't do anything
      if (
        !!getState()
          .teams.filter(t => t.id == teamId)
          .flatten()
      )
        return

      const team = await GraphqlService.getInstance().team(teamId)
      if (!team.data.team) return
      MessagingService.getInstance().join(teamId)
      dispatch(createTeam(team.data.team))
    })
    MessagingService.getInstance().client.on('leaveTeam', ({ teamId }) => {
      MessagingService.getInstance().leave(teamId)
      dispatch(deleteTeam(teamId, false))
    })
    MessagingService.getInstance().client.on('sync', ({ action }) => {
      // Check whether this person is in our chat list first
      if (action.type == 'ADD_PRESENCE') {
        const existingRoom = getState().rooms.reduce((exists, room) => {
          if (room.public) return false

          const { members } = room
          const existingMember = members.filter(member => member.user.id == action.payload.userId).flatten()

          if (existingMember) return true
        }, false)

        if (!existingRoom) return
      }

      // Update our store with the synced action
      dispatch(action)

      // Handle any reads/unreads here for the DB
      // And also handle push notices
      if (action.type == 'CREATE_ROOM_MESSAGE') {
        const { roomId, teamId, message } = action.payload
        const isStarred = getState().user.starred.indexOf(roomId) != -1
        const isArchived = getState().user.archived.indexOf(roomId) != -1
        const isCurrentRoom = roomId == getState().room.id

        // Don't do a PN or unread increment if we are on the same room
        // as the message
        if (isArchived || isStarred || isCurrentRoom) return

        // Trigger a push notification
        showLocalPushNotification('New Message', message.message)

        // Create an unread marker
        // Channel will be null, which is good
        DatabaseService.getInstance().unread(teamId, roomId)
      }
    })

    // Tell our current team about our status
    setInterval(() => {
      const { team, user } = getState()
      const teamId = team.id
      const userId = user.id

      dispatch(addPresence(teamId, userId))
    }, 5000)

    // Clean our presence array every 5 seconds
    setInterval(() => {
      const { presences } = getState()
      const snapshot = new Date().getTime()

      // Remove after 30 seconds
      presences.users.map(p => {
        if (snapshot - p.userTime > 30000) {
          dispatch(deletePresence(p.userId))
        }
      })
    }, 5000)

    // Check if the typing array is valid every 1 second
    // Iterage over the current room's typing array
    // If it's too old - then remove it and notify everyone else
    setInterval(() => {
      const { room } = getState()
      const roomId = room.id
      const snapshot = new Date().getTime()

      // Remove after 1 second
      room.typing.map(t => {
        if (snapshot - t.userTime > 1000) {
          dispatch(updateRoomDeleteTyping(roomId, t.userId))
        }
      })
    }, 2500)

    // Get unread count
    DatabaseService.getInstance()
      .database.allDocs({ include_docs: true })
      .then(({ rows }) => {
        dispatch(updateUnread(rows))
      })
      .catch(err => {
        dispatch(updateError('allDocs DB error'))
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
            dispatch(updateUnread(rows))
          })
          .catch(err => {
            dispatch(updateError('allDocs DB error'))
          })
      })
      .on('error', err => {
        dispatch(updateError('allDocs DB error'))
      })

    // TODO: Debug
    // DatabaseService.getInstance().unread('5db7e3d88476242154d43183', '5db87f04db059a6d8dc8d068')
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

export function updateUnread(payload) {
  return {
    type: 'UPDATE_UNREAD',
    payload: payload,
  }
}
