import React from 'react'
import { connect } from 'react-redux'
import './task.component.css'
import { Popup, Menu } from '@weekday/elements'
import { IconComponent } from '../../../../components/icon.component'
import PropTypes from 'prop-types'
import ConfirmModal from '../../../../modals/confirm.modal'
import { logger } from '../../../../helpers/util'
import GraphqlService from '../../../../services/graphql.service'
import { CheckboxComponent } from '../checkbox/checkbox.component'
import { classNames } from '../../../../helpers/util'
import marked from 'marked'

class TaskComponent extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      id: props.id,
      done: props.done,
      title: props.title,
      text: props.new ? '' : props.title,
      description: props.description || '',
      showDescription: false,
      editDescription: false,
      new: props.new,
      menu: false,
      deleteModal: false,
      over: false,
      compose: false,
    }

    this.composeRef = React.createRef()

    this.handleDoneIconClick = this.handleDoneIconClick.bind(this)
    this.handleKeyUp = this.handleKeyUp.bind(this)
    this.handleKeyDown = this.handleKeyDown.bind(this)
    this.insertAtCursor = this.insertAtCursor.bind(this)
    this.handleComposeChange = this.handleComposeChange.bind(this)
    this.updateOrCreateTask = this.updateOrCreateTask.bind(this)
    this.adjustHeight = this.adjustHeight.bind(this)
    this.handleBlur = this.handleBlur.bind(this)
  }

  insertAtCursor(text) {
    const { selectionStart } = this.composeRef
    const updatedText = [this.state.text.slice(0, selectionStart), text, this.state.text.slice(selectionStart)].join('')

    // Update the text & clos the menu
    // If it was an emoji, close it
    this.setState({ text: updatedText }, () => {
      this.composeRef.focus()
    })
  }

  updateOrCreateTask() {
    const { id, done, text, description } = this.state

    if (this.state.new) {
      this.props.createTask({ title: this.state.text })

      // Reset these
      this.setState({
        compose: false,
        text: '',
        description: '',
      })
    } else {
      // Do the API call
      this.props.updateTask({
        id,
        done,
        title: text,
        description,
      })

      // Update the task here
      this.setState({
        title: text,
        description,
        done,
        compose: false,
      })
    }
  }

  handleBlur(e) {
    this.setState({ compose: false, text: this.state.title })
  }

  // Fires 1st
  handleKeyDown(e) {
    const { keyCode } = e

    // Enter
    if (keyCode == 13) {
      e.preventDefault()
      this.updateOrCreateTask()
    }

    // Escape
    if (keyCode == 27 && this.state.compose) this.setState({ compose: false, text: this.state.title })
  }

  // Fires 2nd
  handleComposeChange(e) {
    const text = e.target.value

    this.setState({ text })
  }

  // Handle the shift being released
  handleKeyUp(e) {}

  componentDidUpdate(prevProps) {
    if (prevProps.title != this.props.title) this.setState({ title: this.props.title })
    if (prevProps.done != this.props.done) this.setState({ done: this.props.done })
  }

  componentDidMount() {}

  handleDoneIconClick() {
    if (this.state.new) {
      // Create a new task - do nothing here
    } else {
      this.setState({ done: !this.state.done }, () => this.updateOrCreateTask())
    }
  }

  adjustHeight() {
    if (this.composeRef) {
      if (this.composeRef.style) {
        this.composeRef.style.height = '1px'
        this.composeRef.style.height = this.composeRef.scrollHeight + 'px'
      }
    }
  }

  render() {
    const classes = classNames({
      row: true,
      task: true,
      hide: this.state.done && !this.props.showCompletedTasks,
      done: this.state.done,
    })
    const textareaClasses = classNames({
      row: true,
      flexer: true,
      hide: this.state.compose || this.state.new ? false : true,
    })

    // Do this every render
    this.adjustHeight()

    return (
      <li>
        {this.state.deleteModal && (
          <ConfirmModal
            onOkay={() => {
              this.props.deleteTask(this.state.id)
              this.setState({ deleteModal: false })
            }}
            onCancel={() => this.setState({ deleteModal: false })}
            text="Are you sure you want to delete this task, it can not be undone?"
            title="Are you sure?"
          />
        )}
        <div onMouseEnter={() => this.setState({ over: true })} onMouseLeave={() => this.setState({ over: false, menu: false })} className={classes}>
          {!this.state.new && <CheckboxComponent done={this.state.done} onClick={() => this.handleDoneIconClick()} />}

          {this.state.new && <div style={{ width: 30 }} />}
          {!this.state.new && <div style={{ width: 10 }} />}

          <div className={textareaClasses}>
            <textarea
              placeholder="Add task title & press enter"
              value={this.state.text}
              className="title"
              onKeyUp={this.handleKeyUp}
              onKeyDown={this.handleKeyDown}
              onChange={this.handleComposeChange}
              onBlur={this.handleBlur}
              ref={ref => (this.composeRef = ref)}
            />
          </div>

          {!this.state.compose && !this.state.new && (
            <div
              className="flexer title button"
              onClick={() => {
                this.setState({ compose: true }, () => this.adjustHeight())
              }}
            >
              {this.state.title}
            </div>
          )}

          <div className="icon-container">
            {((this.state.over && !this.state.new) || !!this.state.description) && (
              <IconComponent
                icon={!!this.state.description ? 'file-text' : 'file'}
                color="#CFD4D9"
                thickness={2}
                size={13}
                className="button"
                onClick={e => this.setState({ showDescription: !this.state.showDescription })}
              />
            )}
          </div>

          <div className="icon-container">
            {this.state.over && !this.state.new && (
              <Popup
                handleDismiss={() => this.setState({ menu: false })}
                visible={this.state.menu}
                width={200}
                direction="right-bottom"
                content={
                  <Menu
                    items={[
                      {
                        text: 'Delete',
                        onClick: e => this.setState({ deleteModal: true }),
                      },
                      {
                        text: 'Share to channel',
                        onClick: e => this.props.shareToChannel(this.state.id),
                      },
                    ]}
                  />
                }
              >
                <IconComponent
                  className="button"
                  icon="more-h"
                  color="#CFD4D9"
                  size={15}
                  thickness={2}
                  onClick={e => {
                    e.stopPropagation()
                    this.setState({ menu: true })
                  }}
                />
              </Popup>
            )}
          </div>
        </div>

        {this.state.showDescription && (
          <div className="column pl-40 pr-20 w-100 mb-10">
            {/* Display the editor */}
            {this.state.editDescription && (
              <textarea placeholder="Add a description with *markdown*" value={this.state.description} className="description" onChange={e => this.setState({ description: e.target.value })} />
            )}

            {/* Display the markdown */}
            {!this.state.editDescription && <div className="task-description-markdown" dangerouslySetInnerHTML={{ __html: marked(this.state.description || 'No description') }} />}

            {/* These are the buttons at the bottom of the description */}
            <div className="row mt-10">
              {!this.state.editDescription && (
                <button className="description-button" onClick={e => this.setState({ editDescription: true })}>
                  Edit
                </button>
              )}

              {this.state.editDescription && (
                <button
                  className="description-button"
                  onClick={e => {
                    this.updateOrCreateTask()
                    this.setState({ editDescription: false })
                  }}
                >
                  Okay
                </button>
              )}

              <button
                className="description-button cancel"
                onClick={e => {
                  this.setState({
                    showDescription: false,
                    editDescription: false,
                  })
                }}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </li>
    )
  }
}

TaskComponent.propTypes = {
  title: PropTypes.string,
  id: PropTypes.string,
  done: PropTypes.bool,
  new: PropTypes.bool,
  createTask: PropTypes.func,
  deleteTask: PropTypes.func,
  updateTask: PropTypes.func,
  sortIndex: PropTypes.number,
  showCompletedTasks: PropTypes.bool,
  shareToChannel: PropTypes.func,
}

const mapDispatchToProps = {}

const mapStateToProps = state => {
  return {}
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(TaskComponent)
