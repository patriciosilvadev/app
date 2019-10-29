import React, { useState, useRef, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import ModalPortal from '../portals/modal.portal'
import GraphqlService from '../services/graphql.service'
import styled from 'styled-components'
import UploadService from '../services/upload.service'
import PropTypes from 'prop-types'
import { browserHistory } from '../services/browser-history.service'
import { updateRoom, createRoomMember, deleteRoomMember } from '../actions'
import { DiMarkdown } from 'react-icons/di'
import ConfirmModal from './confirm.modal'
import { User, Modal, Tabbed, Popup, Loading, Error, Spinner, Notification, Input, Textarea, Button, Avatar } from '@weekday/elements'
import QuickUserComponent from '../components/quick-user.component'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

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
  const common = useSelector(state => state.common)
  const team = useSelector(state => state.team)
  const fileRef = useRef(null)
  const dispatch = useDispatch()
  const [memberToDelete, setMemberToDelete] = useState(null)
  const [confirmDeleteModal, setConfirmDeleteModal] = useState(false)
  const [confirmSelfDeleteModal, setConfirmSelfDeleteModal] = useState(false)
  const [confirmMemberDeleteModal, setConfirmMemberDeleteModal] = useState(false)
  const members = props.members || []

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
      <Modal
        title="Channel"
        width={700}
        height="90%"
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

                          <Link
                            className="button"
                            onClick={() => fileRef.current.click()}>
                            Update image
                          </Link>
                        </div>

                        <Column className="column">
                          <Input
                            label="Title"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="New channel title"
                          />

                          <Textarea
                            label="Description"
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="Add a description"
                            rows={8}
                          />

                          <div className="row">
                            <DiMarkdown
                              color="#00a8ff"
                              size={18}
                            />
                            <Supported>
                              Markdown supported
                            </Supported>
                          </div>
                        </Column>
                      </Row>
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
                          setUserMenu(false)
                          dispatch(deleteRoomMember(memberToDelete))
                          onClose()
                        }}
                        onCancel={() => setConfirmSelfDeleteModal(false)}
                        text="Are you sure you want to leave this room?"
                        title="Are you sure?"
                      />
                    }

                    {confirmMemberDeleteModal &&
                      <ConfirmModal
                        onOkay={() => {
                          if (members.length <= 2) return

                          setConfirmMemberDeleteModal(false)
                          setUserMenu(false)
                          dispatch(deleteRoomMember(memberToDelete))
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
                          name={member.user.id == common.user.id ? member.user.name + " (You)" : member.user.name}
                          label={`${member.user.username} ${member.admin ? "- Admin" : ""}`}>

                          <Button
                            size="small"
                            onClick={() => {
                              setMemberToDelete(member.user)

                              if (common.user.id == member.user.id) {
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
                      teamId={team.id}
                      visible={userMenu}
                      width={250}
                      direction="left-bottom"
                      handleDismiss={() => setUserMenu(false)}
                      handleAccept={({ user }) => {
                        // Check to see if there are already people
                        // Don't re-add people
                        if (members.filter(member => member.user.id == user.id).length > 0) return

                        // Otherwise all good - add them
                        dispatch(createRoomMember(user))
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
                          <FontAwesomeIcon
                            icon={["fal", "plus"]}
                            color="#00a8ff"
                            size="sm"
                          />
                        </Avatar>
                        <Link className="ml-10">Add new Member</Link>
                      </AddButton>
                    </QuickUserComponent>
                  </div>
                )
              }
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
