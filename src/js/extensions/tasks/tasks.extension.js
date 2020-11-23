import React, { useState, useEffect, useRef } from 'react'
import { connect } from 'react-redux'
import { useSelector, useDispatch, ReactReduxContext } from 'react-redux'
import './tasks.extension.css'
import { Avatar, Tooltip, Button, Input, Spinner, Error, Notification } from '@weekday/elements'
import { IconComponent } from '../../components/icon.component'
import { sortTasksByOrder, logger, getMentions, findChildTasks, getHighestTaskOrder } from '../../helpers/util'
import GraphqlService from '../../services/graphql.service'
import {
  updateChannel,
  createChannelMessage,
  updateChannelMessageTaskAttachment,
  deleteChannelMessageTaskAttachment,
  createTasks,
  updateTasks,
  deleteTasks,
  hydrateTask,
  hydrateTasks,
} from '../../actions'
import PropTypes from 'prop-types'
import arrayMove from 'array-move'
import StorageService from '../../services/storage.service'
import { DEVICE } from '../../environment'
import { MIME_TYPES } from '../../constants'
import { classNames, isTaskHeading } from '../../helpers/util'
import { TasksComponent } from './components/tasks/tasks.component'

class TasksExtension extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      error: null,
      notification: null,
      loading: false,
      showCompletedTasks: false,
      title: '',
      tasks: [],
    }

    this.toggleCompletedTasks = this.toggleCompletedTasks.bind(this)
    this.handleDeleteTask = this.handleDeleteTask.bind(this)
    this.handleUpdateTaskOrder = this.handleUpdateTaskOrder.bind(this)
    this.handleCreateTask = this.handleCreateTask.bind(this)
    this.handleUpdateTask = this.handleUpdateTask.bind(this)
    this.shareToChannel = this.shareToChannel.bind(this)
    this.fetchTasks = this.fetchTasks.bind(this)
  }

  async shareToChannel(taskId) {
    const body = `> Task details`
    const userName = this.props.user.name
    const userId = this.props.user.id
    const excerpt = userName.toString().split(' ')[0] + ': ' + body || body
    const teamId = this.props.team.id
    const channelId = this.props.channel.id
    const device = DEVICE
    const parentId = null
    const mentions = getMentions(body)
    const attachments = [
      {
        name: '',
        uri: taskId,
        preview: '',
        mime: MIME_TYPES.TASKS,
        size: 0,
      },
    ]

    try {
      const { data } = await GraphqlService.getInstance().createChannelMessage({
        device,
        mentions,
        channel: channelId,
        user: userId,
        team: teamId,
        parent: parentId,
        body,
        excerpt,
        attachments,
      })

      // Catch it
      if (!data.createChannelMessage) return logger('data.createChannelMessage is null')

      // The extra values are used for processing other info
      const channelMessage = {
        message: data.createChannelMessage,
        channelId,
        teamId,
      }

      // Create the message
      this.props.createChannelMessage(channelId, channelMessage)
      this.props.updateChannel(channelId, { excerpt })
    } catch (e) {
      console.log(e)
    }
  }

  async handleDeleteTask(taskId) {
    try {
      this.setState({
        loading: true,
        error: null,
      })

      const channelId = this.props.channel.id
      const { data } = await GraphqlService.getInstance().deleteTask(taskId)
      const tasks = data.deleteTask

      // Remove the task
      this.setState({ loading: false })

      // Delete it
      this.props.deleteChannelMessageTaskAttachment(channelId, taskId)
      this.props.deleteTasks(channelId, taskId)
    } catch (e) {
      this.setState({
        error: 'Error deleting task',
        loading: false,
      })
    }
  }

  async handleUpdateTaskOrder({ id, parent, order }) {
    try {
      // Get the task
      const taskId = id
      const task = this.props.tasks.filter(task => task.id == taskId)[0]
      const parentId = parent
      const channelId = this.props.channel.id

      // Update the order
      await GraphqlService.getInstance().updateTask(taskId, { parent, order })

      // Update the order on our store (so it reflects)
      // We don't use the parent object anymore here
      this.props.updateTasks(channelId, { ...task, parentId, order })
    } catch (e) {
      logger(e)
    }
  }

  async handleUpdateTask({ id, done, title }) {
    try {
      const channelId = this.props.channel.id
      const taskId = id
      const task = {
        id,
        done,
        title,
      }

      // Update the task if it's been posted on a message
      this.props.updateTasks(channelId, task)
      this.props.updateChannelMessageTaskAttachment(channelId, taskId, task)

      // OPTIMISTIC UPDATES
      await GraphqlService.getInstance().updateTask(id, { done, title })
    } catch (e) {
      logger(e)
    }
  }

  async handleCreateTask({ title }) {
    if (title.trim() == '') return

    try {
      this.setState({
        loading: true,
        error: null,
      })

      // To accommodate for "" as ID
      const channelId = !!this.props.channel.id ? this.props.channel.id : null
      const teamId = this.props.team.id
      const userId = this.props.user.id
      const order = getHighestTaskOrder(this.props.tasks)
      const { data } = await GraphqlService.getInstance().createTask({ channel: channelId, title, order, user: userId, team: teamId })
      const task = data.createTask

      // Stop the loading
      this.setState({ loading: false })

      // Add it ot he store
      this.props.createTasks(channelId, task)
    } catch (e) {
      logger(e)
      this.setState({
        error: 'Error fetching tasks',
        loading: false,
      })
    }
  }

  toggleCompletedTasks() {
    if (StorageService.getStorage('SHOW_COMPLETED_TASKS')) {
      StorageService.deleteStorage('SHOW_COMPLETED_TASKS')
      this.setState({ showCompletedTasks: false })
    } else {
      StorageService.setStorage('SHOW_COMPLETED_TASKS', 'YES')
      this.setState({ showCompletedTasks: true })
    }
  }

  componentDidUpdate(prevProps) {
    if (this.props.match.params.channelId != prevProps.match.params.channelId) {
      this.fetchTasks()
    }
  }

  componentDidMount() {
    if (StorageService.getStorage('SHOW_COMPLETED_TASKS')) {
      this.setState({ showCompletedTasks: true })
    } else {
      this.setState({ showCompletedTasks: false })
    }

    this.fetchTasks()

    setTimeout(() => {
      // this.props.hydrateTask({ id: '5fb2c319093fedfa527baf76' })
    }, 500)
  }

  async fetchTasks() {
    try {
      const { channelId, teamId } = this.props.match.params
      let searchCriteria = {}

      if (channelId) searchCriteria['channel'] = channelId
      if (teamId) searchCriteria['team'] = teamId

      const { data } = await GraphqlService.getInstance().tasks(searchCriteria)
      this.props.hydrateTasks(data.tasks)
    } catch (e) {
      console.log(e)
      logger(e)
    }
  }

  static getDerivedStateFromProps(props, state) {
    // Array is frozen from Redux:
    // https://stackoverflow.com/questions/53420055/error-while-sorting-array-of-objects-cannot-assign-to-read-only-property-2-of/53420326
    let tasks = sortTasksByOrder(findChildTasks(null, [...props.tasks]))

    return { tasks }
  }

  render() {
    const completed = this.props.tasks.filter(task => task.done).length

    return (
      <div className="tasks-extension">
        {this.state.error && <Error message={this.state.error} onDismiss={() => this.setState({ error: null })} />}
        {this.state.loading && <Spinner />}
        {this.state.notification && <Notification text={this.state.notification} onDismiss={() => this.setState({ notification: null })} />}

        <div className="header">
          <div className="title">Tasks</div>
          <div className="progress">
            {completed} / {this.props.tasks.length}
          </div>

          <Button text={this.state.showCompletedTasks ? 'Hide completed' : 'Show completed'} theme="muted" className="mr-25" onClick={() => this.toggleCompletedTasks()} />
        </div>

        <TasksComponent
          hideChildren={false}
          masterTaskList={this.props.tasks}
          tasks={this.state.tasks}
          createTask={this.handleCreateTask}
          deleteTask={this.handleDeleteTask}
          updateTask={this.handleUpdateTask}
          updateTaskOrder={this.handleUpdateTaskOrder}
          showCompletedTasks={this.state.showCompletedTasks}
          shareToChannel={this.shareToChannel}
          disableTools={false}
          displayChannelName={!!this.props.channel.id ? false : true}
        />
      </div>
    )
  }
}

TasksExtension.propTypes = {
  user: PropTypes.any,
  channel: PropTypes.any,
  team: PropTypes.any,
  updateChannel: PropTypes.func,
  updateChannelMessageTaskAttachment: PropTypes.func,
  deleteChannelMessageTaskAttachment: PropTypes.func,
  createChannelMessage: PropTypes.func,
  createTasks: PropTypes.func,
  updateTasks: PropTypes.func,
  deleteTasks: PropTypes.func,
  hydrateTask: PropTypes.func,
  hydrateTasks: PropTypes.func,
  tasks: PropTypes.any,
}

const mapDispatchToProps = {
  hydrateTask: task => hydrateTask(task),
  createChannelMessage: (channelId, channelMessage) => createChannelMessage(channelId, channelMessage),
  updateChannel: (channelId, channel) => updateChannel(channelId, channel),
  updateChannelMessageTaskAttachment: (channelId, taskId, channelMessageTaskAttachment) => updateChannelMessageTaskAttachment(channelId, taskId, channelMessageTaskAttachment),
  deleteChannelMessageTaskAttachment: (channelId, taskId) => deleteChannelMessageTaskAttachment(channelId, taskId),
  createTasks: (channelId, task) => createTasks(channelId, task),
  updateTasks: (channelId, task) => updateTasks(channelId, task),
  deleteTasks: (channelId, taskId) => deleteTasks(channelId, taskId),
  hydrateTasks: tasks => hydrateTasks(tasks),
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
)(TasksExtension)
