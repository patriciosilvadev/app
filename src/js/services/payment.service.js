import GraphqlService from './graphql.service'
import CookieService from './storage.service'
import AuthService from './auth.service'
import { API_HOST, PUBLIC_VAPID_KEY, PN } from '../environment'
import { urlBase64ToUint8Array } from '../helpers/util'

export const getPaymentPortalUrl = async teamId => {
  return await fetch(`${API_HOST}/payment/customer_portal/${teamId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })
}
