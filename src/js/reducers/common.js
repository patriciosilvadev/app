import produce from 'immer'

const initialState = {
  error: null,
  loading: false,
  unread: [],
}

export default (state = initialState, action) =>
  produce(state, draft => {
    switch (action.type) {
      case 'UPDATE_UNREAD':
        draft.unread = action.payload
        break

      case 'UPDATE_ERROR':
        draft.error = action.payload
        break

      case 'UPDATE_LOADING':
        draft.loading = action.payload
        break
    }
  })
