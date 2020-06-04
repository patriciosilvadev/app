import '../helpers/extensions'

const initialState = {}

/**
 * Just a note here. Immer (JS Proxies) don't seem to play
 * well with dynamic properties - so vanilla redux below
 */
export default (state = initialState, action) => {
  switch (action.type) {
    case 'ADD_PRESENCE':
      let addState = { ...state }
      addState[action.payload.userId] = new Date().getTime() + ':' + action.payload.userPresence
      return addState

    case 'DELETE_PRESENCE':
      let deleteState = { ...state }
      delete deleteState[action.payload.userId]
      return deleteState

    default:
      return state
  }
}
