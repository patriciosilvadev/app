import React, { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import './month-day-task.component.css'
import { CheckboxComponent } from '../../../tasks/components/checkbox/checkbox.component'

export const MonthDayTaskComponent = ({ done, title }) => {
  return (
    <div className="month-day-task">
      <div className="checkbox">
        <CheckboxComponent done={done} />
      </div>
      <div className="task-title">{title}</div>
    </div>
  )
}
