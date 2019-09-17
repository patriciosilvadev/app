import ApolloClient from 'apollo-client'
import { createHttpLink } from 'apollo-link-http'
import gql from 'graphql-tag'
import { InMemoryCache } from 'apollo-cache-inmemory'

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

    this.client = new ApolloClient({
      cache: new InMemoryCache(),
      defaultOptions: defaultOptions,
      link: createHttpLink({
        fetch: fetch,
        uri: 'http://localhost:8181/graphql',
        onError: ({ networkError, graphQLErrors }) => {
          console.log('graphQLErrors', graphQLErrors)
          console.log('networkError', networkError)
        },
      }),
    })
  }

  static getInstance() {
    if (this.instance) return this.instance

    this.instance = new GraphqlService()

    return this.instance
  }

  /**
   * Queries
   */

  user(id) {
    return this.client.query({
      query: gql`
        query user($id: String!) {
          user(id: $id) {
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
            image
            createdAt
            updatedAt
          }
        }
      `,
      variables: {
        id,
      },
    })
  }

  users(list) {
    return this.client.query({
      query: gql`
        query users($list: String!) {
          users(list: $list) {
            id
            name
            image
          }
        }
      `,
      variables: {
        list,
      },
    })
  }

  team(id, user) {
    return this.client.query({
      query: gql`
        query team($id: String!, $user: String) {
          team(id: $id, user: $user) {
            id
            name
            url
            description
            image
            rooms(user: $user) {
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
        id,
        user,
      },
    })
  }

  teams(id) {
    return this.client.query({
      query: gql`
        query teams($id: String!) {
          teams(id: $id) {
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
        id,
      },
    })
  }

  roomUrl(url) {
    return this.client.query({
      query: gql`
        query roomUrl($url: String!) {
          roomUrl(url: $url) {
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
              replies {
                user {
                  id
                  name
                  username
                  image
                  color
                }
                reply
                reactions
                attachments {
                  uri
                  thumbnail
                  mime
                }
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
                thumbnail
                uri
                mime
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
        url,
      },
    })
  }

  room(id) {
    return this.client.query({
      query: gql`
        query room($id: String!) {
          room(id: $id) {
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
              replies {
                user {
                  id
                  name
                  username
                  image
                  color
                }
                reply
                reactions
                attachments {
                  uri
                  thumbnail
                  mime
                }
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
                thumbnail
                uri
                mime
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
        id,
      },
    })
  }

  joins(user) {
    return this.client.query({
      query: gql`
        query joins($user: String!) {
          joins(user: $user) {
            id
          }
        }
      `,
      variables: {
        user,
      },
    })
  }

  rooms(team, user) {
    return this.client.query({
      query: gql`
        query rooms($team: String, $user: String!) {
          rooms(team: $team, user: $user) {
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
            }
            members {
              user {
                id
                image
                name
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
        team,
        user,
      },
    })
  }

  roomMessages(id, page) {
    return this.client.query({
      query: gql`
        query roomMessages($id: String!, $page: Float) {
          roomMessages(id: $id, page: $page) {
            id
            reactions
            replies {
              user {
                id
                name
                image
                username
                color
              }
              reply
              reactions
              attachments {
                uri
                thumbnail
                mime
              }
              createdAt
            }
            user {
              id
              name
              image
              username
              color
            }
            message
            attachments {
              uri
              thumbnail
              mime
            }
            createdAt
          }
        }
      `,
      variables: {
        id,
        page,
      },
    })
  }

  search(team, query) {
    return this.client.query({
      query: gql`
        query search($team: String, $query: String) {
          search(team: $team, query: $query) {
            id
            name
            image
            role
            username
          }
        }
      `,
      variables: {
        team,
        query,
      },
    })
  }

  /**
   * Mutations
   */

  updateUser(id, payload) {
    return this.client.mutate({
      mutation: gql`
        mutation updateUser($id: String, $payload: String) {
          updateUser(id: $id, payload: $payload)
        }
      `,
      variables: {
        id,
        payload: JSON.stringify(payload),
      },
    })
  }

  updateUserStarred(id, room, starred) {
    return this.client.mutate({
      mutation: gql`
        mutation updateUserStarred($id: String, $room: String, $starred: Boolean) {
          updateUserStarred(id: $id, room: $room, starred: $starred)
        }
      `,
      variables: {
        id,
        room,
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

  updateTeam(id, payload) {
    return this.client.mutate({
      mutation: gql`
        mutation updateTeam($id: String, $payload: String) {
          updateTeam(id: $id, payload: $payload)
        }
      `,
      variables: {
        id,
        payload: JSON.stringify(payload),
      },
    })
  }

  deleteTeam(id) {
    return this.client.mutate({
      mutation: gql`
        mutation deleteTeam($id: String) {
          deleteTeam(id: $id)
        }
      `,
      variables: {
        id,
      },
    })
  }

  updateTeamMemberAdmin(id, user, admin) {
    return this.client.mutate({
      mutation: gql`
        mutation updateTeamMemberAdmin($id: String, $user: String, $admin: Boolean) {
          updateTeamMemberAdmin(id: $id, user: $user, admin: $admin)
        }
      `,
      variables: {
        id,
        user,
        admin,
      },
    })
  }

  createTeamMembers(id, usernames) {
    return this.client.mutate({
      mutation: gql`
        mutation createTeamMembers($id: String, $usernames: String) {
          createTeamMembers(id: $id, usernames: $usernames) {
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
      `,
      variables: {
        id,
        usernames,
      },
    })
  }

  deleteTeamMember(id, user) {
    return this.client.mutate({
      mutation: gql`
        mutation deleteTeamMember($id: String, $user: String) {
          deleteTeamMember(id: $id, user: $user)
        }
      `,
      variables: {
        id,
        user,
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

  updateRoom(id, payload) {
    return this.client.mutate({
      mutation: gql`
        mutation updateRoom($id: String, $payload: String) {
          updateRoom(id: $id, payload: $payload) {
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
        id,
        payload: JSON.stringify(payload),
      },
    })
  }

  deleteRoom(id) {
    return this.client.mutate({
      mutation: gql`
        mutation deleteRoom($id: String) {
          deleteRoom(id: $id)
        }
      `,
      variables: {
        id,
      },
    })
  }

  createRoomMember(id, user) {
    return this.client.mutate({
      mutation: gql`
        mutation createRoomMember($id: String, $user: String) {
          createRoomMember(id: $id, user: $user)
        }
      `,
      variables: {
        id,
        user,
      },
    })
  }

  deleteRoomMember(id, user) {
    return this.client.mutate({
      mutation: gql`
        mutation deleteRoomMember($id: String, $user: String) {
          deleteRoomMember(id: $id, user: $user)
        }
      `,
      variables: {
        id,
        user,
      },
    })
  }

  createRoomMessage(id, user, name, message, attachments, parent) {
    return this.client.mutate({
      mutation: gql`
        mutation createRoomMessage($id: String, $user: String, $name: String, $message: String, $attachments: [AttachmentInput]) {
          createRoomMessage(id: $id, user: $user, name: $name, message: $message, attachments: $attachments) {
            id
            replies {
              user {
                id
                name
                color
                image
                username
              }
              reactions
              reply
              attachments {
                uri
                thumbnail
                mime
              }
              createdAt
            }
            user {
              id
              name
              image
              username
            }
            message
            reactions
            attachments {
              thumbnail
              uri
              mime
            }
            createdAt
          }
        }
      `,
      variables: {
        id,
        user,
        name,
        message,
        attachments,
        parent,
      },
    })
  }

  createRoomMessageReply(id, user, reply, attachments) {
    return this.client.mutate({
      mutation: gql`
        mutation createRoomMessageReply($id: String, $user: String, $reply: String, $attachments: [AttachmentInput]) {
          createRoomMessageReply(id: $id, user: $user, reply: $reply, attachments: $attachments) {
            user {
              id
              name
              color
              image
              username
            }
            reply
            reactions
            attachments {
              thumbnail
              uri
              mime
            }
            createdAt
          }
        }
      `,
      variables: {
        id,
        user,
        reply,
        attachments,
      },
    })
  }

  createRoomMessageReaction(id, reaction) {
    return this.client.mutate({
      mutation: gql`
        mutation createRoomMessageReaction($id: String, $reaction: String) {
          createRoomMessageReaction(id: $id, reaction: $reaction)
        }
      `,
      variables: {
        id,
        reaction,
      },
    })
  }

  deleteRoomMessageReaction(id, reaction) {
    return this.client.mutate({
      mutation: gql`
        mutation deleteRoomMessageReaction($id: String, $reaction: String) {
          deleteRoomMessageReaction(id: $id, reaction: $reaction)
        }
      `,
      variables: {
        id,
        reaction,
      },
    })
  }
}
