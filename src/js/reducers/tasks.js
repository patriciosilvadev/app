import produce from 'immer'

const initialState = []

export default (state = initialState, action) =>
  produce(state, draft => {
    switch (action.type) {
      case 'TASKS':
        return action.payload

      case 'UPDATE_TASKS':
        return state.map(task => {
          if (task.id != action.payload.task.id) return task

          return {
            ...task,
            ...action.payload.task,
          }
        })

      case 'DELETE_TASKS':
        return state.filter(task => task.id != action.payload.taskId)

      case 'CREATE_TASKS':
        draft.push(action.payload.task)
        break

      // These are from the task reducer
      // But we use them here to adjust the subtaskCount
      case 'UPDATE_TASK_ADD_SUBTASK':
        return state.map(task => {
          if (task.id != action.payload.taskId) return task

          return {
            ...task,
            subtaskCount: Number(task.subtaskCount) + 1,
          }
        })

      case 'UPDATE_TASK_DELETE_SUBTASK':
        return state.map(task => {
          if (task.id != action.payload.currentTaskId) return task

          return {
            ...task,
            subtaskCount: Number(task.subtaskCount) - 1,
          }
        })
    }
  })
