import MessagingService from '../services/messaging.service'
import GraphqlService from '../services/graphql.service'
import DatabaseService from '../services/database.service'
import { browserHistory } from '../services/browser-history.service'
import moment from 'moment'
import EventService from '../services/event.service'
import CookiesService from '../services/cookies.service'
import { showLocalPushNotification, logger } from '../helpers/util'
import { closeAppModal, closeAppPanel, openApp, createTeam, leaveTeam, createChannel, deleteChannel, updateChannelDeleteTyping, addPresence, deletePresence } from './'

export function initialize(userId) {
  return async (dispatch, getState) => {
    EventService.getInstance().on('DISPATCH_APP_ACTION', data => {
      console.log('DISPATCH_APP_ACTION → ', data)

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
    });

    // Join our single channel for us
    MessagingService.getInstance().join(userId)

    // Handle incoming messages
    MessagingService.getInstance().client.on('system', system =>  logger('SYSTEM: ', system))
    MessagingService.getInstance().client.on('joinChannel', async ({ channelId }) => {
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
    })
    MessagingService.getInstance().client.on('leaveChannel', ({ channelId }) => {
      // Unsub from this SOCKET
      MessagingService.getInstance().leave(channelId)

      // And then remove it - but just for us
      dispatch(deleteChannel(channelId, false))
    })
    MessagingService.getInstance().client.on('leaveChannelTeam', ({ channelId }) => {
      const userId = getState().user.id
      const channel = getState()
        .channels.filter(r => r.id == channelId)
        .flatten()

      // If they don't have this channel
      if (!channel) return

      // Check if they are a member
      const { members } = channel

      // Check if this user is a member
      const isMember = members.filter(m => m.user.id == userId).flatten()

      // If they are a member, then they have a right to be a here
      // Don't make them leave
      if (isMember) return

      // Unsub from this SOCKET
      MessagingService.getInstance().leave(channelId)

      // And then remove it - just for us
      dispatch(deleteChannel(channelId, false))
    })
    MessagingService.getInstance().client.on('joinTeam', async ({ teamId }) => {
      // If this user is already in this team, then don't do anything
      if (
        !!getState()
          .teams.filter(t => t.id == teamId)
          .flatten()
      )
        return

      const team = await GraphqlService.getInstance().team(teamId)
      if (!team.data.team) return
      MessagingService.getInstance().join(teamId)
      dispatch(createTeam(team.data.team))
    })
    MessagingService.getInstance().client.on('leaveTeam', ({ teamId }) => {
      MessagingService.getInstance().leave(teamId)
      dispatch(deleteTeam(teamId, false))
    })
    MessagingService.getInstance().client.on('sync', ({ action }) => {
      // Check whether this person is in our channels list first
      if (action.type == 'ADD_PRESENCE') {
        const existingChannel = getState().channels.reduce((exists, channel) => {
          if (channel.public) return false

          const { members } = channel
          const existingMember = members.filter(member => member.user.id == action.payload.userId).flatten()

          if (existingMember) return true
        }, false)

        if (!existingChannel) return
      }

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
    })

    // Tell our current team about our status
    setInterval(() => {
      const { team, user } = getState()
      const teamId = team.id
      const userId = user.id

      dispatch(addPresence(teamId, userId))
    }, 5000)

    // Clean our presence array every 5 seconds
    setInterval(() => {
      const { presences } = getState()
      const snapshot = new Date().getTime()

      // Remove after 30 seconds
      presences.users.map(p => {
        if (snapshot - p.userTime > 30000) {
          dispatch(deletePresence(p.userId))
        }
      })
    }, 5000)

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
    // DatabaseService.getInstance().unread('5db7e3d88476242154d43183', '5db87f04db059a6d8dc8d068')
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

export function updateUnread(payload) {
  return {
    type: 'UPDATE_UNREAD',
    payload: payload,
  }
}
