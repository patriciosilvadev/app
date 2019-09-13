import MessagingService from '../services/messaging.service'
import GraphqlService from '../services/graphql.service'
import DatabaseService from '../services/database.service'
import { browserHistory } from '../services/browser-history.service'
import moment from 'moment'
import EventService from '../services/event.service'
import { updateLoading, updateError } from './'

export function createRoomMember(user) {
  return async (dispatch, getState) => {
    const { room } = getState()
    const userId = user.id
    const userIds = [userId]
    const roomId = room.id

    dispatch(updateLoading(true))
    dispatch(updateError(null))

    try {
      await GraphqlService.getInstance().createRoomMember(roomId, userId)

      dispatch(updateLoading(false))
      dispatch({
        type: 'CREATE_ROOM_MEMBER',
        payload: {
          member: { user },
          roomId,
        },
        sync: roomId,
      })

      MessagingService.getInstance().joinRoom(userIds, roomId)
    } catch (e) {
      dispatch(updateLoading(false))
      dispatch(updateError(e))
    }
  }
}

export function deleteRoomMember(user) {
  return async (dispatch, getState) => {
    const { room, team, common } = getState()
    const userId = user.id
    const userIds = [userId]
    const roomId = room.id
    const currentUserId = common.user.id

    dispatch(updateLoading(true))
    dispatch(updateError(null))

    try {
      await GraphqlService.getInstance().deleteRoomMember(roomId, userId)

      dispatch(updateLoading(false))
      dispatch({
        type: 'DELETE_ROOM_MEMBER',
        payload: { userId, roomId },
        sync: roomId,
      })

      if (userId == currentUserId) {
        dispatch({
          type: 'DELETE_ROOM',
          payload: { roomId },
          sync: roomId,
        })

        browserHistory.push('/app')
      }

      MessagingService.getInstance().leaveRoom(userIds, roomId)
    } catch (e) {
      dispatch(updateLoading(false))
      dispatch(updateError(e))
    }
  }
}

export function deleteRoom(roomId) {
  return async (dispatch, getState) => {
    const { room } = getState()
    const roomId = room.id

    dispatch(updateLoading(true))
    dispatch(updateError(null))

    try {
      await GraphqlService.getInstance().deleteRoom(roomId)

      dispatch(updateLoading(false))
      dispatch({
        type: 'DELETE_ROOM',
        payload: { roomId },
        sync: roomId,
      })
    } catch (e) {
      dispatch(updateLoading(false))
      dispatch(updateError(e))
    }
  }
}

export function updateRoom(updatedRoom) {
  return async (dispatch, getState) => {
    const { room } = getState()
    const roomId = room.id

    dispatch(updateLoading(true))
    dispatch(updateError(null))

    try {
      const { data } = await GraphqlService.getInstance().updateRoom(roomId, updatedRoom)

      dispatch(updateLoading(false))
      dispatch({
        type: 'UPDATE_ROOM',
        payload: { ...data.updateRoom, roomId },
        sync: roomId,
      })
    } catch (e) {
      dispatch(updateLoading(false))
      dispatch(updateError(e))
    }
  }
}

export function fetchRoom(roomId) {
  return async (dispatch, getState) => {
    dispatch(updateLoading(true))
    dispatch(updateError(null))

    try {
      const { data } = await GraphqlService.getInstance().room(roomId)
      const room = data.room

      // We sort the message array first
      dispatch(updateLoading(false))
      dispatch({
        type: 'ROOM',
        payload: {
          ...room,
          messages: room.messages.sort((left, right) => {
            return moment.utc(left.createdAt).diff(moment.utc(right.createdAt))
          }),
        },
      })

      // Clear all the markers for read/unread
      DatabaseService.getInstance().read(room.id)
    } catch (e) {
      dispatch(updateLoading(false))
      dispatch(updateError(e))
    }
  }
}

export function createRoomMessage(text, attachments) {
  return async (dispatch, getState) => {
    const { room, common } = getState()
    const excerpt = common.user.name + ': ' + text

    dispatch(updateLoading(true))
    dispatch(updateError(null))

    try {
      const { data } = await GraphqlService.getInstance().createRoomMessage(room.id, common.user.id, common.user.name, text, attachments, null)

      dispatch(updateLoading(false))

      // Create the message
      dispatch({
        type: 'CREATE_ROOM_MESSAGE',
        payload: {
          message: data.createRoomMessage,
          excerpt: excerpt,
          roomId: room.id,
          teamId: room.team.id,
        },
        sync: room.id,
      })

      // Update the room excerpt
      dispatch({
        type: 'UPDATE_ROOM',
        payload: { excerpt },
        sync: room.id,
      })
    } catch (e) {
      dispatch(updateLoading(false))
      dispatch(updateError(e))
    }
  }
}

export function fetchRoomMessages(page) {
  return async (dispatch, getState) => {
    const { room } = getState()

    dispatch(updateLoading(true))
    dispatch(updateError(null))

    try {
      const roomMessages = await GraphqlService.getInstance().roomMessages(room.id, page)
      const messages = roomMessages.data.roomMessages

      dispatch(updateLoading(false))

      // Add the new messages to the room
      dispatch({
        type: 'UPDATE_ROOM',
        payload: {
          messages: [
            ...room.messages,
            ...messages.sort((left, right) => {
              return moment.utc(left.createdAt).diff(moment.utc(right.createdAt))
            }),
          ],
        },
      })

      // Tell our room to resume enabling loads
      EventService.get().emit('fetchedRoomMessages', true)
    } catch (e) {
      dispatch(updateLoading(false))
      dispatch(updateError(e))
    }
  }
}

export function createRoomMessageReply(messageId, userId, text, attachments) {
  return async (dispatch, getState) => {
    const { room } = getState()

    try {
      const { data } = await GraphqlService.getInstance().createRoomMessageReply(messageId, userId, text, attachments)

      dispatch({
        type: 'CREATE_ROOM_MESSAGE_REPLY',
        payload: {
          messageId,
          roomId: room.id,
          reply: data.createRoomMessageReply,
        },
        sync: room.id,
      })
    } catch (e) {}
  }
}

export function createRoomMessageReaction(messageId, reaction) {
  return async (dispatch, getState) => {
    const { room } = getState()

    try {
      await GraphqlService.getInstance().createRoomMessageReaction(messageId, reaction)

      dispatch({
        type: 'CREATE_ROOM_MESSAGE_REACTION',
        payload: {
          roomId: room.id,
          messageId,
          reaction,
        },
        sync: room.id,
      })
    } catch (e) {}
  }
}

export function deleteRoomMessageReaction(messageId, reaction) {
  return async (dispatch, getState) => {
    const { room } = getState()

    try {
      await GraphqlService.getInstance().deleteRoomMessageReaction(messageId, reaction)

      dispatch({
        type: 'DELETE_ROOM_MESSAGE_REACTION',
        payload: {
          roomId: room.id,
          messageId,
          reaction,
        },
        sync: room.id,
      })
    } catch (e) {}
  }
}
