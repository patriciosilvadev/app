import React from 'react'
import { connect } from 'react-redux'
import './card.component.css'
import PropTypes from 'prop-types'
import { Avatar } from '@weekday/elements'
import { hydrateTasks, hydrateTask, updateTasks, createTasks } from '../../../../actions'
import arrayMove from 'array-move'
import { sortTasksByOrder, classNames, logger } from '../../../../helpers/util'
import { CheckboxComponent } from '../../../tasks/components/checkbox/checkbox.component'
import { TextareaComponent } from '../../../../components/textarea.component'
import * as moment from 'moment'
import dayjs from 'dayjs'
import GraphqlService from '../../../../services/graphql.service'

let CARD_IMAGE = document.createElement('img')
CARD_IMAGE.src =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24'%3E%3Cpath fill='none' d='M0 0h24v24H0z'/%3E%3Cpath d='M3 13h18v8.002c0 .551-.445.998-.993.998H3.993A.995.995 0 0 1 3 21.002V13zM3 2.998C3 2.447 3.445 2 3.993 2h16.014c.548 0 .993.446.993.998V11H3V2.998zM9 5v2h6V5H9zm0 11v2h6v-2H9z' fill='rgba(149,164,166,1)'/%3E%3C/svg%3E"

class CardComponent extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      compose: '',
      ontop: false,
      under: false,
      over: false,
      dueDatePretty: '',
    }

    this.handleKeyDown = this.handleKeyDown.bind(this)

    this.handleDrag = this.handleDrag.bind(this)
    this.handleDragLeave = this.handleDragLeave.bind(this)
    this.handleDrop = this.handleDrop.bind(this)
    this.handleDragOver = this.handleDragOver.bind(this)
    this.draggableIsCard = this.draggableIsCard.bind(this)
    this.handleDragStart = this.handleDragStart.bind(this)
    this.handleDragEnd = this.handleDragEnd.bind(this)
    this.handleUpdateTaskDone = this.handleUpdateTaskDone.bind(this)
    this.handleCreateTask = this.handleCreateTask.bind(this)
  }

  async handleCreateTask() {
    if (this.state.compose.trim() == '') return

    try {
      const { compose } = this.state
      const { channelId, teamId, highestOrder } = this.props
      const userId = this.props.user.id
      const { data } = await GraphqlService.getInstance().createTask({
        channel: channelId,
        title: compose,
        order: highestOrder,
        user: userId,
        team: teamId,
      })

      // Stop the loading
      this.setState({ compose: '' })

      // Add it ot he store
      this.props.createTasks(channelId, data.createTask)
    } catch (e) {
      logger(e)
    }
  }

  async handleUpdateTaskDone() {
    try {
      const { id } = this.props
      const done = !this.props.done
      const channelId = this.props.channelId

      // Update the task if it's been posted on a message
      this.props.updateTasks(channelId, { id, done })

      // OPTIMISTIC UPDATES
      await GraphqlService.getInstance().updateTask(id, { done })
    } catch (e) {
      console.log(e)
      logger(e)
    }
  }

  static getDerivedStateFromProps(props, state) {
    return {
      dueDatePretty: props.dueDate ? moment(props.dueDate).fromNow() : '',
    }
  }

  handleDragEnd(e) {
    e.stopPropagation()
    e.preventDefault()
    if (!this.draggableIsCard()) return
    this.setState({ over: false })
    window['card'] = null
  }

  handleDragStart(e) {
    e.stopPropagation()
    e.dataTransfer.setDragImage(CARD_IMAGE, 0, 0)

    window['card'] = this.props.id
  }

  draggableIsCard() {
    return window.card !== null && window.card !== undefined
  }

  handleKeyDown(e) {
    // On enter
    if (e.keyCode == 13) {
      e.preventDefault()
      this.handleCreateTask()
      this.setState({ compose: '' })
    }
  }

  handleDragLeave(e) {
    e.stopPropagation()
    e.preventDefault()
    if (!this.draggableIsCard()) return
    this.setState({ over: false })
  }

  handleDragOver(e) {
    e.stopPropagation()
    e.preventDefault()
    if (!this.draggableIsCard()) return
    this.setState({ over: true })
  }

  handleDrop(e) {
    e.stopPropagation()
    e.preventDefault()
    if (!this.draggableIsCard()) return

    const draggedTaskId = window['card']
    const taskIdDraggedOnto = this.props.id

    this.setState({ over: false })
    this.props.handleUpdateTaskOrder(draggedTaskId, taskIdDraggedOnto)

    window['card'] = null
  }

  handleDrag(e) {
    e.stopPropagation()
    e.preventDefault()
  }

  render() {
    const columnCardClasses = classNames({
      'column-card': true,
      'dragged-card': window.card == this.props.id,
    })
    const cardDropClasses = classNames({
      'card-drop': true,
      'over': this.state.over,
    })

    return (
      <div
        id={this.props.id}
        onDragStart={this.handleDragStart}
        onDrop={this.handleDrop}
        onDrag={this.handleDrag}
        onDragLeave={this.handleDragLeave}
        onDragOver={this.handleDragOver}
        onDragEnd={this.handleDragEnd}
        draggable={!this.props.new}
        className={columnCardClasses}
      >
        <div className={cardDropClasses}>
          <div className="card-drop-inner"></div>
        </div>

        {!this.props.new && (
          <div className="card-container">
            <div className="inner">
              <CheckboxComponent done={this.props.done} onClick={this.handleUpdateTaskDone} />
              {!!this.props.user && (
                <div className="card-avatar">
                  <Avatar size="very-small" image={this.props.user.image} title={this.props.user.name} />
                </div>
              )}
              <div className="card-details">
                <div className="card-title" onClick={() => this.props.hydrateTask({ id: this.props.id })}>
                  {this.props.title}
                </div>
                {!!this.state.dueDatePretty && <div className="card-duedate">{this.state.dueDatePretty}</div>}
              </div>
            </div>
          </div>
        )}

        {this.props.new && (
          <div className="card-container-new">
            <TextareaComponent value={this.state.compose} onChange={e => this.setState({ compose: e.target.value })} placeholder="Create new task" onKeyDown={this.handleKeyDown} />
          </div>
        )}
      </div>
    )
  }
}

CardComponent.propTypes = {
  id: PropTypes.string,
  title: PropTypes.string,
  user: PropTypes.any,
  order: PropTypes.number,
  dueDate: PropTypes.any,
  hydrateTask: PropTypes.func,
  updateTasks: PropTypes.func,
  createTasks: PropTypes.func,
  done: PropTypes.bool,
  highestOrder: PropTypes.number,
  channelId: PropTypes.string,
  teamId: PropTypes.string,
  handleUpdateTaskOrder: PropTypes.func,
}

const mapDispatchToProps = {
  hydrateTask: task => hydrateTask(task),
  updateTasks: (channelId, task) => updateTasks(channelId, task),
  createTasks: (channelId, task) => createTasks(channelId, task),
}

const mapStateToProps = state => {
  return {}
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(CardComponent)
