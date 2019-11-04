import MessagingService from '../services/messaging.service'
import GraphqlService from '../services/graphql.service'
import DatabaseService from '../services/database.service'
import { browserHistory } from '../services/browser-history.service'
import moment from 'moment'
import EventService from '../services/event.service'
import { updateLoading, updateError } from './'

export function createRoomMember(roomId, user) {
  return async (dispatch, getState) => {
    const userId = user.id
    const userIds = [userId]

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

export function deleteRoomMember(roomId, user) {
  return async (dispatch, getState) => {
    const userId = user.id
    const userIds = [userId]
    const currentUserId = getState().user.id

    dispatch(updateLoading(true))
    dispatch(updateError(null))

    try {
      await GraphqlService.getInstance().deleteRoomMember(roomId, userId)

      dispatch(updateLoading(false))

      // Delete the room member from the store
      dispatch({
        type: 'DELETE_ROOM_MEMBER',
        payload: { userId, roomId },
        sync: roomId,
      })

      // Delete the room for them
      if (userId == currentUserId) {
        dispatch({
          type: 'DELETE_ROOM',
          payload: { roomId },
          sync: roomId,
        })
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

export function updateRoom(roomId, updatedRoom) {
  return async (dispatch, getState) => {
    dispatch(updateLoading(true))
    dispatch(updateError(null))

    try {
      await GraphqlService.getInstance().updateRoom(roomId, updatedRoom)

      dispatch(updateLoading(false))
      dispatch({
        type: 'UPDATE_ROOM',
        payload: { ...updatedRoom, roomId },
        sync: roomId,
      })
    } catch (e) {
      dispatch(updateLoading(false))
      dispatch(updateError(e))
    }
  }
}

export function updateRoomAddTyping(roomId, userName, userId) {
  return async (dispatch, getState) => {
    dispatch({
      type: 'UPDATE_ROOM_ADD_TYPING',
      payload: { userName, userId, roomId },
      sync: roomId,
    })
  }
}

export function updateRoomDeleteTyping(roomId, userId) {
  return async (dispatch, getState) => {
    dispatch({
      type: 'UPDATE_ROOM_DELETE_TYPING',
      payload: { userId, roomId },
      sync: roomId,
    })
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
          typing: [],
          messages: room.messages.sort((left, right) => {
            return moment.utc(left.createdAt).diff(moment.utc(right.createdAt))
          }),
        },
      })

      // Clear all the markers for read/unread
      DatabaseService.getInstance().read(roomId)
    } catch (e) {
      dispatch(updateLoading(false))
      dispatch(updateError(e))
    }
  }
}

export function createRoom(title, description, image, teamId, userId, initialOtherUserId) {
  return async (dispatch, getState) => {
    try {
      // 1. Find rooms where there rae only 2 members
      // 2. Remove the argument-user from the members array, should only be 1 left afterwards (us)
      const room = initialOtherUserId
        ? getState()
            .rooms.filter(room => room.members.length == 2 && room.private)
            .filter(room => room.members.filter(member => member.user.id == initialOtherUserId).length == 1)
            .flatten()
        : null

      // 3. If it's found - then go there
      if (room) return browserHistory.push(`/app/team/${teamId}/room/${room.id}`)

      // Create the default member array
      // If user isn't null - then it's a private room
      const members = initialOtherUserId ? [{ user: initialOtherUserId }, { user: userId }] : [{ user: userId }]

      // Otherwise create the new room
      // 1) Create the room object based on an open room or private
      // 2) Default public room is always members only
      const { data } = await GraphqlService.getInstance().createRoom({
        title,
        description,
        image,
        members,
        team: teamId,
        user: userId,
        messages: [],
        public: false,
        private: initialOtherUserId ? true : false,
      })

      const roomData = data.createRoom
      const roomId = roomData.id

      dispatch({
        type: 'CREATE_ROOM',
        payload: roomData,
      })

      MessagingService.getInstance().join(roomId)

      // If it's a private conversation - then incite the other optersons
      if (initialOtherUserId) MessagingService.getInstance().joinRoom([initialOtherUserId], roomId)

      browserHistory.push(`/app/team/${teamId}/room/${roomId}`)
    } catch (e) {
      console.log(e)
      dispatch(updateError(e))
    }
  }
}

export function fetchRoomMessages(roomId, page) {
  return async (dispatch, getState) => {
    dispatch(updateLoading(true))
    dispatch(updateError(null))

    try {
      const roomMessages = await GraphqlService.getInstance().roomMessages(roomId, page)
      const messages = roomMessages.data.roomMessages

      dispatch(updateLoading(false))

      // Add the new messages to the room
      dispatch({
        type: 'UPDATE_ROOM_ADD_MESSAGES',
        payload: {
          messages: messages.sort((left, right) => {
            return moment.utc(left.createdAt).diff(moment.utc(right.createdAt))
          }),
        },
      })

      // Tell our room to resume enabling loads
      EventService.get().emit('successfullyFetchedMoreRoomMessages', true)
    } catch (e) {
      dispatch(updateLoading(false))
      dispatch(updateError(e))
    }
  }
}

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
