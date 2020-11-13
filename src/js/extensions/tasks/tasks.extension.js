import React, { useState, useEffect, useRef } from 'react'
import { connect } from 'react-redux'
import { useSelector, useDispatch, ReactReduxContext } from 'react-redux'
import './tasks.extension.css'
import { Avatar, Tooltip, Button, Input, Spinner, Error, Notification } from '@weekday/elements'
import { IconComponent } from '../../components/icon.component'
import { getQueryStringValue, logger, getMentions } from '../../helpers/util'
import GraphqlService from '../../services/graphql.service'
import {
  updateChannel,
  createChannelMessage,
  updateChannelMessageTaskAttachment,
  deleteChannelMessageTaskAttachment,
  updateChannelCreateTask,
  updateChannelUpdateTask,
  updateChannelDeleteTask,
  hydrateTask,
} from '../../actions'
import PropTypes from 'prop-types'
import arrayMove from 'array-move'
import StorageService from '../../services/storage.service'
import { DEVICE } from '../../environment'
import { MIME_TYPES } from '../../constants'
import ModalComponent from './components/modal/modal.component'
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

    this.onSortEnd = this.onSortEnd.bind(this)
    this.toggleCompletedTasks = this.toggleCompletedTasks.bind(this)
    this.handleDeleteTask = this.handleDeleteTask.bind(this)
    this.handleUpdateTaskOrder = this.handleUpdateTaskOrder.bind(this)
    this.handleCreateTask = this.handleCreateTask.bind(this)
    this.handleUpdateTask = this.handleUpdateTask.bind(this)
    this.shareToChannel = this.shareToChannel.bind(this)
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
      this.props.updateChannelDeleteTask(channelId, taskId)
    } catch (e) {
      console.log(e)
      this.setState({
        error: 'Error deleting task',
        loading: false,
      })
    }
  }

  async handleUpdateTaskOrder(taskId, order) {
    try {
      // Get the task
      const task = this.props.channel.tasks.filter(task => task.id == taskId)[0]
      const channelId = this.props.channel.id

      // Update the order
      await GraphqlService.getInstance().updateTask(taskId, { order })

      // Update the order on our store (so it reflects)
      this.props.updateChannelUpdateTask(channelId, { ...task, order })
    } catch (e) {
      console.log(e)
    }
  }

  async handleUpdateTask({ id, done, title, description }) {
    try {
      await GraphqlService.getInstance().updateTask(id, { done, title, description })

      const channelId = this.props.channel.id
      const taskId = id
      const task = {
        id,
        done,
        title,
        description,
      }

      // Update the task if it's been posted on a message
      this.props.updateChannelUpdateTask(channelId, task)
      this.props.updateChannelMessageTaskAttachment(channelId, taskId, task)
    } catch (e) {
      logger(e)
    }
  }

  async handleCreateTask({ title }) {
    try {
      this.setState({
        loading: true,
        error: null,
      })

      const channelId = this.props.channel.id
      const order = this.props.channel.tasks.length + 2
      const { data } = await GraphqlService.getInstance().createTask(channelId, { title, order })
      const task = data.createTask

      // Stop the loading
      this.setState({ loading: false })

      // Add it ot he store
      this.props.updateChannelCreateTask(channelId, task)
    } catch (e) {
      logger(e)
      this.setState({
        error: 'Error fetching tasks',
        loading: false,
      })
    }
  }

  onSortEnd({ oldIndex, newIndex }) {
    const taskId = this.state.tasks[oldIndex].id
    let taskOrderAtNewIndex = 0
    let newOrderForTask = 0
    let taskOrderBeforeNewIndex = 0
    let taskOrderAfterNewIndex = 0

    // Generally - take the difference between the new index & the top/bottom one
    // And calucalate mid way
    if (newIndex < oldIndex) {
      // Take the order at index 0 & -1
      if (newIndex == 0) {
        taskOrderAtNewIndex = this.state.tasks[newIndex].order
        newOrderForTask = taskOrderAtNewIndex - 1
      } else {
        taskOrderAtNewIndex = this.state.tasks[newIndex].order
        taskOrderBeforeNewIndex = this.state.tasks[newIndex - 1].order
        newOrderForTask = (taskOrderAtNewIndex + taskOrderBeforeNewIndex) / 2
      }
    } else {
      // Take the highest order & +1
      if (newIndex == this.state.tasks.length - 1) {
        taskOrderAtNewIndex = this.state.tasks[newIndex].order
        newOrderForTask = taskOrderAtNewIndex + 1
      } else {
        taskOrderAtNewIndex = this.state.tasks[newIndex].order
        taskOrderAfterNewIndex = this.state.tasks[newIndex + 1].order
        newOrderForTask = (taskOrderAtNewIndex + taskOrderAfterNewIndex) / 2
      }
    }

    // Update the task list
    this.handleUpdateTaskOrder(taskId, newOrderForTask)
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

  componentDidMount() {
    if (StorageService.getStorage('SHOW_COMPLETED_TASKS')) {
      this.setState({ showCompletedTasks: true })
    } else {
      this.setState({ showCompletedTasks: false })
    }

    setTimeout(() => {
      //this.props.hydrateTask({ id: '5fabcb9e7755c37b8e6f266d' })
    }, 500)
  }

  static getDerivedStateFromProps(props, state) {
    if (props.channel.id == undefined || props.channel.id == '') return null

    const tasks = props.channel.tasks.sort((a, b) => a.order - b.order)

    return { tasks }
  }

  render() {
    const completed = this.props.channel.tasks.filter(task => task.done).length

    return (
      <div className="tasks-extension">
        {this.state.error && <Error message={this.state.error} onDismiss={() => this.setState({ error: null })} />}
        {this.state.loading && <Spinner />}
        {this.state.notification && <Notification text={this.state.notification} onDismiss={() => this.setState({ notification: null })} />}

        <div className="header">
          <div className="title">Tasks</div>
          <div className="progress">
            {completed} / {this.props.channel.tasks.length}
          </div>

          <Button text={this.state.showCompletedTasks ? 'Hide completed' : 'Show completed'} theme="muted" className="mr-25" onClick={() => this.toggleCompletedTasks()} />
        </div>

        <div className="tasks">
          <TasksComponent
            tasks={this.state.tasks}
            deleteTask={this.handleDeleteTask}
            updateTask={this.handleUpdateTask}
            showCompletedTasks={this.state.showCompletedTasks}
            onSortEnd={this.onSortEnd}
            shareToChannel={this.shareToChannel}
            createTask={this.handleCreateTask}
            disableTools={false}
          />
        </div>
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
  updateChannelCreateTask: PropTypes.func,
  updateChannelUpdateTask: PropTypes.func,
  updateChannelDeleteTask: PropTypes.func,
  hydrateTask: PropTypes.func,
}

const mapDispatchToProps = {
  hydrateTask: task => hydrateTask(task),
  createChannelMessage: (channelId, channelMessage) => createChannelMessage(channelId, channelMessage),
  updateChannel: (channelId, channel) => updateChannel(channelId, channel),
  updateChannelMessageTaskAttachment: (channelId, taskId, channelMessageTaskAttachment) => updateChannelMessageTaskAttachment(channelId, taskId, channelMessageTaskAttachment),
  deleteChannelMessageTaskAttachment: (channelId, taskId) => deleteChannelMessageTaskAttachment(channelId, taskId),
  updateChannelCreateTask: (channelId, task) => updateChannelCreateTask(channelId, task),
  updateChannelUpdateTask: (channelId, task) => updateChannelUpdateTask(channelId, task),
  updateChannelDeleteTask: (channelId, taskId) => updateChannelDeleteTask(channelId, taskId),
}

const mapStateToProps = state => {
  return {
    user: state.user,
    channel: state.channel,
    team: state.team,
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(TasksExtension)
