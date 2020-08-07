import React, { useState, useEffect, useRef } from 'react'
import { connect } from 'react-redux'
import { useSelector, useDispatch, ReactReduxContext } from 'react-redux'
import './tasks.extension.css'
import { Avatar, Tooltip, Button, Input, Spinner, Error, Notification } from '@weekday/elements'
import { IconComponent } from '../../components/icon.component'
import { getQueryStringValue, logger } from '../../helpers/util'
import GraphqlService from '../../services/graphql.service'
import { updateChannel } from '../../actions'
import PropTypes from 'prop-types'
import TaskComponent from './components/task.component'
import { SortableContainer, SortableElement } from 'react-sortable-hoc'
import arrayMove from 'array-move'
import StorageService from '../../services/storage.service'

const SortableItem = SortableElement(({ task, index, sortIndex, showCompletedTasks }) => {
  return <TaskComponent index={index} sortIndex={sortIndex} id={task.id} title={task.title} done={task.done} new={false} showCompletedTasks={showCompletedTasks} />
})

const SortableList = SortableContainer(({ tasks, showCompletedTasks }) => {
  return (
    <ul>
      {tasks.map((task, index) => (
        <SortableItem key={`item-${task.id}`} index={index} sortIndex={index} task={task} showCompletedTasks={showCompletedTasks} />
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
  }

  async handleCreateTask() {
    try {
      this.setState({
        loading: true,
        error: null,
      })

      const { channelId } = this.state
      const { data } = await GraphqlService.getInstance().createTask(channelId)
      const tasks = data.channelTasks

      this.setState({
        tasks: tasks ? tasks : [],
        loading: false,
      })

      console.log('Updating')

      this.setState({
        tasks: [
          { id: '12342341', title: '1 Get the drag & drop working', done: false },
          { id: '12342342', title: '2 Fix the blank item when dragging', done: true },
          { id: '12342343', title: '3 Enable the button custor wiht hobver', done: false },
        ],
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
      const tasks = data.channelTasks

      this.setState({
        tasks: tasks ? tasks : [],
        loading: false,
      })

      console.log('Updating')

      this.setState({
        tasks: [
          { id: '12342341', title: '1 Get the drag & drop working', done: false },
          { id: '12342342', title: '2 Fix the blank item when dragging', done: true },
          { id: '12342343', title: '3 Enable the button custor wiht hobver', done: false },
        ],
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
          <SortableList helperClass="sortableHelper" pressDelay={200} tasks={this.state.tasks} showCompletedTasks={this.state.showCompletedTasks} onSortEnd={this.onSortEnd} />

          <ul>
            <TaskComponent id="" title="" done={true} new={true} createTask={() => console.log('CREATE!')} showCompletedTasks={true} />
          </ul>
        </div>
      </div>
    )
  }
}

TasksExtension.propTypes = {
  user: PropTypes.any,
  channel: PropTypes.any,
}

const mapDispatchToProps = {
  updateChannel: (channelId, channel) => updateChannel(channelId, channel),
}

const mapStateToProps = state => {
  return {
    user: state.user,
    channel: state.channel,
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(TasksExtension)
