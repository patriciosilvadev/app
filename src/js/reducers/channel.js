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
  apps: [],
  user: {},
  team: {},
  typing: [],
}

export default (state = initialState, action) =>
  produce(state, draft => {
    if (action.type == 'CHANNEL') return action.payload

    // Only if these are valid
    // We only process messages that are for the current channel
    if (!action.payload) return
    if (!action.payload.channelId) return
    if (state.id != action.payload.channelId) return

    // These are actions that get dispatched against the laoded channel
    // They come from the user or the SocketIO server
    switch (action.type) {
      case 'CHANNEL':
        return action.payload

      case 'UPDATE_CHANNEL':
        draft = Object.assign(draft, action.payload)
        break

      case 'UPDATE_CHANNEL_ADD_MESSAGES':
        draft.messages = [...state.messages, action.payload.messages]
        break

      case 'CREATE_CHANNEL_MESSAGE':
        draft.messages = [...state.messages, action.payload.message]
        break

      case 'UPDATE_CHANNEL_MESSAGE':
        draft.messages = state.messages.map((message, _) => {
          if (message.id == action.payload.messageId) {
            // This is the base of the new message object
            // attachments/message will always be there
            let updatedMessage = {
              ...message,
              attachments: action.payload.message.attachments,
              message: action.payload.message.message,
            }

            // If the app is being updated, then add it
            // It won't always be there
            if (action.payload.message.app) updatedMessage.app = action.payload.message.app

            // Now return the new updated message
            return updatedMessage
          } else {
            return message
          }
        })
        break

      case 'DELETE_CHANNEL_MESSAGE':
        draft.messages = state.messages.filter(message => message.id != action.payload.messageId)
        break

      case 'UPDATE_CHANNEL_ADD_TYPING':
        // If it's already there
        if (state.typing.filter(t => t.userId == action.payload.userId).flatten()) {
          draft.typing = state.typing.map(t => {
            // If it isn't this users typing
            // then don't change anything
            if (t.userId != action.payload.userId) return t

            // Otherwise - update their time
            return {
              userName: action.payload.userName,
              userId: action.payload.userId,
              userTime: new Date().getTime(),
            }
          })

          return
        }

        // If they are NOT there - then we want to add them
        draft.typing.push({
          userName: action.payload.userName,
          userId: action.payload.userId,
          userTime: new Date().getTime(),
        })
        break

      case 'UPDATE_CHANNEL_DELETE_TYPING':
        return { ...state, typing: state.typing.filter(t => t.userId != action.payload.userId) }

      case 'UPDATE_CHANNEL_MESSAGE_ATTACHMENT_PREVIEW':
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

      case 'CREATE_CHANNEL_MESSAGE_REACTION':
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

      case 'DELETE_CHANNEL_MESSAGE_REACTION':
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

      case 'CREATE_CHANNEL_MEMBER':
        draft.members = [...state.members, action.payload.member]
        break

      case 'DELETE_CHANNEL_MEMBER':
        draft.members = state.members.filter(member => member.user.id != action.payload.userId)
        break
    }
  })
