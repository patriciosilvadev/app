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

import 'react-datepicker/dist/react-datepicker.css'
import './modal.component.css'

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
        <IconComponent icon="calendar" color="#524150" size="20" thickness="1.5" onClick={this.props.onClick} />
      </div>
    )
  }
}

class ModalComponent extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      deleteBar: false,
      editDescription: false,
      description: '',
      title: '',
      dueDate: null,
      userPopup: true,
      assigned: {
        id: '5e4b6c55c052ed74e32866bb',
        image: 'https://thumbs.dreamstime.com/b/portrait-young-handsome-man-jean-shirt-smiling-looking-camera-crossed-arms-over-white-background-copy-space-96029875.jpg',
        name: 'Stephen Kennedy',
        timezone: 'Africa/Accra',
        username: 'stephen',
      },
    }
  }

  render() {
    return (
      <ModalPortal>
        <Modal position="right" header={false} title="Task" width={800} height="100%" frameless onClose={this.props.onClose}>
          <div className="task-modal-container">
            <div className="title-bar">
              <QuickUserComponent
                userId={this.props.user.id}
                teamId={this.props.team.id}
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
                <div className="row">
                  {this.state.assigned && (
                    <div className="clear assigned" onClick={() => this.setState({ assigned: null })}>
                      <IconComponent icon="x" color="#ec224b" size="8" thickness="3" />
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
                        <div className="user">{this.state.assigned.name}</div>
                      </div>
                    )}
                  </div>
                </div>
              </QuickUserComponent>

              <div className="flexer" />

              <div className="row">
                {this.state.dueDate && (
                  <div className="clear" onClick={() => this.setState({ dueDate: null })}>
                    <IconComponent icon="x" color="#ec224b" size="8" thickness="3" />
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
                <IconComponent icon="share" color="#524150" size="20" thickness="1.5" />
              </div>

              <div className="icon" onClick={() => this.setState({ deleteBar: true })}>
                <IconComponent icon="delete" color="#524150" size="20" thickness="1.5" />
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

                    {/* These are the buttons at the bottom of the description */}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      </ModalPortal>
    )
  }
}

ModalComponent.propTypes = {
  user: PropTypes.any,
  channel: PropTypes.any,
  team: PropTypes.any,
  onClose: PropTypes.func,
}

const mapDispatchToProps = {
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
)(ModalComponent)
