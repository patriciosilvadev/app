import MessagingService from '../services/messaging.service'
import GraphqlService from '../services/graphql.service'
import { browserHistory } from '../services/browser-history.service'
import moment from 'moment'
import EventService from '../services/event.service'
import { updateLoading, updateError } from './'




// Compose

export function createRoomMessage(roomId, text, attachments, parent) {
  return async (dispatch, getState) => {
    const { room, user } = getState()
    const excerpt = user.name.toString().split(' ')[0] + ': ' + text || text

    dispatch(updateLoading(true))
    dispatch(updateError(null))

    try {
      const { data } = await GraphqlService.getInstance().createRoomMessage(roomId, user.id, user.name, text, attachments, parent)

      dispatch(updateLoading(false))

      // Create the message
      dispatch({
        type: 'CREATE_ROOM_MESSAGE',
        payload: {
          message: data.createRoomMessage,
          excerpt,
          roomId: roomId,
          teamId: room.team.id,
        },
        sync: roomId,
      })

      // Update the room excerpt
      dispatch({
        type: 'UPDATE_ROOM',
        payload: {
          excerpt,
          roomId: roomId,
          teamId: room.team.id,
        },
        sync: roomId,
      })
    } catch (e) {
      dispatch(updateLoading(false))
      dispatch(updateError(e))
    }
  }
}

export function updateRoomMessage(roomId, messageId, message, attachments) {
  return async (dispatch, getState) => {
    const { room, user } = getState()
    const excerpt = user.name.toString().split(' ')[0] + ': ' + message || message
    const userName = user.name
    const userId = user.id
    const teamId = room.team.id

    dispatch(updateLoading(true))
    dispatch(updateError(null))

    try {
      const { data } = await GraphqlService.getInstance().updateRoomMessage(roomId, userId, userName, messageId, message, attachments)

      dispatch(updateLoading(false))

      // Create the message
      dispatch({
        type: 'UPDATE_ROOM_MESSAGE',
        payload: {
          messageId,
          excerpt,
          roomId,
          teamId,
          message: data.updateRoomMessage,
        },
        sync: roomId,
      })

      // Update the room excerpt
      dispatch({
        type: 'UPDATE_ROOM',
        payload: {
          excerpt,
          roomId,
          teamId,
        },
        sync: roomId,
      })
    } catch (e) {
      dispatch(updateLoading(false))
      dispatch(updateError(e))
    }
  }
}

// Message

export function deleteRoomMessage(roomId, messageId) {
  return async (dispatch, getState) => {
    try {
      await GraphqlService.getInstance().deleteRoomMessage(messageId)

      dispatch({
        type: 'DELETE_ROOM_MESSAGE',
        payload: {
          roomId,
          messageId,
        },
        sync: roomId,
      })
    } catch (e) {}
  }
}

export function createRoomMessageReaction(roomId, messageId, reaction) {
  return async (dispatch, getState) => {
    try {
      await GraphqlService.getInstance().createRoomMessageReaction(messageId, reaction)

      dispatch({
        type: 'CREATE_ROOM_MESSAGE_REACTION',
        payload: {
          roomId,
          messageId,
          reaction,
        },
        sync: roomId,
      })
    } catch (e) {}
  }
}

export function deleteRoomMessageReaction(roomId, messageId, reaction) {
  return async (dispatch, getState) => {
    try {
      await GraphqlService.getInstance().deleteRoomMessageReaction(messageId, reaction)

      dispatch({
        type: 'DELETE_ROOM_MESSAGE_REACTION',
        payload: {
          roomId,
          messageId,
          reaction,
        },
        sync: roomId,
      })
    } catch (e) {}
  }
}



export function createRoom(room) {
  return {
    type: 'CREATE_ROOM',
    payload: room,
  }
}

export function createRoomMember(roomId, member) {
  return {
    type: 'CREATE_ROOM_MEMBER',
    payload: {
      member,
      roomId,
    },
    sync: roomId,
  }
}

export function deleteRoomMember(roomId, userId) {
  return {
    type: 'DELETE_ROOM_MEMBER',
    payload: { userId, roomId },
    sync: roomId,
  }
}

export function hydrateRoomMessages(messages) {
  return {
    type: 'UPDATE_ROOM_ADD_MESSAGES',
    payload: {
      messages: messages.sort((left, right) => {
        return moment.utc(left.createdAt).diff(moment.utc(right.createdAt))
      }),
    },
  }
}

export function hydrateRoom(room) {
  return {
    type: 'ROOM',
    payload: {
      ...room,
      typing: [],
      messages: room.messages.sort((left, right) => {
        return moment.utc(left.createdAt).diff(moment.utc(right.createdAt))
      }),
    },
  }
}

export function updateRoom(roomId, updatedRoom) {
  return {
    type: 'UPDATE_ROOM',
    payload: { ...updatedRoom, roomId },
    sync: roomId,
  }
}

export function deleteRoom(roomId, sync) {
  return {
    type: 'DELETE_ROOM',
    payload: { roomId },
    sync: sync ? roomId : null,
  }
}

export function updateRoomAddTyping(roomId, userName, userId) {
  return {
    type: 'UPDATE_ROOM_ADD_TYPING',
    payload: { userName, userId, roomId },
    sync: roomId,
  }
}

export function updateRoomDeleteTyping(roomId, userId) {
  return {
    type: 'UPDATE_ROOM_DELETE_TYPING',
    payload: { userId, roomId },
    sync: roomId,
  }
}
