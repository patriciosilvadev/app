import MessagingService from '../services/messaging.service'
import GraphqlService from '../services/graphql.service'
import DatabaseService from '../services/database.service'
import { browserHistory } from '../services/browser-history.service'
import moment from 'moment'
import EventService from '../services/event.service'
import { updateLoading, updateError } from './'

export function updateTask(taskId, updatedTask, channelId) {
  return {
    type: 'UPDATE_TASK',
    payload: { ...updatedTask, taskId },
    sync: channelId,
  }
}

export function hydrateTask(task) {
  return {
    type: 'TASK',
    payload: task,
  }
}

export function hydrateTaskMessages(messages) {
  return {
    type: 'TASK_MESSAGES',
    payload: { messages },
  }
}

export function updateTaskAddMessage(taskId, message, channelId) {
  return {
    type: 'UPDATE_TASK_ADD_MESSAGE',
    payload: { message, taskId },
    sync: channelId,
  }
}

export function updateTaskAddSubtask(taskId, task, channelId) {
  return {
    type: 'UPDATE_TASK_ADD_SUBTASK',
    payload: { task, taskId },
    sync: channelId,
  }
}

export function updateTaskDeleteSubtask(taskId, currentTaskId, channelId) {
  return {
    type: 'UPDATE_TASK_DELETE_SUBTASK',
    payload: { currentTaskId, taskId },
    sync: channelId,
  }
}

export function updateTaskUpdateSubtask(taskId, task, channelId) {
  return {
    type: 'UPDATE_TASK_UPDATE_SUBTASK',
    payload: { task, taskId },
    sync: channelId,
  }
}
