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

  render() {
    return (
      <div className="tasks-extension">
        {this.state.error && <Error message={this.state.error} onDismiss={() => this.setState({ error: null })} />}
        {this.state.loading && <Spinner />}
        {this.state.notification && <Notification text={this.state.notification} onDismiss={() => this.setState({ notification: null })} />}

        <div className="header">
          <div className="title">Tasks</div>
          <div className="progress">11 / 32</div>
        </div>

        <div className="column tasks w-100">
          <div className="row task">
            <IconComponent icon="circle" color="#11171D" thickness={1.5} size={16} className="mr-10" />
            <div className="flexer">
              <input placeholder="Add task title & press enter" value="Video extension work - QA on production" onChange={e => this.setState({ title: e.target.value })} className="title" />
            </div>
          </div>
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
