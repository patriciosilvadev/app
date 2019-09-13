import produce from 'immer'

const initialState = []

export default (state = initialState, action) =>
  produce(state, draft => {
    switch (action.type) {
      case 'ROOMS':
        return action.payload

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
