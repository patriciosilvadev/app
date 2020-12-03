import { Emoji } from 'emoji-mart'
import marked from 'marked'
import ReactDOMServer from 'react-dom/server'
import React from 'react'
import EventService from '../services/event.service'
import { NODE_ENV } from '../environment'
import { SILENCE, WEEKDAY_DRAGGED_TASK_ID, PRESENCES, FUTURE_DATE_UNIX_TIME } from '../constants'
import * as moment from 'moment'

export const getHighestTaskOrder = tasks => {
  return tasks.reduce((acc, value) => (value.order > acc ? value.order : acc), tasks.length) + 100
}

export const getPreviousTaskOrder = (tasks, taskId) => {
  // If there are no siblings
  if (tasks.length == 0) return 0

  const lowestOrder = tasks.reduce((acc, task) => (acc.order < task.order ? acc : task), 0).order - 100
  const task = tasks.filter(task => task.id == taskId)[0]
  let taskIndex = 0
  let order = 0

  // Get the index of this task
  tasks.map((task, index) => {
    if (task.id == taskId) taskIndex = index
  })

  // Get the task after this
  const previousTaskIndex = taskIndex - 1
  const previousTask = tasks[previousTaskIndex]

  // if there is no next task (possibly dragged into the highest position)
  if (!previousTask) {
    order = lowestOrder
  } else {
    const minOrder = previousTask.order
    const maxOrder = task.order
    const difference = (maxOrder - minOrder) / 2

    logger('Found previous task: ', minOrder, maxOrder, difference)

    order = minOrder + difference
  }

  return order
}

export const getNextTaskOrder = (tasks, taskId) => {
  // If there are no siblings
  if (tasks.length == 0) return 1

  const highestOrder = getHighestTaskOrder(tasks) + 100
  const task = tasks.filter(task => task.id == taskId)[0]
  let taskIndex = 0
  let order = 0

  // Get the index of this task
  tasks.map((task, index) => {
    if (task.id == taskId) taskIndex = index
  })

  // Get the task after this
  const nextTaskIndex = taskIndex + 1
  const nextTask = tasks[nextTaskIndex]

  // if there is no next task (possibly dragged into the highest position)
  if (!nextTask) {
    order = highestOrder
  } else {
    const minOrder = task.order
    const maxOrder = nextTask.order
    const difference = (maxOrder - minOrder) / 2

    logger('Found next task: ', minOrder, maxOrder, difference)

    order = minOrder + difference
  }

  return order
}

export const sortTasksByOrder = tasks => {
  if (!tasks) return []

  return tasks.sort((a, b) => a.order - b.order)
}

export const sortTasksByDueDate = tasks => {
  if (!tasks) return []

  return tasks.sort((a, b) => {
    const dateA = moment(a.dueDate)
    const dateB = moment(b.dueDate)
    const timeA = dateA.isValid() ? dateA.toDate().getTime() : FUTURE_DATE_UNIX_TIME
    const timeB = dateB.isValid() ? dateB.toDate().getTime() : FUTURE_DATE_UNIX_TIME

    return timeA - timeB
  })
}

export const sortMessagesByCreatedAt = messages => {
  if (!messages) return []

  return messages.sort((left, right) => {
    return moment.utc(left.createdAt).diff(moment.utc(right.createdAt))
  })
}

export const findChildTasks = (taskId, tasks) => {
  return tasks
    .filter(task => task.parentId == taskId)
    .map(parentTask => {
      return {
        ...parentTask,
        children: sortTasksByOrder(findChildTasks(parentTask.id, tasks)),
      }
    })
}

export function getQueryStringValue(name) {
  name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]')
  var regex = new RegExp('[\\?&]' + name + '=([^&#]*)'),
    results = regex.exec(location.search)
  return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '))
}

export function isExtensionOpen() {
  const url = window.location.href
  const urlParts = url.split('/')
  const lastPart = urlParts[urlParts.length - 1].toUpperCase()
  return lastPart == 'MEET' || lastPart == 'TASKS' || lastPart == 'CALENDAR' || lastPart == 'BOARDS'
}

export const bytesToSize = bytes => {
  var sizes = ['bytes', 'kb', 'mb', 'gb', 'tb']
  if (bytes == 0) return '0 Byte'
  var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)))
  return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i]
}

export const urlParser = url => {
  if (!url) return false
  if (typeof url != 'string') return false

  const match = url.match(/(http[s]?:\/\/.*)/i)
  return match ? match[0].split(' ') : false
}

export const imageUrlParser = url => {
  const match = url.match(/(http[s]?:\/\/.*\.(?:png|jpg|svg|jpeg|gif))/i)
  return match ? match[1] : false
}

export const vimeoUrlParser = url => {
  const match = url.match(/(?:www\.|player\.)?vimeo.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|video\/|)(\d+)(?:[a-zA-Z0-9_\-]+)?/i)
  return match ? match[1] : false
}

export const youtubeUrlParser = url => {
  const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#\&\?]*).*/
  const match = url.match(regExp)
  return match && match[7].length == 11 ? match[7] : false
}

export const urlBase64ToUint8Array = base64String => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export const showLocalPushNotification = (title, body) => {
  navigator.serviceWorker.ready.then(register => {
    const serviceWorkerRegistration = register

    if (serviceWorkerRegistration) {
      serviceWorkerRegistration.showNotification(title, {
        body,
        icon: 'https://weekday-assets.s3-us-west-2.amazonaws.com/logo-transparent.png',
        image: 'https://weekday-assets.s3-us-west-2.amazonaws.com/logo-transparent.png',
      })
    }
  })
}

export const copyToClipboard = value => {
  const tempInput = document.createElement('input')
  tempInput.style = 'position: absolute; left: -1000px; top: -1000px;'
  tempInput.value = value
  document.body.appendChild(tempInput)
  tempInput.select()
  document.execCommand('copy')
  document.body.removeChild(tempInput)
}

export const logger = function() {
  if (NODE_ENV == 'development' && !window[SILENCE]) {
    for (let argument of arguments) {
      console.log(argument)
    }
  }
}

export const validEmail = email => {
  var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
  return re.test(String(email).toLowerCase())
}

export const decimalToMinutes = minutes => {
  var sign = minutes < 0 ? '-' : ''
  var min = Math.floor(Math.abs(minutes))
  var sec = Math.floor((Math.abs(minutes) * 60) % 60)
  return sign + (min < 10 ? '0' : '') + min + ':' + (sec < 10 ? '0' : '') + sec
}

export const highlightMessage = (message, query) => {
  var reg = new RegExp(query, 'gi')
  return message.replace(reg, str => {
    return `<strong>${str}<strong>`
  })
}

export const parseMessageMarkdown = (markdown, highlight) => {
  const htmlMessage = marked(markdown)
  const compiledMessage = highlight ? (highlight != '' ? highlightMessage(htmlMessage, highlight) : htmlMessage) : htmlMessage

  // What we do here is replace the emoji symbol with one from EmojiOne
  const regex = new RegExp('(:[a-zA-Z0-9-_+]+:(:skin-tone-[2-6]:)?)', 'g')
  const partsOfTheMessageText = []
  let matchArr
  let lastOffset = 0

  // Match all instances of the emoji
  while ((matchArr = regex.exec(compiledMessage)) !== null) {
    const previousText = compiledMessage.substring(lastOffset, matchArr.index)
    if (previousText.length) partsOfTheMessageText.push(previousText)

    lastOffset = matchArr.index + matchArr[0].length

    const emoji = ReactDOMServer.renderToStaticMarkup(
      <Emoji
        emoji={matchArr[0]}
        set="emojione"
        size={22}
        fallback={(em, props) => {
          return em ? `:${em.short_names[0]}:` : props.emoji
        }}
      />
    )

    if (emoji) {
      partsOfTheMessageText.push(emoji)
    } else {
      partsOfTheMessageText.push(matchArr[0])
    }
  }

  const finalPartOfTheText = compiledMessage.substring(lastOffset, compiledMessage.length)

  if (finalPartOfTheText.length) partsOfTheMessageText.push(finalPartOfTheText)

  // Finally set the message after processnig
  return partsOfTheMessageText.join('')
}

export const sendFocusComposeInputEvent = () => {
  EventService.getInstance().emit('FOCUS_COMPOSE_INPUT', null)
}

export const shortenMarkdownText = text => {
  const maxWords = 12
  const html = `<p>${marked(text)}</p>`
  const div = document.createElement('div')

  div.innerHTML = html

  const plainText = div.innerText
  const textArray = plainText.split(' ').filter((_, i) => i < maxWords)

  return `${textArray.join(' ')}...`
}

export const stripSpecialChars = text => {
  return text ? text.replace(/[`~!@#$%^&*()|+\= ?;:'",.<>\{\}\[\]\\\/]/gi, '') : ''
}

export const isElectron = () => {
  const userAgent = navigator.userAgent.toLowerCase()

  return userAgent.indexOf('electron/') > -1
}

export const validateEmail = email => {
  var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
  return re.test(String(email).toLowerCase())
}

export const getMentions = text => {
  const mentions = text
    .replace('/./g', ' ')
    .replace('/,/g', ' ')
    .split(' ')
    .filter(part => part[0] == '@')
  return mentions || []
}

export const classNames = object => {
  const classArray = []

  for (let property in object) {
    if (object[property]) classArray.push(property)
  }

  return classArray.join(' ')
}

export const isTaskHeading = title => {
  return title[title.length - 1] == ':'
}
