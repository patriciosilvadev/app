import React from 'react'
import { connect } from 'react-redux'
import './column.component.css'
import PropTypes from 'prop-types'
import { hydrateTasks, createTasks, hydrateTask, createChannelSection, updateChannelSection, deleteChannelSection } from '../../../../actions'
import arrayMove from 'array-move'
import { sortTasksByOrder, classNames, logger } from '../../../../helpers/util'
import CardComponent from '../card/card.component'
import { TextareaComponent } from '../../../../components/textarea.component'
import { IconComponent } from '../../../../components/icon.component'
import { Popup, Input, Textarea, Modal, Tabbed, Notification, Spinner, Error, User, Menu, Avatar, Button, Range } from '@weekday/elements'
import GraphqlService from '../../../../services/graphql.service'

let COLUMN_IMAGE = document.createElement('img')
COLUMN_IMAGE.src =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24'%3E%3Cpath fill='none' d='M0 0h24v24H0z'/%3E%3Cpath d='M15 21H9V10h6v11zm2 0V10h5v10a1 1 0 0 1-1 1h-4zM7 21H3a1 1 0 0 1-1-1V10h5v11zM22 8H2V4a1 1 0 0 1 1-1h18a1 1 0 0 1 1 1v4z' fill='rgba(149,164,166,1)'/%3E%3C/svg%3E"

class ColumnComponent extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      over: false,
      tasks: [],
      compose: '',
      editable: false,
      menu: false,
    }

    this.composeRef = React.createRef()

    this.handleDrag = this.handleDrag.bind(this)
    this.handleDragLeave = this.handleDragLeave.bind(this)
    this.handleDrop = this.handleDrop.bind(this)
    this.handleDragOver = this.handleDragOver.bind(this)
    this.handleBlur = this.handleBlur.bind(this)
    this.handleKeyDown = this.handleKeyDown.bind(this)
    this.draggableIsSection = this.draggableIsSection.bind(this)
    this.handleDragEnd = this.handleDragEnd.bind(this)
    this.handleDragStart = this.handleDragStart.bind(this)
    this.createSection = this.createSection.bind(this)
    this.updateSection = this.updateSection.bind(this)
    this.deleteSection = this.deleteSection.bind(this)
  }

  draggableIsSection() {
    return window.section !== null && window.section !== undefined
  }

  async updateSection() {
    if (this.state.compose == this.props.title) return this.setState({ compose: '', editable: false })
    if (this.state.compose == '') return this.setState({ compose: '', editable: false })

    const { compose } = this.state
    const { id, order } = this.props
    const sectionId = id
    const title = compose
    const channelId = this.props.channel.id

    await GraphqlService.getInstance().updateChannelSection(channelId, sectionId, title, order)

    // Reset the state
    this.setState({ compose: '', editable: false })

    // Add it ot he store
    this.props.updateChannelSection(channelId, {
      id,
      order,
      title,
    })
  }

  async deleteSection() {
    const sectionId = this.props.id
    const channelId = this.props.channel.id
    this.setState({ menu: false })
    await GraphqlService.getInstance().deleteChannelSection(channelId, sectionId)
    this.props.deleteChannelSection(channelId, sectionId)
  }

  async createSection() {
    if (this.state.compose == '') return this.setState({ compose: '', editable: false })

    const { compose } = this.state
    const order = this.props.channel.sections.length
    const title = compose
    const channelId = this.props.channel.id
    const { data } = await GraphqlService.getInstance().createChannelSection(channelId, title, order)
    const section = data.createChannelSection

    // Reset the state
    this.setState({ compose: '', editable: false })

    // Add it ot he store
    this.props.createChannelSection(channelId, section)
  }

  handleKeyDown(e) {
    // On enter
    if (e.keyCode == 13) {
      e.preventDefault()
      if (!this.props.id) this.createSection()
      if (this.props.id) this.updateSection()
    }
  }

  handleBlur(e) {
    if (!this.props.id) this.createSection()
    if (this.props.id) this.updateSection()
  }

  static getDerivedStateFromProps(props, state) {
    if (props.new) return null

    // Array is frozen from Redux:
    // https://stackoverflow.com/questions/53420055/error-while-sorting-array-of-objects-cannot-assign-to-read-only-property-2-of/53420326
    const tasks = [...props.tasks]
    const tasksForThisColumn = tasks.filter(task => task.section == props.id)

    return { tasks } //sortTasksByOrder(tasksForThisColumn)
  }

  handleDragEnd(e) {
    this.props.shiftIndex(null)
    this.setState({ over: false })
    window['section'] = null
  }

  handleDragLeave(e) {
    e.stopPropagation()
    e.preventDefault()

    if (!this.draggableIsSection()) return

    this.setState({ over: false })
    this.props.shiftIndex(null)
  }

  handleDragOver(e) {
    e.stopPropagation()
    e.preventDefault()

    if (!this.draggableIsSection()) return

    this.setState({ over: true })
    this.props.shiftIndex(this.props.index)
  }

  handleDrop(e) {
    this.props.updatePosition(window['section'], this.props.index)
    this.props.shiftIndex(null)

    if (!this.draggableIsSection()) return

    this.setState({ over: false })
    window['section'] = null
  }

  handleDrag(e) {
    e.stopPropagation()
    e.preventDefault()
  }

  handleDragStart(e) {
    window['section'] = this.props.id
    e.dataTransfer.setDragImage(COLUMN_IMAGE, 0, 0)
  }

  render() {
    const boardColumnClasses = classNames({
      'board-column': true,
      'hide': !!window['section'] && window['section'] == this.props.id,
    })
    const columnContainerClasses = classNames({
      'column-container': true,
      'shift': this.props.shift,
      'last': this.props.last && this.state.over,
      'dragged-section': window.section == this.props.id,
    })

    return (
      <div
        draggable={!this.props.new}
        onDrop={this.handleDrop}
        onDrag={this.handleDrag}
        onDragLeave={this.handleDragLeave}
        onDragOver={this.handleDragOver}
        onDragEnd={this.handleDragEnd}
        onDragStart={this.handleDragStart}
        className={boardColumnClasses}
        style={{
          background: this.state.over ? '#f0f3f5' : 'transparent',
        }}
      >
        <div className={columnContainerClasses}>
          <div className="column-title">
            {/* https://stackoverflow.com/questions/49358560/react-wrapper-react-does-not-recognize-the-staticcontext-prop-on-a-dom-elemen */}
            {/* https://reactjs.org/warnings/unknown-prop.html */}
            {(this.state.editable || this.props.new) && (
              <TextareaComponent
                select={this.props.select ? 'yes' : ''}
                value={this.state.compose}
                onChange={e => this.setState({ compose: e.target.value })}
                placeholder="Create column"
                ref={ref => (this.composeRef = ref)}
                onBlur={this.handleBlur}
                onKeyDown={this.handleKeyDown}
              />
            )}

            {/* main title */}
            {!this.state.editable && !this.props.new && (
              <React.Fragment>
                <div className="column-title-text" onClick={() => this.setState({ compose: this.props.title, editable: true })}>
                  {this.props.title}
                </div>

                <Popup
                  handleDismiss={() => this.setState({ menu: false })}
                  visible={this.state.menu}
                  width={150}
                  direction="right-bottom"
                  content={
                    <Menu
                      items={[
                        {
                          text: 'Delete column',
                          onClick: e => this.deleteSection(),
                        },
                      ]}
                    />
                  }
                >
                  <IconComponent icon="more-v" color="#e9ecee" size="14" thickness="1.5" onClick={() => this.setState({ menu: true })} />
                </Popup>
              </React.Fragment>
            )}
          </div>
          <div className="column-cards">
            {this.state.tasks.map((task, index) => {
              return <CardComponent sectionId={this.props.id} id={task.id} user={task.user} dueDate={task.dueDate} title={task.title} done={task.done} key={index} />
            })}
            {!this.props.new && <CardComponent sectionId={this.props.id} id="" title="" done={false} new={true} />}
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
  new: PropTypes.bool,
  select: PropTypes.bool,
  last: PropTypes.bool,
  shiftIndex: PropTypes.func,
  id: PropTypes.any,
  order: PropTypes.number,
  index: PropTypes.number,
  title: PropTypes.string,
  updatePosition: PropTypes.func,
  createChannelSection: PropTypes.func,
  updateChannelSection: PropTypes.func,
  deleteChannelSection: PropTypes.func,
}

const mapDispatchToProps = {
  hydrateTask: task => hydrateTask(task),
  createTasks: (channelId, task) => createTasks(channelId, task),
  createChannelSection: (channelId, section) => createChannelSection(channelId, section),
  updateChannelSection: (channelId, section) => updateChannelSection(channelId, section),
  deleteChannelSection: (channelId, sectionId) => deleteChannelSection(channelId, sectionId),
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
