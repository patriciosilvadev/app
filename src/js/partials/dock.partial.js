import React from 'react'
import { connect } from 'react-redux'
import RoomComponent from '../components/room.component'
import AvatarComponent from '../components/avatar.component'
import GraphqlService from '../services/graphql.service'
import '../helpers/extensions'
import AuthService from '../services/auth.service'
import styled from 'styled-components'
import { BrowserRouter as Router, Link } from 'react-router-dom'
import TeamModal from '../modals/team.modal'
import RoomModal from '../modals/room.modal'
import AccountModal from '../modals/account.modal'
import { Subject } from 'rxjs'
import { debounceTime } from 'rxjs/operators'
import PropTypes from 'prop-types'
import { createRoom, fetchRooms, fetchStarredRooms, fetchTeam } from '../actions'
import IconComponent from '../components/icon.component'

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
      teamCreateModal: false,
      accountModal: false,
    }

    this.signout = this.signout.bind(this)
  }

  async signout() {
    await AuthService.signout()

    this.props.history.push('/auth')
  }

  componentDidMount() {
    const { teamId } = this.props.match.params
    const userId = this.props.common.user.id

    if (!this.props.starred && teamId) this.props.fetchTeam(teamId, userId)
  }

  componentDidUpdate(prevProps) {
    const { teamId } = this.props.match.params
    const userId = this.props.common.user.id

    if (!prevProps.starred && teamId != prevProps.match.params.teamId) this.props.fetchTeam(teamId, userId)
  }

  // prettier-ignore
  render() {
    return (
      <Dock className="column align-items-center">
        {this.props.teams.map((team, index) => {
          return (
            <Link key={index} to={`/app/team/${team.id}`}>
              <AvatarComponent
                dark
                size="medium"
                image={team.image}
                title={team.name}
                className="button mb-10"
              />
            </Link>
          )
        })}

        <Link to={`/app/starred`}>
          <IconComponent
            color="#475669"
            icon="ROOMS_STARRED"
            className="mt-15 button"
          />
        </Link>

        <IconComponent
          color="#475669"
          className="mt-15 button"
          onClick={(e) => this.setState({ teamCreateModal: true, userMenu: false })}
          icon="ROOMS_ADD_TEAM"
        />

        {this.props.team.id &&
          <IconComponent
            color="#475669"
            className="mt-15 button"
            onClick={(e) => this.setState({ teamModal: true, userMenu: false })}
            icon="ROOMS_UPDATE_TEAM"
          />
        }

        <div className="flexer"></div>

        <IconComponent
          color="#475669"
          onClick={(e) => console.log('Help')}
          className="mt-15 button"
          icon="ROOMS_HELP"
        />

        <IconComponent
          color="#475669"
          className="mt-15 button"
          onClick={this.signout}
          icon="ROOMS_SIGNOUT"
        />

        <IconComponent
          color="#475669"
          className="mt-15 button"
          onClick={(e) => this.setState({ accountModal: true, userMenu: false })}
          icon="ROOMS_ACCOUNT"
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
  fetchTeam: PropTypes.func,
}

const mapDispatchToProps = {
  fetchTeam: teamId => fetchTeam(teamId),
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
