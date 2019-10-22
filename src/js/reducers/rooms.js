import produce from 'immer'

const initialState = []

export default (state = initialState, action) =>
  produce(state, draft => {
    switch (action.type) {
      case 'ROOMS':
        return action.payload

      case 'UPDATE_ROOM_USER_STATUS':
        return state.map(room => {
          if (!room.private) return room

          return {
            ...room,
            members: room.members.map(member => {
              if (member.user.id != action.payload.userId) return member

              // We first find the right user to update
              // Then we re-create the member object and update their
              // status. This value will be used in rooms.js to display
              // an update status (we don't need to do anything else)
              if (member.user.id == action.payload.userId) return {
                ...member,
                user: {
                  ...member.user,
                  status: action.payload.status
                }
              }
            }),
          }
        })

      case 'UPDATE_ROOM':
        return state.map(room => {
          if (room.id != action.payload.roomId) return room

          return {
            ...room,
            ...action.payload,
          }
        })

      case 'DELETE_ROOM':
        return state.filter(room => room.id != action.payload.roomId)

      case 'CREATE_ROOM':
        draft.push(action.payload)
        break
    }
  })
