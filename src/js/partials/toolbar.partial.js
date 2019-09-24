import React from 'react'
import { connect } from 'react-redux'
import styled from 'styled-components'
import { Tooltip } from '@weekday/elements'
import { Avatar } from '@weekday/elements'
import ConfirmModal from '../modals/confirm.modal'
import RoomModal from '../modals/room.modal'
import MenuComponent from '../components/menu.component'
import PopupComponent from '../components/popup.component'
import PropTypes from 'prop-types'
import { updateRoom, deleteRoom, updateUserStarred, fetchRooms } from '../actions'
import '../helpers/extensions'
import IconComponentDelete from '../icons/System/delete-bin-7-line'
import IconComponentStar from '../icons/System/star-line'
import IconComponentEye from '../icons/System/eye-line'
import IconComponentEyeOff from '../icons/System/eye-off-line'
import IconComponentMembers from '../icons/User/group-line'
import IconComponentPencil from '../icons/Design/pencil-line'

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
  margin-bottom: 3px;

  &:hover,
  &.active {
    background-color: #eff2f7;
  }
`

const ToolbarButtonIcon = styled.div`
  overflow: hidden;
`

const ToolbarButtons = styled.div`
  padding: 12px;
  height: 100%;
`

const Badge = styled.span`
  display: inline-block;
  width: auto;
  border-radius: 10px;
  padding: 3px 5px 3px 5px;
  color: white;
  background: #007af5;
  font-size: 10px;
  font-weight: 600;
  position: absolute;
  top: 0px;
  right: 0px;
  transform: translateX(30%);
`

class ToolbarPartial extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      confirmModal: false,
      starred: false,
      teamMenu: false,
      visibilityMenu: false,
      roomModal: false,
    }

    this.updateRoomVisibility = this.updateRoomVisibility.bind(this)
    this.updateRoomTeam = this.updateRoomTeam.bind(this)
    this.updateUserStarred = this.updateUserStarred.bind(this)
    this.deleteRoom = this.deleteRoom.bind(this)
  }

  static getDerivedStateFromProps(props, state) {
    if (props.room.id == undefined || props.room.id == '') return null

    const isMember = !!props.room.members.filter(member => member.user.id == props.common.user.id).flatten()
    const isPublic = props.room.public
    const open = isMember || isPublic
    const starred = props.common.user.starred.indexOf(props.room.id) != -1

    return {
      starred,
      open,
    }
  }

  updateUserStarred(starred) {
    const userId = this.props.common.user.id
    const roomId = this.props.room.id

    this.props.updateUserStarred(userId, roomId, starred)
  }

  updateRoomTeam(team) {
    this.props.updateRoom({ team: team.id })
    this.props.fetchRooms(this.props.team.id, this.props.common.user.id)
  }

  updateRoomVisibility(visibility) {
    this.setState({ visibilityMenu: false })
    this.props.updateRoom(visibility)
  }

  deleteRoom() {
    this.setState({ confirmModal: false })
    this.props.deleteRoom(this.props.room.id)
    this.props.history.push(`/app/team/${this.props.team.id}/`)
  }

  // prettier-ignore
  render() {
    if (!this.state.open) return null

    const { pathname } = this.props.history.location
    const pathnameParts = pathname.split('/')
    const lastPathname = pathnameParts[pathnameParts.length - 1]

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

          {this.state.roomModal &&
            <RoomModal
              id={this.props.room.id}
              onClose={() => this.setState({ roomModal: false })}
            />
          }

          {!this.props.room.private &&
            <PopupComponent
              handleDismiss={() => this.setState({ teamMenu: false })}
              visible={this.state.teamMenu}
              width={250}
              direction="right-bottom"
              content={
                <div className="column flexer">
                  <MenuComponent
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
          }

          {!this.props.room.private &&
            <ToolbarButton className="row" onClick={() => this.setState({ roomModal: true })}>
              <ToolbarButtonIcon className="row justify-content-center">
                <IconComponentPencil size={22} fill="#babec9" />
              </ToolbarButtonIcon>
            </ToolbarButton>
          }

          {!this.props.room.private &&
            <Tooltip direction="left" text="Members">
              <ToolbarButton
                className={`row ${lastPathname == "members" ? "active" : ""}`}
                onClick={() => this.props.history.push(`/app/team/${this.props.room.team.id}/room/${this.props.room.id}/members`)}>
                <Badge>
                  {this.props.room.members.length.numberShorthand()}
                </Badge>
                <ToolbarButtonIcon className="row justify-content-center">
                  <IconComponentMembers size={22} fill="#babec9" />
                </ToolbarButtonIcon>
              </ToolbarButton>
            </Tooltip>
          }

          {!this.props.room.private &&
            <PopupComponent
              handleDismiss={() => this.setState({ visibilityMenu: false })}
              visible={this.state.visibilityMenu} width={275} direction="right-bottom"
              content={
                <div className="column flexer">
                  <MenuComponent
                    items={[
                      { icon: <IconComponentEye size={22} color="#889098" />, text: "Public to your team", label: 'Anyone in your team can join', onClick: (e) => this.updateRoomVisibility({ private: false, public: true }) },
                      { icon: <IconComponentEyeOff size={22} color="#889098" />, text: "Private to members", label: 'Only people you\'ve added can join', onClick: (e) => this.updateRoomVisibility({ private: false, public: false }) },

                    ]}
                  />
                </div>
              }>
              <Tooltip direction="left" text="Visibility">
                <ToolbarButton className="row" onClick={() => this.setState({ visibilityMenu: true })}>
                  <ToolbarButtonIcon className="row justify-content-center">
                    {this.props.room.public && <IconComponentEye size={22} fill="#babec9" />}
                    {!this.props.room.public && <IconComponentEyeOff size={22} fill="#babec9" />}
                  </ToolbarButtonIcon>
                </ToolbarButton>
              </Tooltip>
            </PopupComponent>
          }

          <Tooltip direction="left" text="Favourite">
            <ToolbarButton className="row" onClick={() => this.updateUserStarred(!this.state.starred)}>
              <ToolbarButtonIcon className="row justify-content-center">
                <IconComponentStar size={22} fill={this.state.starred ? "#EBB403" : "#babec9"} />
              </ToolbarButtonIcon>
            </ToolbarButton>
          </Tooltip>

          <Tooltip direction="left" text="Delete">
            <ToolbarButton className="row" onClick={() => this.setState({confirmModal: true})}>
              <ToolbarButtonIcon className="row justify-content-center">
                <IconComponentDelete size={22} fill="#babec9" />
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
  fetchRooms: PropTypes.func,
  updateUserStarred: PropTypes.func,
}

const mapDispatchToProps = {
  fetchRooms: (teamId, userId) => fetchRooms(teamId, userId),
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
