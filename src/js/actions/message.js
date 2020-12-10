export function hydrateMessage(message) {
  return {
    type: 'MESSAGE',
    payload: message,
  }
}

export function updateMessage(messageId, updatedMessage, channelId) {
  return {
    type: 'UPDATE_MESSAGE',
    payload: { ...updatedMessage, messageId },
    sync: channelId,
  }
}

export function updateMessageAddSubmessage(messageId, message, channelId) {
  return {
    type: 'UPDATE_MESSAGE_ADD_MESSAGE',
    payload: { message, messageId },
    sync: channelId,
  }
}

export function updateMessageDeleteSubmessage(messageId, channelId) {
  return {
    type: 'UPDATE_MESSAGE_DELETE_MESSAGE',
    payload: { messageId },
    sync: channelId,
  }
}

export function updateMessageUpdateSubmessage(messageId, message, channelId) {
  return {
    type: 'UPDATE_MESSAGE_UPDATE_MESSAGE',
    payload: { message, messageId },
    sync: channelId,
  }
}
