import './tasks.component.css'
import { useSelector, useDispatch, ReactReduxContext } from 'react-redux'
import React, { useState, useEffect, useRef, memo } from 'react'
import { Avatar, Tooltip, Button, Input, Spinner, Error, Notification, Popup, Menu } from '@weekday/elements'
import TaskComponent from '../task/task.component'
import { SortableContainer, SortableElement } from 'react-sortable-hoc'
import { sortTasksByDueDate, classNames, isTaskHeading, getNextTaskOrder, getHighestTaskOrder, getPreviousTaskOrder } from '../../../../helpers/util'
import EventService from '../../../../services/event.service'
import { MOMENT_TODAY, ONTOP, OVER, UNDER, WEEKDAY_DRAGGED_TASK_ID, SORT } from '../../../../constants'
import { sortTasksByOrder, logger, getMentions, findChildTasks } from '../../../../helpers/util'
import moment from 'moment'

const TASK_IMAGE_SVG = encodeURI(`
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
let TASK_IMAGE = document.createElement('img')
TASK_IMAGE.src = 'data:image/svg+xml,' + TASK_IMAGE_SVG

const L = memo(props => {
  const { base, sort, hideChildren, collapsed, processDrop, showCompletedTasks, deleteTask, updateTask, shareToChannel, disableTools, displayChannelName } = props
  const [tasks, setTasks] = useState([])
  let labelCache

  useEffect(() => {
    let sortedTasks = sort == SORT.DATE ? sortTasksByDueDate(props.tasks) : sortTasksByOrder(props.tasks)

    if (sort == SORT.DATE) {
      sortedTasks = sortedTasks.map((task, index) => {
        let showDate = false
        let currentDate = moment(task.dueDate)
        let dateLabel = 'Later'

        // If it's valid
        // And if it's in the last week
        // Then add the date descriptor
        if (currentDate.isValid() && currentDate.isAfter(moment().subtract(1, 'weeks'))) dateLabel = currentDate.format('dddd')

        // Check for today
        if (currentDate.isSame(MOMENT_TODAY, 'd')) dateLabel = 'Today'

        // Decide whether to show the label or not
        // ONLY if it's different to the cached label
        if (dateLabel != labelCache) {
          showDate = true
          labelCache = dateLabel
        }

        return {
          ...task,
          showDate,
          dateLabel,
        }
      })
    }

    setTasks(sortedTasks)
  }, [props.tasks, props.sort])

  return (
    <div style={{ display: collapsed ? 'none' : 'block' }}>
      {tasks.map((task, index) => {
        return (
          <div style={{ paddingLeft: base ? 0 : 20 }} key={index}>
            {task.showDate && (
              <div className="date-divider">
                <div className="date-divider-text">{task.dateLabel}</div>
              </div>
            )}

            <T
              sort={sort}
              task={task}
              hideChildren={hideChildren}
              processDrop={processDrop}
              index={index}
              showCompletedTasks={showCompletedTasks}
              deleteTask={deleteTask}
              updateTask={updateTask}
              shareToChannel={shareToChannel}
              disableTools={disableTools}
              displayChannelName={displayChannelName}
            />
          </div>
        )
      })}
    </div>
  )
})

class T extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      over: false,
      ontop: false,
      under: false,
      draggable: true,
      collapsed: true,
    }

    this.handleDrag = this.handleDrag.bind(this)
    this.handleDragLeave = this.handleDragLeave.bind(this)
    this.handleDrop = this.handleDrop.bind(this)
    this.handleDragOver = this.handleDragOver.bind(this)
    this.handleDragStart = this.handleDragStart.bind(this)
    this.handleUpdateDraggable = this.handleUpdateDraggable.bind(this)
  }

  handleUpdateDraggable(draggable) {
    const { disableDrag } = this.props

    // Update the draggable (when the task is being edited)
    // But accommodate this task being told not be draggable by the parent
    this.setState({
      draggable: disableDrag ? false : draggable,
    })
  }

  handleDragStart(e) {
    window[WEEKDAY_DRAGGED_TASK_ID] = this.props.task.id
    e.dataTransfer.setDragImage(TASK_IMAGE, 0, 0)
  }

  handleDragLeave(e) {
    e.stopPropagation()
    e.preventDefault()

    this.setState({
      over: false,
      under: false,
      ontop: false,
    })
  }

  handleDragOver(e) {
    e.stopPropagation()
    e.preventDefault()

    const { target } = e
    const relativePosition = (target.getBoundingClientRect().top - e.pageY) * -1
    const ontop = relativePosition < 5
    const over = relativePosition >= 5 && relativePosition < 28
    const under = relativePosition >= 28

    this.setState({
      ontop,
      over,
      under,
    })
  }

  handleDrop(e) {
    const taskIdDragged = window[WEEKDAY_DRAGGED_TASK_ID]
    const type = this.state.ontop ? ONTOP : this.state.under ? UNDER : this.state.over ? OVER : null

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
      over: false,
      under: false,
      ontop: false,
    })

    if (!taskIdDraggedOnto) return
    if (taskIdDraggedOnto == '') return

    this.props.processDrop(taskIdDragged, taskIdDraggedOnto, type)
  }

  handleDrag(e) {}

  render() {
    const { task, sort, hideChildren, processDrop, index, showCompletedTasks, deleteTask, updateTask, shareToChannel, disableTools, displayChannelName } = this.props

    return (
      <React.Fragment>
        <div
          id={task.id}
          style={{
            position: 'relative',
            padding: 0,
            margin: 0,
            background: this.state.over ? 'rgba(240,15,0,0.25)' : 'transparent',
            boxShadow: this.state.ontop ? 'inset 0px 5px 0px 0px rgba(240,15,0,0.25)' : this.state.under ? 'inset 0px -5px 0px 0px rgba(240,15,0,0.25)' : 'none',
          }}
          onDrop={this.handleDrop}
          onDrag={this.handleDrag}
          onDragLeave={this.handleDragLeave}
          onDragOver={this.handleDragOver}
          onDragStart={this.handleDragStart}
          draggable={sort == SORT.DATE ? false : this.state.draggable}
        >
          {/* Sort index is null */}
          <TaskComponent
            index={index}
            id={task.id}
            assignedChannel={task.channel}
            assignedUser={task.user}
            subtaskCount={!!task.subtaskCount ? task.subtaskCount : task.children ? task.children.length : 0}
            dueDate={task.dueDate}
            title={task.title}
            description={task.description}
            done={task.done}
            hide={task.hide}
            shareToChannel={shareToChannel}
            new={false}
            showCompletedTasks={showCompletedTasks}
            deleteTask={deleteTask}
            updateTask={updateTask}
            updateDraggable={this.handleUpdateDraggable}
            toggleTasksBelowHeadings={() => this.setState({ collapsed: !this.state.collapsed })}
            disableTools={disableTools}
            displayChannelName={displayChannelName}
          />
        </div>

        {/* sublists */}
        {!hideChildren && (
          <L
            sort={SORT.NONE}
            hideChildren={!!hideChildren}
            tasks={task.children}
            collapsed={this.state.collapsed}
            processDrop={processDrop}
            showCompletedTasks={showCompletedTasks}
            deleteTask={deleteTask}
            updateTask={updateTask}
            shareToChannel={shareToChannel}
            disableTools={disableTools}
            displayChannelName={displayChannelName}
          />
        )}
      </React.Fragment>
    )
  }
}

/**
 * mastTaskList is all the tasks
 * tasks = nested tasks
 */
export const TasksComponent = memo(({ tasks, masterTaskList, hideChildren, deleteTask, updateTaskOrder, updateTask, shareToChannel, createTask, disableTools, displayChannelName }) => {
  const [sort, setSort] = useState(SORT.NONE)
  const [sortPopup, setSortPopup] = useState(false)
  const [showCompletedTasks, setShowCompletedTasks] = useState(true)
  const [completed, setCompleted] = useState(0)

  useEffect(() => {
    if (!masterTaskList) return
    setCompleted(masterTaskList.filter(task => task.done).length)
  }, [masterTaskList, showCompletedTasks])

  const processDropOver = (taskIdDragged, taskIdDraggedOnto) => {
    console.log(OVER, taskIdDragged, taskIdDraggedOnto)

    // New parent
    const parent = taskIdDraggedOnto
    const id = taskIdDragged

    // Get the parent's childrren (so we can calculate order)
    const children = sortTasksByOrder(masterTaskList.filter(task => task.parentId == taskIdDraggedOnto))
    const order = children.length == 0 ? 1 : getHighestTaskOrder(children)

    // Update it
    return {
      parent,
      id,
      order,
    }
  }

  const processDropUnder = (taskIdDragged, taskIdDraggedOnto) => {
    console.log(UNDER, taskIdDragged, taskIdDraggedOnto)

    const taskDraggedOnto = masterTaskList.filter(task => task.id == taskIdDraggedOnto)[0]
    const { parentId } = taskDraggedOnto
    const siblings = sortTasksByOrder(masterTaskList.filter(task => task.parentId == parentId))

    // Return the updated task to update
    return {
      id: taskIdDragged,
      parent: parentId,
      order: getNextTaskOrder(siblings, taskIdDraggedOnto),
    }
  }

  const processDropOntop = (taskIdDragged, taskIdDraggedOnto) => {
    console.log(ONTOP, taskIdDragged, taskIdDraggedOnto)

    const taskDraggedOnto = masterTaskList.filter(task => task.id == taskIdDraggedOnto)[0]
    const { parentId } = taskDraggedOnto
    const siblings = sortTasksByOrder(masterTaskList.filter(task => task.parentId == parentId))

    // Return the updated task to update
    return {
      id: taskIdDragged,
      parent: parentId,
      order: getPreviousTaskOrder(siblings, taskIdDraggedOnto),
    }
  }

  const processDrop = (taskIdDragged, taskIdDraggedOnto, type) => {
    if (taskIdDragged == taskIdDraggedOnto) return

    let updatedTask = null

    switch (type) {
      case OVER:
        updatedTask = processDropOver(taskIdDragged, taskIdDraggedOnto)
        break
      case UNDER:
        updatedTask = processDropUnder(taskIdDragged, taskIdDraggedOnto)
        break
      case ONTOP:
        updatedTask = processDropOntop(taskIdDragged, taskIdDraggedOnto)
        break
    }

    if (updatedTask) updateTaskOrder(updatedTask)
  }

  return (
    <React.Fragment>
      <div className="tasks-header">
        <div className="tasks-title">Tasks</div>
        <div className="tasks-progress">
          {completed} / {masterTaskList.length}
        </div>

        <Popup
          handleDismiss={() => setSortPopup(false)}
          visible={sortPopup}
          width={250}
          direction="right-bottom"
          content={
            <Menu
              items={[
                {
                  text: 'Custom order',
                  onClick: e => {
                    setSortPopup(false)
                    setSort(SORT.NONE)
                  },
                },
                {
                  text: 'By date',
                  onClick: e => {
                    setSortPopup(false)
                    setSort(SORT.DATE)
                  },
                },
              ]}
            />
          }
        >
          <Button size="small" text={sort == SORT.DATE ? 'By date' : 'Custom order'} theme="muted" className="mr-5" onClick={() => setSortPopup(true)} />
        </Popup>

        <Button size="small" text={showCompletedTasks ? 'Hide completed' : 'Show completed'} theme="muted" className="mr-25" onClick={() => setShowCompletedTasks(!showCompletedTasks)} />
      </div>

      <div className="tasks-container">
        <div className="tasks">
          <div className="task-list">
            <L
              base
              sort={sort}
              hideChildren={hideChildren}
              tasks={tasks}
              collapsed={false}
              processDrop={processDrop}
              showCompletedTasks={showCompletedTasks}
              deleteTask={deleteTask}
              updateTask={updateTask}
              shareToChannel={shareToChannel}
              disableTools={disableTools}
              displayChannelName={displayChannelName}
            />

            <TaskComponent id="" title="" hide={false} done={false} new={true} createTask={createTask} showCompletedTasks={true} />
          </div>
        </div>
      </div>
    </React.Fragment>
  )
})
