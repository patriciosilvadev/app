import produce from 'immer'

const initialState = []

export default (state = initialState, action) =>
  produce(state, draft => {
    switch (action.type) {
      case 'ROOMS':
        return action.payload

      case 'UPDATE_ROOM':
        draft = state.map(room => {
          if (room.id != action.payload.room) return room

          return {
            ...room,
            ...action.payload,
          }
        })

      case 'DELETE_ROOM':
        draft = state.filter(room => room.id != action.payload.room)

      case 'CREATE_ROOM':
        draft.push(action.payload)
    }
  })
