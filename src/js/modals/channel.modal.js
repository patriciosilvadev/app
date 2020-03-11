import React, { useState, useRef, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import ModalPortal from '../portals/modal.portal'
import GraphqlService from '../services/graphql.service'
import MessagingService from '../services/messaging.service'
import styled from 'styled-components'
import UploadService from '../services/upload.service'
import PropTypes from 'prop-types'
import { browserHistory } from '../services/browser-history.service'
import { updateChannel, deleteChannel, createChannelMember, deleteChannelMember } from '../actions'
import ConfirmModal from './confirm.modal'
import { User, Modal, Tabbed, Popup, Loading, Error, Spinner, Notification, Input, Textarea, Button, Avatar } from '@tryyack/elements'
import QuickUserComponent from '../components/quick-user.component'
import { IconComponent } from '../components/icon.component'
import { logger } from '../helpers/util'

export default function ChannelModal(props) {
  const [loading, setLoading] = useState(null)
  const [error, setError] = useState(null)
  const [title, setTitle] = useState('')
  const [userMenu, setUserMenu] = useState(null)
  const [notification, setNotification] = useState(null)
  const [image, setImage] = useState('')
  const [description, setDescription] = useState('')
  const user = useSelector(state => state.user)
  const team = useSelector(state => state.team)
  const channel = useSelector(state => state.channel)
  const fileRef = useRef(null)
  const dispatch = useDispatch()
  const [confirmDeleteModal, setConfirmDeleteModal] = useState(false)
  const [members, setMembers] = useState([])

  const handleFileChange = async e => {
    if (e.target.files.length == 0) return

    setLoading(true)
    setError(null)

    try {
      const file = e.target.files[0]
      const { name, type, size } = file
      const raw = await UploadService.getUploadUrl(name, type)
      const { url } = await raw.json()
      const upload = await UploadService.uploadFile(url, file, type)
      const uri = upload.url.split('?')[0]
      const mime = type

      setImage(uri)
      setLoading(false)
    } catch (e) {
      logger(e)
      setLoading(false)
      setError('Error uploading file')
    }
  }

  const handleDeleteChannel = async () => {
    setLoading(true)
    setError(null)
    setConfirmDeleteModal(false)

    try {
      const channelId = channel.id
      const teamId = team.id
      const { data } = await GraphqlService.getInstance().deleteChannel(channelId)

      // Sync this one for everyone
      dispatch(deleteChannel(channelId, true))
      setLoading(false)
      props.onClose()
      browserHistory.push(`/app/team/${teamId}/`)
    } catch (e) {
      setLoading(false)
      setError('Error deleting team')
    }
  }

  const handleUpdateChannel = async () => {
    setLoading(true)
    setError(null)

    try {
      await GraphqlService.getInstance().updateChannel(channel.id, { title, image, description })

      dispatch(updateChannel(channel.id, { title, image, description }))
      setLoading(false)
      setNotification('Successfully updated')
    } catch (e) {
      setLoading(false)
      setError('Error updating channel')
    }
  }

  useEffect(() => {
    ;(async () => {
      try {
        if (!props.channelId) return

        setLoading(true)

        const { data } = await GraphqlService.getInstance().channel(props.channelId)
        const channel = data.channel

        setImage(channel.image)
        setTitle(channel.title || '')
        setDescription(channel.description || '')
        setLoading(false)
        setMembers(channel.members)
      } catch (e) {
        setLoading(false)
        setError('Error getting data')
      }
    })()
  }, [props.id])

  return (
    <ModalPortal>
      <Modal title="Channel" width={700} height={500} onClose={props.onClose}>
        <div className="row align-items-start w-100">
          <div className="column w-100">
            {error && <Error message={error} onDismiss={() => setError(false)} />}
            {loading && <Spinner />}
            {notification && <Notification text={notification} onDismiss={() => setNotification(false)} />}
            {confirmDeleteModal && (
              <ConfirmModal
                onOkay={handleDeleteChannel}
                onCancel={() => setConfirmDeleteModal(false)}
                text="Are you sure you want to delete this channel, it can not be undone?"
                title="Are you sure?"
              />
            )}

            <Row className="row align-items-start">
              <input accept="image/png,image/jpg" type="file" className="hide" ref={fileRef} onChange={handleFileChange} />

              <div className="column">
                <Avatar title={title} image={image} className="mr-20 mb-20" size="xxx-large" />

                {props.hasAdminPermission && (
                  <Link className="button mt-10" onClick={() => fileRef.current.click()}>
                    Update image
                  </Link>
                )}
              </div>

              <Column className="column">
                <Input label="Title" value={title} onChange={e => setTitle(e.target.value)} placeholder="New channel title" className="mb-20" disable={!props.hasAdminPermission} />

                <Textarea
                  label="Description"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Add a description"
                  rows={8}
                  className="mb-20"
                  disable={!props.hasAdminPermission}
                />

                <div className="row">
                  <IconComponent icon="markdown" size={20} color="#626d7a" />
                  <Supported>Markdown supported</Supported>
                </div>
              </Column>
            </Row>

            {props.hasAdminPermission && (
              <div className="p-25 row w-100">
                <Button className="mr-10" onClick={handleUpdateChannel} text="Update" theme="muted" />
                <div className="flexer" />
                <Button text="Delete" theme="red" onClick={() => setConfirmDeleteModal(true)} />
              </div>
            )}
          </div>
        </div>
      </Modal>
    </ModalPortal>
  )
}

ChannelModal.propTypes = {
  channelId: PropTypes.string,
  teamId: PropTypes.string,
  onClose: PropTypes.func,
  hasAdminPermission: PropTypes.bool, // Whether someone can edit the team or not (admin)
}

const Text = styled.div``

const Row = styled.div`
  background-color: transparent;
  width: 100%;
  padding: 25px;
  border-bottom: 0px solid rgba(255, 255, 255, 0.05);
  transition: background-color 0.5s;
`

const Link = styled.div`
  color: #007af5;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
`

const Column = styled.div`
  flex: 1;
  padding-left: 20px;
`

const Supported = styled.div`
  font-size: 12px;
  font-weight: 400;
  color: #626d7a;
  margin-left: 5px;
`

const AddButton = styled.div`
  padding: 20px;
`
