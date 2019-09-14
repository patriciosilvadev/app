import React, { useState, useRef, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import ModalComponent from '../components/modal.component'
import { Avatar } from '@weekday/elements'
import GraphqlService from '../services/graphql.service'
import styled from 'styled-components'
import PopupComponent from '../components/popup.component'
import LoadingComponent from '../components/loading.component'
import ErrorComponent from '../components/error.component'
import PropTypes from 'prop-types'
import { createRoom } from '../actions'
import { Button } from '@weekday/elements'
import { InputComponent } from '../components/input.component'
import { TextareaComponent } from '../components/textarea.component'
import { browserHistory } from '../services/browser-history.service'

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

export default function RoomModal(props) {
  const [loading, setLoading] = useState(null)
  const [error, setError] = useState(null)
  const [title, setTitle] = useState('')
  const [image, setImage] = useState('')
  const [description, setDescription] = useState('')
  const common = useSelector(state => state.common)
  const team = useSelector(state => state.team)
  const dispatch = useDispatch()
  const fileRef = useRef(null)

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

  // prettier-ignore
  return (
    <ModalComponent
      title="Create New Channel"
      width={560}
      height={300}
      onClose={props.onClose}
      footer={(
        <div className="column w-100 align-items-stretch">
          <div className="mb-20 mr-20 ml-20 row flex-1 justify-content-end">
            <div className="flexer" />

            {/* Null here means it's a channel - no user */}
            <Button
              jumbo
              onClick={() => dispatch(createRoom(title, description, image, team.id, null))}
              text="Create"
            />
          </div>
        </div>
      )}>

      <LoadingComponent show={loading} />
      <ErrorComponent message={error} />

      <Row className="row align-items-start">
        <input
          accept="image/png,image/jpg"
          type="file"
          className="hide"
          ref={fileRef}
          onChange={handleFileChange}
        />

        <Avatar
          image={image}
          className="mr-20"
          size="large"
        />

        <Column className="column">
          <InputComponent
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="New channel title"
          />

          <TextareaComponent
            label="Description"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Enter bio"
            rows={2}
          />
        </Column>
      </Row>
    </ModalComponent>
  )
}

RoomModal.propTypes = {
  team: PropTypes.any,
  onClose: PropTypes.func,
}
