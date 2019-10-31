import produce from 'immer'
import '../helpers/extensions'

const initialState = {
  users: [],
}

export default (state = initialState, action) =>
  produce(state, draft => {
    switch (action.type) {
      case 'ADD_PRESENCE':
        // If it's already there
        if (state.users.filter(p => p.userId == action.payload.userId).flatten()) {
          draft.users = state.users.map(p => {
            // If it isn't this users typing
            // then don't change anything
            if (p.userId != action.payload.userId) return p

            // Otherwise - update their time
            return {
              userId: action.payload.userId,
              userTime: new Date().getTime(),
            }
          })

          return
        }

        // If they are NOT there - then we want to add them
        draft.users.push({
          userId: action.payload.userId,
          userTime: new Date().getTime(),
        })
        break

      case 'DELETE_PRESENCE':
        return { users: state.users.filter(p => p.userId != action.payload.userId) }
    }
  })
