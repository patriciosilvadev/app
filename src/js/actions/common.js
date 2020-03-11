import MessagingService from '../services/messaging.service'
import GraphqlService from '../services/graphql.service'
import DatabaseService from '../services/database.service'
import { browserHistory } from '../services/browser-history.service'
import moment from 'moment'
import EventService from '../services/event.service'
import CookiesService from '../services/cookies.service'
import { showLocalPushNotification, logger } from '../helpers/util'
import { closeAppModal, closeAppPanel, openApp, createTeam, deleteTeam, createChannel, deleteChannel, updateChannelDeleteTyping, addPresence, deletePresence } from './'
import mqtt from 'mqtt'

export function initialize(userId) {
  return async (dispatch, getState) => {
    let cache

    const presenceAdd = () => {
      const { team, user } = getState()
      const teamId = team.id
      const userId = user.id

      dispatch(addPresence(teamId, userId))
    }

    const presenceDelete = () => {
      const { presences } = getState()
      const snapshot = new Date().getTime()

      // Remove after 30 seconds
      presences.users.map(p => {
        if (snapshot - p.userTime > 30000) {
          dispatch(deletePresence(p.userId))
        }
      })
    }

    const isTypingCleanup = () => {
      const { channel } = getState()
      const channelId = channel.id
      const snapshot = new Date().getTime()

      // Remove after 1 second
      channel.typing.map(t => {
        if (snapshot - t.userTime > 1000) {
          dispatch(updateChannelDeleteTyping(channelId, t.userId))
        }
      })
    }

    // Tell our current team about our status
    setInterval(presenceAdd, 5000)

    // Clean our presence array every 5 seconds
    setInterval(presenceDelete, 5000)

    // Check if the typing array is valid every 1 second
    // Iterage over the current channel's typing array
    // If it's too old - then remove it and notify everyone else
    setInterval(isTypingCleanup, 2500)

    // NOT just a Redux action - but an app action
    // Same name, but these actions are data objects that apps create
    // They are dispatched from buttons clicks, etc
    EventService.getInstance().on('DISPATCH_APP_ACTION', data => {
      logger('DISPATCH_APP_ACTION → ', data)

      // These are APP ACTIONS
      // Not Redux actions
      switch (data.action.type) {
        case 'modal':
          dispatch(openApp(data.action))
          break
        case 'panel':
          dispatch(openApp(data.action))
          break
        case 'modal-panel':
          dispatch(closeAppPanel())
          break
        case 'modal-close':
          dispatch(closeAppModal())
          break
      }
    })

    // Set up MQTT
    MessagingService.getInstance().client.on('disconnect', e => dispatch(updateConnected(false)))
    MessagingService.getInstance().client.on('close', e => dispatch(updateConnected(false)))
    MessagingService.getInstance().client.on('connect', () => {
      logger('Connected to broker')

      // Tell everyone we're live
      dispatch(updateConnected(true))

      // Subscribe to the base topic
      MessagingService.getInstance().join(userId)
    })

    // Now subs
    MessagingService.getInstance().client.on('message', async (topic, data) => {
      // Get a string version of the data
      const payload = data.toString()

      // Save it to our cache
      // So we can avoid double deliveries
      // TODO: This might cause double deliveries
      // if (cache == payload) return
      // if (cache != payload) cache = payload

      // This looks like the payload dispatched to the store
      // It's straight from Redux
      const message = JSON.parse(payload)

      // If this is null, then do nothing
      // Every message has this format / structure
      // So bounce a message that doesn't
      if (!message.messageType || !message.messagePayload) return

      // Debug
      // logger('Received from MQTT broker: ')
      // logger(topic)
      // logger(message)
      // Keeping them as fallback
      // const messageSync = async () => {}
      // const messageJoinChannel = async () => {}
      // const messageLeaveChannelTeam = async () => {}
      // const messageJoinTeam = async () => {}
      // const messageLeaveChannel = async () => {}
      // const messageLeaveTeam = async () => {}

      // Only process the message we didn't send
      // if (action.sender == _id) return;
      // These message are sent from the API
      // We need to process these specifically
      switch (message.messageType) {
        case 'SYNC':
          {
            // Just use the Redux acttion
            const action = message.messagePayload

            // Update our store with the synced action
            dispatch(action)

            // Handle any reads/unreads here for the DB
            // And also handle push notices
            if (action.type == 'CREATE_CHANNEL_MESSAGE') {
              const { channelId, teamId, message } = action.payload
              const isStarred = getState().user.starred.indexOf(channelId) != -1
              const isArchived = getState().user.archived.indexOf(channelId) != -1
              const isCurrentChannel = channelId == getState().channel.id

              // Don't do a PN or unread increment if we are on the same channel
              // as the message
              if (isArchived || isStarred || isCurrentChannel) return

              // Trigger a push notification
              showLocalPushNotification('New Message', message.message)

              // Create an unread marker
              // Channel will be null, which is good
              DatabaseService.getInstance().unread(teamId, channelId)
            }
          }
          break

        case 'JOIN_CHANNEL':
          {
            // Just use the Redux acttion
            const channelId = message.messagePayload

            // If this user is already in this channel, then don't do anything
            if (
              getState()
                .channels.filter(r => r.id == channelId)
                .flatten()
            )
              return

            // Get the channel data
            const channel = await GraphqlService.getInstance().channel(channelId)

            // If there is an error
            if (!channel.data.channel) return

            // Joing the channel SOCKET
            MessagingService.getInstance().join(channelId)

            // Create the channel in the store
            // They may or may not be a member of it (irrelevant if it's public)
            dispatch(createChannel(channel.data.channel))
          }
          break

        case 'JOIN_TEAM':
          {
            // Just use the Redux acttion
            const teamId = message.messagePayload

            // If this user is already in this team, then don't do anything
            if (
              !!getState()
                .teams.filter(t => t.id == teamId)
                .flatten()
            )
              return

            // Otherwise get the team & update the store
            const team = await GraphqlService.getInstance().team(teamId)

            // If it fails - do it silenetly
            if (!team.data.team) return

            // Add it the UI
            dispatch(createTeam(team.data.team))

            // Join the team via MQTT
            MessagingService.getInstance().join(teamId)
          }
          break

        case 'LEAVE_CHANNEL':
          {
            // Just use the Redux acttion
            const channelId = message.messagePayload

            // Unsub from this SOCKET
            MessagingService.getInstance().leave(channelId)

            // And then remove it - but just for us
            dispatch(deleteChannel(channelId, false))
          }
          break

        case 'LEAVE_TEAM':
          {
            const teamId = message.messagePayload
            MessagingService.getInstance().leave(teamId)
            dispatch(deleteTeam(teamId, false))
          }
          break

        case 'JOIN_PUBLIC_CHANNEL':
          {
            // Just use the Redux acttion
            const channelId = message.messagePayload

            // If this user is already in this channel, then don't do anything
            if (
              getState()
                .channels.filter(r => r.id == channelId)
                .flatten()
            )
              return

            // Get the channel data
            const channel = await GraphqlService.getInstance().channel(channelId)

            // If there is an error
            if (!channel.data.channel) return

            // Joing the channel SOCKET
            MessagingService.getInstance().join(channelId)

            // Create the channel in the store
            // They may or may not be a member of it (irrelevant if it's public)
            dispatch(createChannel(channel.data.channel))
          }
          break

        case 'LEAVE_CHANNEL_IF_NOT_MEMBER':
          {
            // Just use the Redux acttion
            const channelId = message.messagePayload
            const userId = getState().user.id
            const isChannelMember = await GraphqlService.getInstance().isChannelMember(channelId, userId)

            // Check if this user is a channel member
            // If not, then we leave/delete the channel
            if (!isChannelMember.data.isChannelMember) {
              MessagingService.getInstance().leave(channelId)

              // And then remove it - just for us
              dispatch(deleteChannel(channelId, false))
            }
          }
          break
      }
    })

    // Get unread count
    DatabaseService.getInstance()
      .database.allDocs({ include_docs: true })
      .then(({ rows }) => {
        dispatch(updateUnread(rows))
      })
      .catch(err => {
        dispatch(updateError('allDocs DB error'))
      })

    // If anything changes
    // Update the channels list
    DatabaseService.getInstance()
      .database.changes({
        live: true,
        since: 'now',
      })
      .on('change', docs => {
        DatabaseService.getInstance()
          .database.allDocs({ include_docs: true })
          .then(({ rows }) => {
            dispatch(updateUnread(rows))
          })
          .catch(err => {
            dispatch(updateError('allDocs DB error'))
          })
      })
      .on('error', err => {
        dispatch(updateError('allDocs DB error'))
      })

    // TODO: Debug
    DatabaseService.getInstance().unread('5e4bb079b2fae98633ae2ae7', '5e4cbef284358b2201fccf82')
  }
}

export function updateLoading(payload) {
  return {
    type: 'UPDATE_LOADING',
    payload: !!payload,
  }
}

export function updateError(payload) {
  if (payload) console.error(payload)

  return {
    type: 'UPDATE_ERROR',
    payload: payload,
  }
}

export function updateConnected(payload) {
  return {
    type: 'UPDATE_CONNECTED',
    payload: payload,
  }
}

export function updateUnread(payload) {
  return {
    type: 'UPDATE_UNREAD',
    payload: payload,
  }
}
