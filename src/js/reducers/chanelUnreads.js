import produce from 'immer'

const initialState = []

export default (state = initialState, action) =>
  produce(state, draft => {
    switch (action.type) {
      case 'CHANNEL_UNREADS':
        return action.payload

      case 'CHANNEL_CREATE_UNREAD':
        draft.push(action.payload)
        break

      case 'CHANNEL_DELETE_UNREAD':
        return state.filter(
          unread => unread.channel != action.payload.channelId
        )
    }
  })
