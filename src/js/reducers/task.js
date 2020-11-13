import produce from 'immer'
import { v4 as uuidv4 } from 'uuid'

const initialState = {
  id: null,
  tasks: [],
  files: [],
  messages: [],
  description: '',
  title: '',
  done: false,
  order: 0,
}

export default (state = initialState, action) =>
  produce(state, draft => {
    switch (action.type) {
      case 'TASK':
        return action.payload

      case 'UPDATE_TASK':
        if (action.payload.taskId != state.id) return

        // Copy any updates here
        return {
          ...state,
          ...action.payload,
        }
    }
  })
