import React from 'react'
import styled from 'styled-components'
import ContextPortal from '../portals/context.portal'
import PropTypes from 'prop-types'

const PopupContent = styled.div`
  position: absolute;
  z-index: 1000;
  background: white;
  border-radius: 5px;
  overflow: hidden;
  border: 1px solid #ebedef;
  box-shadow: 0px 0px 50px 0px rgba(0,0,0,0.05);
  width: ${props => props.width}px;
  display: flex;

  &.top { top: 0px; left: 0px; transform: translateY(-100%); }
  &.left-top { top: 0px; left: 0px; transform: translateY(-100%); translateX(-100%); }
  &.right-top { top: 0px; right: 0px; transform: translateY(-100%); translateX(0%); }
  &.left-bottom { bottom: 0px; left: 0px; transform: translateY(100%); }
  &.right-bottom { bottom: 0px; right : 0px; transform: translateY(100%); translateX(-100%); }
`

const PopupContentActiveArea = styled.div`
  flex: 1;
  margin-bottom: -3px;
  margin-right: -3px;
`

export default class PopupContentComponent extends React.Component {
  constructor(props) {
    super(props)

    this.wrapperRef = React.createRef()
    this.handleClickOutside = this.handleClickOutside.bind(this)
    this.handleKeyPress = this.handleKeyPress.bind(this)
  }

  handleClickOutside(event) {
    if (!this.wrapperRef) return
    if (!this.wrapperRef.contains) return
    if (this.wrapperRef.contains(event.target)) return
    if (!this.wrapperRef.contains(event.target)) this.props.hidePopup()
  }

  handleKeyPress(e) {
    if (e.keyCode == 27) this.props.hidePopup()
    if (e.keyCode == 13) this.props.hidePopup()
  }

  componentDidMount() {
    document.addEventListener('mousedown', this.handleClickOutside)
    document.addEventListener('keyup', this.handleKeyPress)
  }

  componentWillUnmount() {
    document.removeEventListener('mousedown', this.handleClickOutside)
    document.removeEventListener('keyup', this.handleKeyPress)
  }

  // prettier-ignore
  render() {
    const { top, left, width, height } = this.props

    return (
      <ContextPortal>
        <div style={{ top, left, width, height }} className="absolute">
          <PopupContent
            ref={(ref) => this.wrapperRef = ref}
            width={this.props.contentWidth}
            className={this.props.direction}>

            {/*<PopupContentActiveArea onClick={this.props.hidePopup}>*/}
            <PopupContentActiveArea>
              {this.props.content}
            </PopupContentActiveArea>
          </PopupContent>
        </div>
      </ContextPortal>
    )
  }
}

PopupContentComponent.propTypes = {
  hidePopup: PropTypes.func,
  top: PropTypes.number,
  left: PropTypes.number,
  width: PropTypes.number,
  height: PropTypes.number,
  contentWidth: PropTypes.number,
  direction: PropTypes.string,
  content: PropTypes.any,
}
