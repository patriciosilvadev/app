import React from 'react'
import { connect } from 'react-redux'
import { Avatar } from '@weekday/elements'
import '../helpers/extensions'
import AuthService from '../services/auth.service'
import styled from 'styled-components'
import { BrowserRouter as Router, Link } from 'react-router-dom'
import { fetchTeams } from '../actions'
import PropTypes from 'prop-types'
import TeamModal from '../modals/team.modal'
import AccountModal from '../modals/account.modal'

import IconComponentAdd from '../icons/System/add-box-line'
import IconComponentHelp from '../icons/System/question-line'
import IconComponentSignout from '../icons/System/logout-box-line'
import IconComponentAccount from '../icons/User/account-circle-line'

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

        <IconComponentAdd
          fill="#475669"
          size={24}
          className="mt-5 button"
          onClick={(e) => this.setState({ teamModal: true, userMenu: false })}
          icon="DOCK_ADD_TEAM"
        />

        <div className="flexer"></div>

        <IconComponentHelp
          fill="#475669"
          onClick={(e) => console.log('Help')}
          className="mt-15 button"
          size={24}
        />

        <IconComponentSignout
          fill="#475669"
          className="mt-15 button"
          onClick={this.signout}
          icon="DOCK_SIGNOUT"
          size={24}
        />

        <IconComponentAccount
          fill="#475669"
          className="mt-15 button"
          onClick={(e) => this.setState({ accountModal: true, userMenu: false })}
          icon="DOCK_ACCOUNT"
          size={24}
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
