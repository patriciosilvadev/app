import produce from 'immer'

const initialState = {
  id: null,
  starred: [],
  archived: [],
  muted: [],
}

export default (state = initialState, action) =>
  produce(state, draft => {
    switch (action.type) {
      case 'USER':
        return action.payload
        break

      case 'UPDATE_USER':
        return {
          ...state,
          ...action.payload,
        }
        break

      case 'UPDATE_USER_MUTED':
        draft.muted = action.payload.muted ? [...state.muted, action.payload.roomId] : state.muted.filter(roomId => roomId != action.payload.roomId)
        break

      case 'UPDATE_USER_ARCHIVED':
        draft.archived = action.payload.archived ? [...state.archived, action.payload.roomId] : state.archived.filter(roomId => roomId != action.payload.roomId)
        break

      case 'UPDATE_USER_STARRED':
        draft.starred = action.payload.starred ? [...state.starred, action.payload.roomId] : state.starred.filter(roomId => roomId != action.payload.roomId)
        break
    }
  })
