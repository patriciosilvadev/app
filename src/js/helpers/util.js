import { Emoji } from 'emoji-mart'
import marked from 'marked'
import ReactDOMServer from 'react-dom/server'
import React from 'react'
import EventService from '../services/event.service'

export const bytesToSize = bytes => {
  var sizes = ['bytes', 'kb', 'mb', 'gb', 'tb']
  if (bytes == 0) return '0 Byte'
  var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)))
  return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i]
}

export const urlParser = url => {
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

export const askPushNotificationPermission = () => {
  return new Promise((resolve, reject) => {
    const permissionResult = Notification.requestPermission(result => {
      resolve(result)
    })

    if (permissionResult) {
      permissionResult.then(resolve, reject)
    }
  }).then(function(permissionResult) {
    if (permissionResult !== 'granted') {
      throw new Error("We weren't granted permission.")
    }
  })
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
        icon: 'https://yack-app.s3-us-west-2.amazonaws.com/favicon.png',
        image: 'https://yack-app.s3-us-west-2.amazonaws.com/favicon.png',
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

export const logger = (log, additional) => {
  if (additional) {
    console.log(log, additional)
  } else {
    console.log(log)
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
