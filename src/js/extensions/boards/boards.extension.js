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
      sections: [
        { id: 11, title: 'One', order: 0 },
        { id: 22, title: 'Four', order: 1 },
        { id: 33, title: 'Three', order: 2 },
        { id: 44, title: 'Two', order: 3 },
        { id: 55, title: 'Five', order: 4 },
        { id: 66, title: 'Six', order: 5 },
        { id: 77, title: 'Seven', order: 6 },
        { id: 88, title: 'Eight', order: 7 },
      ],
    }

    this.updatePosition = this.updatePosition.bind(this)
    this.shiftIndex = this.shiftIndex.bind(this)
  }

  shiftIndex(index) {
    this.setState({ shiftIndex: index })
  }

  updatePosition(draggedSectionId, targetIndex) {
    let indexOfDraggedSection
    const sortedSections = sortTasksByOrder(this.state.sections)

    // Get the CURRENT indexes
    sortedSections.map((section, index) => {
      if (section.id == draggedSectionId) indexOfDraggedSection = index
    })

    // Create a new array based on the new indexes
    const updatedSortedSections = arrayMove(sortedSections, indexOfDraggedSection, targetIndex)

    this.setState({
      sections: this.state.sections.map(section => {
        let updatedOrderForThisSection

        // Now we look for this section - but we use the index as order
        updatedSortedSections.map((s, i) => {
          if (s.id == section.id) updatedOrderForThisSection = i
        })

        return {
          ...section,
          order: updatedOrderForThisSection,
        }
      }),
    })
  }

  componentDidUpdate(prevProps) {
    if (this.props.match.params.channelId != prevProps.match.params.channelId) {
      this.fetchTasks()
    }
  }

  componentDidMount() {
    this.fetchTasks()
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
        <div>Here</div>
        <div>Here</div>
        <div className="container">
          {sortTasksByOrder(this.state.sections).map((section, index) => {
            const shift = this.state.shiftIndex != null && index >= this.state.shiftIndex
            return (
              <ColumnComponent shift={shift} shiftIndex={this.shiftIndex} key={index} id={section.id} order={section.order} index={index} title={section.title} updatePosition={this.updatePosition} />
            )
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
