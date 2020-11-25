import React from 'react'
import { connect } from 'react-redux'
import './card.component.css'
import PropTypes from 'prop-types'
import { hydrateTasks, createTasks, hydrateTask } from '../../../../actions'
import arrayMove from 'array-move'
import { sortTasksByOrder, classNames, logger } from '../../../../helpers/util'
import { CheckboxComponent } from '../../../tasks/components/checkbox/checkbox.component'

class CardComponent extends React.Component {
  constructor(props) {
    super(props)

    this.state = {}
  }

  render() {
    return (
      <div className="column-card">
        <div className="card-container">
          <CheckboxComponent done={this.props.done} onClick={() => console.log('ed')} />
          <div className="card-details">
            <div className="card-title">{this.props.title}</div>
          </div>
        </div>
      </div>
    )
  }
}

CardComponent.propTypes = {
  title: PropTypes.string,
  done: PropTypes.bool,
}

const mapDispatchToProps = {}

const mapStateToProps = state => {
  return {}
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(CardComponent)
