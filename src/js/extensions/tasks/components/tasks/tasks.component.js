import './tasks.component.css'
import { useSelector, useDispatch, ReactReduxContext } from 'react-redux'
import React, { useState, useEffect, useRef } from 'react'
import TaskComponent from '../task/task.component'
import { SortableContainer, SortableElement } from 'react-sortable-hoc'
import { classNames, isTaskHeading, getNextTaskOrder, getHighestTaskOrder, getPreviousTaskOrder } from '../../../../helpers/util'
import EventService from '../../../../services/event.service'
import { TASK_ORDER_INDEX, TASKS_ORDER, DEVICE, MIME_TYPES, TASK_DRAGSTART_RESET_CHEVRON } from '../../../../constants'
import { sortTasksByOrder, logger, getMentions, findChildTasks } from '../../../../helpers/util'

const L = ({ base, tasks, hideChildren, collapsed, processDrop, showCompletedTasks, deleteTask, updateTask, shareToChannel, disableTools, displayChannelName }) => {
  return (
    <div style={{ display: collapsed ? 'none' : 'block' }}>
      {tasks.map((task, index) => {
        return (
          <div style={{ paddingLeft: base ? 0 : 20 }} key={index}>
            <T
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
}

class T extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      over: false,
      ontop: false,
      under: false,
      draggable: true,
      collapsed: false,
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
    const taskIdDragged = window['task']
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
      over: false,
      under: false,
      ontop: false,
    })

    if (!taskIdDraggedOnto) return
    if (taskIdDraggedOnto == '') return

    this.props.processDrop(taskIdDragged, taskIdDraggedOnto, type)
  }

  handleDrag(e) {
    window['task'] = this.props.task.id
  }

  render() {
    const { task, hideChildren, processDrop, index, showCompletedTasks, deleteTask, updateTask, shareToChannel, disableTools, displayChannelName } = this.props

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
          draggable={this.state.draggable}
        >
          {/* Sort index is null */}
          <TaskComponent
            index={index}
            sortIndex={0}
            id={task.id}
            assignedChannel={task.channel}
            assignedUser={task.user}
            subtaskCount={task.children ? task.children.length : 0}
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
            updateDraggable={draggable => this.setState({ draggable })}
            toggleTasksBelowHeadings={() => this.setState({ collapsed: !this.state.collapsed })}
            disableTools={disableTools}
            displayChannelName={displayChannelName}
          />
        </div>
        {!hideChildren && (
          <L
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
export const TasksComponent = ({ masterTaskList, tasks, hideChildren, deleteTask, updateTaskOrder, updateTask, showCompletedTasks, shareToChannel, createTask, disableTools, displayChannelName }) => {
  const processDropOver = (taskIdDragged, taskIdDraggedOnto) => {
    console.log('OVER', taskIdDragged, taskIdDraggedOnto)

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
    console.log('UNDER', taskIdDragged, taskIdDraggedOnto)

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
    console.log('ONTOP', taskIdDragged, taskIdDraggedOnto)

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
      case 'OVER':
        updatedTask = processDropOver(taskIdDragged, taskIdDraggedOnto)
        break
      case 'UNDER':
        updatedTask = processDropUnder(taskIdDragged, taskIdDraggedOnto)
        break
      case 'ONTOP':
        updatedTask = processDropOntop(taskIdDragged, taskIdDraggedOnto)
        break
    }

    if (updatedTask) updateTaskOrder(updatedTask)
  }

  return (
    <div className="tasks">
      <div className="task-list">
        <L
          base
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
  )
}
