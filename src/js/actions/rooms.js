import MessagingService from '../services/messaging.service'
import GraphqlService from '../services/graphql.service'
import DatabaseService from '../services/database.service'
import { browserHistory } from '../services/browser-history.service'
import moment from 'moment'
import EventService from '../services/event.service'
import { updateLoading, updateError } from './'

export function fetchRooms(teamId, userId) {
  return async (dispatch, getState) => {
    dispatch(updateLoading(true))
    dispatch(updateError(null))

    try {
      const rooms = await GraphqlService.getInstance().rooms(teamId, userId)

      dispatch(updateLoading(false))
      dispatch({
        type: 'ROOMS',
        payload: rooms.data.rooms,
      })
    } catch (e) {
      dispatch(updateLoading(true))
      dispatch(updateError(null))
    }
  }
}

export function fetchStarredRooms(userId) {
  return async (dispatch, getState) => {
    dispatch(updateLoading(true))
    dispatch(updateError(null))

    try {
      const starredRooms = await GraphqlService.getInstance().starredRooms(userId)

      dispatch(updateLoading(false))
      dispatch({
        type: 'ROOMS',
        payload: starredRooms.data.starredRooms,
      })
    } catch (e) {
      dispatch(updateLoading(true))
      dispatch(updateError(null))
    }
  }
}

export function createRoom(title, description, team, user) {
  return async (dispatch, getState) => {
    const { rooms, common } = getState()

    try {
      // 1. Find rooms where there rae only 2 members
      // 2. Remove the argument-user from the members array, should only be 1 left afterwards (us)
      const room = rooms
        .filter(room => room.members.length == 2 && room.private)
        .filter(room => room.members.filter(member => member.user.id == user.id).length == 1)
        .flatten()

      // 3. If it's found - then go there
      if (room) return browserHistory.push(`/app/team/${team}/room/${room.id}`)

      const members = user ? [{ user: user.id }, { user: getState().common.user.id }] : [{ user: getState().common.user.id }]

      // Otherwise create the new room
      // 1) Create the room object based on an open room or private
      // 2) Default public room is always members only
      const createRoom = await GraphqlService.getInstance().createRoom({
        title,
        description,
        image: null,
        messages: [],
        members,
        team,
        public: false,
        private: user ? true : false,
        user: common.user.id,
      })

      const roomData = createRoom.data.createRoom
      const roomId = roomData.id

      dispatch({
        type: 'CREATE_ROOM',
        payload: roomData,
      })

      MessagingService.getInstance().join(roomId)

      browserHistory.push(`/app/team/${team}/room/${roomId}`)
    } catch (e) {
      dispatch(updateError(e))
    }
  }
}
