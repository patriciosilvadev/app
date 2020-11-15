import React, { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { IconComponent } from '../../../../components/icon.component'
import { classNames, logger, getMentions } from '../../../../helpers/util'
import ModalPortal from '../../../../portals/modal.portal'
import * as chroma from 'chroma-js'
import { Popup, Input, Textarea, Modal, Tabbed, Notification, Spinner, Error, User, Avatar, Button, Range } from '@weekday/elements'
import marked from 'marked'
import { TextareaComponent } from '../../../../components/textarea.component'
import QuickUserComponent from '../../../../components/quick-user.component'
import { connect } from 'react-redux'
import PropTypes from 'prop-types'
import MessageComponent from '../../../../components/message.component'
import GraphqlService from '../../../../services/graphql.service'
import { CheckboxComponent } from '../checkbox/checkbox.component'
import arrayMove from 'array-move'
import { TasksComponent } from '../tasks/tasks.component'
import { TASK_ORDER_INDEX, TASKS_ORDER, DEVICE, MIME_TYPES } from '../../../../constants'
import './modal.component.css'
import EventService from '../../../../services/event.service'
import {
  updateChannel,
  createChannelMessage,
  updateChannelMessageTaskAttachment,
  deleteChannelMessageTaskAttachment,
  updateChannelCreateTask,
  updateChannelUpdateTask,
  updateChannelDeleteTask,
  hydrateTask,
  updateTask,
  updateTaskAddMessage,
} from '../../../../actions'
import DayPicker from 'react-day-picker'
import 'react-day-picker/lib/style.css'
import * as moment from 'moment'
import dayjs from 'dayjs'
import Keg from '@joduplessis/keg'
import UploadService from '../../../../services/upload.service'

class ModalComponent extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      id: props.taskId,
      deleteBar: false,
      editDescription: false,
      description: '',
      compose: '',
      title: '',
      dueDate: null,
      dueDatePretty: '',
      userPopup: false,
      user: null,
      messages: [],
      files: [],
      loading: true,
      error: null,
      notification: null,
      showCompletedTasks: true,
      dueDatePopup: false,
      tasks: [],
      manualScrolling: false,
    }

    this.composeRef = React.createRef()
    this.fileRef = React.createRef()
    this.scrollRef = React.createRef()

    this.fetchTask = this.fetchTask.bind(this)
    this.onSortEnd = this.onSortEnd.bind(this)
    this.shareToChannel = this.shareToChannel.bind(this)
    this.handleDeleteTask = this.handleDeleteTask.bind(this)
    this.handleUpdateTask = this.handleUpdateTask.bind(this)
    this.handleUpdateTaskUser = this.handleUpdateTaskUser.bind(this)
    this.handleUpdateTaskDueDate = this.handleUpdateTaskDueDate.bind(this)
    this.handleBlur = this.handleBlur.bind(this)
    this.handleKeyDown = this.handleKeyDown.bind(this)
    this.handleFileChange = this.handleFileChange.bind(this)
    this.setupFileQeueu = this.setupFileQeueu.bind(this)
    this.handleDeleteFile = this.handleDeleteFile.bind(this)
    this.handleUpdateTaskDone = this.handleUpdateTaskDone.bind(this)
    this.handleUpdateTaskDone = this.handleUpdateTaskDone.bind(this)
    this.handleCreateSubtask = this.handleCreateSubtask.bind(this)
    this.handleDeleteSubtask = this.handleDeleteSubtask.bind(this)
    this.handleUpdateSubtask = this.handleUpdateSubtask.bind(this)
    this.handleUpdateTaskOrder = this.handleUpdateTaskOrder.bind(this)
    this.handleCreateMessage = this.handleCreateMessage.bind(this)
    this.handleKeyDownCompose = this.handleKeyDownCompose.bind(this)
    this.handleScrollEvent = this.handleScrollEvent.bind(this)
    this.scrollToBottom = this.scrollToBottom.bind(this)
  }

  scrollToBottom() {
    // If there is no scroll ref
    if (!this.scrollRef) return

    // If the user is scrolling
    if (this.state.manualScrolling) return

    // Move it right down
    this.scrollRef.scrollTop = this.scrollRef.scrollHeight
  }

  handleScrollEvent(e) {
    // If there is no scroll ref
    if (!this.scrollRef) return

    // If the user scvrolls up - then fetch more messages
    // 0 = the top of the container
    // if (this.messages.nativeElement.scrollTop == 0) this.fetchCourseMessages()

    // Calculate the difference between the bottom & where the user is
    const offsetHeight = this.scrollRef.scrollHeight - this.scrollRef.scrollTop

    // If they are at the bottom: this.scrollRef.offsetHeight >= offsetHeight
    // Toggle whether the user is scrolling or not
    // If not, then we handle the scrolling
    if (this.scrollRef.offsetHeight >= offsetHeight) {
      this.setState({ manualScrolling: false })
    } else {
      this.setState({ manualScrolling: true })
    }
  }

  static getDerivedStateFromProps(props, state) {
    if (!props.task.id) return null

    // This is the basic state
    let updatedState = {
      done: props.task.done,
      user: props.task.user || null,
      dueDate: props.task.dueDate ? moment(props.task.dueDate).toDate() : null,
      dueDatePretty: props.task.dueDate ? moment(props.task.dueDate).fromNow() : '',
      messages: props.task.messages
        ? props.task.messages.sort((left, right) => {
            return moment.utc(left.createdAt).diff(moment.utc(right.createdAt))
          })
        : [],
      files: props.task.files ? props.task.files : [],
      tasks: props.task.tasks ? props.task.tasks.sort((a, b) => a.order - b.order) : [],
    }

    return updatedState
  }

  componentDidUpdate(nextProps) {
    this.scrollToBottom()
  }

  async handleFileChange(e) {
    const files = e.target.files || []

    if (files.length == 0) return

    for (let file of files) {
      Keg.keg('task').refill('files', file)
    }
  }

  async handleUpdateTaskUser(user) {
    try {
      const { id } = this.state
      const taskId = id
      const channelId = this.props.channel.id
      const task = { id, user }

      // Update the API
      await GraphqlService.getInstance().updateTask(id, { user: user ? user.id : null })

      // Update our UI
      this.setState({ userPopup: false })

      // Update the task list
      this.props.updateChannelUpdateTask(channelId, task)
      this.props.updateTask(taskId, task, channelId)
    } catch (e) {
      logger(e)
    }
  }

  async handleUpdateTaskDueDate(date) {
    try {
      const { id } = this.state
      const taskId = id
      const dueDate = date
      const channelId = this.props.channel.id
      const task = { id, dueDate }

      // Update the API
      await GraphqlService.getInstance().updateTask(id, { dueDate })

      // Update our UI
      this.setState({ dueDatePopup: false })

      // Update the task list
      this.props.updateChannelUpdateTask(channelId, task)
      this.props.updateTask(taskId, task, channelId)
    } catch (e) {
      logger(e)
    }
  }

  async handleUpdateTaskDone(done) {
    try {
      const { id } = this.state
      const taskId = id
      const channelId = this.props.channel.id
      const task = { id, done }

      // Update the API
      await GraphqlService.getInstance().updateTask(id, { done })

      // Update the task list
      this.props.updateChannelUpdateTask(channelId, task)
      this.props.updateTask(taskId, task, channelId)
    } catch (e) {
      logger(e)
    }
  }

  async handleUpdateTaskFiles(files) {
    try {
      const { id } = this.state
      const taskId = id
      const channelId = this.props.channel.id
      const task = { id, files }

      // Update the API
      await GraphqlService.getInstance().updateTask(id, { files })

      // Update the task list
      this.props.updateChannelUpdateTask(channelId, task)
      this.props.updateTask(taskId, task, channelId)
    } catch (e) {
      logger(e)
    }
  }

  async handleUpdateTask() {
    try {
      const { id, title, description } = this.state

      await GraphqlService.getInstance().updateTask(id, { title, description })

      const channelId = this.props.channel.id
      const taskId = id
      const task = {
        id,
        title,
        description,
      }

      // Update the task if it's been posted on a message
      this.props.updateTask(taskId, task, channelId)
      this.props.updateChannelUpdateTask(channelId, task)
      this.props.updateChannelMessageTaskAttachment(channelId, taskId, task)
    } catch (e) {
      logger(e)
    }
  }

  async shareToChannel() {
    const taskId = this.state.id
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
      if (!data.createChannelMessage) {
        logger('data.createChannelMessage is null')
        return this.setState({ error: 'Could not create share' })
      }

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
      this.setState({ error: 'Error sharing task' })
    }
  }

  handleKeyDownCompose(e) {
    // On enter
    if (e.keyCode == 13) {
      e.preventDefault()
      this.handleCreateMessage()
    }
  }

  handleKeyDown(e) {
    // On enter
    if (e.keyCode == 13) {
      e.preventDefault()
      this.handleUpdateTask()
    }
  }

  handleBlur(e) {
    this.handleUpdateTask()
  }

  async handleCreateMessage() {
    try {
      const { user } = this.props
      const userId = user.id
      const taskId = this.state.id
      const body = this.state.compose
      const channelId = this.props.channel.id

      // Add the message
      await GraphqlService.getInstance().createTaskMessage(taskId, body, userId)

      // Consturct this manually because the document is actually
      // Part of the TaskDocument - so we don't rely on the GQL resolvers
      // to construct the return document for us
      // ie: { new: true } <- won't work for MOngoose
      const createdAt = new Date()
      const message = { body, user, createdAt }

      // Add the new subtask to the store
      this.props.updateTaskAddMessage(taskId, message, channelId)

      // Scroll to bottom
      this.scrollToBottom()

      // Reset the state
      this.setState({ compose: '' })
    } catch (e) {
      this.setState({ error: 'Error creating message' })
    }
  }

  async handleDeleteSubtask(subtaskId) {
    try {
      const taskId = this.state.id
      const channelId = this.props.channel.id
      const tasks = this.state.tasks.filter(task => task.id != subtaskId)

      await GraphqlService.getInstance().deleteTask(subtaskId)

      // Delete it
      this.props.updateTask(taskId, { tasks }, channelId)
    } catch (e) {
      this.setState({ error: 'Error deleting task' })
    }
  }

  async handleCreateSubtask({ title }) {
    try {
      const parent = this.state.id
      const taskId = parent
      const channelId = this.props.channel.id
      const order = this.props.task.tasks.length + 2
      const { data } = await GraphqlService.getInstance().createTask(channelId, { parent, title, order })
      const task = data.createTask
      const tasks = [...this.props.task.tasks, task]

      // Stop the loading
      this.setState({ loading: false })

      // Add the new subtask to the store
      this.props.updateTask(taskId, { tasks }, channelId)
    } catch (e) {
      this.setState({ error: 'Error creating task' })
    }
  }

  async handleUpdateSubtask({ id, done, title, description }) {
    try {
      // If the user is updating the task to nothing
      // Then delete it
      if (title == '') {
        this.handleDeleteSubtask(id)
      } else {
        // Otherwise update the task
        await GraphqlService.getInstance().updateTask(id, { done, title, description })

        const channelId = this.props.channel.id
        const taskId = this.state.id
        const tasks = this.state.tasks.map(task => {
          if (task.id != id) return task
          if (task.id == id) return { ...task, id, done, title, description }
        })

        // Update the task if it's been posted on a message
        this.props.updateTask(taskId, { tasks }, channelId)
      }
    } catch (e) {
      this.setState({ error: 'Error udpating task' })
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

  async handleUpdateTaskOrder(subtaskId, order) {
    try {
      // Update the order
      await GraphqlService.getInstance().updateTask(subtaskId, { order })

      const channelId = this.props.channel.id
      const taskId = this.state.id
      const tasks = this.state.tasks.map(task => {
        if (task.id != subtaskId) return task
        if (task.id == subtaskId) return { ...task, order }
      })

      // Update the task if it's been posted on a message
      this.props.updateTask(taskId, { tasks }, channelId)
    } catch (e) {
      this.setState({ error: 'Error udpating task order' })
    }
  }

  async handleDeleteTask() {
    try {
      const taskId = this.state.id
      const channelId = this.props.channel.id

      // Delete it from the API
      await GraphqlService.getInstance().deleteTask(taskId)

      // Delete it
      this.props.deleteChannelMessageTaskAttachment(channelId, taskId)
      this.props.updateChannelDeleteTask(channelId, taskId)

      // Close the modal
      this.props.hydrateTask({ id: null })

      // Remove the task
      this.setState({ loading: false, deleteBar: false })
    } catch (e) {
      this.setState({ error: 'Error deleting task' })
    }
  }

  async handleDeleteFile(url) {
    const files = this.state.files.filter(file => file.url != url)
    this.handleUpdateTaskFiles(files)
  }

  async setupFileQeueu() {
    // Listen for file changes in attachments
    Keg.keg('task').tap(
      'files',
      (file, pour) => {
        this.setState({ error: null, loading: true })

        const { name, type, size } = file
        const secured = false

        UploadService.getUploadUrl(name, type, secured)
          .then(raw => raw.json())
          .then(res => {
            const { url } = res

            UploadService.uploadFile(url, file, type)
              .then(upload => {
                const mime = type
                const urlParts = upload.url.split('?')
                const rawUri = urlParts[0]
                let uriParts = rawUri.replace('https://', '').split('/')

                // Remove the first index value (AWS URL)
                uriParts.shift()

                // Combine the KEY for aws
                const uri = uriParts.join('/')

                // Get the signed URL for this key
                UploadService.getSignedGetUrl(uri)
                  .then(raw => raw.json())
                  .then(res1 => {
                    const file = { url: res1.url, filename: name }

                    // Update the files
                    this.handleUpdateTaskFiles([...this.props.task.files, file])

                    // Go to the next
                    pour()
                  })
                  .catch(err => {
                    this.setState({ error: 'Error getting URL', loading: false })
                  })
              })
              .catch(err => {
                this.setState({ error: 'Error getting URL', loading: false })
              })
          })
          .catch(err => {
            this.setState({ error: 'Error getting URL', loading: false })
          })
      },
      () => {
        // This is the empty() callback
        // Stop loading when all is done
        this.setState({ loading: false })
      }
    )
  }

  componentDidMount() {
    this.fetchTask()
    this.setupFileQeueu()

    // Event listener for the scroll
    this.scrollRef.addEventListener('scroll', this.handleScrollEvent)

    // Just need to wait for the DOM to be there
    setTimeout(() => this.scrollToBottom(), 250)
  }

  async fetchTask() {
    try {
      const { taskId } = this.props
      const { data } = await GraphqlService.getInstance().task(taskId)
      const {
        task: { id, description, title, done, dueDate, tasks, files, messages, user },
      } = data

      // Set up the local state to use
      this.setState({ description, title, loading: false })

      // Update the Redux store
      this.props.hydrateTask({
        id,
        description,
        title,
        done,
        dueDate,
        tasks,
        files,
        messages,
        user,
      })
    } catch (e) {
      this.setState({
        error: 'Error fetching task',
        loading: false,
      })
    }
  }

  render() {
    // Set up the inital user
    // Which in this case is THIS user
    // So add the (You) part
    const initialUser = { ...this.props.user, name: 'Assign to me' }
    const dateClasses = classNames({
      date: true,
      overdue: dayjs().isAfter(this.state.dueDate),
    })

    return (
      <ModalPortal>
        <Modal position="right" header={false} title="Task" width={800} height="100%" frameless onClose={this.props.onClose}>
          {this.state.error && <Error message={this.state.error} onDismiss={() => this.setState({ error: null })} />}
          {this.state.loading && <Spinner />}
          {this.state.notification && <Notification text={this.state.notification} onDismiss={() => this.setState({ notification: null })} />}

          <div className="task-modal-container">
            <div className="title-bar">
              <CheckboxComponent done={this.state.done} onClick={() => this.handleUpdateTaskDone(!this.state.done)} />

              <div style={{ width: 20 }} />
              <input type="file" onChange={this.handleFileChange} ref={ref => (this.fileRef = ref)} style={{ display: 'none' }} />

              <QuickUserComponent
                userId={this.props.user.id}
                teamId={this.props.team.id}
                stickyUser={initialUser}
                visible={this.state.userPopup}
                width={250}
                direction="left-bottom"
                handleDismiss={() => this.setState({ userPopup: false })}
                handleAccept={member => this.handleUpdateTaskUser(member.user)}
              >
                <div className="row showclearonhover">
                  {this.state.user && (
                    <div className="clear assigned" onClick={() => this.handleUpdateTaskUser(null)}>
                      <IconComponent icon="x" color="#ec224b" size="12" thickness="2" />
                    </div>
                  )}

                  <div className="icon" onClick={() => this.setState({ userPopup: true })}>
                    {!this.state.user && (
                      <React.Fragment>
                        <IconComponent icon="profile" color="#524150" size="20" thickness="1.5" />
                        <div className="user">Unassigned</div>
                      </React.Fragment>
                    )}

                    {this.state.user && (
                      <div className="assigned-member">
                        <Avatar size="small-medium" image={this.state.user.image} title={this.state.user.name} className="mb-5 mr-5" />
                        <div className="user">{this.state.user.id == this.props.user.id ? this.props.user.name + ' (you)' : this.state.user.name}</div>
                      </div>
                    )}
                  </div>
                </div>
              </QuickUserComponent>

              <div className="flexer" />

              <div className="row showclearonhover">
                {this.state.dueDate && (
                  <div className="clear" onClick={() => this.handleUpdateTaskDueDate(null)}>
                    <IconComponent icon="x" color="#ec224b" size="12" thickness="2" />
                  </div>
                )}

                <Popup
                  handleDismiss={() => this.setState({ dueDatePopup: false })}
                  visible={this.state.dueDatePopup}
                  width={250}
                  direction="right-bottom"
                  content={<DayPicker selectedDays={this.state.dueDate} onDayClick={date => this.handleUpdateTaskDueDate(moment(date).toDate())} />}
                >
                  <div className="icon">
                    <div className={dateClasses} onClick={() => this.setState({ dueDatePopup: true })}>
                      {!!this.state.dueDatePretty ? this.state.dueDatePretty : 'No date'}
                    </div>
                    <IconComponent icon="calendar" color="#524150" size="18" thickness="1.5" onClick={() => this.setState({ dueDatePopup: true })} />
                  </div>
                </Popup>
              </div>

              <div className="icon" onClick={() => this.fileRef.click()}>
                <IconComponent icon="attachment" color="#524150" size="18" thickness="1.5" />
              </div>

              <div className="icon" onClick={this.shareToChannel}>
                <IconComponent icon="share" color="#524150" size="18" thickness="1.5" />
              </div>

              <div className="icon" onClick={() => this.setState({ deleteBar: true })}>
                <IconComponent icon="delete" color="#524150" size="18" thickness="1.5" />
              </div>

              <div className="icon" onClick={() => this.props.hydrateTask({ id: null })}>
                <IconComponent icon="x" color="#524150" size="22" thickness="1.5" />
              </div>
            </div>

            {this.state.deleteBar && (
              <div className="delete-bar">
                <div className="text">Are you sure? This cannot be undone.</div>
                <Button text="No" size="small" theme="red" onClick={() => this.setState({ deleteBar: false })} />
                <Button text="Yes" size="small" theme="red" onClick={() => this.handleDeleteTask()} className="ml-5" />
              </div>
            )}

            <div className="panels">
              <div className="panel" style={{ flex: 1.5 }}>
                <div className="content">
                  <div className="title">
                    <TextareaComponent
                      ref={ref => (this.composeRef = ref)}
                      onBlur={this.handleBlur}
                      onKeyDown={this.handleKeyDown}
                      placeholder="Task title"
                      value={this.state.title}
                      onChange={e => this.setState({ title: e.target.value })}
                    />
                  </div>

                  <div className="description">
                    <div className="heading row">
                      <IconComponent icon="align-left" color="#adb5bd" size="14" thickness="1.5" onClick={this.props.onClose} />

                      <div className="flexer" />

                      {!this.state.editDescription && (
                        <button className="description-button" onClick={e => this.setState({ editDescription: true })}>
                          Edit
                        </button>
                      )}

                      {this.state.editDescription && (
                        <button
                          className="description-button"
                          onClick={e => {
                            this.handleUpdateTask()
                            this.setState({ editDescription: false })
                          }}
                        >
                          Okay
                        </button>
                      )}
                    </div>
                    <div className="textarea">
                      <div className="column w-100">
                        {/* Display the editor */}
                        {this.state.editDescription && (
                          <TextareaComponent
                            placeholder="Add a description with *markdown*"
                            value={this.state.description}
                            className="description"
                            onChange={e => this.setState({ description: e.target.value })}
                          />
                        )}

                        {/* Display the markdown */}
                        {!this.state.editDescription && (
                          <div className="task-description-markdown" dangerouslySetInnerHTML={{ __html: marked(this.props.task.description || '<em><em>No description</em></em>') }} />
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="files">
                    {this.state.files.map((file, index) => {
                      return <File key={index} filename={file.filename} url={file.url} onDelete={url => this.handleDeleteFile(url)} />
                    })}
                  </div>

                  <div className="tasks-toolbar">
                    <div className="bold h5 color-d3">Subtasks</div>
                    <div className="flexer" />
                    <Button
                      size="small"
                      theme="muted"
                      text={this.state.showCompletedTasks ? 'Hide completed' : 'Show completed'}
                      onClick={() => this.setState({ showCompletedTasks: !this.state.showCompletedTasks })}
                    />
                  </div>

                  <div className="tasks">
                    <TasksComponent
                      tasks={this.state.tasks}
                      createTask={this.handleCreateSubtask}
                      deleteTask={this.handleDeleteSubtask}
                      updateTask={this.handleUpdateSubtask}
                      showCompletedTasks={this.state.showCompletedTasks}
                      onSortEnd={this.onSortEnd}
                      shareToChannel={() => console.log('NOPE')}
                      disableTools={true}
                    />
                  </div>
                </div>
              </div>
              <div className="panel">
                <div className="messages">
                  <div className="scrolling">
                    <div className="inner" ref={ref => (this.scrollRef = ref)}>
                      <div style={{ height: '100%' }}></div>

                      {this.state.messages.map((message, index) => {
                        return <Message key={index} user={message.user} body={message.body} createdAt={message.createdAt} />
                      })}
                    </div>
                  </div>
                </div>

                <div className="compose">
                  <TextareaComponent
                    onKeyDown={this.handleKeyDownCompose}
                    placeholder="Use *markdown* and press enter"
                    value={this.state.compose}
                    onChange={e => this.setState({ compose: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>
        </Modal>
      </ModalPortal>
    )
  }
}

const Message = ({ user, body, createdAt }) => {
  return (
    <div className="message">
      <Avatar size="small-medium" image={user.image} title={user.name} className="mb-5 mr-5" />
      <div className="column">
        <div className="row">
          <div className="user">{user.name}</div>
          <div className="date">{moment(createdAt).fromNow()}</div>
        </div>
        <div className="text" dangerouslySetInnerHTML={{ __html: marked(body) }}></div>
      </div>
    </div>
  )
}

const File = ({ filename, url, onDelete }) => {
  const [over, setOver] = useState(false)

  return (
    <div onMouseEnter={() => setOver(true)} onMouseLeave={() => setOver(false)} className="file">
      <IconComponent icon="attachment" color="#adb5bd" size="12" thickness="2" />
      <a href={url} className="filename" target="_blank">
        {filename}
      </a>
      {over && <IconComponent icon="x" color="#ec224b" size="12" thickness="3" className="button" onClick={() => onDelete(url)} />}
    </div>
  )
}

ModalComponent.propTypes = {
  user: PropTypes.any,
  channel: PropTypes.any,
  team: PropTypes.any,
  onClose: PropTypes.func,
  updateChannel: PropTypes.func,
  updateChannelMessageTaskAttachment: PropTypes.func,
  deleteChannelMessageTaskAttachment: PropTypes.func,
  createChannelMessage: PropTypes.func,
  updateChannelCreateTask: PropTypes.func,
  updateChannelUpdateTask: PropTypes.func,
  updateChannelDeleteTask: PropTypes.func,
  hydrateTask: PropTypes.func,
  updateTask: PropTypes.func,
  updateTaskAddMessage: PropTypes.func,
}

const mapDispatchToProps = {
  hydrateTask: task => hydrateTask(task),
  updateTaskAddMessage: (taskId, message, channelId) => updateTaskAddMessage(taskId, message, channelId),
  updateTask: (taskId, updatedTask, channelId) => updateTask(taskId, updatedTask, channelId),
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
    task: state.task,
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ModalComponent)
