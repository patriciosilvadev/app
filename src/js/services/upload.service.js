import { UPLOAD_HOST } from '../environment'

export default class UploadService {
  constructor(file) {
    const form = new FormData()

    // Add our file
    form.append('file', file)

    // Make the request & return it
    return fetch(UPLOAD_HOST, {
      method: 'POST',
      body: form,
    })
  }
}
