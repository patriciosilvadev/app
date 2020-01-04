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
import { copyToClipboard } from '../helpers/util'
import { LINK_URL_PREFIX } from '../environment'
import { deleteTeam, updateTeam } from '../actions'
import MembersTeamComponent from '../components/members-team.component'

export default function TeamModal(props) {
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(null)
  const [notification, setNotification] = useState(null)
  const [image, setImage] = useState('')
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [shortcode, setShortcode] = useState('')
  const [emails, setEmails] = useState('')
  const [members, setMembers] = useState([])
  const [description, setDescription] = useState('')
  const dispatch = useDispatch()
  const fileRef = useRef(null)
  const user = useSelector(state => state.user)
  const [confirmDeleteModal, setConfirmDeleteModal] = useState(false)
  const [admin, setAdmin] = useState(false)

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
      setLoading(false)
      setError('Error uploading file')
    }
  }

  const handleUpdateTeamSlug = async () => {
    setLoading(true)
    setError(null)

    try {
      const teamId = props.id
      const { data } = await GraphqlService.getInstance().updateTeamSlug(teamId, slug)

      setLoading(false)
      setNotification('Succesfully updated team slug')
      dispatch(updateTeam(teamId, { slug }))
    } catch (e) {
      setLoading(false)
      setError('Error updating team slug')
    }
  }

  const handleUpdateTeamShortcode = async () => {
    setLoading(true)
    setError(null)

    try {
      const teamId = props.id
      const { data } = await GraphqlService.getInstance().updateTeamShortcode(teamId, shortcode)

      setLoading(false)
      setNotification('Succesfully updated team shortcode')
      dispatch(updateTeam(teamId, { shortcode }))
    } catch (e) {
      setLoading(false)
      setError('Error updating team shortcode')
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

  const handleInviteTeamMembers = async () => {
    try {
      setLoading(true)
      setError(null)

      await GraphqlService.getInstance().inviteTeamMembers(name, slug, shortcode, emails)

      setLoading(false)
      setEmails('')
    } catch (e) {
      setLoading(false)
      setError('Error creating team member')
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

        const { data } = await GraphqlService.getInstance().team(props.id, user.id)
        const team = data.team

        setImage(team.image)
        setName(team.name || '')
        setDescription(team.description || '')
        setMembers(team.members)
        setShortcode(team.shortcode)
        setSlug(team.slug)
        setAdmin(team.role == 'ADMIN')
        setLoading(false)
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
                <Text className="h5 color-d2">{name}</Text>
              </div>
              <div className="row">
                {props.id &&
                  <Text className="p color-d0 button bold mr-10">{members.length} members</Text>
                }

                {admin &&
                  <Text
                    className="p color-blue button bold"
                    onClick={() => fileRef.current.click()}>
                    Update profile image
                  </Text>
                }
              </div>
            </div>
          </div>

          <div className="column p-20 flex-1 scroll w-100">
            <Input
              label="Team name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Enter full name"
              className="mb-20"
              disabled={!admin}
            />

            <Textarea
              label="Description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Add a description"
              rows={8}
              className="mb-20"
              disabled={!admin}
            />

            {admin &&
              <Button
                onClick={handleUpdateTeam}
                text="Save"
                theme="blue-border"
                size="small"
              />
            }
          </div>
        </div>
      </div>
    )
  }

  const renderMembers = () => {
    return (
      <div className="column flex-1 w-100 h-100">
        <MembersTeamComponent
          admin={admin}
          id={props.id}
          createChannel={props.createChannel}
          onClose={props.onClose}
          members={members}
        />
      </div>
    )
  }

  const renderAccess = () => {
    return (
      <div className="row align-items-start w-100">
        <div className="column w-100">

          <div className="column p-20 flex-1 scroll w-100">
            <Text className="color-d2 h5 mb-10">Outside access</Text>
            <Text className="color-d0 p mb-30">
              {`Allow anybody to join your team using a shortcode at ${LINK_URL_PREFIX}/t/${slug}`}
            </Text>

            <Input
              label="Update your team shortcode"
              value={shortcode}
              onChange={e => setShortcode(e.target.value)}
              placeholder="Enter shortcode"
              className="mb-20"
            />

            <div className="row mb-30">
              <Button
                onClick={handleUpdateTeamShortcode}
                text="Update shortcode"
                theme="blue-border"
                size="small"
              />

              <Button
                theme="blue-border"
                size="small"
                onClick={() => copyToClipboard(`${LINK_URL_PREFIX}/t/${slug}`)}
                text="Copy URL"
                className="ml-5"
              />
            </div>

            <Input
              label="Update your team slug"
              value={slug}
              onChange={e => setSlug(e.target.value)}
              placeholder="Enter Slug"
              className="mb-20"
            />

            <Button
              theme="blue-border"
              size="small"
              onClick={handleUpdateTeamSlug}
              text="Update slug"
            />
          </div>
        </div>
      </div>
    )
  }

  const renderInviteShare = () => {
    return (
      <div className="row align-items-start w-100">
        <div className="column w-100">
          <div className="column p-20 flex-1 scroll w-100">
            <Text className="color-d2 h5 mb-10">Invite users</Text>
            <Text className="color-d0 p mb-30">Add users email.</Text>

            <Textarea
              placeholder="Comma seperated email addresses"
              value={emails}
              onChange={(e) => setEmails(e.target.value)}
            />

            <Button
              text="Invite users"
              onClick={handleInviteTeamMembers}
              theme="blue-border"
              size="small"
            />
          </div>
        </div>
      </div>
    )
  }

  const renderDangerZone = () => {
    return (
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
  }

  const renderBillingAccount = () => {
    return (
      <div>
        <Button
          text="Ok"

        />
      </div>
    )
  }

  // prettier-ignore
  return (
    <ModalPortal>
      <Modal
        title="Team"
        width={800}
        height="80%"
        onClose={props.onClose}>
          <Tabbed
            start={props.start}
            panels={[
              {
                title: 'Overview',
                show: true,
                content: renderOverview()
              },
              {
                title: 'Members',
                show: true,
                content: renderMembers()
              },
              {
                title: 'Access',
                show: admin,
                content: renderAccess()
              },
              {
                title: 'Invite & share',
                show: admin,
                content: renderInviteShare()
              },
              {
                title: 'Billing Account',
                show: admin,
                content: renderBillingAccount()
              },
              {
                title: 'Danger zone',
                show: admin,
                content: renderDangerZone()
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
  createChannel: PropTypes.func,
}

const Text = styled.div``
