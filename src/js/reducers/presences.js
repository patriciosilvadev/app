import produce from 'immer'
import '../helpers/extensions'

const initialState = {
  users: [],
}

export default (state = initialState, action) =>
  produce(state, draft => {
    switch (action.type) {
      // This gets updated from the initialize() function
      // In the common.js actions file (setInterval)
      case 'UPDATE_USER_PRESENCE':
        // Do they exist already
        const user = state.users.filter(user => user.userId == action.payload.userId).flatten()

        // If they do - then update their heartbeat
        if (user) {
          draft.users = state.users.map(user => {
            const { userId } = user
            const heartbeat = new Date()

            if (userId == action.payload.userId) return { userId, heartbeat }

            return user
          })
        } else {
          // If not, then create them
          draft.users.push({ userId: action.payload.userId, heartbeat: new Date() })
        }
        break
    }
  })
