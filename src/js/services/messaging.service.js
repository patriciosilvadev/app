import { MQTT_HOST, JWT } from '../environment'
import { logger } from '../helpers/util'
import CookiesService from './cookies.service'
import mqtt from 'mqtt'
import AuthService from './auth.service'

export default class MessagingService {
  static instance
  client

  constructor() {
    const token = CookiesService.getCookie(JWT)
    const { userId } = AuthService.parseJwt(token)

    this.client = mqtt.connect(MQTT_HOST, {
      clean: false,
      queueQoSZero: true,
      useSSL: false,
      clientId: userId + '-web',
      will: {
        topic: 'death',
        payload: userId,
      },
    })
  }

  static getInstance() {
    if (this.instance) return this.instance

    this.instance = new MessagingService()

    return this.instance
  }

  sendMessageToTopic(topic, messageType, messagePayload) {
    if (this.client) {
      this.client.publish(
        topic,
        JSON.stringify({
          messageType,
          messagePayload,
        }),
        {
          qos: 2,
        },
        err => {
          if (err) {
            console.log('Error: ', err)
          }
        }
      )
    }
  }

  joins(topics) {
    if (this.client) {
      topics.map(topic => {
        console.log('Subscribing to', topic)

        this.client.subscribe(
          topic,
          {
            qos: 2,
          },
          err => {
            if (err) {
              console.log('Error: ', err)
            }
          }
        )
      })
    }
  }

  join(topic) {
    if (this.client) {
      console.log('Subscribing to', topic)

      this.client.subscribe(
        topic,
        {
          qos: 2,
        },
        err => {
          if (err) {
            console.log('Error: ', err)
          }
        }
      )
    }
  }

  leave(topic) {
    if (this.client) this.client.unsubscribe(topic)
  }

  // These are messages sent to users
  // for them to do specific things
  // Sync gets used by middleware to tell everyone else to update their state
  sync(topic, action) {
    this.sendMessageToTopic(topic, 'SYNC', action)
  }

  joinChannel(userIds, channelId) {
    userIds.map(userId => this.sendMessageToTopic(userId, 'JOIN_CHANNEL', channelId))
  }

  leaveChannelTeam(teamId, channelId) {
    this.sendMessageToTopic(teamId, 'LEAVE_CHANNEL_TEAM', channelId)
  }

  joinTeam(userIds, teamId) {
    userIds.map(userId => this.sendMessageToTopic(userId, 'JOIN_TEAM', teamId))
  }

  leaveChannel(userIds, channelId) {
    userIds.map(userId => this.sendMessageToTopic(userId, 'LEAVE_CHANNEL', channelId))
  }

  leaveTeam(userIds, teamId) {
    userIds.map(userId => this.sendMessageToTopic(userId, 'LEAVE_TEAM', teamId))
  }

  // This is the only one that is not handled in initialise() as it's the same
  // Action as JOIN_CHANNEL (hence the messageType)
  joinChannelTeam(teamId, channelId) {
    this.sendMessageToTopic(teamId, 'JOIN_CHANNEL', channelId)
  }
}
