import ApolloClient from 'apollo-client'
import { createHttpLink, HttpLink } from 'apollo-link-http'
import { ApolloLink, concat } from 'apollo-link'
import gql from 'graphql-tag'
import { InMemoryCache } from 'apollo-cache-inmemory'
import AuthService from './auth.service'
import CookiesService from './cookies.service'

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
        }
      });

      return forward(operation);
    })

    this.client = new ApolloClient({
      cache: new InMemoryCache(),
      defaultOptions: defaultOptions,
      link: concat(authMiddleware, createHttpLink({
        fetch: fetch,
        uri: 'http://localhost:8181/graphql',
        onError: ({ networkError, graphQLErrors }) => {
          console.log('graphQLErrors', graphQLErrors)
          console.log('networkError', networkError)
        },
      })),
    })
  }

  static getInstance(token = null) {
    if (this.instance) return this.instance

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
            email
            color
            username
            password
            name
            role
            theme
            starred
            description
            status
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

  team(teamId, userId) {
    return this.client.query({
      query: gql`
        query team($teamId: String!, $userId: String) {
          team(teamId: $teamId, userId: $userId) {
            id
            name
            url
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
                email
                color
                username
                image
              }
              excerpt
              members {
                user {
                  id
                  name
                  email
                  color
                  username
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
                email
                color
                username
                image
                createdAt
              }
              admin
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
            members {
              user {
                id
                name
                email
                color
                username
                image
              }
              admin
            }
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
                  email
                  color
                  username
                  role
                  image
                }
                admin
              }
            }
            messages {
              id
              reactions
              parent {
                user {
                  id
                  name
                  image
                  username
                  color
                }
                message
                createdAt
              }
              user {
                id
                username
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
            }
            members {
              user {
                id
                name
                email
                color
                username
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

  joins(userId) {
    return this.client.query({
      query: gql`
        query joins($userId: String!) {
          joins(userId: $userId) {
            id
          }
        }
      `,
      variables: {
        userId,
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
              image
              status
            }
            members {
              user {
                id
                image
                name
                status
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
              user {
                id
                name
                image
                username
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
            image
            url
          }
        }
      `,
      variables: {
        payload: JSON.stringify(payload),
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

  updateTeamMemberAdmin(teamId, userId, admin) {
    return this.client.mutate({
      mutation: gql`
        mutation updateTeamMemberAdmin($teamId: String, $userId: String, $admin: Boolean) {
          updateTeamMemberAdmin(teamId: $teamId, userId: $userId, admin: $admin)
        }
      `,
      variables: {
        teamId,
        userId,
        admin,
      },
    })
  }

  createTeamMembers(teamId, usernames) {
    return this.client.mutate({
      mutation: gql`
        mutation createTeamMembers($teamId: String, $usernames: String) {
          createTeamMembers(teamId: $teamId, usernames: $usernames) {
            user {
              id
              role
              name
              email
              color
              username
              image
              createdAt
              status
            }
            admin
          }
        }
      `,
      variables: {
        teamId,
        usernames,
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
                image
              }
            }
            user {
              id
              name
              status
              role
              username
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

  updateRoomMessage(roomId, userId, userName, messageId, message, attachments) {
    return this.client.mutate({
      mutation: gql`
        mutation updateRoomMessage($roomId: String, $userId: String, $userName: String, $messageId: String, $message: String, $attachments: [AttachmentInput]) {
          updateRoomMessage(roomId: $roomId, userId: $userId, userName: $userName, messageId: $messageId, message: $message, attachments: $attachments) {
            id
            user {
              id
              name
              image
              username
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
        roomId,
        userId,
        userName,
        messageId,
        message,
        attachments,
      },
    })
  }

  createRoomMessage(roomId, userId, userName, message, attachments, parentId) {
    return this.client.mutate({
      mutation: gql`
        mutation createRoomMessage($roomId: String, $userId: String, $userName: String, $message: String, $attachments: [AttachmentInput], $parentId: String) {
          createRoomMessage(roomId: $roomId, userId: $userId, userName: $userName, message: $message, attachments: $attachments, parentId: $parentId) {
            id
            user {
              id
              name
              image
              username
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
        roomId,
        userId,
        userName,
        message,
        attachments,
        parentId,
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
