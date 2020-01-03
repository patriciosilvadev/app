import React, { useState, useEffect } from 'react'
import { connect } from 'react-redux'
import '../helpers/extensions'
import AuthService from '../services/auth.service'
import styled from 'styled-components'
import GraphqlService from '../services/graphql.service'
import { BrowserRouter as Router, Link } from 'react-router-dom'
import { hydrateTeams, updateNotifications, hydrateNotifications } from '../actions'
import PropTypes from 'prop-types'
import { logger } from '../helpers/util'
import { Toggle, Popup, Menu, Avatar, Channel } from '@weekday/elements'
import QuickInputComponent from '../components/quick-input.component'
import { useSelector, useDispatch } from 'react-redux'
import NotificationsComponent from '../components/notifications.component'
import { IconComponent } from './icon.component'
import MessagingService from '../services/messaging.service'
import TeamOnboardingModal from '../modals/team-onboarding.modal'

export default function DockComponent(props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [teamOnboardingModal, setTeamOnboardingModal] = useState(false)
  const dispatch = useDispatch()
  const channel = useSelector(state => state.channel)
  const user = useSelector(state => state.user)
  const common = useSelector(state => state.common)
  const teams = useSelector(state => state.teams)
  const team = useSelector(state => state.team)
  const notifications = useSelector(state => state.notifications)

  // When the user creates a team from quick input component
  const fetchTeams = async userId => {
    setLoading(true)
    setError(false)

    try {
      const teams = await GraphqlService.getInstance().teams(userId)
      const teamIds = teams.data.teams.map(team => team.id)

      setLoading(false)
      dispatch(hydrateTeams(teams.data.teams))

      // Join all these team channels
      MessagingService.getInstance().joins(teamIds)
    } catch (e) {
      logger(e)
      setLoading(false)
      setError(e)
    }
  }

  // Important for setting highlighted team
  const { pathname } = props.history.location
  const pathnameParts = pathname.split('/')
  const lastPathname = pathnameParts[pathnameParts.length - 1]

  // Get all the teams
  useEffect(() => {
    if (user.id) fetchTeams(user.id)

    // If the user has signed up (this query string will be present)
    if (props.history.location.search) {
      if (props.history.location.search.split('=')[1] == 'true') {
        setTeamOnboardingModal(true)
      }
    }
  }, [user.id])

  // prettier-ignore
  return (
    <Dock className="column align-items-center">
      {teamOnboardingModal &&
        <TeamOnboardingModal
          onOkay={() => setTeamOnboardingModal(false)}
          onCancel={() => setTeamOnboardingModal(false)}
        />
      }

      {teams.map((t, index) => {
        const unread = !!common.unread.filter((row) => t.id == row.doc.team).flatten()

        return (
          <Link
            key={index}
            to={`/app/team/${t.id}`}
            style={{
              opacity: lastPathname != "starred" && t.id == team.id ? 1 : 0.5,
              marginBottom: 10,
            }}>
            <Avatar
              dark
              badge={unread}
              size="medium"
              image={t.image}
              title={t.name}
              className="button"
            />
          </Link>
        )
      })}

      <Avatar
        dark
        className="button"
        onClick={(e) => setTeamOnboardingModal(true)}>
        <IconComponent
          icon="plus"
          size={20}
          color="#007af5"
        />
      </Avatar>

      <NotificationsComponent style={{ marginTop: 20 }} />

      <div className="flexer"></div>

      <img src="logo.svg" width="30" style={{ marginTop: 20 }}/>
    </Dock>
  )
}

DockComponent.propTypes = {}

const Dock = styled.div`
  width: 70px;
  padding-top: 20px;
  padding-bottom: 20px;
  display: flex;
  height: 100%;
  position: relative;
  background: white;
  background: #1a1f36;
  background: #040b1c;
  border-right: 1px solid #0a152e;
`
