import React from 'react'
import styled from 'styled-components'
import PropTypes from 'prop-types'
import ContextPortal from '../portals/context.portal'
import PopupContentComponent from './popup-content.component'

const Popup = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  align-content: center;
  justify-content: center;
`

export default class PopupComponent extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      visible: props.visible,
    }

    this.rootRef = React.createRef()
    this.hidePopup = this.hidePopup.bind(this)
  }

  static getDerivedStateFromProps(props, state) {
    return { visible: props.visible }
  }

  hidePopup(e) {
    this.props.handleDismiss()
  }

  render() {
    // If both the props & state are true
    // Initially the state will be populated by the prop = true + true
    // const show = this.state.visible != undefined ? this.props.manual : this.state.show
    // We DUPLICATE the dimnesions of our Popup parent
    const rectangle = this.rootRef.getBoundingClientRect ? this.rootRef.getBoundingClientRect() : null
    const top = rectangle ? rectangle.top : 0
    const left = rectangle ? rectangle.left : 0
    const width = rectangle ? rectangle.width : 0
    const height = rectangle ? rectangle.height : 0

    // prettier-ignore
    return (
      <Popup
        className={this.props.containerClassName ? this.props.containerClassName : null}
        ref={(ref) => this.rootRef = ref}>
        {this.props.children}

        {this.state.visible &&
          <PopupContentComponent
            top={top}
            left={left}
            width={width}
            height={height}
            direction={this.props.direction}
            hidePopup={this.hidePopup}
            content={this.props.content}
            contentWidth={this.props.width}
          />
        }
      </Popup>

    )
  }
}

PopupComponent.propTypes = {
  visible: PropTypes.bool,
  handleDismiss: PropTypes.func,
  containerClassName: PropTypes.string,
  children: PropTypes.any,
  direction: PropTypes.string,
  width: PropTypes.number,
  hidePopup: PropTypes.func,
  content: PropTypes.any,
}