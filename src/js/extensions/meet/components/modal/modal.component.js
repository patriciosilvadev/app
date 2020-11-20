import React, { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { IconComponent } from '../../../../components/icon.component'
import { classNames, logger, getMentions } from '../../../../helpers/util'
import ModalPortal from '../../../../portals/modal.portal'
import * as chroma from 'chroma-js'
import { Popup, Input, Textarea, Modal, Tabbed, Notification, Spinner, Error, User, Menu, Avatar, Button, Range } from '@weekday/elements'
import marked from 'marked'
import { TextareaComponent } from '../../../../components/textarea.component'
import QuickUserComponent from '../../../../components/quick-user.component'
import { connect } from 'react-redux'
import PropTypes from 'prop-types'
import GraphqlService from '../../../../services/graphql.service'
import arrayMove from 'array-move'
import MessagesComponent from '../../../tasks/components/messages/messages.component'
import { TASK_ORDER_INDEX, TASKS_ORDER, DEVICE, MIME_TYPES } from '../../../../constants'
import './modal.component.css'
import EventService from '../../../../services/event.service'
import { hydrateMeet, updateMeetAddMessage } from '../../../../actions'
import DayPicker from 'react-day-picker'
import * as moment from 'moment'
import dayjs from 'dayjs'
import Keg from '@joduplessis/keg'
import UploadService from '../../../../services/upload.service'

class ModalComponent extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      messages: [],
    }

    this.handleCreateMessage = this.handleCreateMessage.bind(this)
    this.fetchMeet = this.fetchMeet.bind(this)
  }

  static getDerivedStateFromProps(props, state) {
    if (!props.meet.id) return null

    // This is the basic state
    let updatedState = {
      messages: props.meet.messages
        ? props.meet.messages.sort((left, right) => {
            return moment.utc(left.createdAt).diff(moment.utc(right.createdAt))
          })
        : [],
    }

    return updatedState
  }

  componentDidUpdate(prevProps) {
    if (this.props.meet.id != prevProps.meet.id) {
      this.fetchTask(this.props.meet.id)
    }
  }

  async handleCreateMessage(files, body) {
    try {
      const { user } = this.props
      const userId = user.id
      const channelId = this.props.channel.id
      const meetId = this.props.meet.id

      // Add the message
      await GraphqlService.getInstance().createMeetMessage(meetId, body, userId, files)

      // Consturct this manually because the document is actually
      // Part of the TaskDocument - so we don't rely on the GQL resolvers
      // to construct the return document for us
      // ie: { new: true } <- won't work for MOngoose
      const createdAt = new Date()
      const message = { body, user, createdAt, files }

      // Add the new subtask to the store
      this.props.updateMeetAddMessage(meetId, message, channelId)
    } catch (e) {
      this.setState({ error: 'Error creating message' })
    }
  }

  componentDidMount() {
    const { taskId } = this.props

    this.fetchTask(taskId)
  }

  async fetchMeet(meetId) {
    try {
      this.setState({ loading: true })

      const { data } = await GraphqlService.getInstance().meet(meetId)
      const {
        meet: { messages },
      } = data
      const id = meetId

      // Set up the local state to use
      this.setState({ loading: false })

      // Update the Redux store
      this.props.hydrateMeet({ id, messages })
    } catch (e) {
      this.setState({
        error: 'Error fetching task',
        loading: false,
      })
    }
  }

  render() {
    return (
      <ModalPortal>
        <Modal position="right" header={false} title="Task" width={800} height="100%" frameless onClose={this.props.onClose}>
          {this.state.error && <Error message={this.state.error} onDismiss={() => this.setState({ error: null })} />}
          {this.state.loading && <Spinner />}
          {this.state.notification && <Notification text={this.state.notification} onDismiss={() => this.setState({ notification: null })} />}

          <div className="meet-modal-container">
            <div className="panels">
              <div className="panel">
                <MessagesComponent messages={this.state.messages} handleCreateMessage={this.handleCreateMessage} />
              </div>
            </div>
          </div>
        </Modal>
      </ModalPortal>
    )
  }
}

ModalComponent.propTypes = {
  meet: PropTypes.any,
  user: PropTypes.any,
  channel: PropTypes.any,
  onClose: PropTypes.func,
  hydrateMeet: PropTypes.func,
  updateMeetAddMessage: PropTypes.func,
}

const mapDispatchToProps = {
  hydrateMeet: meet => hydrateMeet(meet),
  updateMeetAddMessage: (meetId, message, channelId) => updateMeetAddMessage(meetId, message, channelId),
}

const mapStateToProps = state => {
  return {
    user: state.user,
    channel: state.channel,
    meet: state.meet,
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ModalComponent)
