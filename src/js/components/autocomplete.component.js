import React from 'react'
import PopupComponent from '../components/popup.component'
import styled from 'styled-components'
import UserComponent from '../components/user.component'
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

class AutocompleteComponent extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      filter: '',
      position: 0,
      members: [],
    }

    this.filterRef = React.createRef()
    this.handleKeyPress = this.handleKeyPress.bind(this)
  }

  handleKeyPress(e) {
    if (e.keyCode == 38) this.setState({ position: this.state.position - 1 < 0 ? this.state.members.length - 1 : this.state.position - 1 })
    if (e.keyCode == 40) this.setState({ position: this.state.position + 1 == this.state.members.length ? 0 : this.state.position + 1 })
    if (e.keyCode == 13) this.props.handleEnterPress(this.state.members[this.state.position])
  }

  componentDidMount() {
    document.addEventListener('keyup', this.handleKeyPress)

    // Add this to back of the event qeueu
    setTimeout(() => this.filterRef.focus(), 250)
  }

  componentWillUnmount() {
    document.removeEventListener('keyup', this.handleKeyPress)
  }

  componentDidUpdate() {}

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
        direction={this.props.direction || "left-bottom"}
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
            <div className="column flexer scroll w-100">
              {this.state.members.map((member, index) => {
                return (
                  <UserComponent
                    key={index}
                    className="button"
                    active={index == this.state.position}
                    image={member.user.image}
                    color={member.user.color}
                    name={member.user.name}
                    label={"@"+member.user.username}
                    onClick={() => this.props.handleEnterPress(member)}>
                  </UserComponent>
                )
              })}
            </div>
          </div>
        }>

        {this.props.children}
      </PopupComponent>
    )
  }
}

AutocompleteComponent.propTypes = {
  visible: PropTypes.bool,
  handleDismiss: PropTypes.func,
  width: PropTypes.number,
  direction: PropTypes.string,
  handleEnterPress: PropTypes.func,
  members: PropTypes.array,
  children: PropTypes.any,
}
