import React from 'react'
import { connect } from 'react-redux'
import './boards.extension.css'
import PropTypes from 'prop-types'
import { hydrateTasks, createTasks } from '../../actions'
import arrayMove from 'array-move'
import { sortTasksByOrder } from '../../helpers/util'

class Column extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      left: false,
      middle: false,
      right: false,
    }

    this.handleDrag = this.handleDrag.bind(this)
    this.handleDragLeave = this.handleDragLeave.bind(this)
    this.handleDrop = this.handleDrop.bind(this)
    this.handleDragOver = this.handleDragOver.bind(this)
  }

  handleDragLeave(e) {
    e.stopPropagation()
    e.preventDefault()

    this.setState({
      left: false,
      middle: false,
      right: false,
    })
  }

  handleDragOver(e) {
    e.stopPropagation()
    e.preventDefault()

    const { target } = e
    const relativePosition = (target.getBoundingClientRect().left - e.pageX) * -1
    const left = relativePosition < 50
    const middle = relativePosition >= 50 && relativePosition < 150
    const right = relativePosition >= 150

    this.setState({
      left,
      middle,
      right,
    })

    //if (left) this.props.updatePosition(this.props.index - 1, window['section'])
    //if (right) this.props.updatePosition(this.props.index + 1, window['section'])
  }

  handleDrop(e) {
    if (this.state.left) this.props.updatePosition(this.props.id, window['section'])
    if (this.state.right) this.props.updatePosition(this.props.id, window['section'])

    this.setState({
      left: false,
      middle: false,
      right: false,
    })

    /* const taskIdDragged = window['section']
    const type = this.state.ontop ? 'ONTOP' : this.state.under ? 'UNDER' : this.state.over ? 'OVER' : null

    if (!type) return

    // We get the outer ID on the parent of this task
    // Not all DIVs have this - so recursively find it
    let count = 0
    let el = e.target
    let taskIdDraggedOnto

    while (!taskIdDraggedOnto && count < 50) {
      if (el.id) taskIdDraggedOnto = el.id
      el = el.parentElement
      count++
    }

    e.preventDefault()

    this.setState({
      left: false,
      middle: false,
      right: false,
    })

    if (!taskIdDraggedOnto) return
    if (taskIdDraggedOnto == '') return

    this.props.processDrop(taskIdDragged, taskIdDraggedOnto, type) */
  }

  handleDrag(e) {
    window['section'] = this.props.id
  }

  render() {
    return (
      <div
        draggable
        className="column"
        onDrop={this.handleDrop}
        onDrag={this.handleDrag}
        onDragLeave={this.handleDragLeave}
        onDragOver={this.handleDragOver}
        style={{
          left: this.props.order * 200,
          boxShadow: this.state.left ? 'inset 30px 0px 0px 0px rgba(240,15,0,0.25)' : this.state.right ? 'inset -30px 0px 0px 0px rgba(240,15,0,0.25)' : 'none',
        }}
      >
        <div className="column-title">{this.props.title}</div>
        <div className="column-cards">
          <div className="card"></div>
        </div>
      </div>
    )
  }
}

class BoardsExtension extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      error: null,
      notification: null,
      loading: false,
      sections: [
        { id: 11, title: 'One', order: 0 },
        { id: 22, title: 'Four', order: 1 },
        { id: 33, title: 'Three', order: 2 },
        { id: 44, title: 'Two', order: 3 },
        { id: 55, title: 'Five', order: 4 },
      ],
    }

    this.updatePosition = this.updatePosition.bind(this)
  }

  updatePosition(targetSectionId, sectionId) {
    const sections = sortTasksByOrder(this.state.sections)
    let indexOfSectionId
    let indexOfTargetSectionId

    sections.map((section, index) => {
      if (section.id == sectionId) indexOfSectionId = index
      if (section.id == targetSectionId) indexOfTargetSectionId = index
    })

    const updatedSections = arrayMove(sections, indexOfSectionId, indexOfTargetSectionId)

    this.setState({
      sections: this.state.sections.map(section => {
        let updatedOrderForThisSection

        updatedSections.map((s, i) => {
          if (s.id == section.id) updatedOrderForThisSection = i
        })

        return {
          ...section,
          order: updatedOrderForThisSection,
        }
      }),
    })
  }

  render() {
    return (
      <div className="boards-extension">
        <div>Here</div>
        <div>Here</div>
        <div className="container">
          {this.state.sections.map((section, index) => {
            return <Column key={index} id={section.id} order={section.order} title={section.title} updatePosition={this.updatePosition} />
          })}
        </div>
      </div>
    )
  }
}

BoardsExtension.propTypes = {
  user: PropTypes.any,
  channel: PropTypes.any,
  team: PropTypes.any,
  tasks: PropTypes.any,
  hydrateTasks: PropTypes.func,
}

const mapDispatchToProps = {
  hydrateTasks: tasks => hydrateTasks(tasks),
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
)(BoardsExtension)
