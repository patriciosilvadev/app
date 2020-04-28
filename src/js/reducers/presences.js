import produce from 'immer'
import '../helpers/extensions'

const initialState = {}

export default (state = initialState, action) =>
  produce(state, draft => {
    switch (action.type) {
      case 'ADD_PRESENCE':
        draft[action.payload.userId] = new Date().getTime() + ':' + action.payload.userPresence

      case 'DELETE_PRESENCE':
        delete draft[action.payload.userId]
    }
  })
