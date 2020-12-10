import produce from 'immer'

const initialState = []

export default (state = initialState, action) =>
  produce(state, draft => {
    switch (action.type) {
      case 'UNREADS':
        return action.payload
        break

      case 'CREATE_UNREAD':
        draft.push(action.payload)
        break

      case 'DELETE_UNREAD':
        return state.filter(unread => unread.channel != action.payload.channelId)
    }
  })
