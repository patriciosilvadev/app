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

export const MonthDayTaskComponent = ({
  id,
  channelId,
  displayChannelName,
  done,
  channel,
  title,
  user,
  onClick,
  subtaskCount,
  parentId,
}) => {
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

  const handleDragStart = e => {
    e.dataTransfer.setDragImage(TASK_IMAGE, 0, 0)
    window[WEEKDAY_DRAGGED_TASK_ID] = id
  }

  const handleDrag = e => {}

  return (
    <div
      draggable
      id={id}
      onDrag={handleDrag}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className="month-day-task"
    >
      <div className="checkbox">
        <CheckboxComponent done={done} onClick={handleUpdateTaskDone} />
      </div>
      {!!user && (
        <div className="task-avatar" onClick={onClick}>
          <Avatar size="x-small" image={user.image} title={user.name} />
        </div>
      )}
      <div className="row flexer pl-5">
        <div className="column flexer" onClick={onClick}>
          <div className="task-title">
            {!!parentId && (
              <IconComponent
                icon="corner-down-right"
                color="#11171d"
                size={11}
                style={{ marginRight: 3 }}
              />
            )}
            <span
              className="flexer"
              style={{ color: displayChannelName ? channel.color : '#11171d' }}
            >
              {title}
            </span>
          </div>
          {displayChannelName && (
            <div
              className="task-channel"
              style={{ color: displayChannelName ? channel.color : '#adb5bd' }}
            >
              {channel.name}
            </div>
          )}
        </div>
        {!!subtaskCount && (
          <div className="subtask-count">
            <IconComponent icon="check" color="#adb5bd" size={11} />
            <IconComponent
              icon="check"
              color="#adb5bd"
              size={11}
              style={{ position: 'relative', left: -8 }}
            />
            <div className="text">{subtaskCount}</div>
          </div>
        )}
      </div>
    </div>
  )
}
