export const UPLOAD_HOST = process.env.ENVIRONMENT == 'dev' ? process.env.UPLOAD_HOST : process.env.UPLOAD_HOST_PROD
export const AUTH_HOST = process.env.ENVIRONMENT == 'dev' ? process.env.AUTH_HOST : process.env.AUTH_HOST_PROD
export const API_HOST = process.env.ENVIRONMENT == 'dev' ? process.env.API_HOST : process.env.API_HOST_PROD
export const SOCKETIO_HOST = process.env.ENVIRONMENT == 'dev' ? process.env.SOCKETIO_HOST : process.env.SOCKETIO_HOST_PROD
export const LOCAL_DB = process.env.LOCAL_DB
