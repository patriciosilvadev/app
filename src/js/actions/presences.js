export function addPresence(teamId, userId) {
  return {
    type: 'ADD_PRESENCE',
    payload: { userId },
    sync: teamId,
  }
}

export function deletePresence(userId) {
  return {
    type: 'DELETE_PRESENCE',
    payload: { userId },
  }
}
