export function bytesToSize(bytes) {
  var sizes = ['bytes', 'kb', 'mb', 'gb', 'tb'];
  if (bytes == 0) return '0 Byte';
  var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
  return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
}

export const askPushNotificationPermission = () => {
  return new Promise(function(resolve, reject) {
    const permissionResult = Notification.requestPermission(function(result) {
      resolve(result);
    });

    if (permissionResult) {
      permissionResult.then(resolve, reject);
    }
  })
  .then(function(permissionResult) {
    console.log(permissionResult)
    if (permissionResult !== 'granted') {
      throw new Error('We weren\'t granted permission.');
    }
  });
}

export const urlBase64ToUint8Array = base64String => {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const showLocalPushNotification = (title, body) => {
  navigator.serviceWorker.ready.then(register => {
    const serviceWorkerRegistration = register
    
    if (serviceWorkerRegistration) {
      serviceWorkerRegistration.showNotification(title, {
        body,
        icon: '/images/favicon.png',
        image: '/images/logo.png',
      })
    }
  })
}
