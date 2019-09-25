import React, { useState, useRef, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import ModalComponent from '../components/modal.component'
import { Avatar } from '@weekday/elements'
import ModalPortal from '../portals/modal.portal'
import GraphqlService from '../services/graphql.service'
import styled from 'styled-components'
import UploadService from '../services/upload.service'
import PopupComponent from '../components/popup.component'
import LoadingComponent from '../components/loading.component'
import ErrorComponent from '../components/error.component'
import PropTypes from 'prop-types'
import { Button } from '@weekday/elements'
import { InputComponent } from '../components/input.component'
import { TextareaComponent } from '../components/textarea.component'
import { browserHistory } from '../services/browser-history.service'
import { updateRoom } from '../actions'
import SpinnerComponent from '../components/spinner.component'
import NotificationComponent from '../components/notification.component'
import { DiMarkdown } from 'react-icons/di'

const Row = styled.div`
  background-color: transparent;
  width: 100%;
  padding: 10px 25px 0px 25px;
  border-bottom: 0px solid rgba(255, 255, 255, 0.05);
  transition: background-color 0.5s;
`

const Column = styled.div`
  flex: 1;
  padding-left: 20px;
`

const Supported = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: #007af5;
  margin-left: 5px;
`

export default function RoomModal(props) {
  const [loading, setLoading] = useState(null)
  const [error, setError] = useState(null)
  const [title, setTitle] = useState('')
  const [notification, setNotification] = useState(null)
  const [image, setImage] = useState('')
  const [description, setDescription] = useState('')
  const common = useSelector(state => state.common)
  const team = useSelector(state => state.team)
  const fileRef = useRef(null)
  const dispatch = useDispatch()

  const handleFileChange = async e => {
    if (e.target.files.length == 0) return

    setLoading(true)
    setError(null)

    try {
      const result = await new UploadService(e.target.files[0])
      const { data, mime } = await result.json()

      setImage(data.Location)
      setLoading(false)
    } catch (e) {
      setLoading(false)
      setError('Error uploading file')
    }
  }

  // Effect loads current team details
  useEffect(() => {
    ;(async () => {
      try {
        if (!props.id) return

        setLoading(true)

        const { data } = await GraphqlService.getInstance().room(props.id)
        const room = data.room

        setImage(room.image)
        setTitle(room.title)
        setDescription(room.description)
        setLoading(false)
      } catch (e) {
        setLoading(false)
        setError('Error getting data')
      }
    })()
  }, [props.id])

  // prettier-ignore
  return (
    <ModalPortal>
      <ModalComponent
        title={props.id ? "Update Channel" : "Create New Channel"}
        width={560}
        height={500}
        onClose={props.onClose}
        footer={(
          <div className="column w-100 align-items-stretch">
            <div className="mb-20 mr-20 ml-20 row flex-1 justify-content-end">
              <div className="flexer" />

              {/* Null here means it's a channel - no user */}
              <Button
                size="large"
                onClick={() => dispatch(updateRoom({ title, image, description }))}
                text="Update"
              />
            </div>
          </div>
        )}>

        {error && <ErrorComponent message={error} />}
        {loading && <SpinnerComponent />}
        {notification && <NotificationComponent text={notification} />}

        <Row className="row align-items-start">
          <input
            accept="image/png,image/jpg"
            type="file"
            className="hide"
            ref={fileRef}
            onChange={handleFileChange}
          />

          <Avatar
            title={title}
            image={image}
            className="mr-20"
            size="xx-large"
            onClick={() => fileRef.current.click()}
          />

          <Column className="column">
            <InputComponent
              label="Title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="New channel title"
            />

            <TextareaComponent
              label="Description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Add a description"
              rows={4}
            />

            <div className="row">
              <DiMarkdown
                color="#007af5"
                size={18}
              />
              <Supported>
                Markdown supported
              </Supported>
            </div>
          </Column>
        </Row>
      </ModalComponent>
    </ModalPortal>
  )
}

RoomModal.propTypes = {
  team: PropTypes.any,
  onClose: PropTypes.func,
}
