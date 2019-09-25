import React from 'react'
import { connect } from 'react-redux'
import ConfirmModal from '../modals/confirm.modal'
import '../helpers/extensions'
import { Avatar } from '@weekday/elements'
import QuickUserComponent from '../components/quick-user.component'
import styled from 'styled-components'
import { createRoomMember, deleteRoomMember } from '../actions'
import PropTypes from 'prop-types'
import { Button } from '@weekday/elements'
import RoomModal from '../modals/room.modal'
import { CloseOutlined, AddOutlined } from '@material-ui/icons'

const Container = styled.div`
  width: 250px;
  border-left: 1px solid #f1f3f5;
  padding: 25px;
  height: 100%;
`

const HeaderRow = styled.div`
  width: 100%;
`

const Subtitle = styled.div`
  color: #858e96;
  font-size: 12px;
  font-weight: 400;
`

const Title = styled.div`
  cursor: pointer;
  font-size: 24px;
  font-weight: 700;
  font-style: normal;
  color: #040b1c;
  flex: 1;
`

const Members = styled.div`
  width: 200px;
  margin-top: 20px;
  margin-bottom: 50px;
`

class MembersPartial extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      confirmModal: false,
      userMenu: false,
    }

    this.createRoomMember = this.createRoomMember.bind(this)
    this.deleteRoomMember = this.deleteRoomMember.bind(this)
  }

  createRoomMember(user) {
    this.setState({ userMenu: false })

    // Check to see if there are already people
    // Don't re-add people
    if (this.props.room.members.filter(member => member.user.id == user.id).length > 0) return

    // Otherwise all good - add them
    this.props.createRoomMember(user)
  }

  deleteRoomMember(user) {
    if (this.props.room.members.length <= 2) return

    this.props.deleteRoomMember(user)
  }

  // prettier-ignore
  render() {
    return (
      <Container className="column">
        {this.state.confirmModal &&
          <ConfirmModal
            onOkay={() => this.deleteRoomMember(this.props.common.user)}
            onCancel={() => this.setState({ confirmModal: false })}
            text="Are you sure you want to remove yourself?"
            title="Are you sure?"
          />
        }

        <HeaderRow className="row">
          <Title>
            Members
          </Title>
          <CloseOutlined
            color="#858e96"
            size={24}
            className="button"
            onClick={() => this.props.history.push(`/app/team/${this.props.room.team.id}/room/${this.props.room.id}`)}
          />
        </HeaderRow>
        <Subtitle>
          {this.props.room.members.length} members in this conversation
        </Subtitle>

        <Members className="row align-items-start wrap">
          {this.props.room.members.map((member, index) => {
            return (
              <Avatar
                className="mr-5 mb-5"
                size="medium"
                circle
                image={member.user.image}
                outlineOuterColor={this.props.common.user.id == member.user.id ? "#007AF5" : null}
                outlineInnerColor="#FFFFFF"
                title={member.user.name}
                key={index}
                onDeleteClick={() => this.props.common.user.id != member.user.id ? this.deleteRoomMember(member.user) : this.setState({ confirmModal: true })}
                deleteIcon={
                  <IconComponentClose
                    color="white"
                    size={16}
                  />
                }
              />
            )
          })}

          <QuickUserComponent
            teamId={this.props.team.id}
            visible={this.state.userMenu}
            width={250}
            direction="right-bottom"
            handleDismiss={() => this.setState({ userMenu: false })}
            handleAccept={({ user }) => this.createRoomMember(user)}>
            <Avatar
              className="mr-5 mb-5"
              size="medium"
              circle
              image={null}
              color="#007AF5"
              title=""
              onClick={() => this.setState({ userMenu:true })}>
              <AddOutlined
                fill="#007AF5"
                size={16}
              />
            </Avatar>
          </QuickUserComponent>
        </Members>

        <Button
          disabled={false}
          text="Manage Users"
          className="hide"
          onClick={() => this.setState({ userMenu:true })}
        />
      </Container>
    )
  }
}

MembersPartial.propTypes = {
  team: PropTypes.any,
  room: PropTypes.any,
  common: PropTypes.any,
  createRoomMember: PropTypes.func,
  deleteRoomMember: PropTypes.func,
}

const mapDispatchToProps = {
  createRoomMember: user => createRoomMember(user),
  deleteRoomMember: user => deleteRoomMember(user),
}

const mapStateToProps = state => {
  return {
    common: state.common,
    team: state.team,
    room: state.room,
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(MembersPartial)
