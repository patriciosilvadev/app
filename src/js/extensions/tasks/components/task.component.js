import React from 'react'
import { connect } from 'react-redux'
import './task.component.css'
import { Popup, Menu } from '@weekday/elements'
import { IconComponent } from '../../../components/icon.component'
import PropTypes from 'prop-types'

class TaskComponent extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      id: props.id,
      done: props.done,
      title: props.title,
      new: props.new,
      menu: false,
      over: false,
    }

    this.handleTaskIconClick = this.handleTaskIconClick.bind(this)
  }

  componentDidUpdate(prevProps) {}

  componentDidMount() {}

  handleTaskIconClick() {
    if (this.state.new) {
      // Create a new task
    } else {
      this.setState({ done: !this.state.done })
    }
  }

  render() {
    const classNames = this.state.done ? 'row task done' : 'row task'

    return (
      <div onMouseEnter={() => this.setState({ over: true })} onMouseLeave={() => this.setState({ over: false, menu: false })} className={classNames}>
        <IconComponent
          icon={this.state.new ? 'plus-circle' : this.state.done ? 'check-circle' : 'circle'}
          color={this.state.new ? '#CFD4D9' : this.state.done ? '#858E96' : '#11171D'}
          thickness={1.5}
          size={16}
          className="mr-10 button"
          onClick={() => this.handleTaskIconClick()}
        />

        <div className="flexer">
          <input placeholder="Add task title & press enter" value={this.state.title} onChange={e => this.setState({ title: e.target.value })} className="title" />
        </div>

        {this.state.over && !this.state.new && (
          <Popup
            handleDismiss={() => this.setState({ menu: false })}
            visible={this.state.menu}
            width={200}
            direction="right-bottom"
            content={
              <Menu
                items={[
                  {
                    text: 'Delete',
                    onClick: e => {
                      //props.onArchivedClick()
                    },
                  },
                  {
                    text: 'Share to channel',
                    onClick: e => {
                      //props.onMutedClick()
                    },
                  },
                ]}
              />
            }
          >
            <IconComponent
              className="button"
              icon="more-h"
              color="#858E96"
              size={15}
              thickness={1.5}
              onClick={e => {
                e.stopPropagation()
                this.setState({ menu: true })
              }}
            />
          </Popup>
        )}
      </div>
    )
  }
}

TaskComponent.propTypes = {
  title: PropTypes.string,
  id: PropTypes.string,
  done: PropTypes.bool,
  new: PropTypes.bool,
  createTask: PropTypes.func,
}

const mapDispatchToProps = {}

const mapStateToProps = state => {
  return {}
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(TaskComponent)
