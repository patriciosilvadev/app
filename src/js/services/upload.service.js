import { API_HOST, JWT } from '../environment'
import CookiesService from './cookies.service'

export default class UploadService {
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
