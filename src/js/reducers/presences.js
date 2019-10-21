import produce from 'immer'
import '../helpers/extensions'

const initialState = {
  users: [],
}

export default (state = initialState, action) =>
  produce(state, draft => {
    switch (action.type) {
      case 'UPDATE_USER_PRESENCE':
        const user = state.users.filter(user => user.userId == action.payload.userId).flatten()

        if (user) {
          draft.users = state.users.map(user => {
            const { userId } = user
            const heartbeat = new Date()

            if (userId == action.payload.userId) return { userId, heartbeat }

            return user
          })
        } else {
          draft.users.push({ userId: action.payload.userId, heartbeat: new Date() })
        }
        break
    }
  })
