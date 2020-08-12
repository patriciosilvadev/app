import React from 'react'
import { connect } from 'react-redux'
import './task.component.css'
import { Popup, Menu } from '@weekday/elements'
import { IconComponent } from '../../../components/icon.component'
import PropTypes from 'prop-types'
import ConfirmModal from '../../../modals/confirm.modal'
import { logger } from '../../../helpers/util'
import GraphqlService from '../../../services/graphql.service'

class TaskComponent extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      id: props.id,
      done: props.done,
      title: props.title,
      text: props.new ? '' : props.title,
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
    const { id, done, text } = this.state

    if (this.state.new) {
      this.props.createTask({ title: this.state.text })

      // Reset these
      this.setState({
        compose: false,
        text: '',
      })
    } else {
      // Do the API call
      this.props.updateTask({
        id,
        done,
        title: text,
      })

      // Update the task here
      this.setState({
        title: text,
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

  componentDidUpdate(prevProps) {}

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
    const classNames = this.state.done ? (this.props.showCompletedTasks ? 'row task done' : 'row task done hide') : 'row task'

    // Do this every render
    this.adjustHeight()

    return (
      <li>
        {this.state.deleteModal && (
          <ConfirmModal
            onOkay={() => this.props.deleteTask(this.state.id)}
            onCancel={() => this.setState({ deleteModal: false })}
            text="Are you sure you want to delete this task, it can not be undone?"
            title="Are you sure?"
          />
        )}
        <div onMouseEnter={() => this.setState({ over: true })} onMouseLeave={() => this.setState({ over: false, menu: false })} className={classNames}>
          <IconComponent
            icon={this.state.new ? 'plus-circle' : this.state.done ? 'check-circle' : 'circle'}
            color={this.state.new ? '#CFD4D9' : this.state.done ? '#858E96' : '#11171D'}
            thickness={1.5}
            size={16}
            className="mr-10 button"
            onClick={() => this.handleDoneIconClick()}
          />

          <textarea
            placeholder="Add task title & press enter"
            value={this.state.text}
            className={this.state.compose || this.state.new ? 'title' : 'hide title'}
            onKeyUp={this.handleKeyUp}
            onKeyDown={this.handleKeyDown}
            onChange={this.handleComposeChange}
            onBlur={this.handleBlur}
            ref={ref => (this.composeRef = ref)}
          />

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
                      hide: true,
                      text: 'Share to channel (coming soon)',
                      onClick: e => {
                        //props.onMutedClick()
                      },
                    },
                  ]}
                />
              }
            >
              <IconComponent
                className="button"
                icon="more-h"
                color="#858E96"
                size={15}
                thickness={1.5}
                onClick={e => {
                  e.stopPropagation()
                  this.setState({ menu: true })
                }}
              />
            </Popup>
          )}
        </div>
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
}

const mapDispatchToProps = {}

const mapStateToProps = state => {
  return {}
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(TaskComponent)
