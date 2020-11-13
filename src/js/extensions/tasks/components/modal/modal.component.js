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
import {
  updateChannel,
  createChannelMessage,
  updateChannelMessageTaskAttachment,
  deleteChannelMessageTaskAttachment,
  updateChannelCreateTask,
  updateChannelUpdateTask,
  updateChannelDeleteTask,
  hydrateTask,
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
      taskOrder: {},
      tasks: [
        { order: 0, id: '1', title: 'Everything:', description: 'none', done: false, hide: false },
        { order: 1, id: '2', title: 'This is task one', description: 'none', done: false, hide: false },
        { order: 2, id: '3', title: 'And then this is task 2', description: 'none', done: true, hide: false },
        { order: 4, id: '22', title: 'wedwde wed wed wed wd', description: 'none', done: false, hide: false },
        { order: 5, id: '33', title: 'wed wed', description: 'none', done: true, hide: false },
        { order: 7, id: '25', title: 'wed wed wded:', description: 'none', done: false, hide: false },
        { order: 8, id: '36', title: 'And thenwedwed wd wed w2', description: 'none', done: true, hide: false },
        { order: 10, id: '28', title: 'This iwedwd wed we dwe dwed wed e', description: 'none', done: false, hide: false },
        { order: 11, id: '39', title: 'And then this iswed wedw ed wdw edk 2', description: 'none', done: true, hide: false },
        { order: 13, id: '211', title: 'Thiswedwedw d wed wd wedwe', description: 'none', done: false, hide: false },
        { order: 14, id: '322', title: 'And then thwedwed w', description: 'none', done: true, hide: false },
        { order: 16, id: 'wed2', title: 'This iswed wed wed wedw edwsk one', description: 'none', done: false, hide: false },
        { order: 17, id: '3wed', title: 'And then thwedwed2', description: 'none', done: true, hide: false },
      ],
    }

    this.composeRef = React.createRef()
    this.fileRef = React.createRef()

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
  }

  async handleFileChange(e) {
    const files = e.target.files || []

    if (files.length == 0) return

    for (let file of files) {
      Keg.keg('compose').refill('uploads', file)
    }
  }

  async handleUpdateTaskUser(user) {
    try {
      const { id } = this.state
      const channelId = this.props.channel.id
      const task = { id, user }

      // Update the API
      await GraphqlService.getInstance().updateTask(id, { user: user ? user.id : null })

      // Update our UI
      this.setState({ user, userPopup: false })

      // Update the task list
      this.props.updateChannelUpdateTask(channelId, task)
    } catch (e) {
      console.log(e)
      logger(e)
    }
  }

  async handleUpdateTaskDueDate(date) {
    try {
      const { id } = this.state
      const dueDate = date
      const channelId = this.props.channel.id
      const task = { id, dueDate }

      // Update the API
      await GraphqlService.getInstance().updateTask(id, { dueDate })

      // Update our UI
      this.setState({
        dueDate: date,
        dueDatePretty: date ? moment(date).fromNow() : null,
        dueDatePopup: false,
      })

      // Update the task list
      this.props.updateChannelUpdateTask(channelId, task)
    } catch (e) {
      console.log(e)
      logger(e)
    }
  }

  async handleUpdateTask() {
    try {
      const { id, done, title, description, files } = this.state

      await GraphqlService.getInstance().updateTask(id, { done, title, description, files })

      const channelId = this.props.channel.id
      const taskId = id
      const task = {
        id,
        done,
        title,
        description,
        files,
      }

      // Update the task if it's been posted on a message
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

  async handleDeleteTask() {
    try {
      const taskId = this.state.id
      const channelId = this.props.channel.id

      // Delete it from the API
      await GraphqlService.getInstance().deleteTask(taskId)

      // Delete it
      this.props.deleteChannelMessageTaskAttachment(channelId, taskId)
      this.props.updateChannelDeleteTask(channelId, taskId)

      // Remove the task
      this.setState({ loading: false, deleteBar: false })

      // Close the modal
      this.props.onClose()
    } catch (e) {
      this.setState({ error: 'Error deleting task' })
    }
  }

  async handleDeleteFile(url) {
    this.setState({
      files: this.state.files.filter(file => file.url != url),
    })
  }

  async setupFileQeueu() {
    // Listen for file changes in attachments
    Keg.keg('compose').tap(
      'uploads',
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

                    // Add the new files & increase the index
                    // And pour again to process the next file
                    this.setState(
                      {
                        files: [...this.state.files, file],
                      },
                      () => pour()
                    )
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
        this.handleUpdateTask()
      }
    )
  }

  componentDidMount() {
    this.fetchTask()
    this.setupFileQeueu()
  }

  async fetchTask() {
    try {
      const { taskId } = this.props
      const { data } = await GraphqlService.getInstance().task(taskId)
      const {
        task: { id, description, done, title, user, dueDate, messages, files, tasks },
      } = data

      this.setState({
        id,
        description,
        done,
        title,
        user,
        dueDate: moment(dueDate).toDate(),
        dueDatePretty: dueDate ? moment(dueDate).fromNow() : '',
        messages,
        tasks,
        files,
        loading: false,
      })
    } catch (e) {
      console.log(e)
      this.setState({
        error: 'Error fetching task',
        loading: false,
      })
    }
  }

  onSortEnd({ oldIndex, newIndex }) {
    const { tasks } = this.state
    const updatedTasks = arrayMove(tasks, oldIndex, newIndex)

    // Use the index as the order
    this.setState({
      tasks: updatedTasks.map((task, index) => {
        return { ...task, order: index }
      }),
    })
  }

  render() {
    // Set up the inital user
    // Which in this case is THIS user
    // So add the (You) part
    const initialUser = { ...this.props.user, name: 'Assign to me' }

    return (
      <ModalPortal>
        <Modal position="right" header={false} title="Task" width={800} height="100%" frameless onClose={this.props.onClose}>
          {this.state.error && <Error message={this.state.error} onDismiss={() => this.setState({ error: null })} />}
          {this.state.loading && <Spinner />}
          {this.state.notification && <Notification text={this.state.notification} onDismiss={() => this.setState({ notification: null })} />}

          <div className="task-modal-container">
            <div className="title-bar">
              <CheckboxComponent
                done={this.state.done}
                onClick={() => {
                  this.setState({ done: !this.state.done }, () => this.handleUpdateTask())
                }}
              />

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
                    <div className="date" onClick={() => this.setState({ dueDatePopup: true })}>
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
                          <div className="task-description-markdown" dangerouslySetInnerHTML={{ __html: marked(this.state.description || '<em><em>No description</em></em>') }} />
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="files">
                    {this.state.files.map((file, index) => {
                      return <File key={index} filename={file.filename} url={file.url} onDelete={url => this.handleDeleteFile(url)} />
                    })}
                  </div>

                  <div className="tasks">
                    <TasksComponent
                      tasks={this.state.tasks.sort((a, b) => parseFloat(a.order) - parseFloat(b.order))}
                      createTask={this.handleCreateTask}
                      deleteTask={this.handleDeleteTask}
                      updateTask={this.handleUpdateTask}
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
                  {this.state.messages.map((message, index) => {
                    return <Message key={index} user={message.user} body={message.body} createdAt={message.createdAt} />
                  })}
                </div>

                <div className="compose">
                  <TextareaComponent placeholder="Use *markdown* and press enter" value={this.state.compose} onChange={e => this.setState({ compose: e.target.value })} />
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
          <div className="date">{createdAt}</div>
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
    task: state.task,
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ModalComponent)
