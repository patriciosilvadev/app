import React from 'react'
import { connect } from 'react-redux'
import '../helpers/extensions'
import AuthService from '../services/auth.service'
import styled from 'styled-components'
import { BrowserRouter as Router, Link } from 'react-router-dom'
import { fetchTeams, createTeam } from '../actions'
import PropTypes from 'prop-types'
import TeamModal from '../modals/team.modal'
import AccountModal from '../modals/account.modal'
import { AddOutlined, AccountCircleOutlined, ExitToAppOutlined, HelpOutlineOutlined, AddBoxOutlined, AddToPhotosOutlined } from '@material-ui/icons'
import { Avatar } from '@weekday/elements'
import QuickInputComponent from '../components/quick-input.component'

const Dock = styled.div`
  width: 70px;
  padding-top: 20px;
  padding-bottom: 20px;
  display: flex;
  height: 100%;
  position: relative;
  background: white;
  background: #040B1C;
  border-right: 1px solid #0a152e;
`

class DockComponent extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      teamPopup: false,
      pluginId: null,
    }
  }

  componentDidMount() {
    this.props.fetchTeams(this.props.common.user.id)
  }

  // prettier-ignore
  render() {
    const { pathname } = this.props.history.location
    const pathnameParts = pathname.split('/')
    const lastPathname = pathnameParts[pathnameParts.length - 1]

    return (
      <Dock className="column align-items-center">
        {this.props.common.plugins.dock.map((plugin, index) => {
          const { Component, id } = plugin

          if (this.state.pluginId == id) return (
            <Component
              key={index}
              onClose={() => this.setState({ pluginId: null })}
            />
          )
        })}

        {this.props.teams.map((team, index) => {
          return (
            <Link
              key={index}
              to={`/app/team/${team.id}`}
              style={{ opacity: lastPathname != "starred" && this.props.team.id == team.id ? 1 : 0.5 }}>
              <Avatar
                dark
                size="medium"
                image={team.image}
                title={team.name}
                className="button mb-10"
              />
            </Link>
          )
        })}

        <QuickInputComponent
          visible={this.state.teamPopup}
          width={300}
          direction="left-bottom"
          handleDismiss={() => this.setState({ teamPopup: false })}
          handleAccept={(name) => this.setState({ teamPopup: false }, () => this.props.createTeam(name))}
          placeholder="New team name">
          <Avatar
            dark
            className="button"
            onClick={(e) => this.setState({ teamPopup: true })}>
            <AddOutlined htmlColor="#007af5" fontSize="default" />
          </Avatar>
        </QuickInputComponent>
      </Dock>
    )
  }
}

DockComponent.propTypes = {
  team: PropTypes.any,
  room: PropTypes.any,
  rooms: PropTypes.array,
  common: PropTypes.any,
  teams: PropTypes.array,
  fetchTeams: PropTypes.func,
  createTeam: PropTypes.func,
}

const mapDispatchToProps = {
  fetchTeams: userId => fetchTeams(userId),
  createTeam: name => createTeam(name),
}

const mapStateToProps = state => {
  return {
    common: state.common,
    team: state.team,
    rooms: state.rooms,
    room: state.room,
    teams: state.teams,
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(DockComponent)
