import { API_HOST } from '../environment'

export default class UploadService {
  constructor(file, roomId = null, messageId = null) {
    const form = new FormData()

    // Add our file
    form.append('file', file)
    form.append('roomId', roomId)
    form.append('messageId', messageId)

    // Make the request & return it
    return fetch(API_HOST + '/upload', {
      method: 'POST',
      body: form,
    })
  }
}
