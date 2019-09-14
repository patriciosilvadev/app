import React from 'react'
import { connect } from 'react-redux'
import { Avatar } from '@weekday/elements'
import '../helpers/extensions'
import AuthService from '../services/auth.service'
import styled from 'styled-components'
import { BrowserRouter as Router, Link } from 'react-router-dom'
import { fetchTeams } from '../actions'
import PropTypes from 'prop-types'
import IconComponent from '../components/icon.component'
import TeamModal from '../modals/team.modal'
import AccountModal from '../modals/account.modal'

const Dock = styled.div`
  padding: 25px;
  display: flex;
  height: 100%;
  position: relative;
  z-index: 2;
  background: #08111d;
  border-right: 1px solid #0c1828;
`

class DockPartial extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      teamModal: false,
      accountModal: false,
      pluginId: null,
    }

    this.signout = this.signout.bind(this)
  }

  async signout() {
    await AuthService.signout()

    this.props.history.push('/auth')
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

        {/* Create a new team */}
        {this.state.teamModal &&
          <TeamModal
            id={null}
            onClose={() => this.setState({ teamModal: false })}
          />
        }

        {/* Update user account */}
        {this.state.accountModal &&
          <AccountModal
            id={this.props.common.user.id}
            onClose={() => this.setState({ accountModal: false })}
          />
        }

        {this.props.teams.map((team, index) => {
          return (
            <Link key={index} to={`/app/team/${team.id}`}>
              <Avatar
                dark
                size="medium"
                image={team.image}
                title={team.name}
                className="button mb-10"
                outlineInnerColor="#08111d"
                outlineOuterColor={lastPathname != "starred" && this.props.team.id == team.id ? "#007af5" : "transparent"}
              />
            </Link>
          )
        })}

        <IconComponent
          color="#475669"
          size="lg"
          className="mt-5 button"
          onClick={(e) => this.setState({ teamModal: true, userMenu: false })}
          icon="DOCK_ADD_TEAM"
        />

        <div className="flexer"></div>

        {this.props.common.plugins.dock.map((plugin, index) => {
          const { id, icon } = plugin

          return (
            <IconComponent
              key={index}
              color="#475669"
              className="mt-15 button"
              size="lg"
              onClick={(e) => this.setState({ pluginId: id })}
              icon={icon}
            />
          )
        })}

        <IconComponent
          color="#475669"
          onClick={(e) => console.log('Help')}
          className="mt-15 button"
          icon="DOCK_HELP"
          size="lg"
        />

        <IconComponent
          color="#475669"
          className="mt-15 button"
          onClick={this.signout}
          icon="DOCK_SIGNOUT"
          size="lg"
        />

        <IconComponent
          color="#475669"
          className="mt-15 button"
          onClick={(e) => this.setState({ accountModal: true, userMenu: false })}
          icon="DOCK_ACCOUNT"
          size="lg"
        />
      </Dock>
    )
  }
}

DockPartial.propTypes = {
  team: PropTypes.any,
  room: PropTypes.any,
  rooms: PropTypes.array,
  common: PropTypes.any,
  teams: PropTypes.array,
  fetchTeams: PropTypes.func,
}

const mapDispatchToProps = {
  fetchTeams: userId => fetchTeams(userId),
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
)(DockPartial)
