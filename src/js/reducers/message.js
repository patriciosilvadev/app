import '../helpers/extensions'
import produce from 'immer'

const initialState = {
  messages: [],
}

/**
 * Just a note here. Immer (JS Proxies) don't seem to play
 * well with dynamic properties - so vanilla redux below
 */
export default (state = initialState, action) =>
  produce(state, draft => {
    switch (action.type) {
      case 'MESSAGE':
        return action.payload

      case 'UPDATE_MESSAGE':
        if (action.payload.messageId != state.id) return

        // Copy any updates here
        return {
          ...state,
          ...action.payload,
        }

      case 'UPDATE_MESSAGE_ADD_MESSAGE':
        if (state.id == action.payload.messageId) {
          draft.messages.push(action.payload.message)
        }
        break

      case 'UPDATE_MESSAGE_DELETE_MESSAGE':
        draft.messages = state.messages.filter(message => message.id != action.payload.messageId)
        break

      case 'UPDATE_MESSAGE_UPDATE_MESSAGE':
        draft.messages = state.messages.map((message, _) => {
          if (message.id == action.payload.messageId) {
            return {
              ...message,
              ...action.payload.message,
            }
          } else {
            return message
          }
        })
        break
    }
  })
