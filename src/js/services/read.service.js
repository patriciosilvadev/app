import GraphqlService from './graphql.service'
import CookieService from './storage.service'
import AuthService from './auth.service'
import { API_HOST, PUBLIC_VAPID_KEY, PN } from '../environment'
import { urlBase64ToUint8Array } from '../helpers/util'

export const addMessageRead = async (messageId, userId) => {
  return await fetch(`${API_HOST}/read/${messageId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userId }),
  })
}

export const updateMessageAsRead = async messageId => {
  return await fetch(`${API_HOST}/read/${messageId}/read`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  })
}
