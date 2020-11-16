import MessagingService from '../services/messaging.service'
import GraphqlService from '../services/graphql.service'
import DatabaseService from '../services/database.service'
import { browserHistory } from '../services/browser-history.service'
import moment from 'moment'
import EventService from '../services/event.service'
import { updateLoading, updateError } from './'

export function hydrateTasks(tasks) {
  return {
    type: 'TASKS',
    payload: tasks,
  }
}

export function createTasks(channelId, task) {
  return {
    type: 'CREATE_TASKS',
    payload: {
      channelId,
      task,
    },
    sync: channelId,
  }
}

export function updateTasks(channelId, task) {
  return {
    type: 'UPDATE_TASKS',
    payload: {
      channelId,
      task,
    },
    sync: channelId,
  }
}

export function deleteTasks(channelId, taskId) {
  return {
    type: 'DELETE_TASKS',
    payload: {
      channelId,
      taskId,
    },
    sync: channelId,
  }
}
