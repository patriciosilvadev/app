import MessagingService from '../services/messaging.service'
import GraphqlService from '../services/graphql.service'
import DatabaseService from '../services/database.service'
import { browserHistory } from '../services/browser-history.service'
import moment from 'moment'
import EventService from '../services/event.service'
import { updateLoading, updateError } from './'

export function updateTask(taskId, updatedTask) {
  return {
    type: 'UPDATE_TASK',
    payload: { ...updatedTask, taskId },
    sync: taskId,
  }
}

export function deleteTask(taskId, sync) {
  return {
    type: 'DELETE_TASK',
    payload: { taskId },
    sync: sync ? taskId : null,
  }
}

export function hydrateTask(task) {
  return {
    type: 'TASK',
    payload: task,
  }
}
