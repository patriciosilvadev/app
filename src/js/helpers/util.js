// prettier-ignore
export const bytesToSize = bytes => {
  var sizes = ['bytes', 'kb', 'mb', 'gb', 'tb']
  if (bytes == 0) return '0 Byte'
  var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)))
  return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i]
}

// prettier-ignore
export const imageUrlParser = url => {
  const match = url.match(/(http[s]?:\/\/.*\.(?:png|jpg|svg|jpeg|gif))/i)
  return match ? match[1] : false
}

// prettier-ignore
export const vimeoUrlParser = url => {
  const match = url.match(/(?:www\.|player\.)?vimeo.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|video\/|)(\d+)(?:[a-zA-Z0-9_\-]+)?/i)
  return match ? match[1] : false
}

// prettier-ignore
export const youtubeUrlParser = url => {
  const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#\&\?]*).*/
  const match = url.match(regExp)
  return (match && match[7].length == 11) ? match[7] : false
}

// prettier-ignore
export const askPushNotificationPermission = () => {
  return new Promise((resolve, reject) => {
    const permissionResult = Notification.requestPermission(result => {
      resolve(result)
    })

    if (permissionResult) {
      permissionResult.then(resolve, reject)
    }
  })
  .then(function(permissionResult) {
    if (permissionResult !== 'granted') {
      throw new Error('We weren\'t granted permission.')
    }
  })
}

// prettier-ignore
export const urlBase64ToUint8Array = base64String => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/')

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
        icon: 'https://weekday-app.s3-us-west-2.amazonaws.com/favicon.png',
        image: 'https://weekday-app.s3-us-west-2.amazonaws.com/favicon.png',
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

export const logger = (log) => {
  //console.log(`%c ≡ ${JSON.stringify(log)}`, 'color: #007AF5')
  console.log(log)
}

export const validEmail = (email) => {
    var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}
