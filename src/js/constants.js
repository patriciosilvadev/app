export const API_HOST = process.env.ENVIRONMENT == 'dev' ? process.env.API_HOST : process.env.API_HOST_PROD
export const SOCKETIO_HOST = process.env.ENVIRONMENT == 'dev' ? process.env.SOCKETIO_HOST : process.env.SOCKETIO_HOST_PROD
export const LOCAL_DB = process.env.LOCAL_DB
