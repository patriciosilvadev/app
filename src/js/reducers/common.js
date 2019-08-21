import produce from 'immer'

const initialState = {
  error: null,
  loading: false,
  unread: [],
  user: {
    starred: [],
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
        draft.user.starred = action.payload.starred ? [...state.user.starred, action.payload.room] : state.user.starred.filter(t => t != action.payload.room)
        break

      case 'UPDATE_ERROR':
        draft.error = action.payload
        break

      case 'UPDATE_LOADING':
        draft.loading = action.payload
        break

      case 'UPDATE_UNREAD':
        draft.unread = action.payload
        break
    }
  })
