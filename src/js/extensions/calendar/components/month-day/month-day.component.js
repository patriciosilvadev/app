import React from 'react'
import { connect } from 'react-redux'
import dayjs from 'dayjs'
import { Avatar } from '@weekday/elements'
import PropTypes from 'prop-types'
import { classNames } from '../../../../helpers/util'
import { MonthDayTaskComponent } from '../month-day-task/month-day-task.component'
import './month-day.component.css'
import { hydrateTask } from '../../../../actions'

class MonthDayComponent extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      loading: false,
      isToday: false,
      day: '',
      tasks: [],
    }
  }

  static getDerivedStateFromProps(props, state) {
    const today = dayjs()

    return {
      tasks: props.channel.tasks
        .filter(task => !!task.dueDate)
        .filter(task => dayjs(task.dueDate).isValid())
        .filter(task => today.isSame(dayjs(task.dueDate), 'day')),
    }
  }

  componentDidMount() {
    this.setState({
      isToday: dayjs(this.props.day, 'YYYY-MM-DD HH:mm').isSame(dayjs(), 'day'),
      day: dayjs(this.props.day, 'YYYY-MM-DD HH:mm').format('DD'),
    })
  }

  render() {
    const classes = classNames({
      'month-day-component': true,
      'today': this.state.isToday,
    })

    return (
      <div className={classes}>
        <span className="day">{this.state.day}</span>
        <div className="task-container">
          <div style={{ height: 20 }} />
          {this.state.tasks.map(task => {
            return <MonthDayTaskComponent done={task.done} title={task.title} onClick={() => this.props.hydrateTask({ id: task.id })} />
          })}
        </div>
      </div>
    )
  }
}

MonthDayComponent.propTypes = {
  user: PropTypes.any,
  channel: PropTypes.any,
  team: PropTypes.any,
}

const mapDispatchToProps = {
  hydrateTask: task => hydrateTask(task),
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
)(MonthDayComponent)
