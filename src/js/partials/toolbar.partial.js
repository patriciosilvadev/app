import React from 'react'
import { connect } from 'react-redux'
import styled from 'styled-components'
import { Tooltip } from '@weekday/elements'
import { Avatar } from '@weekday/elements'
import RoomModal from '../modals/room.modal'
import PropTypes from 'prop-types'
import { updateRoom } from '../actions'

const Drawer = styled.div`
  height: 100%;
  background: white;
  border-left: 1px solid #f1f3f5;
  box-shadow: 0px 0px 100px 100px rgba(0, 0, 0, 0.05);
  box-shadow: 0px 0px 0px 0px rgba(0, 0, 0, 0);
  position: absolute;
  position: relative;
  right: 0px;
  top: 0px;
  z-index: 1000;
  width: 500px;
  width: 70px;
`

class ToolbarPartial extends React.Component {
  constructor(props) {
    super(props)

    this.state = {}
  }

  // prettier-ignore
  render() {
    return (
      <Drawer className="row">
      </Drawer>
    )
  }
}

ToolbarPartial.propTypes = {
  team: PropTypes.any,
  teams: PropTypes.any,
  room: PropTypes.any,
  common: PropTypes.any,
  updateRoom: PropTypes.func,
}

const mapDispatchToProps = {
  updateRoom: updatedRoom => updateRoom(updatedRoom),
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
