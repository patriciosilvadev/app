import GraphqlService from './graphql.service'
import CookieService from './cookies.service'
import AuthService from './auth.service'
import { API_HOST, PUBLIC_VAPID_KEY, PN } from '../environment'
import { urlBase64ToUint8Array } from '../helpers/util'

export const updateUserPresence = async userId => {
  return await fetch(`${API_HOST}/presence/${userId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ update: true }),
  })
}

export const getUserPresence = async userId => {
  // Return is: { lastseen }
  return await fetch(`${API_HOST}/presence/${userId}`)
}
