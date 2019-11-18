import ApolloClient from 'apollo-client'
import { createHttpLink, HttpLink } from 'apollo-link-http'
import { ApolloLink, concat } from 'apollo-link'
import gql from 'graphql-tag'
import { InMemoryCache } from 'apollo-cache-inmemory'
import AuthService from './auth.service'
import CookiesService from './cookies.service'
import { API_HOST } from '../environment'
import { logger } from '../helpers/util'

export default class GraphqlService {
  static instance
  client

  constructor(token) {
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

    const token = CookiesService.getCookie('jwt')

    this.instance = new GraphqlService(token)

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
            email {
              address
              confirmed
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
            rooms(userId: $userId) {
              id
              title
              description
              image
              public
              private
              user {
                id
                name
                email {
                  address
                  confirmed
                }
                color
                username
                timezone
                image
              }
              excerpt
              members {
                user {
                  id
                  name
                  email {
                    address
                    confirmed
                  }
                  color
                  username
                  timezone
                  image
                }
              }
              createdAt
              updatedAt
            }
            members {
              user {
                id
                role
                name
                email {
                  address
                  confirmed
                }
                color
                username
                timezone
                image
                createdAt
              }
              role
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

  teams(userId) {
    return this.client.query({
      query: gql`
        query teams($userId: String!) {
          teams(userId: $userId) {
            id
            name
            description
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

  room(roomId) {
    return this.client.query({
      query: gql`
        query room($roomId: String!) {
          room(roomId: $roomId) {
            id
            title
            url
            description
            image
            public
            private
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
              members {
                user {
                  id
                  name
                  email {
                    address
                    confirmed
                  }
                  color
                  username
                  timezone
                  role
                  image
                }
                role
              }
            }
            apps {
              active
              app {
                name
                description
                image
                token
                draft
                incoming
                outgoing
                commands {
                  name
                  description
                  action {
                    type
                    url
                    name
                    icon
                  }
                }
                attachments {
                  type
                  url
                  name
                  icon
                }
                tools {
                  type
                  url
                  name
                  icon
                }
                shortcuts {
                  type
                  url
                  name
                  icon
                }
                message {
                  url
                  actions {
                    type
                    url
                    name
                    icon
                  }
                }
              }
            }
            messages {
              id
              reactions
              parent {
                room {
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
                  id
                  name
                  image
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
                name
                description
                image
                token
                draft
                incoming
                outgoing
                commands {
                  name
                  description
                  action {
                    type
                    url
                    name
                    icon
                  }
                }
                attachments {
                  type
                  url
                  name
                  icon
                }
                tools {
                  type
                  url
                  name
                  icon
                }
                shortcuts {
                  type
                  url
                  name
                  icon
                }
                message {
                  url
                  width
                  height
                  actions {
                    type
                    url
                    name
                    icon
                  }
                }
              }
            }
            members {
              user {
                id
                name
                email {
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
            createdAt
            updatedAt
          }
        }
      `,
      variables: {
        roomId,
      },
    })
  }

  rooms(teamId, userId) {
    return this.client.query({
      query: gql`
        query rooms($teamId: String, $userId: String!) {
          rooms(teamId: $teamId, userId: $userId) {
            id
            title
            description
            url
            image
            public
            excerpt
            private
            user {
              id
              name
              username
              timezone
              image
              status
            }
            members {
              user {
                id
                image
                name
                status
                timezone
              }
            }
            team {
              id
              name
              image
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

  roomMessages(roomId, page) {
    return this.client.query({
      query: gql`
        query roomMessages($roomId: String!, $page: Float) {
          roomMessages(roomId: $roomId, page: $page) {
            id
            reactions
            parent {
              app {
                id
                name
                image
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
              name
              description
              image
              token
              draft
              incoming
              outgoing
              commands {
                name
                description
                action {
                  type
                  url
                  name
                  icon
                }
              }
              attachments {
                type
                url
                name
                icon
              }
              tools {
                type
                url
                name
                icon
              }
              shortcuts {
                type
                url
                name
                icon
              }
              message {
                url
                width
                height
                actions {
                  type
                  url
                  name
                  icon
                }
              }
            }
          }
        }
      `,
      variables: {
        roomId,
        page,
      },
    })
  }

  searchMessages(roomId, query) {
    return this.client.query({
      query: gql`
        query searchMessages($roomId: String, $query: String) {
          searchMessages(roomId: $roomId, query: $query) {
            id
            reactions
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
            createdAt
          }
        }
      `,
      variables: {
        roomId,
        query,
      },
    })
  }

  search(teamId, query) {
    return this.client.query({
      query: gql`
        query search($teamId: String, $query: String) {
          search(teamId: $teamId, query: $query) {
            id
            name
            image
            role
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
            type
            meta
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

  updateUserMuted(userId, roomId, muted) {
    return this.client.mutate({
      mutation: gql`
        mutation updateUserMuted($userId: String, $roomId: String, $muted: Boolean) {
          updateUserMuted(userId: $userId, roomId: $roomId, muted: $muted)
        }
      `,
      variables: {
        userId,
        roomId,
        muted,
      },
    })
  }

  updateUserArchived(userId, roomId, archived) {
    return this.client.mutate({
      mutation: gql`
        mutation updateUserArchived($userId: String, $roomId: String, $archived: Boolean) {
          updateUserArchived(userId: $userId, roomId: $roomId, archived: $archived)
        }
      `,
      variables: {
        userId,
        roomId,
        archived,
      },
    })
  }

  updateUserStarred(userId, roomId, starred) {
    return this.client.mutate({
      mutation: gql`
        mutation updateUserStarred($userId: String, $roomId: String, $starred: Boolean) {
          updateUserStarred(userId: $userId, roomId: $roomId, starred: $starred)
        }
      `,
      variables: {
        userId,
        roomId,
        starred,
      },
    })
  }

  createTeam(payload) {
    return this.client.mutate({
      mutation: gql`
        mutation createTeam($payload: String) {
          createTeam(payload: $payload) {
            id
            name
            slug
            shortcode
            image
          }
        }
      `,
      variables: {
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

  createRoom(payload) {
    return this.client.mutate({
      mutation: gql`
        mutation createRoom($payload: String) {
          createRoom(payload: $payload) {
            id
            title
            description
            createdAt
            public
            private
            team {
              id
              name
            }
            members {
              user {
                id
                status
                name
                color
                role
                username
                timezone
                image
              }
            }
            user {
              id
              name
              status
              role
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

  updateRoom(roomId, payload) {
    return this.client.mutate({
      mutation: gql`
        mutation updateRoom($roomId: String, $payload: String) {
          updateRoom(roomId: $roomId, payload: $payload) {
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
        roomId,
        payload: JSON.stringify(payload),
      },
    })
  }

  deleteRoom(roomId) {
    return this.client.mutate({
      mutation: gql`
        mutation deleteRoom($roomId: String) {
          deleteRoom(roomId: $roomId)
        }
      `,
      variables: {
        roomId,
      },
    })
  }

  createRoomMember(roomId, userId) {
    return this.client.mutate({
      mutation: gql`
        mutation createRoomMember($roomId: String, $userId: String) {
          createRoomMember(roomId: $roomId, userId: $userId)
        }
      `,
      variables: {
        roomId,
        userId,
      },
    })
  }

  deleteRoomMessage(messageId) {
    return this.client.mutate({
      mutation: gql`
        mutation deleteRoomMessage($messageId: String) {
          deleteRoomMessage(messageId: $messageId)
        }
      `,
      variables: {
        messageId,
      },
    })
  }

  deleteRoomMember(roomId, userId) {
    return this.client.mutate({
      mutation: gql`
        mutation deleteRoomMember($roomId: String, $userId: String) {
          deleteRoomMember(roomId: $roomId, userId: $userId)
        }
      `,
      variables: {
        roomId,
        userId,
      },
    })
  }

  updateRoomMessage(messageId, payload) {
    return this.client.mutate({
      mutation: gql`
        mutation updateRoomMessage($messageId: String, $payload: String) {
            updateRoomMessage(messageId: $messageId, payload: $payload) {
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

  createRoomMessage(payload) {
    return this.client.mutate({
      mutation: gql`
        mutation createRoomMessage($payload: String) {
          createRoomMessage(payload: $payload) {
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
        payload: JSON.stringify(payload),
      },
    })
  }

  createRoomMessageReaction(messageId, reaction) {
    return this.client.mutate({
      mutation: gql`
        mutation createRoomMessageReaction($messageId: String, $reaction: String) {
          createRoomMessageReaction(messageId: $messageId, reaction: $reaction)
        }
      `,
      variables: {
        messageId,
        reaction,
      },
    })
  }

  deleteRoomMessageReaction(messageId, reaction) {
    return this.client.mutate({
      mutation: gql`
        mutation deleteRoomMessageReaction($messageId: String, $reaction: String) {
          deleteRoomMessageReaction(messageId: $messageId, reaction: $reaction)
        }
      `,
      variables: {
        messageId,
        reaction,
      },
    })
  }
}
