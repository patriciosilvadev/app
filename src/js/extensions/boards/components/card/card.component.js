import React from 'react'
import { connect } from 'react-redux'
import './card.component.css'
import PropTypes from 'prop-types'
import { hydrateTasks, createTasks, hydrateTask } from '../../../../actions'
import arrayMove from 'array-move'
import { sortTasksByOrder, classNames, logger } from '../../../../helpers/util'
import { CheckboxComponent } from '../../../tasks/components/checkbox/checkbox.component'
import { TextareaComponent } from '../../../../components/textarea.component'

let CARD_IMAGE = document.createElement('img')
CARD_IMAGE.src =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24'%3E%3Cpath fill='none' d='M0 0h24v24H0z'/%3E%3Cpath d='M3 13h18v8.002c0 .551-.445.998-.993.998H3.993A.995.995 0 0 1 3 21.002V13zM3 2.998C3 2.447 3.445 2 3.993 2h16.014c.548 0 .993.446.993.998V11H3V2.998zM9 5v2h6V5H9zm0 11v2h6v-2H9z' fill='rgba(149,164,166,1)'/%3E%3C/svg%3E"

class CardComponent extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      compose: '',
      ontop: false,
      under: false,
    }

    this.handleKeyDown = this.handleKeyDown.bind(this)

    this.handleDrag = this.handleDrag.bind(this)
    this.handleDragLeave = this.handleDragLeave.bind(this)
    this.handleDrop = this.handleDrop.bind(this)
    this.handleDragOver = this.handleDragOver.bind(this)
    this.draggableIsCard = this.draggableIsCard.bind(this)
    this.handleDragStart = this.handleDragStart.bind(this)
  }

  handleDragStart(e) {
    e.stopPropagation()
    e.dataTransfer.setDragImage(CARD_IMAGE, 0, 0)
  }

  draggableIsCard() {
    return window.card !== null && window.card !== undefined && !this.props.new
  }

  handleKeyDown(e) {
    // On enter
    if (e.keyCode == 13) {
      e.preventDefault()
      //this.handleUpdateTask()
      console.log('Add')
      this.setState({ compose: '' })
    }
  }

  handleDragLeave(e) {
    e.stopPropagation()
    e.preventDefault()

    if (!this.draggableIsCard()) return

    this.setState({
      under: false,
      ontop: false,
    })
  }

  handleDragOver(e) {
    e.stopPropagation()
    e.preventDefault()

    if (!this.draggableIsCard()) return

    const { target } = e
    const relativePosition = (target.getBoundingClientRect().top - e.pageY) * -1
    const ontop = relativePosition < 5
    const under = relativePosition >= 28

    this.setState({
      ontop,
      under,
    })
  }

  handleDrop(e) {
    e.stopPropagation()
    e.preventDefault()

    if (!this.draggableIsCard()) return

    const taskIdDragged = window['card']
    const type = this.state.ontop ? 'ONTOP' : this.state.under ? 'UNDER' : null

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
      under: false,
      ontop: false,
    })

    if (!taskIdDraggedOnto) return
    if (taskIdDraggedOnto == '') return

    // this.props.processDrop(taskIdDragged, taskIdDraggedOnto, type)
    console.log(taskIdDragged, taskIdDraggedOnto, type, this.props.sectionId)
    window['card'] = null
  }

  handleDrag(e) {
    e.stopPropagation()
    e.preventDefault()

    window['card'] = this.props.id
  }

  render() {
    return (
      <div
        id={this.props.id}
        style={{
          position: 'relative',
          padding: 0,
          margin: 0,
          boxShadow: this.state.ontop ? 'inset 0px 10px 0px 0px rgba(240,15,0,0.25)' : this.state.under ? 'inset 0px -10px 0px 0px rgba(240,15,0,0.25)' : 'none',
        }}
        onDragStart={this.handleDragStart}
        onDrop={this.handleDrop}
        onDrag={this.handleDrag}
        onDragLeave={this.handleDragLeave}
        onDragOver={this.handleDragOver}
        draggable={!this.props.new}
        className="column-card"
      >
        {!this.props.new && (
          <div className="card-container">
            <CheckboxComponent done={this.props.done} onClick={() => console.log('ed')} />
            <div className="card-details">
              <div className="card-title" onClick={() => this.props.hydrateTask({ id: this.props.id })}>
                {this.props.title}
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
  hydrateTask: PropTypes.func,
  done: PropTypes.bool,
}

const mapDispatchToProps = {
  hydrateTask: task => hydrateTask(task),
}

const mapStateToProps = state => {
  return {}
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(CardComponent)
