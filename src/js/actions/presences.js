export function addPresence(teamId, userId, userPresence) {
  return {
    type: 'ADD_PRESENCE',
    payload: { userId, userPresence },
    sync: teamId,
  }
}

export function deletePresence(userId) {
  return {
    type: 'DELETE_PRESENCE',
    payload: { userId },
  }
}
