import React from 'react'
import { connect } from 'react-redux'
import './column.component.css'
import PropTypes from 'prop-types'
import { hydrateTasks, createTasks, hydrateTask } from '../../../../actions'
import arrayMove from 'array-move'
import { sortTasksByOrder, classNames, logger } from '../../../../helpers/util'
import CardComponent from '../card/card.component'

class ColumnComponent extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      over: false,
      tasks: [],
    }

    this.handleDrag = this.handleDrag.bind(this)
    this.handleDragLeave = this.handleDragLeave.bind(this)
    this.handleDrop = this.handleDrop.bind(this)
    this.handleDragOver = this.handleDragOver.bind(this)
  }

  static getDerivedStateFromProps(props, state) {
    // Array is frozen from Redux:
    // https://stackoverflow.com/questions/53420055/error-while-sorting-array-of-objects-cannot-assign-to-read-only-property-2-of/53420326
    const tasks = [...props.tasks]
    const tasksForThisColumn = tasks.filter(task => task.section == props.id)

    return { tasks } //sortTasksByOrder(tasksForThisColumn)
  }

  handleDragLeave(e) {
    e.stopPropagation()
    e.preventDefault()
    this.setState({ over: false })
  }

  handleDragOver(e) {
    e.stopPropagation()
    e.preventDefault()
    this.setState({ over: true })
    this.props.shiftIndex(this.props.index)
  }

  handleDrop(e) {
    this.props.updatePosition(window['section'], this.props.index)
    this.props.shiftIndex(null)
    this.setState({ over: false })
  }

  handleDrag(e) {
    window['section'] = this.props.id
  }

  render() {
    const columnContainerClasses = classNames({
      'column-container': true,
      'shift': this.props.shift,
    })
    return (
      <div
        draggable
        className="board-column"
        onDrop={this.handleDrop}
        onDrag={this.handleDrag}
        onDragLeave={this.handleDragLeave}
        onDragOver={this.handleDragOver}
        style={{
          background: this.state.over ? '#f0f3f5' : 'transparent',
          left: this.props.index * 200,
        }}
      >
        <div className={columnContainerClasses}>
          <div className="column-title">{this.props.title}</div>
          <div className="column-cards">
            {this.state.tasks.map((task, index) => {
              return <CardComponent title={task.title} done={task.done} key={index} />
            })}
          </div>
        </div>
      </div>
    )
  }
}

ColumnComponent.propTypes = {
  user: PropTypes.any,
  channel: PropTypes.any,
  team: PropTypes.any,
  tasks: PropTypes.any,
  hydrateTask: PropTypes.func,
  createTasks: PropTypes.func,
  shift: PropTypes.bool,
  shiftIndex: PropTypes.func,
  id: PropTypes.any,
  order: PropTypes.number,
  index: PropTypes.number,
  title: PropTypes.string,
  updatePosition: PropTypes.func,
}

const mapDispatchToProps = {
  hydrateTask: task => hydrateTask(task),
  createTasks: (channelId, task) => createTasks(channelId, task),
}

const mapStateToProps = state => {
  return {
    user: state.user,
    channel: state.channel,
    team: state.team,
    tasks: state.tasks,
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ColumnComponent)
