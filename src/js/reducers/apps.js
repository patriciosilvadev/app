import produce from 'immer'

const initialState = []

export default (state = initialState, action) =>
  produce(state, draft => {
    switch (action.type) {
      case 'APPS':
        return action.payload

      case 'DELETE_APP':
        return state.filter(app => app.id != action.payload.appId)
        break

      case 'CREATE_APP':
        draft.push(action.payload)
        break

      case 'UPDATE_APP':
        return state.map(app => {
          if (app.id != action.payload.appId) return app

          return {
            ...app,
            ...action.payload,
          }
        })
        break
    }
  })
