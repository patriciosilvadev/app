import produce from 'immer'

const initialState = []

export default (state = initialState, action) =>
  produce(state, draft => {
    switch (action.type) {
      case 'TEAMS':
        return action.payload

      case 'DELETE_TEAM':
        draft = state.filter(team => team.id != action.payload)

      case 'CREATE_TEAM':
        draft.push(action.payload)

      case 'UPDATE_TEAM':
        draft = state.map(team => {
          if (team.id != action.payload.id) return team

          return {
            ...team,
            ...action.payload,
          }
        })
    }
  })
