import produce from 'immer'

const initialState = {
  id: '',
  name: '',
  description: '',
  image: '',
  public: false,
  private: false,
  readonly: false,
  isMember: false,
  totalMembers: 0,
  messages: [],
  userPreviews: [],
  pinnedMessages: [],
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

      case 'UPDATE_CHANNEL_CREATE_MESSAGE_PIN':
        draft.pinnedMessages = [action.payload.channelMessage, ...state.pinnedMessages]
        break

      case 'UPDATE_CHANNEL_DELETE_MESSAGE_PIN':
        draft.pinnedMessages = state.pinnedMessages.filter(pinnedMessage => pinnedMessage.id != action.payload.messageId)
        break

      case 'UPDATE_CHANNEL_UPDATE_MESSAGE_PIN':
        draft.pinnedMessages = state.pinnedMessages.map(pinnedMessage => {
          if (pinnedMessage.id == action.payload.messageId) {
            return {
              ...pinnedMessage,
              ...action.payload.message,
            }
          }
        })
        break

      case 'UPDATE_CHANNEL_ADD_MESSAGES':
        draft.messages = [...state.messages, ...action.payload.messages]
        break

      case 'CREATE_CHANNEL_MESSAGE':
        const channelAlreadyContainsMessage = state.messages.filter(message => message.id == action.payload.message.id).length > 0

        if (!channelAlreadyContainsMessage) draft.messages = [...state.messages, action.payload.message]
        break

      case 'UPDATE_CHANNEL_MESSAGE_INITIAL_READ_COUNT':
        draft.messages = state.messages.map((message, _) => {
          // If it's the correct message
          if (message.id == action.payload.messageId) {
            // Bump the read count from what we've got from the API
            return {
              ...message,
              reads: action.payload.channelMessageReadCount,
            }
          }

          // Otherwise default
          return message
        })
        break

      case 'UPDATE_CHANNEL_MESSAGE_READ_COUNT':
        draft.messages = state.messages.map((message, _) => {
          // If it's the correct message
          if (message.id == action.payload.messageId) {
            // Bump the read count
            return { ...message, reads: message.reads + 1 }
          }

          // Otherwise default
          return message
        })
        break

      case 'UPDATE_CHANNEL_MESSAGE':
        // Update the normal message
        draft.messages = state.messages.map((message, _) => {
          // If it's the correct message
          if (message.id == action.payload.messageId) {
            return {
              ...message,
              ...action.payload.message,
            }
          }

          // If it's the parent (replied to) message
          if (message.parent) {
            if (message.parent.id == action.payload.messageId) {
              return {
                ...message,
                parent: {
                  ...message.parent,
                  ...action.payload.message,
                },
              }
            }
          }

          // Otherwise default
          return message
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
              // Not a child object - the "id" accessor only gets added to Models
              // Usually this is fine - but we need the _id of the child object here to
              // know which attachment to update the preview of
              attachments: message.attachments.map(attachment => {
                if (attachment._id == action.payload.attachmentId) {
                  return {
                    ...attachment,
                    preview: action.payload.preview,
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

      case 'DECREASE_CHANNEL_USER_PREVIEW':
        draft.userPreviews = state.userPreviews.filter(user => user.id != action.payload.userId)
        break

      case 'DECREASE_CHANNEL_TOTAL_MEMBERS':
        draft.totalMembers = state.totalMembers - 1
        break

      case 'INCREASE_CHANNEL_TOTAL_MEMBERS':
        draft.totalMembers = state.totalMembers + 1
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

      case 'CREATE_CHANNEL_MESSAGE_LIKE':
        draft.messages = state.messages.map((message, _) => {
          if (message.id == action.payload.messageId) {
            return {
              ...message,
              likes: [...message.likes, action.payload.userId],
            }
          } else {
            return message
          }
        })
        break

      case 'DELETE_CHANNEL_MESSAGE_LIKE':
        draft.messages = state.messages.map((message, _) => {
          if (message.id == action.payload.messageId) {
            return {
              ...message,
              likes: message.likes.filter(like => like != action.payload.userId),
            }
          } else {
            return message
          }
        })
        break

      // There are the app reducer functions
      // Just so there is some seperation

      case 'CREATE_CHANNEL_APP':
        draft.apps = [...state.apps, action.payload.app]
        break

      case 'DELETE_CHANNEL_APP':
        // Delete app
        draft.apps = state.apps.filter(app => app.app.id != action.payload.appId)

        // Delete messages
        draft.messages = state.messages.filter(message => {
          if (message.app) {
            return message.app.app.id != action.payload.appId
          } else {
            return true
          }
        })
        break

      case 'UPDATE_CHANNEL_APP_APP':
        draft.apps = state.apps.map((app, _) => {
          if (app.app.id == action.payload.appId) {
            return {
              ...app,
              app: {
                ...action.payload.app,
              },
            }
          } else {
            return app
          }
        })
        break

      case 'UPDATE_CHANNEL_APP_ACTIVE':
        draft.apps = state.apps.map((app, _) => {
          if (app.app.id == action.payload.appId) {
            return {
              ...app,
              active: action.payload.active,
            }
          } else {
            return app
          }
        })
        break

      case 'UPDATE_CHANNEL_APP_MESSAGES_WITH_RESOURCE_IDS':
        draft.messages = state.messages.map((message, _) => {
          if (action.payload.messageIds.indexOf(message.id) != -1) {
            // This is the base of the new message object
            // attachments/message will always be there
            let updatedMessage = message

            // Because these aren\t guaranteed
            if (action.payload.message.body) updatedMessage.body = action.payload.message.body
            if (action.payload.message.attachments) updatedMessage.attachments = action.payload.message.attachments

            // If there is an app - there should be
            // Just change the RESOURCE ID (not app.app object)
            if (updatedMessage.app) {
              if (action.payload.message.app) {
                updatedMessage.app.resourceId = action.payload.message.app.resourceId
              }
            }

            // Now return the new updated message
            return updatedMessage
          } else {
            return message
          }
        })
        break

      case 'DELETE_CHANNEL_APP_MESSAGES_WITH_RESOURCE_IDS':
        draft.messages = state.messages.filter(message => {
          const { messageIds } = action.payload
          const messageIdPresentWithmessageIds = messageIds.indexOf(message.id) != -1

          // Remove it if it's there
          return !messageIdPresentWithmessageIds
        })
        break
    }
  })
