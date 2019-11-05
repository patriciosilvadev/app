import MessagingService from '../services/messaging.service'
import GraphqlService from '../services/graphql.service'
import { browserHistory } from '../services/browser-history.service'
import moment from 'moment'
import EventService from '../services/event.service'
import { updateLoading, updateError } from './'

export function deleteRoomMessage(roomId, messageId) {
  return {
    type: 'DELETE_ROOM_MESSAGE',
    payload: {
      roomId,
      messageId,
    },
    sync: roomId,
  }
}

export function createRoomMessageReaction(roomId, messageId, reaction) {
  return {
    type: 'CREATE_ROOM_MESSAGE_REACTION',
    payload: {
      roomId,
      messageId,
      reaction,
    },
    sync: roomId,
  }
}

export function deleteRoomMessageReaction(roomId, messageId, reaction) {
  return {
    type: 'DELETE_ROOM_MESSAGE_REACTION',
    payload: {
      roomId,
      messageId,
      reaction,
    },
    sync: roomId,
  }
}

export function createRoomMessage(roomId, roomMessage) {
  return {
    type: 'CREATE_ROOM_MESSAGE',
    payload: roomMessage,
    sync: roomId,
  }
}

export function updateRoomMessage(roomId, roomMessage) {
  return {
    type: 'UPDATE_ROOM_MESSAGE',
    payload: roomMessage,
    sync: roomId,
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
    payload: {
      userId,
      roomId,
    },
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
    payload: {
      ...updatedRoom,
      roomId,
    },
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
