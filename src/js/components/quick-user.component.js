import React from 'react'
import PopupComponent from '../components/popup.component'
import styled from 'styled-components'
import UserComponent from '../components/user.component'
import MembersComponent from '../components/members.component'
import PropTypes from 'prop-types'

const Filter = styled.input`
  border: none;
  flex: 1;
  background: transparent;
  color: #acb5bd;
  font-size: 15px;
  font-weight: 400;
  padding: 15px;
  width: 250px;

  &::placeholder {
    color: #acb5bd;
  }
`

export default class QuickUserComponent extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      filter: '',
      index: 0,
      members: [],
    }

    this.filterRef = React.createRef()
  }

  componentDidUpdate() {
    if (!this.filterRef) return
    if (this.filterRef.focus) this.filterRef.focus()
  }

  static getDerivedStateFromProps(props, state) {
    // Remove the @ sign
    // QuillJS seems to input some weird chars here that
    // we just need to strip out
    const username = state.filter.replace('@', '')

    // Create the Regex test against the remaining word
    // Return if there is no match
    // // Cap them at 5
    const newMembers = props.members.filter((member, index) => member.user.name.toLowerCase().match(new RegExp(username.toLowerCase() + '.*')))

    // Create the brand the state object the component should use
    let newState = { members: newMembers }

    // If the new members array has changed (due to updated text from the user
    // then reset the cursor & start over)
    if (newMembers.length != state.members.length) newState.position = 0

    // Return the state object
    return newState
  }

  // prettier-ignore
  render() {
    return (
      <PopupComponent
        visible={this.props.visible}
        handleDismiss={this.props.handleDismiss}
        width={this.props.width || 250}
        direction={this.props.direction || "right-bottom"}
        content={
          <div className="column flexer">
            <div className="row">
              <Filter
                autoFocus
                ref={ref => this.filterRef = ref}
                placeholder="Search for users"
                value={this.state.filter}
                onChange={(e) => this.setState({ filter: e.target.value })}
              />
            </div>
            <MembersComponent
              members={this.state.members}
              handleAccept={() => this.props.handleAccept(member)}
            />
          </div>
        }>

        {this.props.children}
      </PopupComponent>
    )
  }
}

QuickUserComponent.propTypes = {
  visible: PropTypes.bool,
  handleDismiss: PropTypes.func,
  width: PropTypes.number,
  direction: PropTypes.string,
  handleAccept: PropTypes.func,
  members: PropTypes.array,
  children: PropTypes.any,
}
