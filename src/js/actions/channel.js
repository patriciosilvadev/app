import MessagingService from '../services/messaging.service'
import GraphqlService from '../services/graphql.service'
import { browserHistory } from '../services/browser-history.service'
import moment from 'moment'
import EventService from '../services/event.service'
import { updateLoading, updateError } from './'

export function deleteChannelMessage(channelId, messageId) {
  return {
    type: 'DELETE_CHANNEL_MESSAGE',
    payload: {
      channelId,
      messageId,
    },
    sync: channelId,
  }
}

export function createChannelMessageReaction(channelId, messageId, reaction) {
  return {
    type: 'CREATE_CHANNEL_MESSAGE_REACTION',
    payload: {
      channelId,
      messageId,
      reaction,
    },
    sync: channelId,
  }
}

export function deleteChannelMessageReaction(channelId, messageId, reaction) {
  return {
    type: 'DELETE_CHANNEL_MESSAGE_REACTION',
    payload: {
      channelId,
      messageId,
      reaction,
    },
    sync: channelId,
  }
}

export function createChannelMessageLike(channelId, messageId, userId) {
  return {
    type: 'CREATE_CHANNEL_MESSAGE_LIKE',
    payload: {
      channelId,
      messageId,
      userId,
    },
    sync: channelId,
  }
}

export function deleteChannelMessageLike(channelId, messageId, userId) {
  return {
    type: 'DELETE_CHANNEL_MESSAGE_LIKE',
    payload: {
      channelId,
      messageId,
      userId,
    },
    sync: channelId,
  }
}

export function createChannelMessage(channelId, channelMessage) {
  return {
    type: 'CREATE_CHANNEL_MESSAGE',
    payload: channelMessage,
    sync: channelId,
  }
}

export function updateChannelMessageReadCount(channelId, messageId) {
  return {
    type: 'UPDATE_CHANNEL_MESSAGE_READ_COUNT',
    payload: { channelId, messageId },
    sync: channelId,
  }
}

export function updateChannelMessage(channelId, channelMessage) {
  return {
    type: 'UPDATE_CHANNEL_MESSAGE',
    payload: channelMessage,
    sync: channelId,
  }
}

export function createChannel(channel) {
  return {
    type: 'CREATE_CHANNEL',
    payload: channel,
  }
}

export function hydrateChannelMessages(channelId, messages) {
  return {
    type: 'UPDATE_CHANNEL_ADD_MESSAGES',
    payload: {
      channelId,
      messages,
    },
  }
}

export function hydrateChannel(channel) {
  return {
    type: 'CHANNEL',
    payload: {
      ...channel,
      typing: [],
    },
  }
}

export function updateChannel(channelId, updatedChannel) {
  return {
    type: 'UPDATE_CHANNEL',
    payload: {
      ...updatedChannel,
      channelId,
    },
    sync: channelId,
  }
}

export function deleteChannel(channelId, sync) {
  return {
    type: 'DELETE_CHANNEL',
    payload: { channelId },
    sync: sync ? channelId : null,
  }
}

export function updateChannelAddTyping(channelId, userName, userId) {
  return {
    type: 'UPDATE_CHANNEL_ADD_TYPING',
    payload: { channelId, userName, userId },
    sync: channelId,
  }
}

export function updateChannelDeleteTyping(channelId, userId) {
  return {
    type: 'UPDATE_CHANNEL_DELETE_TYPING',
    payload: { userId, channelId },
    sync: channelId,
  }
}
