import CookiesService from './cookies.service'
import { API_HOST, JWT } from '../environment'

export default class AuthService {
  static parseJwt(token) {
    var base64Url = token.split('.')[1]
    var base64 = base64Url.replace('-', '+').replace('_', '/')

    return JSON.parse(window.atob(base64))
  }

  static currentAuthenticatedUser() {
    return new Promise((resolve, reject) => {
      const token = CookiesService.getCookie('jwt')

      // Now parse the JWT
      if (token) {
        const { exp, sub, userId } = this.parseJwt(token)

        if (exp > Date.now() / 1000) {
          resolve({ token, exp, sub, userId })
        } else {
          reject('Expired')
        }
      } else {
        reject('No user')
      }
    })
  }

  static signout() {
    CookiesService.deleteCookie('jwt')
  }

  static saveToken(token) {
    CookiesService.setCookie('jwt', token)
  }
}
