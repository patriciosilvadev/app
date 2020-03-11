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

  /**
   * This applies to the server too (see sendMessageToMqttTopic & mqtt.helper.js)
   * Redux (store) action creators gets sent as 'messagePayload':
   * This would look like: messagePayload: { type: 'COOL', payload: 'Dude' }
   * messageType & messagePayload are not Redux type & payload
   * messageType & messagePayload are used for things other than Redux
   */
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
            logger('Error: ', err)
          }
        }
      )
    }
  }

  joins(topics) {
    if (this.client) {
      topics.map(topic => {
        logger('Subscribing to', topic)

        this.client.subscribe(
          topic,
          {
            qos: 2,
          },
          err => {
            if (err) {
              logger('Error: ', err)
            }
          }
        )
      })
    }
  }

  join(topic) {
    if (this.client) {
      logger('Subscribing to', topic)

      this.client.subscribe(
        topic,
        {
          qos: 2,
        },
        err => {
          if (err) {
            logger('Error: ', err)
          }
        }
      )
    }
  }

  leave(topic) {
    if (this.client) this.client.unsubscribe(topic)
  }

  sync(topic, action) {
    this.sendMessageToTopic(topic, 'SYNC', action)
  }

  // This tell everyone to join this channel if they haven't already
  // Only for public groups - because everyone has access to them
  joinPublicChannel(teamId, channelId) {
    this.sendMessageToTopic(teamId, 'JOIN_PUBLIC_CHANNEL', channelId)
  }

  // This tells users to leave channels they are not a member of
  // This is handled in common.js
  leaveChannelIfNotMember(teamId, channelId) {
    this.sendMessageToTopic(teamId, 'LEAVE_CHANNEL_IF_NOT_MEMBER', channelId)
  }
}
