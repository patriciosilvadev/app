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

  static confirm(email, token) {
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
      body: JSON.stringify({email, token}),
    })
  }

  static updatePassword(userId, currentPassword, newPassword) {
    return fetch(AUTH_HOST + '/password/update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        currentPassword,
        newPassword,
      }),
    })
  }

  static confirmEmail(email, userId) {
    return fetch(AUTH_HOST + '/email/confirm', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, userId }),
    })
  }

  static deleteEmail(email, userId) {
    return fetch(AUTH_HOST + '/email/delete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, userId }),
    })
  }

  static addEmail(email, userId) {
    return fetch(AUTH_HOST + '/email/add', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, userId }),
    })
  }

  static resetPassword(email) {
    return fetch(AUTH_HOST + '/password/reset', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    })
  }

  static updatePasswordReset(email, password, code) {
    return fetch(AUTH_HOST + '/password/reset/update', {
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

  static accountDelete(userId) {
    return fetch(AUTH_HOST + '/account/delete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId }),
    })
  }
}
