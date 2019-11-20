import produce from 'immer'

const initialState = []

export default (state = initialState, action) =>
  produce(state, draft => {
    switch (action.type) {
      case 'CHANNELS':
        return action.payload

      case 'UPDATE_CHANNEL_USER_STATUS':
        return state.map(channel => {
          if (!channel.private) return channel

          return {
            ...channel,
            members: channel.members.map(member => {
              if (member.user.id != action.payload.userId) return member

              // We first find the right user to update
              // Then we re-create the member object and update their
              // status. This value will be used in channels.js to display
              // an update status (we don't need to do anything else)
              if (member.user.id == action.payload.userId) {
                return {
                  ...member,
                  user: {
                    ...member.user,
                    status: action.payload.status,
                  },
                }
              }
            }),
          }
        })

      case 'UPDATE_CHANNEL':
        return state.map(channel => {
          if (channel.id != action.payload.channelId) return channel

          return {
            ...channel,
            ...action.payload,
          }
        })

      case 'DELETE_CHANNEL':
        return state.filter(channel => channel.id != action.payload.channelId)

      case 'CREATE_CHANNEL':
        draft.push(action.payload)
        break
    }
  })
