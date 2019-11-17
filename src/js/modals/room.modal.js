import React, { useState, useRef, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import ModalPortal from '../portals/modal.portal'
import GraphqlService from '../services/graphql.service'
import MessagingService from '../services/messaging.service'
import styled from 'styled-components'
import UploadService from '../services/upload.service'
import PropTypes from 'prop-types'
import { browserHistory } from '../services/browser-history.service'
import { updateRoom, deleteRoom, createRoomMember, deleteRoomMember } from '../actions'
import ConfirmModal from './confirm.modal'
import { User, Modal, Tabbed, Popup, Loading, Error, Spinner, Notification, Input, Textarea, Button, Avatar } from '@weekday/elements'
import QuickUserComponent from '../components/quick-user.component'
import { IconComponent } from '../components/icon.component'

const Text = styled.div``

const Row = styled.div`
  background-color: transparent;
  width: 100%;
  padding: 25px;
  border-bottom: 0px solid rgba(255, 255, 255, 0.05);
  transition: background-color 0.5s;
`

const Link = styled.div`
  color: #00a8ff;
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
  color: #00a8ff;
  margin-left: 5px;
`

const AddButton = styled.div`
  padding: 20px;
`

export default function RoomModal(props) {
  const [loading, setLoading] = useState(null)
  const [error, setError] = useState(null)
  const [title, setTitle] = useState('')
  const [userMenu, setUserMenu] = useState(null)
  const [notification, setNotification] = useState(null)
  const [image, setImage] = useState('')
  const [description, setDescription] = useState('')
  const user = useSelector(state => state.user)
  const team = useSelector(state => state.team)
  const room = useSelector(state => state.room)
  const fileRef = useRef(null)
  const dispatch = useDispatch()
  const [memberToDelete, setMemberToDelete] = useState(null)
  const [confirmDeleteModal, setConfirmDeleteModal] = useState(false)
  const [confirmSelfDeleteModal, setConfirmSelfDeleteModal] = useState(false)
  const [confirmMemberDeleteModal, setConfirmMemberDeleteModal] = useState(false)
  const [members, setMembers] = useState([])

  const handleCreateRoomMember = async (user) => {
    setLoading(true)
    setError(null)

    try {
      const userId = user.id
      const userIds = [userId]
      const roomId = room.id
      const member = { user }
      const { data } = await GraphqlService.getInstance().createRoomMember(roomId, userId)

      setLoading(false)
      setMembers([ ...members, member ])
      dispatch(createRoomMember(roomId, member))

      MessagingService.getInstance().joinRoom(userIds, roomId)
    } catch (e) {
      setLoading(false)
      setError('Error adding channel member')
    }
  }

  const handleDeleteRoomMember = async () => {
    setLoading(true)
    setError(null)

    try {
      const roomId = room.id
      const teamId = team.id
      const userId = memberDeleteId
      const userIds = [userId]

      await GraphqlService.getInstance().deleteRoomMember(teamId, userId)

      // Revoke access to people
      dispatch(deleteRoomMember(roomId, userId))

      setMemberDeleteId('')
      setLoading(false)
      setConfirmMemberDeleteModal(false)
      setMembers(members.filter(member => member.user.id != userId))

      // Tell this person to leave this room - send to team
      MessagingService.getInstance().leaveRoom(userIds, teamId)
    } catch (e) {
      setLoading(false)
      setError('Error deleting channel member')
    }
  }

  const handleDeleteRoomMemberSelf = async () => {
    setLoading(true)
    setError(null)

    try {
      const roomId = props.id
      const userId = user.id
      const teamId = team.id

      await GraphqlService.getInstance().deleteRoomMember(roomId, userId)

      // Stop loading the spinners
      setLoading(false)

      // Don't sync this one - because its just for us
      // false is for syncing here
      dispatch(deleteRoomMember(roomId, userId))
      dispatch(deleteRoom(roomId, false))

      // Unsub frem receiving messages here
      MessagingService.getInstance().leave(roomId)

      // Redirect the user back to the landing page
      browserHistory.push(`/app/team/${teamId}/`)
      props.onClose()
    } catch (e) {
      setLoading(false)
      setError('Error deleting self')
    }
  }

  const handleFileChange = async e => {
    if (e.target.files.length == 0) return

    setLoading(true)
    setError(null)

    try {
      const result = await new UploadService(e.target.files[0])
      const { uri, mime, size, name } = await result.json()

      setImage(uri)
      setLoading(false)
    } catch (e) {
      setLoading(false)
      setError('Error uploading file')
    }
  }

  const handleDeleteRoom = async () => {
    setLoading(true)
    setError(null)
    setConfirmDeleteModal(false)

    try {
      await GraphqlService.getInstance().deleteRoom(props.id)

      // Sync this one for everyone
      dispatch(deleteRoom(teamId, true))
      setLoading(false)
      browserHistory.push(`/app/team/${team.id}/`)
      props.onClose()
    } catch (e) {
      setLoading(false)
      setError('Error deleting team')
    }
  }

  const handleUpdateRoom = async () => {
    setLoading(true)
    setError(null)

    try {
      await GraphqlService.getInstance().updateRoom(room.id, { title, image, description })

      dispatch(updateRoom(room.id, { title, image, description }))
      setLoading(false)
      setNotification('Successfully updated')
    } catch (e) {
      setLoading(false)
      setError('Error updating room')
    }
  }

  useEffect(() => {
    ;(async () => {
      try {
        if (!props.id) return

        setLoading(true)

        const { data } = await GraphqlService.getInstance().room(props.id)
        const room = data.room

        setImage(room.image)
        setTitle(room.title || '')
        setDescription(room.description || '')
        setLoading(false)
        setMembers(room.members)
      } catch (e) {
        setLoading(false)
        setError('Error getting data')
      }
    })()
  }, [props.id])

  // prettier-ignore
  return (
    <ModalPortal>
      <Modal
        title="Channel"
        width={700}
        height="90%"
        onClose={props.onClose}>
          <Tabbed
            start={props.start || 0}
            panels={[
              {
                title: 'Profile',
                show: true,
                content: (
                  <div className="row align-items-start w-100">
                    <div className="column w-100">
                      {error && <Error message={error} />}
                      {loading && <Spinner />}
                      {notification && <Notification text={notification} />}

                      <Row className="row align-items-start">
                        <input
                          accept="image/png,image/jpg"
                          type="file"
                          className="hide"
                          ref={fileRef}
                          onChange={handleFileChange}
                        />

                        <div className="column">
                          <Avatar
                            title={title}
                            image={image}
                            className="mr-20 mb-20"
                            size="xx-large"
                            onClick={() => fileRef.current.click()}
                          />

                          <Link className="button mt-10" onClick={() => fileRef.current.click()}>
                            Update image
                          </Link>
                        </div>

                        <Column className="column">
                          <Input
                            label="Title"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="New channel title"
                            className="mb-20"
                          />

                          <Textarea
                            label="Description"
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="Add a description"
                            rows={8}
                            className="mb-20"
                          />

                          <div className="row">
                            <IconComponent
                              icon="markdown"
                              size={20}
                              color="#00a8ff"
                            />
                            <Supported>
                              Markdown supported
                            </Supported>
                          </div>
                        </Column>
                      </Row>

                      <div className="p-20">
                        <Button
                          onClick={handleUpdateRoom}
                          text="Update"
                          theme="blue-border"
                          size="small"
                        />
                      </div>
                    </div>
                  </div>
                )
              },
              {
                title: 'Members',
                show: members.length != 0,
                content: (
                  <div className="column flex-1 w-100 h-100">
                    {error && <Error message={error} />}
                    {loading && <Spinner />}
                    {notification && <Notification text={notification} />}

                    {confirmSelfDeleteModal &&
                      <ConfirmModal
                        onOkay={() => {
                          setConfirmSelfDeleteModal(false)
                          handleDeleteRoomMemberSelf()
                        }}
                        onCancel={() => setConfirmSelfDeleteModal(false)}
                        text="Are you sure you want to leave this room?"
                        title="Are you sure?"
                      />
                    }

                    {confirmMemberDeleteModal &&
                      <ConfirmModal
                        onOkay={() => {
                          setConfirmMemberDeleteModal(false)
                          handleDeleteRoomMember()
                        }}
                        onCancel={() => setConfirmMemberDeleteModal(false)}
                        text="Are you sure you want to remove this person, it can not be undone?"
                        title="Are you sure?"
                      />
                    }

                    {members.map((member, index) => {
                      return (
                        <User
                          key={index}
                          image={member.user.image}
                          color={member.user.color}
                          name={member.user.id == user.id ? member.user.name + " (You)" : member.user.name}
                          label={`${member.user.username} ${member.admin ? "- Admin" : ""}`}>

                          <Button
                            theme="blue-border"
                            size="small"
                            onClick={() => {
                              if (members.length == 1) {
                                setError('There must be at least 1 person in a channel')
                                setTimeout(() => setError(null), 2000)
                                return
                              }

                              setMemberToDelete(member.user)

                              if (user.id == member.user.id) {
                                setConfirmSelfDeleteModal(true)
                              } else {
                                setConfirmMemberDeleteModal(true)
                              }
                            }}
                            text="Delete Member"
                          />
                        </User>
                      )
                    })}

                    <QuickUserComponent
                      room={room}
                      visible={userMenu}
                      width={250}
                      direction="left-bottom"
                      handleDismiss={() => setUserMenu(false)}
                      handleAccept={({ user }) => {
                        // Check to see if there are already people
                        // Don't re-add people
                        if (members.filter(member => member.user.id == user.id).length > 0) return

                        // Otherwise all good - add them
                        handleCreateRoomMember(user)
                        setUserMenu(false)
                      }}>
                      <AddButton className="button row" onClick={() => setUserMenu(true)}>
                        <Avatar
                          className="mr-5"
                          size="medium"
                          circle
                          image={null}
                          color="#007af5"
                          title="">
                          <IconComponent
                            icon="plus"
                            size={20}
                            color="#00a8ff"
                          />
                        </Avatar>

                        <Link className="ml-10">Add new Member</Link>
                      </AddButton>
                    </QuickUserComponent>
                  </div>
                )
              },
              {
                title: 'Danger zone',
                show: true,
                content: (
                  <div className="row align-items-start w-100">
                    <div className="column w-100">

                      {confirmDeleteModal &&
                        <ConfirmModal
                          onOkay={handleDeleteRoom}
                          onCancel={() => setConfirmDeleteModal(false)}
                          text="Are you sure you want to delete this channel, it can not be undone?"
                          title="Are you sure?"
                        />
                      }

                      <div className="column p-20 flex-1 scroll w-100">
                        <Text className="color-red h5 mb-10">Here be dragons!</Text>
                        <Text className="color-d0 p mb-30">This cannot be undone.</Text>

                        <Button
                          text="Delete"
                          theme="red"
                          onClick={() => setConfirmDeleteModal(true)}
                        />
                      </div>
                    </div>
                  </div>
                )
              },
            ]}
          />
      </Modal>
    </ModalPortal>
  )
}

RoomModal.propTypes = {
  team: PropTypes.any,
  start: PropTypes.number,
  members: PropTypes.array,
  onClose: PropTypes.func,
}
