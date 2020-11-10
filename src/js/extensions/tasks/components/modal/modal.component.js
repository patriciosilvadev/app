import './modal.component.css'
import React, { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { IconComponent } from '../../../../components/icon.component'
import { classNames } from '../../../../helpers/util'
import ModalPortal from '../../../../portals/modal.portal'
import * as chroma from 'chroma-js'
import { Input, Textarea, Modal, Tabbed, Notification, Spinner, Error, User, Avatar, Button, Range } from '@weekday/elements'

export const ModalComponent = props => {
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(null)
  const [notification, setNotification] = useState(null)
  const dispatch = useDispatch()
  const user = useSelector(state => state.user)

  return (
    <ModalPortal>
      <Modal header={true} title="Task" width={800} height="80%" onClose={props.onClose}></Modal>
    </ModalPortal>
  )
}
