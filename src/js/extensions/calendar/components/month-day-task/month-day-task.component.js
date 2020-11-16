import React, { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import './month-day-task.component.css'
import { CheckboxComponent } from '../../../tasks/components/checkbox/checkbox.component'
import { Avatar } from '@weekday/elements'
import { updateChannelUpdateTask, updateTask } from '../../../../actions'
import GraphqlService from '../../../../services/graphql.service'
import { logger } from '../../../../helpers/util'
import { WEEKDAY_DRAGGED_TASK_ID } from '../../../../constants'

export const MonthDayTaskComponent = ({ id, channelId, done, title, user, onClick }) => {
  const dispatch = useDispatch()

  const handleUpdateTaskDone = async () => {
    try {
      const updatedDone = !done
      const taskId = id
      const task = { id, done: updatedDone }

      // Update the API
      await GraphqlService.getInstance().updateTask(id, { done: updatedDone })

      // Update the task list
      dispatch(updateChannelUpdateTask(channelId, task))
      dispatch(updateTask(taskId, task, channelId))
    } catch (e) {
      logger(e)
    }
  }

  const handleDragEnd = e => {}

  const handleDragStart = e => {}

  const handleDrag = e => {
    window[WEEKDAY_DRAGGED_TASK_ID] = id
  }

  return (
    <div id={id} draggable onDrag={handleDrag} onDragStart={handleDragStart} onDragEnd={handleDragEnd} className="month-day-task">
      <div className="checkbox">
        <CheckboxComponent done={done} onClick={handleUpdateTaskDone} />
      </div>
      {!!user && (
        <div className="task-avatar" onClick={onClick}>
          <Avatar size="very-small" image={user.image} title={user.name} />
        </div>
      )}
      <div className="task-title" onClick={onClick}>
        {title}
      </div>
    </div>
  )
}
