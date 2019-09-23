import CookiesService from './cookies.service'
import { AUTH_HOST } from '../environment'

export default class AuthService {
  static parseJwt(token) {
    var base64Url = token.split('.')[1]
    var base64 = base64Url.replace('-', '+').replace('_', '/')

    return JSON.parse(window.atob(base64))
  }

  static currentAuthenticatedUser() {
    return new Promise((resolve, reject) => {
      const jwt = CookiesService.getCookie('jwt')

      // Now parse the JWT
      if (jwt) {
        const { exp, sub } = this.parseJwt(jwt)

        if (exp > Date.now() / 1000) {
          resolve({
            token: jwt,
          })
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

  static confirm(token) {
    return fetch(AUTH_HOST + '/confirm', {
      method: 'POST',
      mode: 'cors',
      cache: 'no-cache',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
      },
      redirect: 'follow',
      referrer: 'no-referrer',
      body: JSON.stringify({ token }),
    })
  }

  static update(email, password, code) {
    return fetch(AUTH_HOST + '/password/update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        code,
        password,
      }),
    })
  }

  static reset(email) {
    return fetch(AUTH_HOST + '/password/reset', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    })
  }

  static signup(email, username, password) {
    return fetch(AUTH_HOST + '/signup', {
      method: 'POST',
      mode: 'cors',
      cache: 'no-cache',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
      },
      redirect: 'follow',
      referrer: 'no-referrer',
      body: JSON.stringify({
        email,
        username,
        password,
      }),
    })
  }

  static signin(username, password) {
    return fetch(AUTH_HOST + '/signin', {
      method: 'POST',
      mode: 'cors',
      cache: 'no-cache',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
      },
      redirect: 'follow',
      referrer: 'no-referrer',
      body: JSON.stringify({
        username,
        password,
      }),
    })
  }
}
