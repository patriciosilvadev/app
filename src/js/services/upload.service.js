export default class UploadService {
  constructor(file) {
    const form = new FormData()

    // Add our file
    form.append('file', file)

    // Make the request & return it
    return fetch('http://localhost:8181/api/upload', {
      method: 'POST',
      body: form,
    })
  }
}
