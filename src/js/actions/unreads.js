export function hydrateUnreads(unreads) {
  return {
    type: 'UNREADS',
    payload: unreads,
  }
}

export function createUnread(unread) {
  return {
    type: 'CREATE_UNREAD',
    payload: unread,
  }
}

export function deleteUnread(channelId) {
  return {
    type: 'DELETE_UNREAD',
    payload: { channelId },
  }
}
