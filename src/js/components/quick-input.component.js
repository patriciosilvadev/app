import React from 'react'
import PopupComponent from '../components/popup.component'
import styled from 'styled-components'
import UserComponent from '../components/user.component'
import MembersComponent from '../components/members.component'
import SpinnerComponent from '../components/spinner.component'
import PropTypes from 'prop-types'
import GraphqlService from '../services/graphql.service'

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

export default class QuickInputComponent extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      filter: '',
    }

    this.filterRef = React.createRef()
    this.handleKeyDown = this.handleKeyDown.bind(this)
  }

  handleKeyDown(e) {
    if (e.keyCode == 27) this.props.handleDismiss()
    if (e.keyCode == 13) {
      this.props.handleAccept(this.state.filter)
      this.setState({ filter: '' })
    }
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
                onKeyDown={this.handleKeyDown}
                placeholder={this.props.placeholder}
                value={this.state.filter}
                onChange={(e) => this.setState({ filter: e.target.value })}
              />
            </div>
          </div>
        }>
        {this.props.children}
      </PopupComponent>
    )
  }
}

QuickInputComponent.propTypes = {
  visible: PropTypes.bool,
  handleDismiss: PropTypes.func,
  width: PropTypes.number,
  direction: PropTypes.string,
  placeholder: PropTypes.string,
  handleAccept: PropTypes.func,
  children: PropTypes.any,
}
