import produce from 'immer'

const initialState = {
  modal: null,
  panel: null
}

export default (state = initialState, action) =>
  produce(state, draft => {
    switch (action.type) {
      case 'APP_MODAL':
        // action.payload = { action, payload } 
        draft.modal = action.payload
        break

      case 'APP_PANEL':
        // action.payload = { action, payload }
        draft.panel = action.payload
        break
    }
  })
