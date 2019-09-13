import React, { useState, useEffect, useCallback } from 'react'
import styled from 'styled-components'
import PropTypes from 'prop-types'
import UserComponent from '../components/user.component'

export default class MembersComponent extends React.Component {
  constructor(props) {
    super(props)

    this.state = { index: 0 }
    this.handleKeyPress = this.handleKeyPress.bind(this)
  }

  handleKeyPress(e) {
    // Move up
    if (e.keyCode == 38) this.setState({ index: this.state.index - 1 < 0 ? this.props.members.length - 1 : this.state.index - 1 })

    // Move down
    if (e.keyCode == 40) this.setState({ index: this.state.index + 1 == this.props.members.length ? 0 : this.state.index + 1 })

    // Press enter
    if (e.keyCode == 13) this.props.members.length > 0 ? this.props.handleAccept(this.props.members[this.state.index]) : null
  }

  componentDidMount() {
    document.addEventListener('keyup', this.handleKeyPress)
  }

  componentWillUnmount() {
    document.removeEventListener('keyup', this.handleKeyPress)
  }

  render() {
    return (
      <React.Fragment>
        {this.props.members.map((member, index) => {
          return (
            <UserComponent
              key={index}
              active={index == this.state.index}
              image={member.user.image}
              color={member.user.color}
              name={member.user.name}
              label={"@"+member.user.username}
              className="button"
              onClick={() => this.props.handleAccept(member)}>
            </UserComponent>
          )
        })}
      </React.Fragment>
    )
  }
}

MembersComponent.propTypes = {
  handleAccept: PropTypes.func,
  members: PropTypes.array,
}
