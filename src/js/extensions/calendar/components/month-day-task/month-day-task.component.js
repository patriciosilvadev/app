import React, { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import './month-day-task.component.css'
import { CheckboxComponent } from '../../../tasks/components/checkbox/checkbox.component'
import { Avatar } from '@weekday/elements'
import { updateTasks, updateTask } from '../../../../actions'
import GraphqlService from '../../../../services/graphql.service'
import { logger } from '../../../../helpers/util'
import { WEEKDAY_DRAGGED_TASK_ID } from '../../../../constants'
import { IconComponent } from '../../../../components/icon.component'

export const MonthDayTaskComponent = ({ id, channelId, displayChannelName, done, channel, title, user, onClick, subtaskCount, parent }) => {
  const dispatch = useDispatch()

  const handleUpdateTaskDone = async () => {
    try {
      const updatedDone = !done
      const taskId = id
      const task = { id, done: updatedDone }

      // Update the API
      await GraphqlService.getInstance().updateTask(id, { done: updatedDone })

      // Update the task list
      dispatch(updateTasks(channelId, task))
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
    <div draggable id={id} onDrag={handleDrag} onDragStart={handleDragStart} onDragEnd={handleDragEnd} className="month-day-task">
      <div className="checkbox">
        <CheckboxComponent done={done} onClick={handleUpdateTaskDone} />
      </div>
      {!!user && (
        <div className="task-avatar" onClick={onClick}>
          <Avatar size="very-small" image={user.image} title={user.name} />
        </div>
      )}
      <div className="row flexer pl-5">
        <div className="column flexer" onClick={onClick}>
          <div className="task-title">
            {!!parent && <IconComponent icon="corner-down-right" color="#11171d" thickness={2.25} size={11} style={{ marginRight: 3 }} />}
            <span className="flexer">{title}</span>
          </div>
          {displayChannelName && <div className="task-channel">{channel.name}</div>}
        </div>
        {!!subtaskCount && (
          <div className="subtask-count">
            <IconComponent icon="check" color="#adb5bd" thickness={2.25} size={11} />
            <IconComponent icon="check" color="#adb5bd" thickness={2.25} size={11} style={{ position: 'relative', left: -8 }} />
            <div className="text">{subtaskCount}</div>
          </div>
        )}
      </div>
    </div>
  )
}
