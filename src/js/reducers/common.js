import produce from 'immer'

const initialState = {
  error: null,
  loading: false,
  unread: [],
  user: {
    starred: [],
  },
  plugins: {
    dock: [],
  },
}

export default (state = initialState, action) =>
  produce(state, draft => {
    switch (action.type) {
      case 'USER':
        draft.user = {
          ...state.user,
          ...action.payload,
        }
        break

      case 'UPDATE_USER_STARRED':
        draft.user.starred = action.payload.starred
          ? [...state.user.starred, action.payload.roomId]
          : state.user.starred.filter(room => room.id != action.payload.roomId)
        break

      case 'UPDATE_UNREAD':
        draft.unread = action.payload
        break

      case 'UPDATE_ERROR':
        draft.error = action.payload
        break

      case 'UPDATE_LOADING':
        draft.loading = action.payload
        break

      case 'REGISTER_DOCK_PLUGIN':
        draft.plugins.dock.push(action.payload)
        break
    }
  })
