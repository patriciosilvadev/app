import { SOCKETIO_HOST } from '../constants'

export default class MessagingService {
  static instance
  client

  constructor() {
    this.client = io.connect(SOCKETIO_HOST)

    this.client.on('connect', data => {
      console.log('WS:CONNECTED')
    })

    this.client.on('error', data => {
      console.log('WS:ERROR')
    })

    this.client.on('connect_failed', data => {
      console.log('WS:FAILED')
    })
  }

  static getInstance() {
    if (this.instance) return this.instance

    this.instance = new MessagingService()

    return this.instance
  }

  initialize(ids) {
    this.client.emit('initialize', { ids })
  }

  sync(sync, action) {
    this.client.emit('sync', { sync, action })
  }

  join(roomId) {
    this.client.emit('join', { roomId })
  }

  leave(roomId) {
    this.client.emit('leave', { roomId })
  }

  joinRoom(userIds, roomId) {
    this.client.emit('joinRoom', { userIds, roomId })
  }

  joinTeam(userIds, teamId) {
    this.client.emit('joinTeam', { userIds, teamId })
  }

  leaveRoom(userIds, roomId) {
    this.client.emit('leaveRoom', { userIds, roomId })
  }

  leaveTeam(userIds, teamId) {
    this.client.emit('leaveTeam', { userIds, teamId })
  }
}
