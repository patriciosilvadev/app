import React from 'react'
import { connect } from 'react-redux'
import './boards.extension.css'
import PropTypes from 'prop-types'
import { hydrateTasks, createTasks, hydrateTask } from '../../actions'
import arrayMove from 'array-move'
import { sortTasksByOrder, classNames, logger } from '../../helpers/util'
import ColumnComponent from './components/column/column.component'
import GraphqlService from '../../services/graphql.service'

class BoardsExtension extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      error: null,
      notification: null,
      loading: false,
      shiftIndex: null,
      sections: [],
    }

    this.updatePosition = this.updatePosition.bind(this)
    this.shiftIndex = this.shiftIndex.bind(this)
  }

  shiftIndex(index) {
    this.setState({ shiftIndex: index })
  }

  updatePosition(draggedSectionId, targetIndex) {
    if (!draggedSectionId || !targetIndex) return

    let indexOfDraggedSection
    const sortedSections = this.state.sections

    // Get the CURRENT indexes
    sortedSections.map((section, index) => {
      if (section.id == draggedSectionId) indexOfDraggedSection = index
    })

    // Create a new array based on the new indexes
    const compensateForForwardDragging = indexOfDraggedSection < targetIndex
    const newTargetIndex = compensateForForwardDragging ? targetIndex - 1 : targetIndex
    const updatedSortedSections = arrayMove(sortedSections, indexOfDraggedSection, newTargetIndex)
    const sections = this.state.sections.map(section => {
      let updatedOrderForThisSection

      // Now we look for this section - but we use the index as order
      updatedSortedSections.map((s, i) => {
        if (s.id == section.id) updatedOrderForThisSection = i
      })

      return {
        ...section,
        order: updatedOrderForThisSection,
      }
    })

    // Update the state with the new order
    this.setState({
      sections: sortTasksByOrder(sections),
    })
  }

  componentDidUpdate(prevProps) {
    if (this.props.match.params.channelId != prevProps.match.params.channelId) {
      this.fetchTasks()
    }
  }

  componentDidMount() {
    this.fetchTasks()
    this.setState({
      sections: sortTasksByOrder([
        { id: 1, title: 'One', order: 0 },
        { id: 2, title: 'Four', order: 3 },
        { id: 3, title: 'Three', order: 2 },
        { id: 4, title: 'Two', order: 4 },
        { id: 5, title: 'Five', order: 1 },
      ]),
    })
  }

  async fetchTasks() {
    try {
      const { channelId, teamId } = this.props.match.params
      const { data } = await GraphqlService.getInstance().tasks({
        parent: null,
        team: teamId,
        channel: channelId,
      })

      this.props.hydrateTasks(data.tasks)
    } catch (e) {
      console.log(e)
      logger(e)
    }
  }

  render() {
    return (
      <div className="boards-extension">
        <div className="scroll-container">
          <div className="scroll-content">
            <div className="boards-container">
              {this.state.sections.map((section, index) => {
                let shift = this.state.shiftIndex != null && index >= this.state.shiftIndex

                return (
                  <ColumnComponent
                    shift={shift}
                    shiftIndex={this.shiftIndex}
                    select={true}
                    key={index}
                    id={section.id}
                    order={section.order}
                    index={index}
                    last={false}
                    title={section.title}
                    updatePosition={this.updatePosition}
                  />
                )
              })}

              <ColumnComponent
                new
                shift={this.state.shiftIndex != null && this.state.sections.length >= this.state.shiftIndex}
                shiftIndex={() => console.log('No')}
                id={0}
                order={0}
                last={true}
                index={this.state.sections.length}
                title="New"
                updatePosition={this.updatePosition}
              />
            </div>
          </div>
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
