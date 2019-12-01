import { API_HOST, JWT } from '../environment'

export default class UploadService {
  constructor(file, channelId = null, messageId = null) {
    const form = new FormData()
    const token = CookiesService.getCookie(JWT)

    // Add our file
    form.append('file', file)
    form.append('channelId', channelId)
    form.append('messageId', messageId)

    // Make the request & return it
    return fetch(API_HOST + '/upload', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + token,
      },
      body: form,
    })
  }

  static getUploadUrl(filename, mime) {
    const token = CookiesService.getCookie(JWT)

    return fetch(`${API_HOST}/upload/url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token,
      },
      body: JSON.stringify({ filename, mime }),
    })
  }

  static uploadFile(url, file, mime) {
    return fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': mime,
      },
      body: file,
    })
  }
}
