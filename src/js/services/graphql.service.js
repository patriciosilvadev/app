import ApolloClient from 'apollo-client'
import { createHttpLink, HttpLink } from 'apollo-link-http'
import { ApolloLink, concat } from 'apollo-link'
import gql from 'graphql-tag'
import { InMemoryCache } from 'apollo-cache-inmemory'
import AuthService from './auth.service'
import StorageService from './storage.service'
import { API_HOST, JWT } from '../environment'
import { logger } from '../helpers/util'

export default class GraphqlService {
  static instance
  client

  constructor() {
    const defaultOptions = {
      watchQuery: {
        fetchPolicy: 'network-only',
        errorPolicy: 'ignore',
      },
      query: {
        fetchPolicy: 'network-only',
        errorPolicy: 'all',
      },
    }

    const token = StorageService.getStorage(JWT)
    const authMiddleware = new ApolloLink((operation, forward) => {
      operation.setContext({
        headers: {
          authorization: `Bearer ${token}`,
        },
      })

      return forward(operation)
    })

    this.client = new ApolloClient({
      cache: new InMemoryCache(),
      defaultOptions: defaultOptions,
      link: concat(
        authMiddleware,
        createHttpLink({
          fetch: fetch,
          uri: API_HOST + '/graphql',
          onError: ({ networkError, graphQLErrors }) => {
            logger('graphQLErrors', graphQLErrors)
            logger('networkError', networkError)
          },
        })
      ),
    })
  }

  static getInstance() {
    if (this.instance) return this.instance

    this.instance = new GraphqlService()

    return this.instance
  }

  static signout() {
    this.instance = null
  }

  /**
   * Queries
   */

  user(userId) {
    return this.client.query({
      query: gql`
        query user($userId: String!) {
          user(userId: $userId) {
            id
            emails {
              address
              confirmed
            }
            username
            timezone
            password
            name
            theme
            starred
            muted
            archived
            description
            status
            presence
            dnd
            dndUntil
            timezone
            image
            createdAt
            updatedAt
          }
        }
      `,
      variables: {
        userId,
      },
    })
  }

  users(userIds) {
    return this.client.query({
      query: gql`
        query users($userIds: String!) {
          users(userIds: $userIds) {
            id
            name
            image
          }
        }
      `,
      variables: {
        userIds,
      },
    })
  }

  teamSlug(slug) {
    return this.client.query({
      query: gql`
        query teamSlug($slug: String) {
          teamSlug(slug: $slug) {
            id
            name
            description
            image
          }
        }
      `,
      variables: {
        slug,
      },
    })
  }

  teamChannelsComponent(teamId, userId) {
    return this.client.query({
      query: gql`
        query team($teamId: String!, $userId: String) {
          team(teamId: $teamId, userId: $userId) {
            id
            name
            shortcode
            position(userId: $userId)
            slug
            image
            channels(userId: $userId) {
              id
              name
              image
              public
              color
              icon
              excerpt
              private
              readonly
              otherUser {
                id
                name
                username
                timezone
                image
                status
                presence
              }
            }
          }
        }
      `,
      variables: {
        teamId,
        userId,
      },
    })
  }

  team(teamId, userId) {
    return this.client.query({
      query: gql`
        query team($teamId: String!, $userId: String) {
          team(teamId: $teamId, userId: $userId) {
            id
            name
            shortcode
            slug
            totalMembers
            description
            image
            role(userId: $userId)
            position(userId: $userId)
            channels(userId: $userId) {
              id
              name
              description
              url
              image
              public
              color
              icon
              readonly
              excerpt
              private
              otherUser {
                id
                name
                username
                timezone
                image
                status
                presence
              }
              createdAt
              updatedAt
            }
          }
        }
      `,
      variables: {
        teamId,
        userId,
      },
    })
  }

  teamMembers(teamId, page) {
    return this.client.query({
      query: gql`
        query teamMembers($teamId: String!, $page: Float) {
          teamMembers(teamId: $teamId, page: $page) {
            id
            role
            position
            user {
              id
              name
              emails {
                address
                confirmed
              }
              username
              timezone
              image
            }
          }
        }
      `,
      variables: {
        teamId,
        page,
      },
    })
  }

  isTeamMember(teamId, userId) {
    return this.client.query({
      query: gql`
        query isTeamMember($teamId: String!, $userId: String!) {
          isTeamMember(teamId: $teamId, userId: $userId)
        }
      `,
      variables: {
        teamId,
        userId,
      },
    })
  }

  teams(userId) {
    return this.client.query({
      query: gql`
        query teams($userId: String!) {
          teams(userId: $userId) {
            id
            name
            description
            image
            role(userId: $userId)
          }
        }
      `,
      variables: {
        userId,
      },
    })
  }

  channelShortcode(shortcode) {
    return this.client.query({
      query: gql`
        query channelShortcode($shortcode: String) {
          channelShortcode(shortcode: $shortcode) {
            id
            name
            description
            image
          }
        }
      `,
      variables: {
        shortcode,
      },
    })
  }

  channel(channelId) {
    return this.client.query({
      query: gql`
        query channel($channelId: String!) {
          channel(channelId: $channelId) {
            id
            name
            url
            description
            image
            public
            private
            color
            icon
            readonly
            shortcode
            isMember
            totalMembers
            otherUser {
              id
              name
              username
              timezone
              image
              status
              presence
            }
            user {
              id
              name
              username
              timezone
              image
            }
            team {
              id
              name
              image
            }
            apps {
              active
              token
              app {
                id
                name
                slug
                description
                image
                token
                published
                outgoing
                commands {
                  name
                  description
                  action {
                    type
                    name
                    payload {
                      url
                      width
                      height
                    }
                  }
                }
                attachments {
                  icon
                  text
                  action {
                    type
                    name
                    payload {
                      url
                      width
                      height
                    }
                  }
                }
                tools {
                  icon
                  text
                  action {
                    type
                    name
                    payload {
                      url
                      width
                      height
                    }
                  }
                }
                shortcuts {
                  icon
                  text
                  action {
                    type
                    name
                    payload {
                      url
                      width
                      height
                    }
                  }
                }
                message {
                  url
                  width
                  height
                  buttons {
                    icon
                    text
                    action {
                      type
                      name
                      payload {
                        url
                        width
                        height
                      }
                    }
                  }
                }
              }
            }
            pinnedMessages {
              id
              reactions
              device
              read
              reads
              likes
              system
              parent {
                id
                channel {
                  name
                  id
                }
                user {
                  id
                  name
                  image
                  username
                  timezone
                }
                app {
                  resourceId
                  app {
                    id
                    name
                    image
                  }
                }
                body
                createdAt
              }
              user {
                id
                username
                timezone
                presence
                name
                image
              }
              body
              createdAt
              app {
                resourceId
                app {
                  id
                  name
                  slug
                  description
                  image
                }
              }
            }
            messages {
              id
              reactions
              device
              read
              reads
              pinned
              likes
              system
              forwardingOriginalTime
              forwardingUser {
                id
                name
                username
                timezone
                image
              }
              parent {
                id
                channel {
                  name
                  id
                }
                user {
                  id
                  name
                  image
                  username
                  timezone
                }
                app {
                  resourceId
                  app {
                    id
                    name
                    image
                  }
                }
                body
                createdAt
              }
              user {
                id
                username
                timezone
                presence
                name
                image
              }
              body
              attachments {
                _id
                id
                size
                uri
                preview
                mime
                name
                createdAt
              }
              createdAt
              app {
                resourceId
                app {
                  id
                  name
                  slug
                  description
                  image
                  token
                  published
                  outgoing
                  message {
                    url
                    width
                    height
                    buttons {
                      icon
                      text
                      action {
                        type
                        name
                        payload {
                          url
                          width
                          height
                        }
                      }
                    }
                  }
                }
              }
            }
            createdAt
            updatedAt
          }
        }
      `,
      variables: {
        channelId,
      },
    })
  }

  channelMembers(channelId, page) {
    return this.client.query({
      query: gql`
        query channelMembers($channelId: String!, $page: Float) {
          channelMembers(channelId: $channelId, page: $page) {
            id
            user {
              id
              name
              emails {
                address
                confirmed
              }
              username
              timezone
              image
            }
          }
        }
      `,
      variables: {
        channelId,
        page,
      },
    })
  }

  isChannelMember(channelId, userId) {
    return this.client.query({
      query: gql`
        query isChannelMember($channelId: String!, $userId: String!) {
          isChannelMember(channelId: $channelId, userId: $userId)
        }
      `,
      variables: {
        channelId,
        userId,
      },
    })
  }

  channels(teamId, userId) {
    return this.client.query({
      query: gql`
        query channels($teamId: String, $userId: String!) {
          channels(teamId: $teamId, userId: $userId) {
            id
            name
            description
            readonly
            url
            image
            public
            color
            icon
            excerpt
            private
            otherUser {
              id
              name
              username
              timezone
              image
              status
              presence
            }
            createdAt
            updatedAt
          }
        }
      `,
      variables: {
        teamId,
        userId,
      },
    })
  }

  channelMessageReadCount(messageId, teamId, channelId) {
    return this.client.query({
      query: gql`
        query channelMessageReadCount($messageId: String, $teamId: String, $channelId: String) {
          channelMessageReadCount(messageId: $messageId, teamId: $teamId, channelId: $channelId)
        }
      `,
      variables: {
        messageId,
        teamId,
        channelId,
      },
    })
  }

  channelMessages(channelId, page) {
    return this.client.query({
      query: gql`
        query channelMessages($channelId: String!, $page: Float) {
          channelMessages(channelId: $channelId, page: $page) {
            id
            reactions
            device
            read
            reads
            pinned
            likes
            system
            parent {
              id
              channel {
                name
                id
              }
              user {
                id
                name
                image
                username
                timezone
              }
              app {
                resourceId
                app {
                  id
                  name
                  image
                }
              }
              body
              createdAt
            }
            forwardingOriginalTime
            forwardingUser {
              id
              name
              username
              timezone
              image
            }
            user {
              id
              name
              image
              status
              presence
              dnd
              dndUntil
              username
              timezone
            }
            body
            attachments {
              _id
              id
              uri
              size
              name
              preview
              mime
              createdAt
            }
            createdAt
            app {
              resourceId
              app {
                id
                name
                slug
                description
                image
                token
                published
                outgoing
                message {
                  url
                  width
                  height
                  buttons {
                    icon
                    text
                    action {
                      type
                      name
                      payload {
                        url
                        width
                        height
                      }
                    }
                  }
                }
              }
            }
          }
        }
      `,
      variables: {
        channelId,
        page,
      },
    })
  }

  channelAttachments(channelId, page) {
    return this.client.query({
      query: gql`
        query channelAttachments($channelId: String!, $page: Float) {
          channelAttachments(channelId: $channelId, page: $page) {
            id
            reactions
            device
            likes
            system
            parent {
              user {
                id
                name
                image
                username
                timezone
                status
                presence
              }
              body
              createdAt
            }
            user {
              id
              name
              image
              status
              presence
              dnd
              dndUntil
              username
              timezone
            }
            body
            attachments {
              _id
              id
              uri
              size
              name
              preview
              mime
              createdAt
            }
            createdAt
            updatedAt
          }
        }
      `,
      variables: {
        channelId,
        page,
      },
    })
  }

  searchMessages(channelId, query) {
    return this.client.query({
      query: gql`
        query searchMessages($channelId: String, $query: String) {
          searchMessages(channelId: $channelId, query: $query) {
            id
            reactions
            device
            read
            pinned
            likes
            system
            parent {
              channel {
                id
                name
              }
              user {
                id
                name
                image
                username
                timezone
                status
                presence
              }
              body
              createdAt
            }
            user {
              id
              name
              image
              status
              presence
              username
              timezone
            }
            body
            attachments {
              _id
              id
              uri
              size
              name
              preview
              mime
              createdAt
            }
            app {
              resourceId
              app {
                id
                name
                slug
                description
                image
                token
                published
                outgoing
                message {
                  url
                  width
                  height
                  buttons {
                    icon
                    text
                    action {
                      type
                      name
                      payload {
                        url
                        width
                        height
                      }
                    }
                  }
                }
              }
            }
            createdAt
          }
        }
      `,
      variables: {
        channelId,
        query,
      },
    })
  }

  searchChannelMembers(channelId, query, page) {
    return this.client.query({
      query: gql`
        query searchChannelMembers($channelId: String, $query: String, $page: Float) {
          searchChannelMembers(channelId: $channelId, query: $query, page: $page) {
            id
            role
            user {
              id
              name
              image
              username
              timezone
            }
          }
        }
      `,
      variables: {
        channelId,
        query,
        page,
      },
    })
  }

  searchTeamMembers(teamId, query, page) {
    return this.client.query({
      query: gql`
        query searchTeamMembers($teamId: String, $query: String, $page: Float) {
          searchTeamMembers(teamId: $teamId, query: $query, page: $page) {
            id
            role
            user {
              id
              name
              image
              username
              timezone
            }
          }
        }
      `,
      variables: {
        teamId,
        query,
        page,
      },
    })
  }

  notifications(userId, page) {
    return this.client.query({
      query: gql`
        query notifications($userId: String, $page: Float) {
          notifications(userId: $userId, page: $page) {
            id
            title
            body
            team {
              image
              name
              id
            }
            channel {
              image
              name
              id
            }
            read
            createdAt
          }
        }
      `,
      variables: {
        userId,
        page,
      },
    })
  }

  /**
   * Mutations
   */

  joinChannel(shortcode, userId) {
    return this.client.mutate({
      mutation: gql`
        mutation joinChannel($shortcode: String, $userId: String) {
          joinChannel(shortcode: $shortcode, userId: $userId)
        }
      `,
      variables: {
        shortcode,
        userId,
      },
    })
  }

  joinTeam(slug, userId, shortcode) {
    return this.client.mutate({
      mutation: gql`
        mutation joinTeam($slug: String, $userId: String, $shortcode: String) {
          joinTeam(slug: $slug, userId: $userId, shortcode: $shortcode)
        }
      `,
      variables: {
        slug,
        userId,
        shortcode,
      },
    })
  }

  updateNotificationRead(notificationId, read) {
    return this.client.mutate({
      mutation: gql`
        mutation updateNotificationRead($notificationId: String, $read: Boolean) {
          updateNotificationRead(notificationId: $notificationId, read: $read)
        }
      `,
      variables: {
        notificationId,
        read,
      },
    })
  }

  updateUser(userId, payload) {
    return this.client.mutate({
      mutation: gql`
        mutation updateUser($userId: String, $payload: String) {
          updateUser(userId: $userId, payload: $payload)
        }
      `,
      variables: {
        userId,
        payload: JSON.stringify(payload),
      },
    })
  }

  updateUserMuted(userId, channelId, muted) {
    return this.client.mutate({
      mutation: gql`
        mutation updateUserMuted($userId: String, $channelId: String, $muted: Boolean) {
          updateUserMuted(userId: $userId, channelId: $channelId, muted: $muted)
        }
      `,
      variables: {
        userId,
        channelId,
        muted,
      },
    })
  }

  updateUserArchived(userId, channelId, archived) {
    return this.client.mutate({
      mutation: gql`
        mutation updateUserArchived($userId: String, $channelId: String, $archived: Boolean) {
          updateUserArchived(userId: $userId, channelId: $channelId, archived: $archived)
        }
      `,
      variables: {
        userId,
        channelId,
        archived,
      },
    })
  }

  updateUserStarred(userId, channelId, starred) {
    return this.client.mutate({
      mutation: gql`
        mutation updateUserStarred($userId: String, $channelId: String, $starred: Boolean) {
          updateUserStarred(userId: $userId, channelId: $channelId, starred: $starred)
        }
      `,
      variables: {
        userId,
        channelId,
        starred,
      },
    })
  }

  createTeam(userId, userName, payload) {
    return this.client.mutate({
      mutation: gql`
        mutation createTeam($userId: String, $userName: String, $payload: String) {
          createTeam(userId: $userId, userName: $userName, payload: $payload) {
            id
            name
            slug
            shortcode
            image
          }
        }
      `,
      variables: {
        userId,
        userName,
        payload: JSON.stringify(payload),
      },
    })
  }

  updateTeamShortcode(teamId, shortcode) {
    return this.client.mutate({
      mutation: gql`
        mutation updateTeamShortcode($teamId: String, $shortcode: String) {
          updateTeamShortcode(teamId: $teamId, shortcode: $shortcode)
        }
      `,
      variables: {
        teamId,
        shortcode,
      },
    })
  }

  updateTeamSlug(teamId, slug) {
    return this.client.mutate({
      mutation: gql`
        mutation updateTeamSlug($teamId: String, $slug: String) {
          updateTeamSlug(teamId: $teamId, slug: $slug)
        }
      `,
      variables: {
        teamId,
        slug,
      },
    })
  }

  updateTeam(teamId, payload) {
    return this.client.mutate({
      mutation: gql`
        mutation updateTeam($teamId: String, $payload: String) {
          updateTeam(teamId: $teamId, payload: $payload)
        }
      `,
      variables: {
        teamId,
        payload: JSON.stringify(payload),
      },
    })
  }

  deleteTeam(teamId) {
    return this.client.mutate({
      mutation: gql`
        mutation deleteTeam($teamId: String) {
          deleteTeam(teamId: $teamId)
        }
      `,
      variables: {
        teamId,
      },
    })
  }

  updateTeamMemberPosition(teamId, userId, position) {
    return this.client.mutate({
      mutation: gql`
        mutation updateTeamMemberPosition($teamId: String, $userId: String, $position: String) {
          updateTeamMemberPosition(teamId: $teamId, userId: $userId, position: $position)
        }
      `,
      variables: {
        teamId,
        userId,
        position,
      },
    })
  }

  updateTeamMemberRole(teamId, userId, role) {
    return this.client.mutate({
      mutation: gql`
        mutation updateTeamMemberRole($teamId: String, $userId: String, $role: String) {
          updateTeamMemberRole(teamId: $teamId, userId: $userId, role: $role)
        }
      `,
      variables: {
        teamId,
        userId,
        role,
      },
    })
  }

  inviteTeamMembers(teamId, emails) {
    return this.client.mutate({
      mutation: gql`
        mutation inviteTeamMembers($teamId: String, $emails: String) {
          inviteTeamMembers(teamId: $teamId, emails: $emails)
        }
      `,
      variables: {
        teamId,
        emails,
      },
    })
  }

  deleteTeamMember(teamId, userId) {
    return this.client.mutate({
      mutation: gql`
        mutation deleteTeamMember($teamId: String, $userId: String) {
          deleteTeamMember(teamId: $teamId, userId: $userId)
        }
      `,
      variables: {
        teamId,
        userId,
      },
    })
  }

  createChannel(payload) {
    return this.client.mutate({
      mutation: gql`
        mutation createChannel($payload: String) {
          createChannel(payload: $payload) {
            id
            name
            description
            color
            icon
            createdAt
            public
            private
          }
        }
      `,
      variables: {
        payload: JSON.stringify(payload),
      },
    })
  }

  updateChannelShortcode(channelId, generateNewCode) {
    return this.client.mutate({
      mutation: gql`
        mutation updateChannelShortcode($channelId: String, $generateNewCode: Boolean) {
          updateChannelShortcode(channelId: $channelId, generateNewCode: $generateNewCode)
        }
      `,
      variables: {
        channelId,
        generateNewCode,
      },
    })
  }

  updateChannel(channelId, payload) {
    return this.client.mutate({
      mutation: gql`
        mutation updateChannel($channelId: String, $payload: String) {
          updateChannel(channelId: $channelId, payload: $payload) {
            id
            name
            description
            createdAt
            public
            color
            icon
            private
            team {
              id
              name
              image
            }
          }
        }
      `,
      variables: {
        channelId,
        payload: JSON.stringify(payload),
      },
    })
  }

  deleteChannel(channelId, teamId) {
    return this.client.mutate({
      mutation: gql`
        mutation deleteChannel($channelId: String, $teamId: String) {
          deleteChannel(channelId: $channelId, teamId: $teamId)
        }
      `,
      variables: {
        channelId,
        teamId,
      },
    })
  }

  createChannelMembers(channelId, teamId, members) {
    return this.client.mutate({
      mutation: gql`
        mutation createChannelMembers($channelId: String, $teamId: String, $members: String) {
          createChannelMembers(channelId: $channelId, teamId: $teamId, members: $members)
        }
      `,
      variables: {
        teamId,
        channelId,
        members: JSON.stringify(members),
      },
    })
  }

  deleteChannelMessage(messageId) {
    return this.client.mutate({
      mutation: gql`
        mutation deleteChannelMessage($messageId: String) {
          deleteChannelMessage(messageId: $messageId)
        }
      `,
      variables: {
        messageId,
      },
    })
  }

  deleteChannelMember(channelId, userId) {
    return this.client.mutate({
      mutation: gql`
        mutation deleteChannelMember($channelId: String, $userId: String) {
          deleteChannelMember(channelId: $channelId, userId: $userId)
        }
      `,
      variables: {
        channelId,
        userId,
      },
    })
  }

  updateChannelMessage(messageId, payload) {
    return this.client.mutate({
      mutation: gql`
        mutation updateChannelMessage($messageId: String, $payload: String) {
          updateChannelMessage(messageId: $messageId, payload: $payload) {
            id
            user {
              id
              name
              image
              username
              timezone
            }
            body
            reactions
            device
            likes
            attachments {
              _id
              id
              uri
              mime
              preview
              name
              createdAt
              size
            }
            system
            parent {
              id
              user {
                id
                name
                image
                username
                timezone
              }
              body
              createdAt
            }
            createdAt
          }
        }
      `,
      variables: {
        messageId,
        payload: JSON.stringify(payload),
      },
    })
  }

  createChannelMessage(payload) {
    return this.client.mutate({
      mutation: gql`
        mutation createChannelMessage($payload: String) {
          createChannelMessage(payload: $payload) {
            id
            user {
              id
              name
              image
              username
              timezone
            }
            body
            read
            reads
            reactions
            device
            likes
            attachments {
              _id
              id
              uri
              mime
              preview
              name
              createdAt
              size
            }
            system
            parent {
              channel {
                name
                id
              }
              user {
                id
                name
                image
                username
                timezone
              }
              body
              createdAt
            }
            createdAt
          }
        }
      `,
      variables: {
        payload: JSON.stringify(payload),
      },
    })
  }

  createChannelMessageReaction(messageId, reaction) {
    return this.client.mutate({
      mutation: gql`
        mutation createChannelMessageReaction($messageId: String, $reaction: String) {
          createChannelMessageReaction(messageId: $messageId, reaction: $reaction)
        }
      `,
      variables: {
        messageId,
        reaction,
      },
    })
  }

  deleteChannelMessageReaction(messageId, reaction) {
    return this.client.mutate({
      mutation: gql`
        mutation deleteChannelMessageReaction($messageId: String, $reaction: String) {
          deleteChannelMessageReaction(messageId: $messageId, reaction: $reaction)
        }
      `,
      variables: {
        messageId,
        reaction,
      },
    })
  }

  createChannelMessageLike(messageId, userId) {
    return this.client.mutate({
      mutation: gql`
        mutation createChannelMessageLike($messageId: String, $userId: String) {
          createChannelMessageLike(messageId: $messageId, userId: $userId)
        }
      `,
      variables: {
        messageId,
        userId,
      },
    })
  }

  deleteChannelMessageLike(messageId, userId) {
    return this.client.mutate({
      mutation: gql`
        mutation deleteChannelMessageLike($messageId: String, $userId: String) {
          deleteChannelMessageLike(messageId: $messageId, userId: $userId)
        }
      `,
      variables: {
        messageId,
        userId,
      },
    })
  }
}
