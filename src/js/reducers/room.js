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
  typing: [],
}

export default (state = initialState, action) =>
  produce(state, draft => {
    if (action.type == 'ROOM') return action.payload

    // Only if these are valid
    // We only process messages that are for the current room
    if (!action.payload) return
    if (!action.payload.roomId) return
    if (state.id != action.payload.roomId) return

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

      case 'UPDATE_ROOM_MESSAGE':
        draft.messages = state.messages.map((message, _) => {
          if (message.id == action.payload.messageId) {
            return {
              ...message,
              attachments: action.payload.message.attachments,
              message: action.payload.message.message,
            }
          } else {
            return message
          }
        })
        break

      case 'DELETE_ROOM_MESSAGE':
        draft.messages = state.messages.filter(message => message.id != action.payload.messageId)
        break

      case 'UPDATE_ROOM_ADD_TYPING':
        draft.typing.push({
          userName: action.payload.userName,
          userId: action.payload.userId
        })
        break

      case 'UPDATE_ROOM_DELETE_TYPING':
        return {
          ...state,
          typing: state.typing.filter(typing => typing.userId != action.payload.userId)
        }

      case 'UPDATE_ROOM_MESSAGE_ATTACHMENT_PREVIEW':
        draft.messages = state.messages.map((message, _) => {
          if (message.id == action.payload.messageId) {
            return {
              ...message,

              // We need to use the _id because attachments is a schema-only of message
              // Not a child object - the ID accessor only gets added to Models
              attachments: message.attachments.map(attachment => {
                if (attachment._id == action.payload.attachmentId) {
                  return {
                    ...attachment,
                    preview: action.payload.uri,
                  }
                } else {
                  return attachment
                }
              }),
            }
          } else {
            return message
          }
        })
        break

      case 'CREATE_ROOM_MESSAGE_REACTION':
        draft.messages = state.messages.map((message, _) => {
          if (message.id == action.payload.messageId) {
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
          if (message.id == action.payload.messageId) {
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
        draft.members = state.members.filter(member => member.user.id != action.payload.userId)
        break
    }
  })
