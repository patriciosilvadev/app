import produce from 'immer'

const initialState = {
  members: [],
  channels: [
    {
      task: {},
      members: [],
    },
  ],
}

export default (state = initialState, action) =>
  produce(state, draft => {
    switch (action.type) {
      case 'TASK':
        return action.payload

      case 'UPDATE_TASK':
        if (action.payload.taskId != state.id) return
        draft = Object.assign(draft, action.payload)
        break
    }
  })
