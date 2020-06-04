import produce from 'immer'

const initialState = []

export default (state = initialState, action) =>
  produce(state, draft => {
    switch (action.type) {
      case 'CHANNELS':
        return action.payload

      case 'UPDATE_CHANNEL_USER_STATUS':
        return state.map(channel => {
          // Only do private channels
          // Because there will be 2 members
          if (!channel.private) return channel
          if (!channel.otherUser) return channel
          if (channel.otherUser.id != action.payload.userId) return channel

          // Only update the user if it's this userId as the otherUser.id
          // So only update the desiganted userId with the new status
          return {
            ...channel,
            otherUser: {
              ...channel.otherUser,
              status: action.payload.status,
            },
          }
        })

      case 'UPDATE_CHANNEL_USER_NAME_IMAGE':
        return state.map(channel => {
          // Only do private channels
          // Because there will be 2 members
          if (!channel.private) return channel
          if (!channel.otherUser) return channel
          if (channel.otherUser.id != action.payload.userId) return channel

          // Only update the user if it's this userId as the otherUser.id
          // So only update the desiganted userId with the new name / image
          return {
            ...channel,
            otherUser: {
              ...channel.otherUser,
              name: action.payload.name,
              image: action.payload.image,
            },
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
