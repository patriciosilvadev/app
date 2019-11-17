import CookiesService from './cookies.service'
import { API_HOST } from '../environment'

export default class AuthService {
  static confirmEmail(email, userId) {
    return fetch(`${API_HOST}/account/${userId}/email/confirm`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    })
  }

  static addEmail(email, userId) {
    return fetch(`${API_HOST}/account/${userId}/email/add`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, userId }),
    })
  }

  static deleteEmail(email, userId) {
    return fetch(`${API_HOST}/account/${userId}/email/delete`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, userId }),
    })
  }

  static updatePassword(userId, currentPassword, newPassword) {
    return fetch(`${API_HOST}/account/${userId}/password/update`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        currentPassword,
        newPassword,
      }),
    })
  }

  static resetPassword(email) {
    return fetch(API_HOST + '/account/password/reset', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    })
  }

  static updatePasswordReset(email, password, code) {
    return fetch(API_HOST + '/account/password/reset/update', {
      method: 'PUT',
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
    return fetch(API_HOST + '/account/signup', {
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
    return fetch(API_HOST + '/account/signin', {
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
    return fetch(`${API_HOST}/account/${userId}/delete`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }

  static accountUpdate(userId, payload) {
    return fetch(`${API_HOST}/account/${userId}/update`, {
      method: 'PUT',
      mode: 'cors',
      cache: 'no-cache',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
      },
      redirect: 'follow',
      referrer: 'no-referrer',
      body: JSON.stringify(payload),
    })
  }
}
