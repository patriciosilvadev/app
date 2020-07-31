import React from 'react'
import { connect } from 'react-redux'
import './task.component.css'
import { Popup, Menu } from '@weekday/elements'
import { IconComponent } from '../../../components/icon.component'
import PropTypes from 'prop-types'
import ConfirmModal from '../../../modals/confirm.modal'

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

    this.handleTaskIconClick = this.handleTaskIconClick.bind(this)
    this.handleKeyUp = this.handleKeyUp.bind(this)
    this.handleKeyDown = this.handleKeyDown.bind(this)
    this.insertAtCursor = this.insertAtCursor.bind(this)
    this.handleComposeChange = this.handleComposeChange.bind(this)
    this.updateOrCreateTask = this.updateOrCreateTask.bind(this)
    this.adjustHeight = this.adjustHeight.bind(this)
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
    if (this.state.new) {
      console.log('Create a task')
    } else {
      console.log('Update a task')
    }

    // Hide the ccompose field
    this.setState({
      compose: false,
      title: this.state.text,
    })
  }

  // Fires 1st
  handleKeyDown(e) {
    const { keyCode } = e

    // Enter
    if (keyCode == 13) this.updateOrCreateTask()

    // Escape
    if (keyCode == 27 && this.state.compose) this.setState({ compose: false, text: this.state.title })
  }

  // Fires 2nd
  handleComposeChange(e) {
    const text = e.target.value

    this.setState({ text })
  }

  // Handle the shift being released
  handleKeyUp(e) {
    // Do nothing here
  }

  componentDidUpdate(prevProps) {}

  componentDidMount() {}

  handleTaskIconClick() {
    if (this.state.new) {
      // Create a new task
    } else {
      this.setState({ done: !this.state.done })
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
            onOkay={() => console.log('Delete')}
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
            onClick={() => this.handleTaskIconClick()}
          />

          <textarea
            placeholder="Add task title & press enter"
            value={this.state.text}
            className={this.state.compose || this.state.new ? 'title' : 'hide title'}
            onKeyUp={this.handleKeyUp}
            onKeyDown={this.handleKeyDown}
            onChange={this.handleComposeChange}
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
                      onClick: e => this.setState({ deleteModal: false }),
                    },
                    {
                      text: 'Share to channel',
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
