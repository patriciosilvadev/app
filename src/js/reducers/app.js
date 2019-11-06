import produce from 'immer'

const initialState = {
  action: {},
  payload: {},
}

export default (state = initialState, action) =>
  produce(state, draft => {
    switch (action.type) {
      case 'APP':
        draft.action = action.payload.action
        draft.payload = action.payload.payload
        break
    }
  })
