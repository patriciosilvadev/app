import React, { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { IconComponent } from '../../../../components/icon.component'
import { classNames } from '../../../../helpers/util'
import ModalPortal from '../../../../portals/modal.portal'
import * as chroma from 'chroma-js'
import { Input, Textarea, Modal, Tabbed, Notification, Spinner, Error, User, Avatar, Button, Range } from '@weekday/elements'
import marked from 'marked'
import { TextareaComponent } from '../../../../components/textarea.component'
import QuickUserComponent from '../../../../components/quick-user.component'
import DatePicker from 'react-datepicker'
import { connect } from 'react-redux'
import PropTypes from 'prop-types'
import MessageComponent from '../../../../components/message.component'
import GraphqlService from '../../../../services/graphql.service'
import { CheckboxComponent } from '../checkbox/checkbox.component'

import 'react-datepicker/dist/react-datepicker.css'
import './modal.component.css'

class ModalComponent extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      id: '',
      deleteBar: false,
      editDescription: false,
      description: '',
      compose: '',
      title: '',
      dueDate: null,
      userPopup: false,
      assigned: null,
      messages: [],
      files: [],
      loading: true,
      error: null,
      notification: null,
    }
  }

  componentDidMount() {
    this.fetchTask()
  }

  async fetchTask() {
    try {
      const { taskId } = this.props
      const { data } = await GraphqlService.getInstance().task(taskId)
      const {
        task: { id, description, done, title, user, dueDate, messages, files },
      } = data

      this.setState({
        id,
        description,
        done,
        title,
        user,
        dueDate,
        messages,
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

  render() {
    // Set up the inital user
    // Which in this case is THIS user
    // So add the (You) part
    const initialUser = {
      ...this.props.user,
      name: this.props.user.name + ' (you)',
    }

    return (
      <ModalPortal>
        <Modal position="right" header={false} title="Task" width={800} height="100%" frameless onClose={this.props.onClose}>
          {this.state.error && <Error message={this.state.error} onDismiss={() => this.setState({ error: null })} />}
          {this.state.loading && <Spinner />}
          {this.state.notification && <Notification text={this.state.notification} onDismiss={() => this.setState({ notification: null })} />}

          <div className="task-modal-container">
            <div className="title-bar">
              <CheckboxComponent done={this.state.done} onClick={() => this.handleDoneIconClick()} />

              <div style={{ width: 20 }} />

              <QuickUserComponent
                userId={this.props.user.id}
                teamId={this.props.team.id}
                stickyUser={initialUser}
                visible={this.state.userPopup}
                width={250}
                direction="left-bottom"
                handleDismiss={() => this.setState({ userPopup: false })}
                handleAccept={member => {
                  this.setState({
                    assigned: member.user,
                    userPopup: false,
                  })
                }}
              >
                <div className="row showclearonhover">
                  {this.state.assigned && (
                    <div className="clear assigned" onClick={() => this.setState({ assigned: null })}>
                      <IconComponent icon="x" color="#ec224b" size="12" thickness="2" />
                    </div>
                  )}

                  <div className="icon" onClick={() => this.setState({ userPopup: true })}>
                    {!this.state.assigned && (
                      <React.Fragment>
                        <IconComponent icon="profile" color="#524150" size="20" thickness="1.5" />
                        <div className="user">Unassigned</div>
                      </React.Fragment>
                    )}

                    {this.state.assigned && (
                      <div className="assigned-member">
                        <Avatar size="small-medium" image={this.state.assigned.image} title={this.state.assigned.name} className="mb-5 mr-5" />
                        <div className="user">{this.state.assigned.id == this.props.user.id ? this.props.user.name + ' (you)' : this.state.assigned.name}</div>
                      </div>
                    )}
                  </div>
                </div>
              </QuickUserComponent>

              <div className="flexer" />

              <div className="row showclearonhover">
                {this.state.dueDate && (
                  <div className="clear" onClick={() => this.setState({ dueDate: null })}>
                    <IconComponent icon="x" color="#ec224b" size="12" thickness="2" />
                  </div>
                )}

                <DatePicker
                  selected={this.state.dueDate}
                  onChange={date => this.setState({ dueDate: date })}
                  customInput={<DueDateIcon />}
                  placeholderText="This is disabled"
                  dateFormat="MMMM d, yyyy"
                />
              </div>

              <div className="icon" onClick={this.props.onClose}>
                <IconComponent icon="attachment" color="#524150" size="18" thickness="1.5" />
              </div>

              <div className="icon" onClick={this.props.onClose}>
                <IconComponent icon="share" color="#524150" size="18" thickness="1.5" />
              </div>

              <div className="icon" onClick={() => this.setState({ deleteBar: true })}>
                <IconComponent icon="delete" color="#524150" size="18" thickness="1.5" />
              </div>

              <div className="icon" onClick={this.props.onClose}>
                <IconComponent icon="x" color="#524150" size="20" thickness="1.5" />
              </div>
            </div>

            {this.state.deleteBar && (
              <div className="delete-bar">
                <div className="text">Are you sure? This cannot be undone.</div>
                <Button text="Yes" size="small" theme="red" onClick={() => this.setState({ deleteBar: false })} />
                <Button text="No" size="small" theme="red" onClick={() => this.setState({ deleteBar: false })} className="ml-5" />
              </div>
            )}

            <div className="content">
              <div className="title">
                <TextareaComponent placeholder="Task title" value={this.state.title} onChange={e => this.setState({ title: e.target.value })} />
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
                        // this.updateOrCreateTask()
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
                {this.state.files.map(file => {
                  return <File filename={file.filename} url={file.url} onDelete={() => console.log('DELETE')} />
                })}
              </div>
            </div>

            <div className="messages">
              {this.state.messages.map(message => {
                return <Message user={message.user} body={message.body} createdAt={message.createdAt} />
              })}
            </div>

            <div className="compose">
              <TextareaComponent placeholder="Use *markdown* and press enter" value={this.state.compose} onChange={e => this.setState({ compose: e.target.value })} />
            </div>
          </div>
        </Modal>
      </ModalPortal>
    )
  }
}

class DueDateIcon extends React.Component {
  constructor(props) {
    super(props)
  }

  render() {
    return (
      <div className="icon">
        <div className="date" onClick={this.props.onClick}>
          {!!this.props.value ? this.props.value : 'No date'}
        </div>
        <IconComponent icon="calendar" color="#524150" size="18" thickness="1.5" onClick={this.props.onClick} />
      </div>
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
      {over && <IconComponent icon="x" color="#ec224b" size="12" thickness="3" className="button" onClick={onDelete} />}
    </div>
  )
}

ModalComponent.propTypes = {
  user: PropTypes.any,
  channel: PropTypes.any,
  team: PropTypes.any,
  onClose: PropTypes.func,
}

const mapDispatchToProps = {}

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
)(ModalComponent)
