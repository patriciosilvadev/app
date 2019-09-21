import produce from 'immer'

const initialState = {
  members: [],
  rooms: [
    {
      team: {},
      members: [],
    },
  ],
}

export default (state = initialState, action) =>
  produce(state, draft => {
    switch (action.type) {
      case 'TEAM':
        return action.payload
        break

      case 'UPDATE_TEAM':
        if (action.payload.teamId != state.id) return
        draft = Object.assign(draft, action.payload)
        break
    }
  })
