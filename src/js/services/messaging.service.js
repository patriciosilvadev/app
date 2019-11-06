import { SOCKETIO_HOST } from '../environment'
import { logger } from '../helpers/util'

export default class MessagingService {
  static instance
  client

  constructor() {
    this.client = io.connect(SOCKETIO_HOST)

    this.client.on('connect', data => {
      logger('WS:CONNECTED')
    })

    this.client.on('error', data => {
      logger('WS:ERROR')
    })

    this.client.on('connect_failed', data => {
      logger('WS:FAILED')
    })
  }

  static getInstance() {
    if (this.instance) return this.instance

    this.instance = new MessagingService()

    return this.instance
  }

  sync(sync, action) {
    this.client.emit('sync', { sync, action })
  }

  joins(roomIds) {
    this.client.emit('joins', { roomIds })
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

  leaveRoomTeam(teamId, roomId) {
    this.client.emit('leaveRoomTeam', { teamId, roomId })
  }

  joinRoomTeam(teamId, roomId) {
    this.client.emit('joinRoomTeam', { teamId, roomId })
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
