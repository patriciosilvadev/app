import MessagingService from '../services/messaging.service'
import GraphqlService from '../services/graphql.service'
import DatabaseService from '../services/database.service'
import { browserHistory } from '../services/browser-history.service'
import moment from 'moment'
import EventService from '../services/event.service'
import { updateLoading, updateError } from './'

export function fetchRooms(teamId, userId) {
  return async (dispatch, getState) => {
    dispatch(updateLoading(true))
    dispatch(updateError(null))

    try {
      const rooms = await GraphqlService.getInstance().rooms(teamId, userId)

      dispatch(updateLoading(false))
      dispatch({
        type: 'ROOMS',
        payload: rooms.data.rooms,
      })
    } catch (e) {
      dispatch(updateLoading(true))
      dispatch(updateError(null))
    }
  }
}
