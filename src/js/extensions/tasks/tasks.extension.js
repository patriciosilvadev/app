import React, { useState, useEffect, useRef } from 'react'
import { connect } from 'react-redux'
import { useSelector, useDispatch, ReactReduxContext } from 'react-redux'
import './tasks.extension.css'
import { Avatar, Tooltip, Button, Input, Spinner, Error, Notification } from '@weekday/elements'
import { IconComponent } from '../../components/icon.component'
import { getQueryStringValue, logger, getMentions } from '../../helpers/util'
import GraphqlService from '../../services/graphql.service'
import { updateChannel, createChannelMessage, updateChannelMessageTaskAttachment, deleteChannelMessageTaskAttachment } from '../../actions'
import PropTypes from 'prop-types'
import TaskComponent from './components/task.component'
import { SortableContainer, SortableElement } from 'react-sortable-hoc'
import arrayMove from 'array-move'
import StorageService from '../../services/storage.service'
import { DEVICE } from '../../environment'
import { MIME_TYPES } from '../../constants'

const SortableItem = SortableElement(({ task, index, sortIndex, showCompletedTasks, deleteTask, updateTask, shareToChannel }) => {
  return (
    <TaskComponent
      index={index}
      sortIndex={sortIndex}
      id={task.id}
      title={task.title}
      done={task.done}
      shareToChannel={shareToChannel}
      new={false}
      showCompletedTasks={showCompletedTasks}
      deleteTask={deleteTask}
      updateTask={updateTask}
    />
  )
})

const SortableList = SortableContainer(({ tasks, showCompletedTasks, deleteTask, updateTask, shareToChannel }) => {
  return (
    <ul>
      {tasks.map((task, index) => (
        <SortableItem
          key={`item-${task.id}`}
          index={index}
          sortIndex={index}
          task={task}
          shareToChannel={shareToChannel}
          showCompletedTasks={showCompletedTasks}
          deleteTask={deleteTask}
          updateTask={updateTask}
        />
      ))}
    </ul>
  )
})

class TasksExtension extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      channelId: 0,
      error: null,
      notification: null,
      loading: false,
      tasks: [],
      showCompletedTasks: false,
      title: '',
    }

    this.onSortEnd = this.onSortEnd.bind(this)
    this.fetchChannelTasks = this.fetchChannelTasks.bind(this)
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

      const { channelId } = this.state
      const { data } = await GraphqlService.getInstance().deleteTask(taskId)
      const tasks = data.deleteTask

      // Remove the task
      this.setState({
        tasks: this.state.tasks.filter(task => task.id != taskId),
        loading: false,
      })

      // Delete it
      this.props.deleteChannelMessageTaskAttachment(channelId, taskId)
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
      await GraphqlService.getInstance().updateTask(taskId, { order })
    } catch (e) {
      console.log(e)
    }
  }

  async handleUpdateTask({ id, done, title }) {
    try {
      await GraphqlService.getInstance().updateTask(id, { done, title })

      // Update the state
      this.setState({
        tasks: this.state.tasks.map(task => {
          if (task.id != id) return task

          return {
            ...task,
            title,
            done,
          }
        }),
      })

      // Update the task if it's been posted on a message
      this.props.updateChannelMessageTaskAttachment(this.props.channel.id, id, {
        id,
        done,
        title,
      })
    } catch (e) {
      console.log(e)
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
      const order = this.state.tasks.length
      const { data } = await GraphqlService.getInstance().createTask(channelId, { title, order })
      const task = data.createTask

      this.setState({
        tasks: [...this.state.tasks, task],
        loading: false,
      })
    } catch (e) {
      logger(e)
      this.setState({
        error: 'Error fetching tasks',
        loading: false,
      })
    }
  }

  async fetchChannelTasks() {
    try {
      this.setState({
        loading: true,
        error: null,
      })

      const { channelId } = this.state
      const { data } = await GraphqlService.getInstance().channelTasks(channelId)
      const tasks = data.channelTasks.sort((a, b) => a.order - b.order)

      this.setState({
        tasks: tasks ? tasks : [],
        loading: false,
      })
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
    const highestOrder = this.state.tasks.reduce((acc, task) => (task.order > acc ? task.order : acc), 0)
    const lowestOrder = this.state.tasks.reduce((acc, task) => (task.order < acc ? task.order : acc), 0)
    const taskOrderAtNewIndex = this.state.tasks[newIndex] ? this.state.tasks[newIndex].order : 0
    const taskOrderBeforeNewIndex = this.state.tasks[newIndex - 1] ? this.state.tasks[newIndex - 1].order : 0

    //const currentTaskOrderAtNewIndex = this.state.tasks[newIndex].order
    //const taskOrderAfterThisOne = this.state.tasks[newIndex + 1] ? this.state.tasks[newIndex + 1].order : (highestOrder + 1)
    //const betweenCurrentAndBefore = (currentTaskOrderAtNewIndex - taskOrderBeforeThisOne) / 2
    //const betweenCurrentAndAfter = (taskOrderAfterThisOne - currentTaskOrderAtNewIndex) / 2
    if (newIndex > oldIndex) this.handleUpdateTaskOrder(taskId, taskOrderAtNewIndex + 0.001)
    if (newIndex < oldIndex) {
      if (newIndex == 0) {
        this.handleUpdateTaskOrder(taskId, lowestOrder - 0.001)
      } else {
        this.handleUpdateTaskOrder(taskId, taskOrderBeforeNewIndex + 0.001)
      }
    }

    // Update the task list
    this.setState({
      tasks: arrayMove(this.state.tasks, oldIndex, newIndex),
    })
  }

  componentDidUpdate(prevProps) {
    // Only fethc if this is new
    if (this.props.channel.id != this.state.channelId) {
      this.setState({ channelId: this.props.channel.id }, () => this.fetchChannelTasks())
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

  componentDidMount() {
    if (StorageService.getStorage('SHOW_COMPLETED_TASKS')) {
      this.setState({ showCompletedTasks: true })
    } else {
      this.setState({ showCompletedTasks: false })
    }
  }

  render() {
    const completed = this.state.tasks.filter(task => task.done).length

    return (
      <div className="tasks-extension">
        {this.state.error && <Error message={this.state.error} onDismiss={() => this.setState({ error: null })} />}
        {this.state.loading && <Spinner />}
        {this.state.notification && <Notification text={this.state.notification} onDismiss={() => this.setState({ notification: null })} />}

        <div className="header">
          <div className="title">Tasks</div>
          <div className="progress">
            {completed} / {this.state.tasks.length}
          </div>

          <Button text={this.state.showCompletedTasks ? 'Hide completed' : 'Show completed'} theme="muted" className="mr-25" onClick={() => this.toggleCompletedTasks()} />
        </div>

        <div className="tasks w-100">
          <SortableList
            helperClass="sortableHelper"
            pressDelay={200}
            tasks={this.state.tasks}
            deleteTask={this.handleDeleteTask}
            updateTask={this.handleUpdateTask}
            showCompletedTasks={this.state.showCompletedTasks}
            onSortEnd={this.onSortEnd}
            shareToChannel={this.shareToChannel}
          />

          <ul>
            <TaskComponent id="" title="" done={true} new={true} createTask={this.handleCreateTask} showCompletedTasks={true} />
          </ul>
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
}

const mapDispatchToProps = {
  createChannelMessage: (channelId, channelMessage) => createChannelMessage(channelId, channelMessage),
  updateChannel: (channelId, channel) => updateChannel(channelId, channel),
  updateChannelMessageTaskAttachment: (channelId, taskId, channelMessageTaskAttachment) => updateChannelMessageTaskAttachment(channelId, taskId, channelMessageTaskAttachment),
  deleteChannelMessageTaskAttachment: (channelId, taskId) => deleteChannelMessageTaskAttachment(channelId, taskId),
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