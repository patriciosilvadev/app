import React, { useState, useRef, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import GraphqlService from '../services/graphql.service'
import UploadService from '../services/upload.service'
import ConfirmModal from './confirm.modal'
import PropTypes from 'prop-types'
import MessagingService from '../services/messaging.service'
import ModalPortal from '../portals/modal.portal'
import { browserHistory } from '../services/browser-history.service'
import styled from 'styled-components'
import { Input, Textarea, Modal, Tabbed, Notification, Spinner, Error, User, Avatar, Button } from '@weekday/elements'
import { IconComponent } from '../components/icon.component'
import { Text } from '../elements'
import { copyToClipboard } from '../helpers/util'
import { LINK_URL_PREFIX } from '../environment'
import { deleteTeam, updateTeam } from '../actions'

export default function TeamModal(props) {
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(null)
  const [notification, setNotification] = useState(null)
  const [image, setImage] = useState('')
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [emails, setEmails] = useState('')
  const [members, setMembers] = useState([])
  const [description, setDescription] = useState('')
  const dispatch = useDispatch()
  const fileRef = useRef(null)
  const user = useSelector(state => state.user)
  const [confirmDeleteModal, setConfirmDeleteModal] = useState(false)
  const [confirmSelfDeleteModal, setConfirmSelfDeleteModal] = useState(false)
  const [confirmMemberDeleteModal, setConfirmMemberDeleteModal] = useState(false)
  const [memberDeleteId, setMemberDeleteId] = useState('')

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

  const handleUpdateTeamUrl = async () => {
    setLoading(true)
    setError(null)

    try {
      const teamId = props.id
      const { data } = await GraphqlService.getInstance().updateTeamUrl(teamId)

      setUrl(data.updateTeamUrl)
      setLoading(false)
      setNotification('Succesfully updated team url')
      dispatch(updateTeam(teamId, { url }))
    } catch (e) {
      setLoading(false)
      setError('Error updating team url')
    }
  }

  const handleUpdateTeam = async () => {
    setLoading(true)
    setError(null)

    try {
      const teamId = props.id
      await GraphqlService.getInstance().updateTeam(teamId, { name, description, image })

      setLoading(false)
      setNotification('Succesfully updated team')
      dispatch(updateTeam(teamId, { name, description, image }))
    } catch (e) {
      setLoading(false)
      setError('Error updating team')
    }
  }

  const handleDeleteTeam = async () => {
    setLoading(true)
    setError(null)
    setConfirmDeleteModal(false)

    try {
      const teamId = props.id
      const deleteTeam = await GraphqlService.getInstance().deleteTeam(teamId)

      // Sync this one for everyone
      dispatch(deleteTeam(teamId, true))
      setLoading(false)
      browserHistory.push('/app')
      props.onClose()
    } catch (e) {
      setLoading(false)
      setError('Error deleting team')
    }
  }

  const inviteTeamMembers = async () => {
    try {
      setLoading(true)
      setError(null)

      await GraphqlService.getInstance().inviteTeamMembers(name, url, emails)

      setLoading(false)
      setEmails('')
    } catch (e) {
      setLoading(false)
      setError('Error creating team member')
    }
  }

  const deleteTeamMember = async () => {
    setLoading(true)
    setError(null)

    try {
      const teamId = props.id
      const userId = memberDeleteId
      const userIds = [userId]
      const deleteTeamMember = await GraphqlService.getInstance().deleteTeamMember(teamId, userId)
      const updatedMembers = members.filter(member => member.user.id != userId)

      setLoading(false)

      // Revoke access to people
      // MessagingService.getInstance().revoke(team, [user])
      // Update the UI
      setMemberDeleteId('')
      setConfirmMemberDeleteModal(false)
      setMembers(updatedMembers)

      MessagingService.getInstance().leaveTeam(userIds, teamId)
    } catch (e) {
      setLoading(false)
      setError('Error deleting team member')
    }
  }

  const deleteTeamMemberSelf = async () => {
    setLoading(true)
    setError(null)

    try {
      const teamId = props.id
      const userId = user.id
      const deleteTeamMember = await GraphqlService.getInstance().deleteTeamMember(teamId, userId)

      setLoading(false)

      // Don't sync this one - because its just for us
      // false is for syncing here
      dispatch(deleteTeam(teamId, false))

      MessagingService.getInstance().leave(teamId)

      // Redirect the user back to the landing page
      browserHistory.push('/app')
      props.onClose()
    } catch (e) {
      setLoading(false)
      setError('Error deleting self')
    }
  }

  const updateTeamMemberAdmin = async (userId, admin) => {
    setLoading(true)
    setError(null)

    try {
      const teamId = props.id
      const updateTeamMemberAdmin = await GraphqlService.getInstance().updateTeamMemberAdmin(teamId, userId, admin)

      setLoading(false)
      setMembers(members.map(member => (member.user.id == userId ? { ...member, admin } : member)))
    } catch (e) {
      setLoading(false)
      setError('Error setting admin')
    }
  }

  const handleDeleteClick = member => {
    if (member.user.id == user.id) {
      setConfirmSelfDeleteModal(true)
    } else {
      setConfirmMemberDeleteModal(true)
      setMemberDeleteId(member.user.id)
    }
  }

  // Effect loads current team details
  useEffect(() => {
    ;(async () => {
      try {
        if (!props.id) return

        setLoading(true)

        const { data } = await GraphqlService.getInstance().team(props.id)
        const team = data.team

        setImage(team.image)
        setName(team.name || '')
        setDescription(team.description || '')
        setMembers(team.members)
        setUrl(team.url)
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
        title="Team"
        width={800}
        height="80%"
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

                      <div className="row w-100 p-20">
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

                        <div className="column flexer header pl-10">
                          <div className="row pb-5">
                            <Text color="d" display="h3">{name}</Text>
                          </div>
                          <div className="row">
                            {props.id &&
                              <Text color="m" display="p" className="mr-10">{members.length} members</Text>
                            }
                            <Text color="highlight" display="a" className="button" onClick={() => fileRef.current.click()}>Update profile image</Text>
                          </div>
                        </div>
                      </div>

                      <div className="column p-20 flex-1 scroll w-100">
                        <Input
                          label="Full name"
                          value={name}
                          onChange={e => setName(e.target.value)}
                          placeholder="Enter full name"
                        />

                        <Textarea
                          label="Description"
                          value={description}
                          onChange={e => setDescription(e.target.value)}
                          placeholder="Add a description"
                          rows={8}
                        />

                        <Button
                          onClick={handleUpdateTeam}
                          text="Save"
                        />
                      </div>
                    </div>
                  </div>
                )
              },
              {
                title: 'Members',
                show: true,
                content: (
                  <div className="column flex-1 w-100 h-100">
                    {error && <Error message={error} />}
                    {loading && <Spinner />}
                    {notification && <Notification text={notification} />}

                    {confirmSelfDeleteModal &&
                      <ConfirmModal
                        onOkay={deleteTeamMemberSelf}
                        onCancel={() => setConfirmSelfDeleteModal(false)}
                        text="Are you sure you want to leave this team?"
                        title="Are you sure?"
                      />
                    }

                    {confirmMemberDeleteModal &&
                      <ConfirmModal
                        onOkay={deleteTeamMember}
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
                          <IconComponent
                            icon="delete"
                            size={25}
                            color="#007af5"
                            onClick={() => handleDeleteClick(member)}
                            className="button"
                          />

                          <Button
                            size="small"
                            className="ml-20"
                            onClick={() => updateTeamMemberAdmin(member.user.id, !member.admin)}
                            text={member.admin ? 'Remove Admin' : 'Make Admin'}
                          />
                        </User>
                      )
                    })}
                  </div>
                )
              },
              {
                title: 'Invite & share',
                show: true,
                content: (
                  <div className="row align-items-start w-100">
                    <div className="column w-100">

                      <div className="column p-20 flex-1 scroll w-100">
                        <Text color="d" display="h3">Invite users</Text>
                        <Text color="m" display="p" className="mb-10">Add users email.</Text>

                        <div className="mb-5">
                          <Text
                            className="button"
                            color="highlight"
                            display="a"
                            onClick={() => copyToClipboard(`${LINK_URL_PREFIX}/join/${url}`)}>
                            Click here
                          </Text>
                          <Text color="d" display="p"> to copy a temporary access URL that users can use to join this team</Text>
                        </div>

                        <Button
                          text="Generate a new url"
                          onClick={handleUpdateTeamUrl}
                          className="mt-30 mb-30"
                          size="small"
                        />

                        <Textarea
                          placeholder="Comma seperated email addresses"
                          value={emails}
                          onChange={(e) => setEmails(e.target.value)}
                        />

                        <Button
                          text="Invite users"
                          onClick={inviteTeamMembers}
                        />
                      </div>
                    </div>
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
                          onOkay={handleDeleteTeam}
                          onCancel={() => setConfirmDeleteModal(false)}
                          text="Are you sure you want to delete this team, it can not be undone?"
                          title="Are you sure?"
                        />
                      }
                      <div className="column p-20 flex-1 scroll w-100">
                        <Text color="d" display="h3">Here be dragons!</Text>
                        <Text color="m" display="p" className="mb-30">This cannot be undone.</Text>

                        <Button
                          text="Delete"
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

TeamModal.propTypes = {
  onClose: PropTypes.func,
  start: PropTypes.number,
  id: PropTypes.string,
  history: PropTypes.any,
}
