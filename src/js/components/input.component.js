import React from 'react'
import PopupComponent from '../components/popup.component'
import styled from 'styled-components'
import PropTypes from 'prop-types'

const Input = styled.input`
  border: none;
  flex: 1;
  background: transparent;
  color: #acb5bd;
  font-size: 14px;
  font-weight: 400;
  padding: 15px;
  width: 250px;

  &::placeholder {
    color: #acb5bd;
  }
`

class InputContentComponent extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      filter: '',
    }

    this.filterRef = React.createRef()
    this.handleKeyPress = this.handleKeyPress.bind(this)
  }

  handleKeyPress(e) {
    if (e.keyCode == 13) e.preventDefault()
    if (e.keyCode == 13) this.props.handleEnterPress(this.state.filter)
  }

  componentDidMount() {
    this.setState({ filter: '' })
    document.addEventListener('keyup', this.handleKeyPress)
  }

  componentWillUnmount() {
    this.setState({ filter: '' })
    document.removeEventListener('keyup', this.handleKeyPress)
  }

  componentDidUpdate() {
    if (this.filterRef.focus != undefined) this.filterRef.focus()
  }

  // prettier-ignore
  render() {
    return (
      <div className="column flexer">
        <div className="row">
          <Input
            autoFocus
            ref={ref => this.filterRef = ref}
            placeholder={this.props.placeholder || "Enter text"}
            value={this.state.filter}
            onChange={(e) => this.setState({ filter: e.target.value })}
          />
        </div>
      </div>
    )
  }
}

InputContentComponent.propTypes = {
  placeholder: PropTypes.string,
  handleEnterPress: PropTypes.func,
}

export default function InputComponent(props) {
  // prettier-ignore
  return (
    <PopupComponent
      containerStyle={props.containerStyle}
      containerClassName={props.containerClassName}
      visible={props.visible}
      width={props.width || 250}
      direction={props.direction || "left-bottom"}
      handleDismiss={props.handleDismiss}
      content={
        <InputContentComponent
          placeholder={props.placeholder}
          handleEnterPress={props.handleEnterPress}
        />
      }>
      {props.children}
    </PopupComponent>
  )
}

InputComponent.propTypes = {
  containerStyle: PropTypes.string,
  containerClassName: PropTypes.string,
  visible: PropTypes.boolean,
  width: PropTypes.number,
  direction: PropTypes.string,
  handleDismiss: PropTypes.func,
  placeholder: PropTypes.string,
  handleEnterPress: PropTypes.func,
  children: PropTypes.any,
}
