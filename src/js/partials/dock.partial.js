import React from 'react'
import { connect } from 'react-redux'
import { Avatar } from '@weekday/elements'
import '../helpers/extensions'
import AuthService from '../services/auth.service'
import styled from 'styled-components'
import { BrowserRouter as Router, Link } from 'react-router-dom'
import { fetchTeams, createTeam } from '../actions'
import PropTypes from 'prop-types'
import TeamModal from '../modals/team.modal'
import AccountModal from '../modals/account.modal'
import { AccountCircleOutlined, ExitToAppOutlined, HelpOutlineOutlined, AddBoxOutlined, AddToPhotosOutlined } from '@material-ui/icons'
import QuickInputComponent from '../components/quick-input.component'

const Dock = styled.div`
  width: 70px;
  padding-top: 20px;
  padding-bottom: 20px;
  display: flex;
  height: 100%;
  position: relative;
  z-index: 2;
  background: #08111d;
  background: white;
  border-right: 1px solid #f1f3f5;
`

class DockPartial extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      teamModal: false,
      teamPopup: false,
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
                size="medium-large"
                image={team.image}
                title={team.name}
                className="button mb-10"
                outlineInnerColor="white"
                outlineOuterColor={lastPathname != "starred" && this.props.team.id == team.id ? "#007af5" : "transparent"}
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
          <AddToPhotosOutlined
            htmlColor="#babec9"
            fontSize="default"
            className="mt-10 button"
            onClick={(e) => this.setState({ teamPopup: true })}
          />
        </QuickInputComponent>

        <div className="flexer"></div>

        <HelpOutlineOutlined
          htmlColor="#babec9"
          onClick={(e) => console.log('Help')}
          className="mt-20 button"
          fontSize="default"
        />

        <ExitToAppOutlined
          htmlColor="#babec9"
          className="mt-20 button"
          onClick={this.signout}
          fontSize="default"
        />

        <Avatar
          size="medium"
          image={this.props.common.user.image}
          title={this.props.common.user.name}
          className="mt-20 button"
          onClick={(e) => this.setState({ accountModal: true, userMenu: false })}
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
)(DockPartial)
