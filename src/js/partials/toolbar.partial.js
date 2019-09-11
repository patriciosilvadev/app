import React from 'react'
import { connect } from 'react-redux'
import styled from 'styled-components'
import { Tooltip } from '@weekday/elements'
import { Avatar } from '@weekday/elements'
import ConfirmModal from '../modals/confirm.modal'
import PopupMenuComponent from '../components/popup-menu.component'
import PopupComponent from '../components/popup.component'
import PropTypes from 'prop-types'
import { updateRoom, deleteRoom, updateUserStarred } from '../actions'
import IconComponent from '../components/icon.component'

const Toolbar = styled.div`
  height: 100%;
  background: white;
  border-left: 1px solid #f1f3f5;
  box-shadow: 0px 0px 100px 0px rgba(0, 0, 0, 0);
  position: relative;
  z-index: 1;
`

const ToolbarButton = styled.div`
  padding: 10px;
  border-radius: 100px;
  cursor: pointer;
  margin-top: 0px;

  &:hover {
    background-color: #eff2f7;
  }
`

const ToolbarButtonIcon = styled.div``

const ToolbarButtons = styled.div`
  padding: 12px;
  height: 100%;
`

class ToolbarPartial extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      confirmModal: false,
      starred: false,
      teamMenu: false,
      visibilityMenu: false,
    }

    this.updateRoomVisibility = this.updateRoomVisibility.bind(this)
    this.updateRoomTeam = this.updateRoomTeam.bind(this)
    this.updateUserStarred = this.updateUserStarred.bind(this)
    this.deleteRoom = this.deleteRoom.bind(this)
  }

  static getDerivedStateFromProps(props, state) {
    if (props.room.id == undefined || props.room.id == '') return null

    return {
      starred: props.common.user.starred.indexOf(props.room.id) != -1,
    }
  }

  updateUserStarred(starred) {
    const userId = this.props.common.user.id
    const roomId = this.props.room.id

    this.props.updateUserStarred(userId, roomId, starred)
  }

  updateRoomTeam(team) {
    this.props.updateRoom({ team: team ? team.id : null })
  }

  updateRoomVisibility(visibility) {
    this.setState({ visibilityMenu: false })
    this.props.updateRoom(visibility)
  }

  deleteRoom() {
    this.setState({ confirmModal: false })
    this.props.deleteRoom(this.props.room.id)
    this.props.history.push(`/teams/${this.props.team.id}/`)
  }

  // prettier-ignore
  render() {
    return (
      <Toolbar className="row">
        <ToolbarButtons className="column align-items-center">
          {this.state.confirmModal &&
            <ConfirmModal
              onOkay={this.deleteRoom}
              onCancel={() => this.setState({ confirmModal: false })}
              text="Are you sure you want to delete this room?"
              title="Are you sure?"
            />
          }

          <PopupComponent
            handleDismiss={() => this.setState({ teamMenu: false })}
            visible={this.state.teamMenu}
            width={250}
            direction="right-bottom"
            content={
              <div className="column flexer">
                <PopupMenuComponent
                  items={[
                    ...this.props.teams.map((team, index) => {
                      return {
                        type: 'avatar',
                        circle: false,
                        image: team.image,
                        text: team.name,
                        onClick: (e) => this.updateRoomTeam(team)
                      }
                    }),
                  ]}
                />
              </div>
            }>

            <Tooltip direction="left" text="Team">
              <Avatar
                image={this.props.room.team ? this.props.room.team.image : ""}
                title={this.props.room.team ? this.props.room.team.name : ""}
                size="small"
                className="mb-10 mt-10 button"
                onClick={() => this.setState({ teamMenu: true })}
              />
            </Tooltip>
          </PopupComponent>

          <Tooltip direction="left" text="Members">
            <ToolbarButton className="row" onClick={() => {
                this.props.history.push(`/app/team/${this.props.room.team.id}/room/${this.props.room.id}/members`)
            }}>
              <ToolbarButtonIcon className="row justify-content-center">
                <IconComponent
                  icon="TOOLBAR_MEMBERS"
                  color="#ADB5BD"
                  size="1x"
                />
              </ToolbarButtonIcon>
            </ToolbarButton>
          </Tooltip>

          <PopupComponent
            handleDismiss={() => this.setState({ visibilityMenu: false })}
            visible={this.state.visibilityMenu}
            width={275}
            direction="right-bottom"
            content={
              <div className="column flexer">
                <PopupMenuComponent
                  items={[
                    { icon: <IconComponent size="1x" icon="TOOLBAR_EYE" color="#889098" />, text: "Public to your team", label: 'Anyone in your team can join', onClick: (e) => this.updateRoomVisibility({ private: false, public: true }) },
                    { icon: <IconComponent size="1x" icon="TOOLBAR_EYE_OFF" color="#889098" />, text: "Private to members", label: 'Only people you\'ve added can join', onClick: (e) => this.updateRoomVisibility({ private: false, public: false }) },

                  ]}
                />
              </div>
            }>

            {!this.props.room.private &&
              <Tooltip direction="left" text="Visibility">
                <ToolbarButton className="row" onClick={() => this.setState({ visibilityMenu: true })}>
                  <ToolbarButtonIcon className="row justify-content-center">
                    {this.props.room.public && <IconComponent size="1x" icon="TOOLBAR_EYE" color="#ADB5BD" />}
                    {!this.props.room.public && <IconComponent size="1x" icon="TOOLBAR_EYE_OFF" color="#ADB5BD" />}
                  </ToolbarButtonIcon>
                </ToolbarButton>
              </Tooltip>
            }
          </PopupComponent>

          <Tooltip direction="left" text="Favourite">
            <ToolbarButton className="row" onClick={() => this.updateUserStarred(!this.state.starred)}>
              <ToolbarButtonIcon className="row justify-content-center">
              <IconComponent size="1x" icon="TOOLBAR_STARRED" color={this.state.starred ? "#EBB403" : "#ADB5BD"} width={18} height={18} />
              </ToolbarButtonIcon>
            </ToolbarButton>
          </Tooltip>

          <Tooltip direction="left" text="Delete">
            <ToolbarButton className="row" onClick={() => this.setState({confirmModal: true})}>
              <ToolbarButtonIcon className="row justify-content-center">
                <IconComponent size="1x" icon="TOOLBAR_TRASH" color="#ADB5BD" width={18} height={18} />
              </ToolbarButtonIcon>
            </ToolbarButton>
          </Tooltip>
        </ToolbarButtons>
      </Toolbar>
    )
  }
}

ToolbarPartial.propTypes = {
  team: PropTypes.any,
  teams: PropTypes.any,
  room: PropTypes.any,
  common: PropTypes.any,
  updateRoom: PropTypes.func,
  deleteRoom: PropTypes.func,
  updateUserStarred: PropTypes.func,
}

const mapDispatchToProps = {
  updateRoom: updatedRoom => updateRoom(updatedRoom),
  deleteRoom: roomId => deleteRoom(roomId),
  updateUserStarred: (userId, roomId, starred) => updateUserStarred(userId, roomId, starred),
}

const mapStateToProps = state => {
  return {
    common: state.common,
    team: state.team,
    teams: state.teams,
    room: state.room,
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ToolbarPartial)
