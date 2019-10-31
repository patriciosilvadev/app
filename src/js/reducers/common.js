import produce from 'immer'

const initialState = {
  error: null,
  loading: false,
  unread: [],
  user: {
    id: null,
    starred: [],
    archived: [],
    muted: [],
  },
}

export default (state = initialState, action) =>
  produce(state, draft => {
    switch (action.type) {
      case 'USER':
        draft.user = action.payload
        break

      case 'UPDATE_USER':
        draft.user = {
          ...state.user,
          ...action.payload,
        }
        break

      case 'UPDATE_USER_MUTED':
        draft.user.muted = action.payload.muted ? [...state.user.muted, action.payload.roomId] : state.user.muted.filter(roomId => roomId != action.payload.roomId)
        break

      case 'UPDATE_USER_ARCHIVED':
        draft.user.archived = action.payload.archived ? [...state.user.archived, action.payload.roomId] : state.user.archived.filter(roomId => roomId != action.payload.roomId)
        break

      case 'UPDATE_USER_STARRED':
        draft.user.starred = action.payload.starred ? [...state.user.starred, action.payload.roomId] : state.user.starred.filter(roomId => roomId != action.payload.roomId)
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
