import React from 'react'
import { connect } from 'react-redux'
import AvatarComponent from '../components/avatar.component'
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
    this.props.fetchTeams(this.props.common.user.id)
  }

  // prettier-ignore
  render() {
    return (
      <Dock className="column align-items-center">
        {/* Update an existing team */}
        {this.state.teamModal &&
          <TeamModal
            id={this.props.team.id}
            history={this.props.history}
            onClose={() => this.setState({ teamModal: false })}
          />
        }

        {/* Create a new team */}
        {this.state.teamCreateModal &&
          <TeamModal
            id={null}
            history={this.props.history}
            onClose={() => this.setState({ teamCreateModal: false })}
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
