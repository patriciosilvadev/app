import MessagingService from '../services/messaging.service'
import GraphqlService from '../services/graphql.service'
import DatabaseService from '../services/database.service'
import { browserHistory } from '../services/browser-history.service'
import moment from 'moment'
import EventService from '../services/event.service'
import { updateLoading, updateError } from './'

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
      dispatch(updateLoading(false))
      dispatch(updateError(null))
    }
  }
}

export function createTeam(userId, name) {
  return async (dispatch, getState) => {
    dispatch(updateLoading(true))
    dispatch(updateError(null))

    try {
      const { data } = await GraphqlService.getInstance().createTeam({
        name,
        description: '',
        image: null,
        members: [
          {
            user: userId,
            admin: true,
          },
        ],
      })
      const teamId = data.createTeam.id

      dispatch(updateLoading(false))
      dispatch({
        type: 'CREATE_TEAM',
        payload: data.createTeam,
      })

      MessagingService.getInstance().join(teamId)
    } catch (e) {
      dispatch(updateLoading(false))
      dispatch(updateError(null))
    }
  }
}
