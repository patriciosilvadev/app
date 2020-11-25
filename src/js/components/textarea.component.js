import React from 'react'
import PropTypes from 'prop-types'

export class TextareaComponent extends React.Component {
  constructor(props) {
    super(props)

    this.textareaRef = React.createRef()
  }

  componentDidMount() {
    if (this.textareaRef) {
      if (this.textareaRef.style) {
        this.textareaRef.style.height = '1px'
        this.textareaRef.style.height = this.textareaRef.scrollHeight + 'px'

        if (!!this.props.select) this.textareaRef.select()
      }
    }
  }

  render() {
    if (this.textareaRef) {
      if (this.textareaRef.style) {
        const minHeight = this.textareaRef.scrollHeight == 0 ? 25 : this.textareaRef.scrollHeight
        this.textareaRef.style.height = '1px'
        this.textareaRef.style.height = minHeight + 'px'
      }
    }

    return <textarea ref={ref => (this.textareaRef = ref)} {...this.props} />
  }
}
