import './modal.component.css'
import React, { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { IconComponent } from '../../../../components/icon.component'
import { classNames } from '../../../../helpers/util'
import ModalPortal from '../../../../portals/modal.portal'
import * as chroma from 'chroma-js'
import { Input, Textarea, Modal, Tabbed, Notification, Spinner, Error, User, Avatar, Button, Range } from '@weekday/elements'
import marked from 'marked'

export const ModalComponent = props => {
  const [editDescription, setEditDescription] = useState(false)
  const [description, setDescription] = useState('')

  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(null)
  const [notification, setNotification] = useState(null)
  const dispatch = useDispatch()
  const user = useSelector(state => state.user)

  return (
    <ModalPortal>
      <Modal position="right" header={false} title="Task" width={800} height="100%" frameless onClose={props.onClose}>
        <div className="task-modal-container">
          <div className="title-bar">
            <div className="icon">
              <IconComponent icon="profile" color="#524150" size="20" thickness="1.5" onClick={props.onClose} />
              <div className="user">Unassigned</div>
            </div>

            <div className="flexer" />

            <div className="icon">
              <div className="date">No date</div>
              <IconComponent icon="calendar" color="#524150" size="20" thickness="1.5" onClick={props.onClose} />
            </div>

            <div className="icon">
              <IconComponent icon="share" color="#524150" size="20" thickness="1.5" onClick={props.onClose} />
            </div>

            <div className="icon">
              <IconComponent icon="delete" color="#524150" size="20" thickness="1.5" onClick={props.onClose} />
            </div>

            <div className="icon">
              <IconComponent icon="x" color="#524150" size="20" thickness="1.5" onClick={props.onClose} />
            </div>
          </div>

          <div className="content">
            <div className="title">
              <textarea value="Task title goes here!" />
            </div>
            <div className="description">
              <div className="heading row">
                <IconComponent icon="align-left" color="#adb5bd" size="14" thickness="1.5" onClick={props.onClose} />

                <div className="flexer" />

                {!editDescription && (
                  <button className="description-button" onClick={e => setEditDescription(true)}>
                    Edit
                  </button>
                )}

                {editDescription && (
                  <button
                    className="description-button"
                    onClick={e => {
                      // this.updateOrCreateTask()
                      setEditDescription(false)
                    }}
                  >
                    Okay
                  </button>
                )}
              </div>
              <div className="textarea">
                <div className="column w-100">
                  {/* Display the editor */}
                  {editDescription && <textarea placeholder="Add a description with *markdown*" value={description} className="description" onChange={e => setDescription(e.target.value)} />}

                  {/* Display the markdown */}
                  {!editDescription && <div className="task-description-markdown" dangerouslySetInnerHTML={{ __html: marked(description || '<em><em>No description</em></em>') }} />}

                  {/* These are the buttons at the bottom of the description */}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </ModalPortal>
  )
}
