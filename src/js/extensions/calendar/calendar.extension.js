import React, { useState, useEffect, useRef } from 'react'
import { connect } from 'react-redux'
import { useSelector, useDispatch, ReactReduxContext } from 'react-redux'
import './calendar.extension.css'
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
} from '../../actions'
import PropTypes from 'prop-types'
import arrayMove from 'array-move'
import StorageService from '../../services/storage.service'
import { DEVICE } from '../../environment'
import { MIME_TYPES } from '../../constants'
import { classNames, isTaskHeading } from '../../helpers/util'
import dayjs from 'dayjs'
import MonthDayComponent from './components/month-day/month-day.component'

class CalendarExtension extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      error: null,
      notification: null,
      loading: false,
      weeks: [],
      month: '',
      date: new Date(),
    }

    this.forward = this.forward.bind(this)
    this.back = this.back.bind(this)
    this.createDays = this.createDays.bind(this)
  }

  createDays(date) {
    const weeks = []
    const startWeek = dayjs(date).startOf('month')
    const endWeek = dayjs(date)
      .endOf('month')
      .add(1, 'weeks')
    const month = startWeek.format('MMMM')

    for (let week = startWeek; week.isBefore(endWeek); week = week.add(1, 'week')) {
      const days = []
      const startDay = week.startOf('week')
      const endDay = week.endOf('week')

      for (let day = startDay; day.isBefore(endDay); day = day.add(1, 'days')) {
        days.push(day.format('YYYY-MM-DD HH:mm'))
      }

      weeks.push(days)
    }

    this.setState({
      weeks,
      month,
    })
  }

  forward() {
    const date = dayjs(this.state.date)
      .add(1, 'months')
      .toDate()

    this.setState({ date })
    this.createDays(date)
  }

  back() {
    const date = dayjs(this.state.date)
      .subtract(1, 'months')
      .toDate()

    this.setState({ date })
    this.createDays(date)
  }

  componentDidMount() {
    this.createDays()
  }

  render() {
    return (
      <div className="calendar-extension">
        <div className="toolbar row">
          <div className="date-heading">{this.state.month}</div>
          <div className="flexer" />
          <Button text="Back" theme="muted" onClick={this.back} />
          <Button text="Forward" theme="muted" onClick={this.forward} className="ml-5" />
        </div>
        <div className="container">
          {this.state.weeks.map((week, index) => {
            return (
              <div key={index} className="week">
                {week.map((day, index) => {
                  return <MonthDayComponent day={day} key={index} />
                })}
              </div>
            )
          })}
        </div>
      </div>
    )
  }
}

CalendarExtension.propTypes = {
  user: PropTypes.any,
  channel: PropTypes.any,
  team: PropTypes.any,
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
)(CalendarExtension)
