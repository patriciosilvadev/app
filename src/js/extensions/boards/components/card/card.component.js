import React from 'react'
import { connect } from 'react-redux'
import './card.component.css'
import PropTypes from 'prop-types'
import { Avatar } from '@weekday/elements'
import { hydrateTasks, hydrateTask, updateTasks, createTasks } from '../../../../actions'
import arrayMove from 'array-move'
import { sortTasksByOrder, classNames, logger } from '../../../../helpers/util'
import { CheckboxComponent } from '../../../tasks/components/checkbox/checkbox.component'
import { TextareaComponent } from '../../../../components/textarea.component'
import * as moment from 'moment'
import dayjs from 'dayjs'
import GraphqlService from '../../../../services/graphql.service'

const CARD_IMAGE_SVG = encodeURI(`
<svg width='115' height='27' viewBox='0 0 235 53' version='1.1' xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' xml:space='preserve' xmlns:serif='http://www.serif.com/' style='fill-rule:evenodd;clip-rule:evenodd;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:1.5;'>
    <g transform='matrix(1,0,0,1,-393.621,-397.641)'>
        <g transform='matrix(1,0,0,1,358.779,380.024)'>
            <g transform='matrix(0.948208,0,0,0.748642,-338.393,-280.074)'>
                <path d='M640.402,405.16C640.402,401.01 637.742,397.641 634.465,397.641L399.558,397.641C396.281,397.641 393.621,401.01 393.621,405.16L393.621,460.583C393.621,464.733 396.281,468.102 399.558,468.102L634.465,468.102C637.742,468.102 640.402,464.733 640.402,460.583L640.402,405.16Z' style='fill:rgb(242,242,242);'/>
            </g>
            <g transform='matrix(0.744185,0,0,0.744185,-249.208,-272.1)'>
                <path d='M405.983,425.789L418.478,438.284L442.616,414.147' style='fill:none;stroke:rgb(195,216,237);stroke-width:10.75px;'/>
            </g>
            <g transform='matrix(1,0,0,1,-362.779,-381.024)'>
                <path d='M471.881,415.536L591.396,415.536' style='fill:none;stroke:rgb(195,216,237);stroke-width:8px;'/>
            </g>
            <g transform='matrix(1,0,0,1,-362.779,-381.024)'>
                <path d='M474.079,434.447L531.735,434.447' style='fill:none;stroke:rgb(195,216,237);stroke-width:8px;'/>
            </g>
        </g>
    </g>
</svg>
`)
let CARD_IMAGE = document.createElement('img')
CARD_IMAGE.src = 'data:image/svg+xml,' + CARD_IMAGE_SVG

class CardComponent extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      compose: '',
      ontop: false,
      under: false,
      over: false,
      dueDatePretty: '',
    }

    this.handleKeyDown = this.handleKeyDown.bind(this)

    this.handleDrag = this.handleDrag.bind(this)
    this.handleDragLeave = this.handleDragLeave.bind(this)
    this.handleDrop = this.handleDrop.bind(this)
    this.handleDragOver = this.handleDragOver.bind(this)
    this.draggableIsCard = this.draggableIsCard.bind(this)
    this.handleDragStart = this.handleDragStart.bind(this)
    this.handleDragEnd = this.handleDragEnd.bind(this)
    this.handleUpdateTaskDone = this.handleUpdateTaskDone.bind(this)
    this.handleCreateTask = this.handleCreateTask.bind(this)
  }

  async handleCreateTask() {
    if (this.state.compose.trim() == '') return

    try {
      const { compose } = this.state
      const { channelId, teamId, highestOrder } = this.props
      const userId = this.props.user.id
      const { data } = await GraphqlService.getInstance().createTask({
        channel: channelId,
        title: compose,
        order: highestOrder,
        user: userId,
        team: teamId,
      })

      // Stop the loading
      this.setState({ compose: '' })

      // Add it ot he store
      this.props.createTasks(channelId, data.createTask)
    } catch (e) {
      logger(e)
    }
  }

  async handleUpdateTaskDone() {
    try {
      const { id } = this.props
      const done = !this.props.done
      const channelId = this.props.channelId

      // Update the task if it's been posted on a message
      this.props.updateTasks(channelId, { id, done })

      // OPTIMISTIC UPDATES
      await GraphqlService.getInstance().updateTask(id, { done })
    } catch (e) {
      console.log(e)
      logger(e)
    }
  }

  static getDerivedStateFromProps(props, state) {
    return {
      dueDatePretty: props.dueDate ? moment(props.dueDate).fromNow() : '',
    }
  }

  handleDragEnd(e) {
    e.stopPropagation()
    e.preventDefault()
    if (!this.draggableIsCard()) return
    this.setState({ over: false })
    window['card'] = null
  }

  handleDragStart(e) {
    e.stopPropagation()
    e.dataTransfer.setDragImage(CARD_IMAGE, 0, 0)

    window['card'] = this.props.id
  }

  draggableIsCard() {
    return window.card !== null && window.card !== undefined
  }

  handleKeyDown(e) {
    // On enter
    if (e.keyCode == 13) {
      e.preventDefault()
      this.handleCreateTask()
      this.setState({ compose: '' })
    }
  }

  handleDragLeave(e) {
    e.stopPropagation()
    e.preventDefault()
    if (!this.draggableIsCard()) return
    this.setState({ over: false })
  }

  handleDragOver(e) {
    e.stopPropagation()
    e.preventDefault()
    if (!this.draggableIsCard()) return
    this.setState({ over: true })
  }

  handleDrop(e) {
    e.stopPropagation()
    e.preventDefault()
    if (!this.draggableIsCard()) return

    const draggedTaskId = window['card']
    const taskIdDraggedOnto = this.props.id

    this.setState({ over: false })
    this.props.handleUpdateTaskOrder(draggedTaskId, taskIdDraggedOnto)

    window['card'] = null
  }

  handleDrag(e) {
    e.stopPropagation()
    e.preventDefault()
  }

  render() {
    const columnCardClasses = classNames({
      'column-card': true,
      'dragged-card': window.card == this.props.id,
    })
    const cardDropClasses = classNames({
      'card-drop': true,
      'over': this.state.over,
    })

    return (
      <div
        id={this.props.id}
        onDragStart={this.handleDragStart}
        onDrop={this.handleDrop}
        onDrag={this.handleDrag}
        onDragLeave={this.handleDragLeave}
        onDragOver={this.handleDragOver}
        onDragEnd={this.handleDragEnd}
        draggable={!this.props.new}
        className={columnCardClasses}
      >
        <div className={cardDropClasses}>
          <div className="card-drop-inner"></div>
        </div>

        {!this.props.new && (
          <div className="card-container">
            <div className="inner">
              <CheckboxComponent done={this.props.done} onClick={this.handleUpdateTaskDone} />
              {!!this.props.user && (
                <div className="card-avatar">
                  <Avatar size="very-small" image={this.props.user.image} title={this.props.user.name} />
                </div>
              )}
              <div className="card-details">
                <div className="card-title" onClick={() => this.props.hydrateTask({ id: this.props.id })}>
                  {this.props.title}
                </div>
                {!!this.state.dueDatePretty && <div className="card-duedate">{this.state.dueDatePretty}</div>}
              </div>
            </div>
          </div>
        )}

        {this.props.new && (
          <div className="card-container-new">
            <TextareaComponent value={this.state.compose} onChange={e => this.setState({ compose: e.target.value })} placeholder="Create new task" onKeyDown={this.handleKeyDown} />
          </div>
        )}
      </div>
    )
  }
}

CardComponent.propTypes = {
  id: PropTypes.string,
  title: PropTypes.string,
  user: PropTypes.any,
  order: PropTypes.number,
  dueDate: PropTypes.any,
  hydrateTask: PropTypes.func,
  updateTasks: PropTypes.func,
  createTasks: PropTypes.func,
  done: PropTypes.bool,
  highestOrder: PropTypes.number,
  channelId: PropTypes.string,
  teamId: PropTypes.string,
  handleUpdateTaskOrder: PropTypes.func,
}

const mapDispatchToProps = {
  hydrateTask: task => hydrateTask(task),
  updateTasks: (channelId, task) => updateTasks(channelId, task),
  createTasks: (channelId, task) => createTasks(channelId, task),
}

const mapStateToProps = state => {
  return {}
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(CardComponent)
