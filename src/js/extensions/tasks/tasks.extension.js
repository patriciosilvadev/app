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

class TasksExtension extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      channelId: 0,
      error: null,
      notification: null,
      loading: false,
      tasks: [],
      title: '',
    }

    this.fetchChannelTasks = this.fetchChannelTasks.bind(this)
    this.renderNoTasks = this.renderNoTasks.bind(this)
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
    } catch (e) {
      logger(e)
      this.setState({
        error: 'Error fetching tasks',
        loading: false,
      })
    }
  }

  componentDidUpdate(prevProps) {
    // Only fethc if this is new
    if (this.props.channel.id != this.state.channelId) {
      this.setState({ channelId: this.props.channel.id }, () => this.fetchChannelTasks())
    }
  }

  componentDidMount() {
    console.warn('TASKS EXT')
  }

  renderNoTasks() {
    if (this.state.tasks.length > 0) return null

    return (
      <div className="no-tasks">
        <img src="icon-muted.svg" height="200" className="mb-20" />
        <div className="pb-30 color-d0 h5">There are no tasks yet - add one now!</div>
        <div className="row w-100 pl-30 pr-30 pt-10 pb-10">
          <Input placeholder="Enter task title" inputSize="large" value={this.state.title} onChange={e => this.setState({ title: e.target.value })} className="mb-20" />
        </div>
        <Button text="Add now" size="large" theme="muted" onClick={() => this.startCall()} />
      </div>
    )
  }

  render() {
    return (
      <div className="tasks-extension">
        {this.state.error && <Error message={this.state.error} onDismiss={() => this.setState({ error: null })} />}
        {this.state.loading && <Spinner />}
        {this.state.notification && <Notification text={this.state.notification} onDismiss={() => this.setState({ notification: null })} />}
        <div className="header">
          <div className="title">Tasks</div>
          <div className="flexer"></div>
        </div>

        {this.renderNoTasks()}
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
