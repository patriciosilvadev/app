import React from 'react'
import { connect } from 'react-redux'
import dayjs from 'dayjs'
import { Avatar } from '@weekday/elements'
import PropTypes from 'prop-types'
import { classNames, logger } from '../../../../helpers/util'
import { MonthDayTaskComponent } from '../month-day-task/month-day-task.component'
import './month-day.component.css'
import { hydrateTask } from '../../../../actions'
import { WEEKDAY_DRAGGED_TASK_ID } from '../../../../constants'
import GraphqlService from '../../../../services/graphql.service'
import { updateTasks, updateTask } from '../../../../actions'

class MonthDayComponent extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      loading: false,
      isToday: false,
      day: '',
      tasks: [],
      date: null,
      over: false,
    }

    this.handleDragLeave = this.handleDragLeave.bind(this)
    this.handleDrop = this.handleDrop.bind(this)
    this.handleDragOver = this.handleDragOver.bind(this)
    this.handleTaskUpdateOnDragStop = this.handleTaskUpdateOnDragStop.bind(this)
  }

  async handleTaskUpdateOnDragStop() {
    try {
      const taskId = window[WEEKDAY_DRAGGED_TASK_ID]
      const { date } = this.state
      const task = { id: taskId, dueDate: date }
      const channelId = this.props.channel.id

      if (!taskId) return

      // Update the API
      await GraphqlService.getInstance().updateTask(taskId, { dueDate: date })

      // Update the task list
      this.props.updateTasks(channelId, task)
      this.props.updateTask(taskId, task, channelId)

      // Reset this
      window[WEEKDAY_DRAGGED_TASK_ID] = null
    } catch (e) {
      logger(e)
    }
  }

  handleDragLeave(e) {
    e.stopPropagation()
    e.preventDefault()
    this.setState({ over: false })
  }

  handleDragOver(e) {
    e.stopPropagation()
    e.preventDefault()
    this.setState({ over: true })
  }

  handleDrop(e) {
    e.preventDefault()
    this.setState({ over: false })
    this.handleTaskUpdateOnDragStop()
  }

  static getDerivedStateFromProps(props, state) {
    const today = props.day
    const date = props.day.toDate()
    const isToday = today.isSame(dayjs(), 'day')
    const day = props.day.format('DD')
    const tasks = props.tasks
      .filter(task => !!task.dueDate)
      .filter(task => dayjs(task.dueDate).isValid())
      .filter(task => today.isSame(dayjs(task.dueDate), 'day'))

    return {
      date,
      day,
      tasks,
      isToday,
    }
  }

  render() {
    const classes = classNames({
      'month-day-component': true,
      'today': this.state.isToday,
      'over': this.state.over,
    })

    return (
      <div onDrop={this.handleDrop} onDragLeave={this.handleDragLeave} onDragOver={this.handleDragOver} className={classes}>
        <span className="day">{this.state.day}</span>
        <div className="task-container">
          <div style={{ height: 20 }} />
          {this.state.tasks.map((task, index) => {
            return (
              <MonthDayTaskComponent
                key={index}
                channelId={this.props.channel.id}
                id={task.id}
                user={task.user}
                done={task.done}
                title={task.title}
                onClick={() => this.props.hydrateTask({ id: task.id })}
              />
            )
          })}
        </div>
      </div>
    )
  }
}

MonthDayComponent.propTypes = {
  user: PropTypes.any,
  channel: PropTypes.any,
  team: PropTypes.any,
  tasks: PropTypes.any,
}

const mapDispatchToProps = {
  hydrateTask: task => hydrateTask(task),
  updateTasks: (channelId, task) => updateTasks(channelId, task),
  updateTask: (taskId, task, channelId) => updateTask(taskId, task, channelId),
}

const mapStateToProps = state => {
  return {
    user: state.user,
    channel: state.channel,
    team: state.team,
    tasks: state.tasks,
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(MonthDayComponent)
