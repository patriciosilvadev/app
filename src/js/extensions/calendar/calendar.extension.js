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
      weekdays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    }

    this.forward = this.forward.bind(this)
    this.back = this.back.bind(this)
    this.today = this.today.bind(this)
    this.createDays = this.createDays.bind(this)
  }

  createDays(date) {
    const weeks = []
    const month = dayjs(date)
      .startOf('month')
      .format('MMMM')
    let monthStartDay
    let firstDay = dayjs(date).startOf('month')
    let lastDay = dayjs(date).endOf('month')
    let totalWeeks = 6

    // Find which date we need to start on
    while (!monthStartDay) {
      const weekday = firstDay.format('dddd').toUpperCase()
      const targetWeekday = this.state.weekdays[0].toUpperCase()
      if (weekday == targetWeekday) monthStartDay = firstDay
      firstDay = firstDay.subtract(1, 'days')
    }

    for (let week = 0; week < totalWeeks; week++) {
      const days = []
      const startDay = monthStartDay.add(week, 'weeks')
      const endDay = startDay.endOf('week').add(1, 'days')

      for (let day = startDay; day.isBefore(endDay); day = day.add(1, 'days')) {
        days.push(day)
      }

      // Ignore weeks that are totally in the next month
      if (startDay.isBefore(lastDay)) weeks.push(days)
    }

    this.setState({
      weeks,
      month,
    })
  }

  today() {
    const date = new Date()
    this.createDays(date)
    this.setState({ date })
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
    this.today()
  }

  render() {
    return (
      <div className="calendar-extension">
        <div className="toolbar row">
          <div className="date-heading">{this.state.month}</div>
          <div className="flexer" />
          <Button text="Today" theme="muted" onClick={this.today} />
          <Button text="Back" theme="muted" onClick={this.back} className="ml-5" />
          <Button text="Forward" theme="muted" onClick={this.forward} className="ml-5" />
        </div>
        <div className="weekdays">
          {this.state.weekdays.map((weekday, index) => {
            return (
              <div className="weekday" key={index}>
                {weekday}
              </div>
            )
          })}
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
