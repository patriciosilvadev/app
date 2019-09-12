import React from 'react'
import { connect } from 'react-redux'
import ConfirmModal from '../../modals/confirm.modal'
import '../../helpers/extensions'
import { Avatar } from '@weekday/elements'
import AutocompleteComponent from '../../components/autocomplete.component'
import styled from 'styled-components'
import { createRoomMember } from '../../actions'
import PropTypes from 'prop-types'
import { Button } from '@weekday/elements'

const Container = styled.div`
  width: 250px;
  border-left: 1px solid #f1f3f5;
  padding: 25px;
  height: 100%;
`

const Title = styled.div`
  color: #858e96;
  font-size: 12px;
  font-weight: 400;
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
      autocompleteMenu: false,
    }

    this.createRoomMember = this.createRoomMember.bind(this)
    this.deleteRoomMember = this.deleteRoomMember.bind(this)
  }

  createRoomMember(user) {
    this.setState({ autocompleteMenu: false })

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

        <Title>{this.props.room.members.length} members</Title>

        <Members className="row align-items-start wrap">
          {this.props.room.members.map((member, index) => {
            return (
              <Avatar
                className="mr-5 mb-5"
                size="medium"
                circle
                image={member.user.image}
                outline={this.props.common.user.id == member.user.id ? "#007AF5" : null}
                outlineBackground="#FFFFFF"
                title={member.user.name}
                key={index}
                onDeleteClick={() => this.props.common.user.id != member.user.id ? this.deleteRoomMember(member.user) : this.setState({ confirmModal: true })}
              />
            )
          })}
        </Members>

        {this.props.room.team &&
          <AutocompleteComponent
            placeholder="Username"
            members={this.props.team.members}
            visible={this.state.autocompleteMenu}
            width={250}
            direction="right-bottom"
            handleDismiss={() => this.setState({ autocompleteMenu: false })}
            handleEnterPress={(member) => this.createRoomMember(member.user)}>
            <Button
              disabled={false}
              text="Add"
              onClick={() => this.setState({ autocompleteMenu:true })}
            />
          </AutocompleteComponent>
        }
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
