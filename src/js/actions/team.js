import MessagingService from '../services/messaging.service'
import GraphqlService from '../services/graphql.service'
import DatabaseService from '../services/database.service'
import { browserHistory } from '../services/browser-history.service'
import moment from 'moment'
import EventService from '../services/event.service'

export function fetchTeam(teamId) {
  return async (dispatch, getState) => {
    dispatch(updateLoading(true))
    dispatch(updateError(null))

    try {
      const team = await GraphqlService.getInstance().team(teamId)

      dispatch(updateLoading(false))
      dispatch({
        type: 'TEAM',
        payload: team.data.team,
      })
    } catch (e) {
      dispatch(updateLoading(true))
      dispatch(updateError(null))
    }
  }
}
