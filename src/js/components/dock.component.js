import React, { useState, useEffect } from 'react'
import { connect } from 'react-redux'
import '../helpers/extensions'
import AuthService from '../services/auth.service'
import styled from 'styled-components'
import { BrowserRouter as Router, Link } from 'react-router-dom'
import { fetchTeams, createTeam, fetchNotifications } from '../actions'
import PropTypes from 'prop-types'
import { Toggle, Popup, Menu, Avatar, Room } from '@weekday/elements'
import QuickInputComponent from '../components/quick-input.component'
import { useSelector, useDispatch } from 'react-redux'
import NotificationsComponent from '../components/notifications.component'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

const Dock = styled.div`
  width: 70px;
  padding-top: 20px;
  padding-bottom: 20px;
  display: flex;
  height: 100%;
  position: relative;
  background: white;
  background: #040b1c;
  border-right: 1px solid #0a152e;
`

const Badge = styled.span`
  position: absolute;
  right: -3px;
  bottom: -3px;
  width: 11px;
  height: 11px;
  border-radius: 50%;
  background-color: #007af5;
  border: 2px solid #040b1c;
`

export default function DockComponent(props) {
  const [pluginId, setPluginId] = useState(null)
  const [teamPopup, setTeamPopup] = useState(false)
  const [lastPathname, setLastPathname] = useState('')
  const [hasNotification, setHasNotification] = useState(false)
  const [notificationsMenu, setNotificationsMenu] = useState(false)

  const dispatch = useDispatch()
  const room = useSelector(state => state.room)
  const common = useSelector(state => state.common)
  const teams = useSelector(state => state.teams)
  const team = useSelector(state => state.team)
  const notifications = useSelector(state => state.notifications)

  // When the user creates a team from quick input component
  const handleNewTeamAccept = name => {
    setTeamPopup(false)
    dispatch(createTeam(common.user.id, name))
  }

  // Important for setting highlighted team
  useEffect(() => {
    const { pathname } = props.history.location
    const pathnameParts = pathname.split('/')
    const unreadNotifications = notifications.filter(n => !n.read).length > 0

    setHasNotification(unreadNotifications)
    setLastPathname(pathnameParts[pathnameParts.length - 1])
  })

  // Fetch the user details
  useEffect(() => {
    dispatch(fetchTeams(common.user.id))
    dispatch(fetchNotifications(common.user.id))
  }, [])

  // prettier-ignore
  return (
    <Dock className="column align-items-center">
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

      <QuickInputComponent
        visible={teamPopup}
        width={250}
        direction="left-bottom"
        placeholder="New team name"
        handleDismiss={() => setTeamPopup(false)}
        handleAccept={handleNewTeamAccept}>
        <Avatar
          dark
          className="button"
          onClick={(e) => setTeamPopup(true)}>
          <FontAwesomeIcon
            icon={["fal", "plus"]}
            color="#007af5"
            size="sm"
          />
        </Avatar>
      </QuickInputComponent>

      <div className="flexer"></div>

      <Popup
        handleDismiss={() => setNotificationsMenu(false)}
        visible={notificationsMenu}
        width={275}
        direction="left-top"
        content={
          <NotificationsComponent />
        }>
        <div
          className="button"
          onClick={(e) => setNotificationsMenu(true)}>
          {hasNotification && <Badge />}
          <FontAwesomeIcon
            icon={["fal", "bell"]}
            color="white"
            size="lg"
            style={{ opacity: hasNotification ? 1 : 0.5}}
          />
        </div>
      </Popup>
    </Dock>
  )
}

DockComponent.propTypes = {}