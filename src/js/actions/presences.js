export function addPresence(teamId, userId) {
  return async (dispatch, getState) => {
    dispatch({
      type: 'ADD_PRESENCE',
      payload: { userId },
      sync: teamId,
    })
  }
}

export function deletePresence(userId) {
  return async (dispatch, getState) => {
    dispatch({
      type: 'DELETE_PRESENCE',
      payload: { userId },
    })
  }
}
