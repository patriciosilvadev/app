import './tasks.component.css'
import React, { useState, useEffect, useRef } from 'react'
import TaskComponent from '../task/task.component'
import { SortableContainer, SortableElement } from 'react-sortable-hoc'
import { classNames, isTaskHeading } from '../../../../helpers/util'
import EventService from '../../../../services/event.service'
import { TASK_ORDER_INDEX, TASKS_ORDER, DEVICE, MIME_TYPES, TASK_DRAGSTART_RESET_CHEVRON } from '../../../../constants'

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

export const TasksComponent = ({ tasks, deleteTask, updateTask, showCompletedTasks, onSortEnd, shareToChannel, createTask, disableTools, displayChannelName }) => {
  const [tasklist, setTasklist] = useState([])

  useEffect(() => {
    setTasklist(tasks)
  }, [tasks])

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

  return (
    <div className="task-list">
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
