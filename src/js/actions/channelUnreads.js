export function hydrateChannelUnreads(channelUnreads) {
  return {
    type: 'CHANNEL_UNREADS',
    payload: channelUnreads,
  }
}

export function createChannelUnread(unread) {
  return {
    type: 'CHANNEL_CREATE_UNREAD',
    payload: unread,
  }
}

export function deleteChannelUnread(channelId) {
  return {
    type: 'CHANNEL_DELETE_UNREAD',
    payload: { channelId },
  }
}
