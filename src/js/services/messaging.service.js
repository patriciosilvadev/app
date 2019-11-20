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

  joins(channelIds) {
    this.client.emit('joins', { channelIds })
  }

  join(channelId) {
    this.client.emit('join', { channelId })
  }

  leave(channelId) {
    this.client.emit('leave', { channelId })
  }

  joinChannel(userIds, channelId) {
    this.client.emit('joinChannel', { userIds, channelId })
  }

  leaveChannelTeam(teamId, channelId) {
    this.client.emit('leaveChannelTeam', { teamId, channelId })
  }

  joinChannelTeam(teamId, channelId) {
    this.client.emit('joinChannelTeam', { teamId, channelId })
  }

  joinTeam(userIds, teamId) {
    this.client.emit('joinTeam', { userIds, teamId })
  }

  leaveChannel(userIds, channelId) {
    this.client.emit('leaveChannel', { userIds, channelId })
  }

  leaveTeam(userIds, teamId) {
    this.client.emit('leaveTeam', { userIds, teamId })
  }
}
