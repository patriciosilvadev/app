import React from 'react'
import { connect } from 'react-redux'
import './task.component.css'
import { Popup, Menu, Avatar } from '@weekday/elements'
import { IconComponent } from '../../../../components/icon.component'
import PropTypes from 'prop-types'
import ConfirmModal from '../../../../modals/confirm.modal'
import { logger } from '../../../../helpers/util'
import GraphqlService from '../../../../services/graphql.service'
import { CheckboxComponent } from '../checkbox/checkbox.component'
import { classNames, isTaskHeading } from '../../../../helpers/util'
import marked from 'marked'
import { hydrateTask } from '../../../../actions'
import QuickUserComponent from '../../../../components/quick-user.component'
import DayPicker from 'react-day-picker'
import 'react-day-picker/lib/style.css'
import * as moment from 'moment'
import dayjs from 'dayjs'

class TaskComponent extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      id: props.id,
      done: props.done,
      title: props.title,
      user: props.assignedUser, // Because props.user is the redux store
      dueDate: props.dueDate,
      dueDatePretty: props.dueDate ? moment(props.dueDate).fromNow() : '',
      heading: isTaskHeading(props.title),
      text: props.new ? '' : props.title,
      description: props.description || '',
      showDescription: false,
      editDescription: false,
      new: props.new,
      menu: false,
      deleteModal: false,
      over: false,
      compose: false,
      childTasksHidden: false,
      userPopup: false,
      dueDatePopup: false,
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

  static getDerivedStateFromProps(props, state) {
    return {
      user: props.assignedUser,
      dueDate: props.dueDate,
      dueDatePretty: props.dueDate ? moment(props.dueDate).fromNow() : '',
    }
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
    this.setState({
      compose: false,
      text: this.state.title,
      heading: isTaskHeading(this.state.title),
    })
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
    const initialUser = { ...this.props.user, name: 'Assign to me' }
    const { id, over, heading, deleteModal, compose, done, title, description, user, dueDate } = this.state
    const newTask = this.state.new
    const classes = classNames({
      'tasks-extension-li': true,
      done,
    })
    const containerClasses = classNames({
      row: true,
      task: true,
      hide: (done && !this.props.showCompletedTasks) || this.props.hide,
      done: done,
      heading,
    })
    const titleTextareaClasses = classNames({
      'task-title': true,
      heading,
    })
    const titleClasses = classNames({
      'flexer': true,
      'button': true,
      'task-title': true,
      heading,
    })
    const textareaClasses = classNames({
      row: true,
      flexer: true,
      hide: compose || newTask ? false : true,
    })

    // Do this every render
    this.adjustHeight()

    return (
      <li className={classes}>
        {deleteModal && (
          <ConfirmModal
            onOkay={() => {
              this.props.deleteTask(id)
              this.setState({ deleteModal: false })
            }}
            onCancel={() => this.setState({ deleteModal: false })}
            text="Are you sure you want to delete this task, it can not be undone?"
            title="Are you sure?"
          />
        )}
        <div
          className={containerClasses}
          onMouseEnter={() => this.setState({ over: true })}
          onMouseLeave={() => {
            this.setState({
              over: false,
              menu: false,
              userPopup: false,
              dueDatePopup: false,
            })
          }}
        >
          {!newTask && !heading && <CheckboxComponent done={done} onClick={() => this.handleDoneIconClick()} />}
          {newTask && <div style={{ width: 30 }} />}
          {heading && <div style={{ width: 20 }} />}
          {!newTask && !heading && <div style={{ width: 10 }} />}

          {heading && (
            <div
              className="children-hide-icon"
              onClick={() => {
                const childTasksHidden = !this.state.childTasksHidden
                this.setState({ childTasksHidden })
                this.props.toggleTasksBelowHeadings(id, childTasksHidden)
              }}
            >
              <IconComponent icon={this.state.childTasksHidden ? 'chevron-right' : 'chevron-down'} color="#11171d" thickness={3} size={16} className="button" />
            </div>
          )}

          <div className={textareaClasses}>
            <textarea
              placeholder="Add task title & press enter. End the title with ':' for headings."
              value={this.state.text}
              className={titleTextareaClasses}
              onKeyUp={this.handleKeyUp}
              onKeyDown={this.handleKeyDown}
              onChange={this.handleComposeChange}
              onBlur={this.handleBlur}
              ref={ref => (this.composeRef = ref)}
            />
          </div>

          {!compose && !newTask && (
            <div
              className={titleClasses}
              onClick={() => {
                this.setState({ compose: true }, () => this.adjustHeight())
              }}
            >
              {title}
            </div>
          )}

          {/* These are the hovers that happen for the task tools */}
          {/* Don't display them for headings or when they are disbales (inside task modal) */}
          {!heading && !this.props.disableTools && (
            <React.Fragment>
              <div className="due-date">{this.state.dueDatePretty}</div>

              {/* Calendar that lets the user select a date */}
              <div className="icon-container">
                {over && !newTask && (
                  <Popup
                    handleDismiss={() => this.setState({ dueDatePopup: false })}
                    visible={this.state.dueDatePopup}
                    width={250}
                    direction="right-bottom"
                    content={
                      <DayPicker
                        selectedDays={dueDate}
                        onDayClick={date => {
                          this.setState({
                            dueDate: moment(date).toDate(),
                            dueDatePretty: moment(date).fromNow(),
                            dueDatePopup: false,
                          })
                        }}
                      />
                    }
                  >
                    <IconComponent icon="calendar" color="#CFD4D9" thickness={2} size={15} className="button" onClick={() => this.setState({ dueDatePopup: true })} />
                  </Popup>
                )}
              </div>

              {/* This is the user popup that displays when you click */}
              {/* on the icon or avatar */}
              <QuickUserComponent
                userId={this.props.user.id}
                teamId={this.props.team.id}
                stickyUser={initialUser}
                visible={this.state.userPopup}
                width={250}
                direction="right-bottom"
                handleDismiss={() => this.setState({ userPopup: false })}
                handleAccept={member => {
                  this.setState({
                    user: member.user,
                    userPopup: false,
                  })
                }}
              >
                <div className="icon-container" onClick={e => this.setState({ userPopup: true })}>
                  {!newTask && !!user && <Avatar size="very-small" image={user.image} title={user.name} className="mb-5 mr-5" />}

                  {over && !newTask && !user && <IconComponent icon="profile" color="#CFD4D9" thickness={2} size={15} className="button" />}
                </div>
              </QuickUserComponent>

              {/* Always display when there is a description */}
              <div className="icon-container">
                {((over && !newTask) || !!description) && (
                  <IconComponent
                    icon={!!description ? 'file-text' : 'file'}
                    color="#CFD4D9"
                    thickness={2}
                    size={13}
                    className="button"
                    onClick={e => this.setState({ showDescription: !this.state.showDescription })}
                  />
                )}
              </div>

              {/* Opens the modal */}
              <div className="icon-container">
                {over && !newTask && <IconComponent icon="pen" color="#CFD4D9" thickness={2} size={13} className="button" onClick={e => this.props.hydrateTask({ id: this.props.id })} />}
              </div>

              <div className="icon-container">
                {over && !newTask && (
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
                            onClick: e => this.props.shareToChannel(id),
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
            </React.Fragment>
          )}
        </div>

        {this.state.showDescription && (
          <div className="column pl-40 pr-20 w-100 mb-10">
            {/* Display the editor */}
            {this.state.editDescription && (
              <textarea placeholder="Add a description with *markdown*" value={description} className="description" onChange={e => this.setState({ description: e.target.value })} />
            )}

            {/* Display the markdown */}
            {!this.state.editDescription && <div className="task-description-markdown" dangerouslySetInnerHTML={{ __html: marked(description || '<em><em>No description</em></em>') }} />}

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
  hide: PropTypes.bool,
  disableTools: PropTypes.bool,
  new: PropTypes.bool,
  createTask: PropTypes.func,
  deleteTask: PropTypes.func,
  updateTask: PropTypes.func,
  user: PropTypes.any,
  dueDate: PropTypes.any,
  sortIndex: PropTypes.number,
  showCompletedTasks: PropTypes.bool,
  shareToChannel: PropTypes.func,
  toggleTasksBelowHeadings: PropTypes.func,
  hydrateTask: PropTypes.func,
  user: PropTypes.any,
  team: PropTypes.any,
}

const mapDispatchToProps = {
  hydrateTask: task => hydrateTask(task),
}

const mapStateToProps = state => {
  return {
    task: state.task,
    user: state.user,
    team: state.team,
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(TaskComponent)
