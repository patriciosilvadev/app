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
import MembersChannelComponent from '../components/members-channel.component'
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

  const handleCreateChannelMember = async user => {
    setLoading(true)
    setError(null)

    try {
      const userId = user.id
      const userName = user.name
      const userIds = [userId]
      const { channelId, teamId } = props
      const member = { user }
      const { data } = await GraphqlService.getInstance().createChannelMember(channelId, teamId, userId, userName)

      setLoading(false)
      setMembers([...members, member])
      dispatch(createChannelMember(channelId, member))

      MessagingService.getInstance().joinChannel(userIds, channelId)
    } catch (e) {
      setLoading(false)
      setError('Error adding channel member')
    }
  }

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
      await GraphqlService.getInstance().deleteChannel(props.id)

      // Sync this one for everyone
      dispatch(deleteChannel(teamId, true))
      setLoading(false)
      browserHistory.push(`/app/team/${team.id}/`)
      props.onClose()
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

  // Render functions for ease of reading
  const renderOverview = () => {
    return (
      <div className="row align-items-start w-100">
        <div className="column w-100">
          {error && <Error message={error} onDismiss={() => setError(false)} />}
          {loading && <Spinner />}
          {notification && <Notification text={notification} onDismiss={() => setNotification(false)} />}

          <Row className="row align-items-start">
            <input accept="image/png,image/jpg" type="file" className="hide" ref={fileRef} onChange={handleFileChange} />

            <div className="column">
              <Avatar title={title} image={image} className="mr-20 mb-20" size="xx-large" />

              {props.hasPermission && (
                <Link className="button mt-10" onClick={() => fileRef.current.click()}>
                  Update image
                </Link>
              )}
            </div>

            <Column className="column">
              <Input label="Title" value={title} onChange={e => setTitle(e.target.value)} placeholder="New channel title" className="mb-20" disable={!props.hasPermission} />

              <Textarea
                label="Description"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Add a description"
                rows={8}
                className="mb-20"
                disable={!props.hasPermission}
              />

              <div className="row">
                <IconComponent icon="markdown" size={20} color="#007af5" />
                <Supported>Markdown supported</Supported>
              </div>
            </Column>
          </Row>

          {props.hasPermission && (
            <div className="p-20">
              <Button onClick={handleUpdateChannel} text="Update" theme="muted" />
            </div>
          )}
        </div>
      </div>
    )
  }

  const renderMembers = () => {
    return (
      <div className="column flex-1 w-100 h-100">
        <MembersChannelComponent hasPermission={props.hasPermission} id={props.id} channelId={channel.id} teamId={team.id} onClose={props.onClose} members={members} />

        {props.hasPermission && (
          <QuickUserComponent
            channel={channel}
            visible={userMenu}
            width={250}
            direction="left-top"
            handleDismiss={() => setUserMenu(false)}
            handleAccept={({ user }) => {
              // Check to see if there are already people
              // Don't re-add people
              if (members.filter(member => member.user.id == user.id).length > 0) return

              // Otherwise all good - add them
              handleCreateChannelMember(user)
              setUserMenu(false)
            }}
          >
            <AddButton className="button row" onClick={() => setUserMenu(true)}>
              <Avatar className="mr-5" size="medium" circle image={null} color="#007af5" title="">
                <IconComponent icon="plus" size={20} color="#007af5" />
              </Avatar>

              <Link className="ml-10">Add new Member</Link>
            </AddButton>
          </QuickUserComponent>
        )}
      </div>
    )
  }

  const renderDangerZone = () => {
    return (
      <div className="row align-items-start w-100">
        <div className="column w-100">
          {confirmDeleteModal && (
            <ConfirmModal onOkay={handleDeleteChannel} onCancel={() => setConfirmDeleteModal(false)} text="Are you sure you want to delete this channel, it can not be undone?" title="Are you sure?" />
          )}

          <div className="column p-20 flex-1 scroll w-100">
            <Text className="color-red h5 mb-10">Here be dragons!</Text>
            <Text className="color-d0 p mb-30">This cannot be undone.</Text>

            <Button text="Delete" theme="red" onClick={() => setConfirmDeleteModal(true)} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <ModalPortal>
      <Modal title="Channel" width={700} height="90%" onClose={props.onClose}>
        <Tabbed
          start={props.start}
          onChange={i => {
            setNotification(null)
            setError(null)
          }}
          panels={[
            {
              title: 'Overview',
              show: true,
              content: renderOverview(),
            },
            {
              title: 'Members',
              show: members.length != 0,
              content: renderMembers(),
            },
            {
              title: 'Danger zone',
              show: true,
              hide: !props.hasPermission,
              content: renderDangerZone(),
            },
          ]}
        />
      </Modal>
    </ModalPortal>
  )
}

ChannelModal.propTypes = {
  channelId: PropTypes.string,
  teamId: PropTypes.string,
  start: PropTypes.number,
  members: PropTypes.array,
  onClose: PropTypes.func,
  hasPermission: PropTypes.bool, // Whether someone can edit the team or not (admin)
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
  font-weight: 600;
  color: #007af5;
  margin-left: 5px;
`

const AddButton = styled.div`
  padding: 20px;
`
