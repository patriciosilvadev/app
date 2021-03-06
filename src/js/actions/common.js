import MessagingService from '../services/messaging.service'
import GraphqlService from '../services/graphql.service'
import DatabaseService from '../services/database.service'
import { browserHistory } from '../services/browser-history.service'
import moment from 'moment'
import EventService from '../services/event.service'
import StorageService from '../services/storage.service'
import {
  showLocalPushNotification,
  logger,
  shouldShowUnreadNotification,
} from '../helpers/util'
import { PRESENCES } from '../constants'
import {
  closeAppModal,
  closeAppPanel,
  openApp,
  createTeam,
  updateTeamMemberRole,
  updateTeam,
  deleteTeam,
  createChannel,
  deleteChannel,
  updateChannelDeleteTyping,
  addPresence,
  deletePresence,
  createChannelMessage,
  deleteChannelMessage,
  deleteChannelUnread,
  createMessageUnread,
  createChannelUnread,
} from './'
import mqtt from 'mqtt'
import { updateChannel } from './channel'

export function initialize(userId) {
  return async (dispatch, getState) => {
    let cache

    // Delete the channelUnread property from reveviing messages
    // IF the user is alreadyd on the channel / thread
    // See action.type == 'CREATE_CHANNEL_MESSAGE' below
    const deleteChannelUnreadWithApi = async (
      userId,
      channelId,
      parentId,
      threaded
    ) => {
      try {
        // parentId is null (so ignore this)
        // threaded is false
        await GraphqlService.getInstance().deleteChannelUnread(
          userId,
          channelId,
          parentId,
          threaded
        )

        // Add the new messages to the channel
        dispatch(deleteChannelUnread(channelId, parentId, threaded))
      } catch (e) {}
    }

    // Fires a PN popup
    const showNotification = message => {
      if (!message) return
      if (!message.body) return

      showLocalPushNotification(
        'New Message',
        message.body ? message.body : 'Read now'
      )
    }

    // Tell our current team about our status
    setInterval(() => {
      const { team, user } = getState()
      const teamId = team.id
      const userId = user.id
      const userPresence = user.presence || 'online'
      const presence = {
        u: userId,
        t: new Date().getTime(),
        p: userPresence,
      }

      // Sync this to the team
      // Window object will be updated from message router below
      MessagingService.getInstance().sync(teamId, {
        type: 'UPDATE_PRESENCE',
        payload: presence,
      })
    }, 15000)

    // Clean our presence array every 5 seconds
    setInterval(() => {
      if (!window) return
      if (!window[PRESENCES]) return

      const snapshot = new Date().getTime()
      const presences = window[PRESENCES]

      // Format of presences are timestamp:presenceText
      for (let p in presences) {
        const presence = presences[p]

        // CHECK!
        if (!presence) return

        const { t, p } = presence

        // CHECK
        if (!t || !p) return

        // Longer than 120s then we remove them
        if (snapshot - t > 120000) delete window[PRESENCES][p]
      }
    }, 120000)

    // Check if the typing array is valid every 1 second
    // Iterage over the current channel's typing array
    // If it's too old - then remove it and notify everyone else
    setInterval(() => {
      const { channel } = getState()
      const channelId = channel.id
      const snapshot = new Date().getTime()

      // Remove after 1 second
      channel.typing.map(t => {
        if (snapshot - t.userTime > 1000) {
          dispatch(updateChannelDeleteTyping(channelId, t.userId))
        }
      })
    }, 2500)

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
    MessagingService.getInstance().client.on('disconnect', e =>
      dispatch(updateConnected(false))
    )
    MessagingService.getInstance().client.on('close', e =>
      dispatch(updateConnected(false))
    )
    MessagingService.getInstance().client.on('connect', () => {
      logger('Connected to broker')

      // Tell everyone we're live
      dispatch(updateConnected(true))

      // Subscribe to the base topic
      MessagingService.getInstance().join(userId)
    })

    /**
     *
     *
     * ⚠️ THIS IS THE MESSAGE ROUTER
     *
     *
     */
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

      // Debug
      // logger(message)
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
      // We now process the ones we send
      switch (message.messageType) {
        case 'SYNC':
          {
            // Just use the Redux acttion
            const action = message.messagePayload

            // This is a special case sync where:
            // We do'nt want to dispathc this against the store
            // We want to simple update the window object with the presence
            if (action.type == 'UPDATE_PRESENCE') {
              if (!window) return
              if (!window[PRESENCES]) window[PRESENCES] = {}

              const presence = action.payload
              const userId = presence.u

              // Don't save the userId
              delete presence.u

              // Update the window
              // { p: 'online', t: timestamp }
              window[PRESENCES][userId] = presence
            } else {
              // Carry on with all other action types
              // Update our store with the synced action
              dispatch(action)

              // Handle any reads/channelUnreads here for the DB
              // And also handle push notices
              if (action.type == 'CREATE_CHANNEL_MESSAGE') {
                const { channelId, teamId, message } = action.payload
                const { body, threaded } = message

                // Check this first!
                if (!channelId || !teamId) return

                // Otheriwse carry on
                const isCurrentChannel = channelId == getState().channel.id
                const { id, username } = getState().user
                const userId = id
                const parentId = message.parent ? message.parent.id : null
                const messageId = message.id
                const channelNotifications = getState().channelNotifications
                const mention = body.indexOf(`@${username}`) != -1

                // If it's in the current channel
                // Then delete the appropriate UNREAD straight away
                // parentId (not null) && threaded (false) = reeply
                // parentId (not null) && threaded (true) = threaded reply
                // parentId (null) && threaded (false) = normal
                // SO NOT ALL MESSAGE UNREAD NOTICES WILL BE CLEARLY HERE
                if (isCurrentChannel) {
                  deleteChannelUnreadWithApi(
                    userId,
                    channelId,
                    parentId,
                    threaded
                  )
                } else {
                  // In channels.component the channel will decide to show the notice based on DnD
                  // This unread will also be createed on the backend - we just want to recreat it here
                  if (
                    shouldShowUnreadNotification(
                      channelNotifications,
                      channelId,
                      mention
                    )
                  ) {
                    // If we can disturb the user, then do so by showing a PN
                    if (!doNotDisturbUser(user)) showNotification(message)

                    // Create the unread - will also be created on the server
                    // So each time a user logs on they will receive it
                    dispatch(
                      createChannelUnread({
                        mention,
                        channelId,
                        parentId,
                        messageId,
                        threaded,
                      })
                    )
                  }
                }
              }
            }
          }
          break

        // From API
        case 'JOIN_CHANNEL':
          {
            // Just use the Redux acttion
            const channelId = message.messagePayload

            // If this user is already in this channel, then don't do anything
            if (
              getState()
                .channels.filter(channel => channel.id == channelId)
                .flatten()
            )
              return

            // Get the channel data
            const channel = await GraphqlService.getInstance().channel(
              channelId
            )

            // If there is an error
            if (!channel.data.channel) return

            // Joing the channel SOCKET
            MessagingService.getInstance().join(channelId)

            // Create the channel in the store
            // They may or may not be a member of it (irrelevant if it's public)
            dispatch(createChannel(channel.data.channel))
          }
          break

        // From API
        case 'JOIN_TEAM':
          {
            // Just use the Redux acttion
            const teamId = message.messagePayload

            // If this user is already in this team, then don't do anything
            if (
              !!getState()
                .teams.filter(team => team.id == teamId)
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

        // From API
        case 'LEAVE_CHANNEL':
          {
            // Just use the Redux acttion
            const channelId = message.messagePayload
            const currentChannelId = getState().channel.id
            const teamId = getState().team.id

            // Unsub from this topic
            MessagingService.getInstance().leave(channelId)

            // And then remove it - but just for us
            dispatch(deleteChannel(channelId, false))

            // Don't navigate them away - simply remove their ability to chat
            // browserHistory.push(`/app/team/${teamId}/`)
            if (channelId == currentChannelId)
              dispatch(updateChannel(channelId, { readonly: true }))
          }
          break

        // From API
        case 'LEAVE_TEAM':
          {
            const teamId = message.messagePayload
            const currentTeamId = getState().team.id

            // Unsub from this topic
            MessagingService.getInstance().leave(teamId)

            // Remove this in the side
            dispatch(deleteTeam(teamId, false))

            // Don't navigate them away - simply remove their ability to chat
            // browserHistory.push(`/app/`)
            if (teamId == currentTeamId) dispatch(updateTeamMemberRole(null))
          }
          break

        case 'JOIN_PUBLIC_CHANNEL':
          {
            // Just use the Redux acttion
            // The entire payload here will be the channelId
            const channelId = message.messagePayload

            // If this user already has this channel, then don't do anything
            if (
              !!getState()
                .channels.filter(channel => channel.id == channelId)
                .flatten()
            )
              return

            // Get the channel data
            const channel = await GraphqlService.getInstance().channel(
              channelId
            )

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
            const isChannelMember = await GraphqlService.getInstance().isChannelMember(
              channelId,
              userId
            )

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

export function updateToast(payload) {
  return {
    type: 'UPDATE_TOAST',
    payload: payload,
  }
}
