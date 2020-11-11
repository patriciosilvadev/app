import React from 'react'

export class TextareaComponent extends React.Component {
  constructor(props) {
    super(props)

    this.textareaRef = React.createRef()
  }

  render() {
    if (this.textareaRef) {
      if (this.textareaRef.style) {
        this.textareaRef.style.height = '1px'
        this.textareaRef.style.height = this.textareaRef.scrollHeight + 'px'
      }
    }

    return <textarea ref={ref => (this.textareaRef = ref)} {...this.props} />
  }
}
