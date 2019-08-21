import produce from 'immer'

const initialState = {
  id: '',
  title: '',
  description: '',
  image: '',
  public: false,
  private: false,
  messages: [],
  members: [],
  user: {},
  team: {},
}

export default (state = initialState, action) =>
  produce(state, draft => {
    if (action.type == 'ROOM') return action.payload

    // Only if these are valid
    // We only process messages that are for the current room
    if (!action.payload) return
    if (!action.payload.room) return
    if (state.id != action.payload.room) return

    // These are actions that get dispatched against the laoded room
    // They come from the user or the SocketIO server
    switch (action.type) {
      case 'ROOM':
        return action.payload

      case 'UPDATE_ROOM':
        draft = Object.assign(draft, action.payload)
        break

      case 'CREATE_ROOM_MESSAGE':
        draft.messages = [...state.messages, action.payload.message]
        break

      case 'CREATE_ROOM_MESSAGE_REPLY':
        draft.messages = state.messages.map((message, _) => {
          if (message.id == action.payload.id) {
            return {
              ...message,
              replies: [...message.replies, action.payload.reply],
            }
          } else {
            return message
          }
        })
        break

      case 'CREATE_ROOM_MESSAGE_REACTION':
        draft.messages = state.messages.map((message, _) => {
          if (message.id == action.payload.id) {
            return {
              ...message,
              reactions: [...message.reactions, action.payload.reaction],
            }
          } else {
            return message
          }
        })
        break

      case 'DELETE_ROOM_MESSAGE_REACTION':
        draft.messages = state.messages.map((message, _) => {
          if (message.id == action.payload.id) {
            return {
              ...message,
              reactions: message.reactions.filter(reaction => reaction != action.payload.reaction),
            }
          } else {
            return message
          }
        })
        break

      case 'CREATE_ROOM_MEMBER':
        draft.members = [...state.members, action.payload.member]
        break

      case 'DELETE_ROOM_MEMBER':
        draft.members = state.members.filter(member => member.user.id != action.payload.user)
        break
    }
  })
