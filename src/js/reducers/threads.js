import produce from 'immer'
import { browserHistory } from '../services/browser-history.service'

const initialState = []

export default (state = initialState, action) =>
  produce(state, draft => {
    switch (action.type) {
      case 'THREADS':
        console.log(action.payload)
        return action.payload.sort((a, b) => b.updatedAt - a.updatedAt)

      case 'UPDATE_THREADS':
        return state
          .map(thread => {
            if (thread.id != action.payload.thread.id) return thread

            return {
              ...thread,
              ...action.payload.thread,
            }
          })
          .sort((a, b) => b.updatedAt - a.updatedAt)

      case 'CREATE_THREADS':
        // If the channelId is not in the URL
        // then don't do anything
        // This is a bit of a hack - but quickly check whether the channelID
        // is the one the user is currently
        if (!window) return
        if (!window.location) return
        if (!window.location.href) return
        if (!window.location.href.split) return
        if (window.location.href.split('/').indexOf(action.payload.channelId) == -1) return

        return [action.payload.thread, ...state]
    }
  })
