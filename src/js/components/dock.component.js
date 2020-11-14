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
import { Toggle, Popup, Menu, Avatar, Channel, Tooltip } from '@weekday/elements'
import { useSelector, useDispatch } from 'react-redux'
import NotificationsComponent from '../components/notifications.component'
import { IconComponent } from './icon.component'
import MessagingService from '../services/messaging.service'
import TeamOnboardingModal from '../modals/team-onboarding.modal'
import { IS_CORDOVA, DEVICE, TOGGLE_CHANNELS_DRAWER } from '../constants'
import EventService from '../services/event.service'

export default function DockComponent(props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [open, setOpen] = useState(true)
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

  return (
    <Dock className="column align-items-center">
      <ToggleButton
        onClick={e => {
          setOpen(!open)
          EventService.getInstance().emit(TOGGLE_CHANNELS_DRAWER, true)
        }}
      >
        <IconComponent icon={open ? 'chevron-left' : 'chevron-right'} size={10} color="#AEB5BB" thickness={3} style={{ top: -2 }} />
      </ToggleButton>

      {teamOnboardingModal && <TeamOnboardingModal onOkay={() => setTeamOnboardingModal(false)} onCancel={() => setTeamOnboardingModal(false)} />}

      {teams.map((t, index) => {
        const unread = !!common.unread.filter(row => t.id == row.doc.team).flatten()

        return (
          <Link
            className="column align-items-center align-content-center justify-content-center"
            key={index}
            to={`/app/team/${t.id}`}
            style={{
              width: '100%',
              boxSizing: 'border-box',
              paddingTop: 7,
              paddingBottom: 7,
              backgroundColor: lastPathname != 'starred' && t.id == team.id ? '#F0F3F5' : 'transparent',
              borderLeft: lastPathname != 'starred' && t.id == team.id ? '3px solid #AEB5BB' : 'none',
            }}
          >
            <Avatar badge={unread} size="medium-large" image={t.image} title={t.name} className="button" />
            <Team>{t.name}</Team>
          </Link>
        )
      })}

      <DockPadding />

      <div className="mt-0 mb-0">
        <Avatar size="medium-large" color="rgba(0,0,0,0)" className="button" onClick={e => setTeamOnboardingModal(true)}>
          <IconComponent icon="plus-circle" size={19} color="#112640" thickness={1.75} />
        </Avatar>
      </div>

      <div className="mt-0 mb-10" id="yack" data-inbox="weekday">
        {/* onClick={e => window.open('mailto:support@weekday.freshdesk.com')} */}
        <Avatar size="medium-large" color="rgba(0,0,0,0)" className="button">
          <IconComponent icon="life-buoy" size={18} color="#112640" thickness={1.75} />
        </Avatar>
      </div>

      <NotificationsComponent style={{ marginTop: 0 }} />

      <div className="flexer"></div>

      <img src="icon-light.svg" width="20" />
    </Dock>
  )
}

DockComponent.propTypes = {}

const ToggleButton = styled.div`
  position: absolute;
  z-index: 10;
  top: 0px;
  right: 0px;
  width: 20px;
  height: 20px;
  background: #f8f9fa;
  border-radius: 50%;
  transform: translate(50%, 50%);
  box-shadow: 0px 0px 10px 10px rgba(0, 0, 0, 0.015);
  border: 1px solid #eaedef;
  transition: border 0.2s;
  cursor: pointer;
  display: flex;
  flex-direction: row;
  align-items: center;
  align-content: center;
  justify-content: center;
  overflow: hidden;

  &:hover {
    border: 3px solid #eaedef;
  }
`

const DockPadding = styled.div`
  height: 20px;
`

const Dock = styled.div`
  width: 75px;
  padding-top: 20px;
  padding-bottom: 20px;
  display: flex;
  height: 100%;
  position: relative;
  background: #18181d;
  background: #f8f9fa;
  z-index: 7;
  border-right: 1px solid #eaedef;
  box-shadow: 0px 0px 10px 10px rgba(0, 0, 0, 0.015);

  @media only screen and (max-width: 768px) {
    width: 20vw;
    padding-top: ${props => (IS_CORDOVA ? 'env(safe-area-inset-top)' : '0px')};
  }
`

const Team = styled.div`
  margin-top: 5px;
  font-size: 9px;
  color: #aeb5bb;
  font-weight: 800;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`
