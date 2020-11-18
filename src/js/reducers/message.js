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

      // These actions are from the channel reducer
      // Implementation details are slightly different
      // We want to make sure there are always message to do things with
      case 'CREATE_CHANNEL_MESSAGE':
        // Don't do anything if there isn't porent
        // We only want non-0 level messages
        if (!action.payload.message.parent) return

        // Check if it's already here (can happen sometimes)
        const channelAlreadyContainsMessage = state.messages.filter(message => message.id == action.payload.message.id).length > 0

        // Otherwise cool
        if (!channelAlreadyContainsMessage) draft.messages = [...state.messages, action.payload.message]
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
    }
  })
