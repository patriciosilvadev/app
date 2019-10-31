import * as Sentry from '@sentry/browser'

export const UPLOAD_HOST = 'https://api.weekday.sh/api/upload'
export const AUTH_HOST = 'https://api.weekday.sh/api/auth'
export const GRAPHQL_HOST = 'https://api.weekday.sh/graphql'
export const API_HOST = 'https://api.weekday.sh'
export const SOCKETIO_HOST = 'https://websocket.weekday.sh'
export const LOCAL_DB = 'weekday'
export const PUBLIC_VAPID_KEY = 'BK-o1CaPiLRUYWahx8VbyocJwrdmbdAYE3qPG17rZ6kjOWduL6-P6UFu5yxfH4fw4KhGzxmnbYAMeSAVU4zshkk'
export const NODE_ENV = 'production'
export const LINK_URL_PREFIX = 'https://app.weekday.sh'

// Set up Sentry
Sentry.init({ dsn: 'https://aab4b362715b436a9180426477e17e2b@sentry.io/1513390' })
