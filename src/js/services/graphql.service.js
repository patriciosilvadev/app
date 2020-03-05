import ApolloClient from 'apollo-client'
import { createHttpLink, HttpLink } from 'apollo-link-http'
import { ApolloLink, concat } from 'apollo-link'
import gql from 'graphql-tag'
import { InMemoryCache } from 'apollo-cache-inmemory'
import AuthService from './auth.service'
import CookiesService from './cookies.service'
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

    const token = CookiesService.getCookie(JWT)
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
            invoices {
              id
              processed
              number
              items {
                description
                amount
                cost
              }
              team {
                id
                name
                image
              }
              createdAt
              updatedAt
            }
            color
            username
            timezone
            password
            name
            role
            theme
            starred
            muted
            archived
            description
            status
            timezone
            image
            createdAt
            updatedAt
            cards {
              token
              vendor
              card
              active
            }
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
            slug
            image
            channels(userId: $userId) {
              id
              title
              image
              public
              excerpt
              private
              otherUser {
                id
                name
                username
                timezone
                image
                status
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
            description
            image
            billing {
              next
              strikes
              plan
              user {
                id
                name
                image
                username
              }
            }
            role(userId: $userId)
            channels(userId: $userId) {
              id
              title
              description
              url
              image
              public
              excerpt
              private
              otherUser {
                id
                name
                username
                timezone
                image
                status
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
            user {
              id
              name
              emails {
                address
                confirmed
              }
              color
              username
              timezone
              role
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

  channel(channelId) {
    return this.client.query({
      query: gql`
        query channel($channelId: String!) {
          channel(channelId: $channelId) {
            id
            title
            url
            description
            image
            public
            private
            isMember
            totalMembers
            otherUser {
              id
              name
              username
              timezone
              image
              status
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
            messages {
              id
              reactions
              likes
              system
              parent {
                channel {
                  title
                  id
                }
                user {
                  id
                  name
                  image
                  username
                  color
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
                message
                createdAt
              }
              user {
                id
                username
                timezone
                name
                image
              }
              message
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
              color
              username
              timezone
              role
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

  channels(teamId, userId) {
    return this.client.query({
      query: gql`
        query channels($teamId: String, $userId: String!) {
          channels(teamId: $teamId, userId: $userId) {
            id
            title
            description
            url
            image
            public
            excerpt
            private
            otherUser {
              id
              name
              username
              timezone
              image
              status
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

  channelMessages(channelId, page) {
    return this.client.query({
      query: gql`
        query channelMessages($channelId: String!, $page: Float) {
          channelMessages(channelId: $channelId, page: $page) {
            id
            reactions
            likes
            system
            parent {
              channel {
                title
                id
              }
              user {
                id
                name
                image
                username
                color
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
              message
              createdAt
            }
            user {
              id
              name
              image
              status
              username
              color
              timezone
            }
            message
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
                color
              }
              message
              createdAt
            }
            user {
              id
              name
              image
              status
              username
              color
              timezone
            }
            message
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
            likes
            system
            parent {
              channel {
                id
                title
              }
              user {
                id
                name
                image
                username
                timezone
                status
                color
              }
              message
              createdAt
            }
            user {
              id
              name
              image
              status
              username
              timezone
              color
            }
            message
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

  searchChannelMembers(channelId, query) {
    return this.client.query({
      query: gql`
        query searchChannelMembers($channelId: String, $query: String) {
          searchChannelMembers(channelId: $channelId, query: $query) {
            id
            name
            image
            username
            timezone
          }
        }
      `,
      variables: {
        channelId,
        query,
      },
    })
  }

  searchTeamMembers(teamId, query) {
    return this.client.query({
      query: gql`
        query searchTeamMembers($teamId: String, $query: String) {
          searchTeamMembers(teamId: $teamId, query: $query) {
            id
            name
            image
            username
            timezone
          }
        }
      `,
      variables: {
        teamId,
        query,
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

  createTeam(userId, payload) {
    return this.client.mutate({
      mutation: gql`
        mutation createTeam($userId: String, $payload: String) {
          createTeam(userId: $userId, payload: $payload) {
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

  updateTeamBilling(teamId, plan, userId) {
    return this.client.mutate({
      mutation: gql`
        mutation updateTeamBilling($teamId: String, $plan: String, $userId: String) {
          updateTeamBilling(teamId: $teamId, plan: $plan, userId: $userId)
        }
      `,
      variables: {
        teamId,
        plan,
        userId,
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

  updateTeamBillingUser(teamId, userId) {
    return this.client.mutate({
      mutation: gql`
        mutation updateTeamBillingUser($teamId: String, $userId: String) {
          updateTeamBillingUser(teamId: $teamId, userId: $userId)
        }
      `,
      variables: {
        teamId,
        userId,
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

  inviteTeamMembers(teamName, teamSlug, teamShortcode, emails) {
    return this.client.mutate({
      mutation: gql`
        mutation inviteTeamMembers($teamName: String, $teamSlug: String, $teamShortcode: String, $emails: String) {
          inviteTeamMembers(teamName: $teamName, teamSlug: $teamSlug, teamShortcode: $teamShortcode, emails: $emails)
        }
      `,
      variables: {
        teamName,
        teamSlug,
        teamShortcode,
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
            title
            description
            createdAt
            public
            private
            excerpt
            otherUser {
              id
              name
              status
              username
              timezone
              image
            }
            user {
              id
              name
              status
              username
              timezone
              image
            }
          }
        }
      `,
      variables: {
        payload: JSON.stringify(payload),
      },
    })
  }

  updateChannel(channelId, payload) {
    return this.client.mutate({
      mutation: gql`
        mutation updateChannel($channelId: String, $payload: String) {
          updateChannel(channelId: $channelId, payload: $payload) {
            id
            title
            description
            createdAt
            public
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

  deleteChannel(channelId) {
    return this.client.mutate({
      mutation: gql`
        mutation deleteChannel($channelId: String) {
          deleteChannel(channelId: $channelId)
        }
      `,
      variables: {
        channelId,
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
            message
            reactions
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
              user {
                id
                name
                image
                username
                timezone
                color
              }
              message
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
            message
            reactions
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
                title
                id
              }
              user {
                id
                name
                image
                username
                timezone
                color
              }
              message
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
