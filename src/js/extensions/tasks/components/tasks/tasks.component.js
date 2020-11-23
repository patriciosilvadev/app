import './tasks.component.css'
import { useSelector, useDispatch } from 'react-redux'
import React, { useState, useEffect, useRef } from 'react'
import TaskComponent from '../task/task.component'
import { SortableContainer, SortableElement } from 'react-sortable-hoc'
import { classNames, isTaskHeading } from '../../../../helpers/util'
import EventService from '../../../../services/event.service'
import { TASK_ORDER_INDEX, TASKS_ORDER, DEVICE, MIME_TYPES, TASK_DRAGSTART_RESET_CHEVRON } from '../../../../constants'
import { sortTasksByOrder, logger, getMentions, findChildTasks } from '../../../../helpers/util'

const L = ({ tasks, collapsed, processDrop }) => {
  return (
    <div style={{ display: collapsed ? 'none' : 'block' }}>
      {tasks.map((task, index) => {
        return (
          <div className="pl-20 pr-20" key={index}>
            <T task={task} processDrop={processDrop} />
          </div>
        )
      })}
    </div>
  )
}

const T = ({ task, processDrop }) => {
  const [over, setOver] = useState(false)
  const [under, setUnder] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  const handleDragLeave = e => {
    e.stopPropagation()
    e.preventDefault()
    setOver(false)
    setUnder(false)
  }

  const handleDragOver = e => {
    e.stopPropagation()
    e.preventDefault()

    const { target } = e
    const relativePosition = target.getBoundingClientRect().top - e.pageY
    const isOver = relativePosition > -5
    const isUnder = relativePosition <= -5

    setUnder(isUnder)
    setOver(isOver)
  }

  const handleDrop = e => {
    const type = over ? 'OVER' : under ? 'UNDER' : ''
    const taskIdDragged = window['task']
    const taskIdDraggedOnto = e.target.id

    e.preventDefault()

    setOver(false)
    setUnder(false)

    processDrop(taskIdDragged, taskIdDraggedOnto, type)
  }

  const handleDrag = e => {
    window['task'] = task.id
  }

  return (
    <div>
      <div
        id={task.id}
        style={{ background: over ? '#EEE' : 'none', borderBottom: under ? '2px solid red' : 'none' }}
        onDrop={handleDrop}
        onDrag={handleDrag}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        draggable
      >
        <span onClick={() => setCollapsed(!collapsed)}>({collapsed ? ' + ' : ' - '})</span>
        {task.title} {task.children.length}
      </div>
      <L tasks={task.children} collapsed={collapsed} processDrop={processDrop} />
    </div>
  )
}

export const TasksComponent = ({ tasks, deleteTask, updateTaskOrder, updateTask, showCompletedTasks, onSortEnd, shareToChannel, createTask, disableTools, displayChannelName }) => {
  const masterTaskList = useSelector(state => state.tasks)

  // OLD
  const [tasklist, setTasklist] = useState([])

  // OLD
  useEffect(() => {
    setTasklist(tasks)
  }, [tasks])

  // OLD
  const toggleTasksBelowHeadings = (taskId, hide) => {
    let done = false
    let startIndex = null
    let endIndex = null

    tasklist.map((task, index) => {
      if (task.id == taskId) {
        startIndex = index
      } else {
        if (startIndex != null) {
          if (isTaskHeading(task.title)) done = true
          if (!done) endIndex = index
        }
      }
    })

    setTasklist(
      tasklist.map((task, index) => {
        if (index > startIndex && index <= endIndex) return { ...task, hide }

        return task
      })
    )
  }

  const processDropOver = (taskIdDragged, taskIdDraggedOnto) => {
    console.log('OVER', taskIdDragged, taskIdDraggedOnto)

    // New parent
    const parent = taskIdDraggedOnto
    const id = taskIdDragged

    // Get the parent's childrren (so we can calculate order)
    const children = sortTasksByOrder(masterTaskList.filter(task => task.parentId == taskIdDraggedOnto))

    // Highest order
    const order = children.length != 0 ? children.reduce((acc, value) => (value.order > acc ? value.order : acc), children.length + 1) + 2 : 1

    // Return the updated task to update
    return { id, parent, order }
  }

  const processDropUnder = (taskIdDragged, taskIdDraggedOnto) => {
    console.log('UNDER', taskIdDragged, taskIdDraggedOnto)

    const taskDraggedOnto = masterTaskList.filter(task => task.id == taskIdDraggedOnto)[0]
    const parent = taskDraggedOnto.parentId
    const id = taskIdDragged

    // Get the dragged on tasks' siblings / order them
    const siblings = sortTasksByOrder(masterTaskList.filter(task => task.parentId == parent))
    const highestOrder = siblings.length != 0 ? siblings.reduce((acc, value) => (value.order > acc ? value.order : acc), siblings.length + 1) + 2 : 1
    const minOrder = taskDraggedOnto.order
    let maxOrder = null

    // Go over the siblings
    // GET THE NEXT TASK AFTERR THE ONE THAT WAS DRAGGED ONTO
    siblings.map((task, index) => {
      if (task.id == taskIdDraggedOnto) {
        const nextTask = siblings[index + 1]
        if (nextTask) maxOrder = nextTask.order
      }
    })

    // If we have the next order
    if (!maxOrder) maxOrder = highestOrder

    // Calculate a midway point
    const order = (maxOrder - minOrder) / 2 + minOrder

    // Return the updated task to update
    return { id, parent, order }
  }

  const processDrop = (taskIdDragged, taskIdDraggedOnto, type) => {
    let updatedTask = null

    switch (type) {
      case 'OVER':
        updatedTask = processDropOver(taskIdDragged, taskIdDraggedOnto)
        break
      case 'UNDER':
        updatedTask = processDropUnder(taskIdDragged, taskIdDraggedOnto)
        break
    }

    if (updatedTask) updateTaskOrder(updatedTask)
  }

  return (
    <div className="task-list">
      {/* <L tasks={tasks} processDrop={processDrop} /> */}

      <SortableList
        helperClass="sortableHelper"
        pressDelay={200}
        tasks={tasklist}
        deleteTask={deleteTask}
        updateTask={updateTask}
        showCompletedTasks={showCompletedTasks}
        onSortEnd={onSortEnd}
        shareToChannel={shareToChannel}
        toggleTasksBelowHeadings={toggleTasksBelowHeadings}
        disableTools={disableTools}
        displayChannelName={displayChannelName}
        onSortStart={({ index, oldIndex, newIndex, collection, isKeySorting }) => {
          const taskId = tasklist[index].id
          toggleTasksBelowHeadings(taskId, false)
          EventService.getInstance().emit(TASK_DRAGSTART_RESET_CHEVRON, taskId)
        }}
      />

      <ul>
        <TaskComponent id="" title="" hide={false} done={false} new={true} createTask={createTask} showCompletedTasks={true} />
      </ul>
    </div>
  )
}

const SortableItem = SortableElement(({ task, index, sortIndex, showCompletedTasks, deleteTask, updateTask, shareToChannel, toggleTasksBelowHeadings, disableTools, displayChannelName }) => {
  // assignedUser because props.user is the redux store
  return (
    <TaskComponent
      index={index}
      sortIndex={sortIndex}
      id={task.id}
      assignedChannel={task.channel}
      assignedUser={task.user}
      subtaskCount={task.subtaskCount}
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
      toggleTasksBelowHeadings={toggleTasksBelowHeadings}
      disableTools={disableTools}
      displayChannelName={displayChannelName}
    />
  )
})

const SortableList = SortableContainer(({ tasks, showCompletedTasks, deleteTask, updateTask, shareToChannel, toggleTasksBelowHeadings, disableTools, displayChannelName }) => {
  return (
    <ul>
      {tasks.map((task, index) => (
        <SortableItem
          key={`item-${task.id}`}
          index={index}
          sortIndex={index}
          task={task}
          shareToChannel={shareToChannel}
          showCompletedTasks={showCompletedTasks}
          deleteTask={deleteTask}
          updateTask={updateTask}
          toggleTasksBelowHeadings={toggleTasksBelowHeadings}
          disableTools={disableTools}
          displayChannelName={displayChannelName}
        />
      ))}
    </ul>
  )
})
