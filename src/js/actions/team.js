import MessagingService from '../services/messaging.service'
import GraphqlService from '../services/graphql.service'
import DatabaseService from '../services/database.service'
import { browserHistory } from '../services/browser-history.service'
import moment from 'moment'
import EventService from '../services/event.service'
import { updateLoading, updateError } from './'

export function updateTeam(teamId, updatedTeam) {
  return {
    type: 'UPDATE_TEAM',
    payload: { ...updatedTeam, teamId },
    sync: teamId,
  }
}

export function deleteTeam(teamId, sync) {
  return {
    type: 'DELETE_TEAM',
    payload: { teamId },
    sync: sync ? teamId : null,
  }
}

export function hydrateTeam(team) {
  return {
    type: 'TEAM',
    payload: team,
  }
}

export function createTeam(team) {
  return {
    type: 'CREATE_TEAM',
    payload: team,
  }
}
