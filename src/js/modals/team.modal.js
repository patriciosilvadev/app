import React, { useState, useRef, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import ModalComponent from '../components/modal.component'
import TabbedComponent from '../components/tabbed.component'
import { Avatar } from '@weekday/elements'
import NotificationComponent from '../components/notification.component'
import GraphqlService from '../services/graphql.service'
import SpinnerComponent from '../components/spinner.component'
import ErrorComponent from '../components/error.component'
import UploadService from '../services/upload.service'
import ConfirmModal from './confirm.modal'
import styled from 'styled-components'
import UserComponent from '../components/user.component'
import PropTypes from 'prop-types'
import IconComponent from '../components/icon.component'
import MessagingService from '../services/messaging.service'
import ModalPortal from '../portals/modal.portal'
import { Button } from '@weekday/elements'
import { InputComponent } from '../components/input.component'
import { TextareaComponent } from '../components/textarea.component'
import { browserHistory } from '../services/browser-history.service'

const Header = styled.div`
  flex: 1;
`

const HeaderName = styled.div`
  color: #483545;
  font-size: 14px;
  font-weight: 400;
`

const HeaderMembers = styled.div`
  color: #858e96;
  font-size: 12px;
  font-weight: 400;
  padding-right: 10px;
`

const HeaderLink = styled.div`
  color: #00a8ff;
  font-size: 12px;
  font-weight: 400;
  cursor: pointer;
`

const Label = styled.div`
  color: #858e96;
  font-size: 12px;
  font-weight: 400;
  padding-bottom: 5px;
`

const SmallTextButton = styled.div`
  color: #adb5bd;
  font-size: 14px;
  font-weight: 500;
  text-decoration: underline;
  cursor: pointer;

  &:hover {
    color: #007af5;
  }
`

const Usernames = styled.div`
  width: 100%;
  border-bottom: 1px solid #f1f3f5;

  &::placeholder {
    color: #ebedef;
  }
`

const UsernamesInput = styled.input`
  color: #202529;
  font-size: 16px;
  font-weight: 400;
  padding: 20px;
  width: 100%;
  text-align: left;
  flex: 1;
  border: none;

  &::placeholder {
    color: #ebedef;
  }
`

export default function TeamModal(props) {
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(null)
  const [notification, setNotification] = useState(null)
  const [image, setImage] = useState('')
  const [name, setName] = useState('')
  const [usernames, setUsernames] = useState('')
  const [members, setMembers] = useState([])
  const [description, setDescription] = useState('')
  const dispatch = useDispatch()
  const fileRef = useRef(null)
  const common = useSelector(state => state.common)
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
      const { data, mime } = await result.json()

      setImage(data.Location)
      setLoading(false)
    } catch (e) {
      setLoading(false)
      setError('Error uploading file')
    }
  }

  const createTeam = async () => {
    setLoading(true)
    setError(null)

    try {
      const { data } = await GraphqlService.getInstance().createTeam({
        name,
        description,
        image,
        members: [
          {
            user: common.user.id,
            admin: true,
          },
        ],
      })
      const teamId = data.createTeam.id

      setLoading(false)
      dispatch({
        type: 'CREATE_TEAM',
        payload: data.createTeam,
      })

      MessagingService.getInstance().join(teamId)

      props.onClose()
    } catch (e) {
      setLoading(false)
      setError('Error creating team')
    }
  }

  const updateTeam = async () => {
    setLoading(true)
    setError(null)

    try {
      const teamId = props.id
      const { data } = await GraphqlService.getInstance().updateTeam(teamId, { name, description, image })

      setLoading(false)
      setNotification('Succesfully updated team')

      dispatch({
        type: 'UPDATE_TEAM',
        payload: { name, description, image, teamId },
        sync: teamId,
      })
    } catch (e) {
      setLoading(false)
      setError('Error updating team')
    }
  }

  const deleteTeam = async () => {
    setLoading(true)
    setError(null)
    setConfirmDeleteModal(false)

    try {
      const teamId = props.id
      const deleteTeam = await GraphqlService.getInstance().deleteTeam(teamId)

      setLoading(false)
      dispatch({
        type: 'DELETE_TEAM',
        payload: { teamId },
        sync: teamId,
      })

      browserHistory.push('/app')
      props.onClose()
    } catch (e) {
      setLoading(false)
      setError('Error deleting team')
    }
  }

  const createTeamMembers = async () => {
    setLoading(true)
    setError(null)

    try {
      const teamId = props.id
      const usernamesWithoutThisUser = usernames
        .split(',')
        .filter(username => username.trim() != common.user.email && username.trim() != common.user.username)
        .join(',')
      const { data } = await GraphqlService.getInstance().createTeamMembers(teamId, usernamesWithoutThisUser)
      const newMembers = data.createTeamMembers
      const userIds = newMembers.map(member => member.user.id)

      setLoading(false)
      setUsernames('')
      setMembers([...members, ...newMembers])

      MessagingService.getInstance().joinTeam(userIds, teamId)
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
      const userId = common.user.id
      const deleteTeamMember = await GraphqlService.getInstance().deleteTeamMember(teamId, userId)

      setLoading(false)

      // Don't sync this one - because its just for us
      dispatch({
        type: 'DELETE_TEAM',
        payload: { teamId },
      })

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

  // Effect loads current team details
  useEffect(() => {
    ;(async () => {
      try {
        if (!props.id) return

        setLoading(true)

        const { data } = await GraphqlService.getInstance().team(props.id)
        const team = data.team

        setImage(team.image)
        setName(team.name)
        setDescription(team.description)
        setMembers(team.members)
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
        title={props.id ? "Update Team" : "Create New Team"}
        width={560}
        height="90%"
        onClose={props.onClose}
        footer={(
          <div className="column w-100 align-items-stretch">
            <div className="mb-20 mr-20 ml-20 row flex-1 justify-content-end">
              <div className="flexer" />

              {confirmDeleteModal &&
                <ConfirmModal
                  onOkay={deleteTeam}
                  onCancel={() => setConfirmDeleteModal(false)}
                  text="Are you sure you want to delete this team, it can not be undone?"
                  title="Are you sure?"
                />
              }

              {props.id &&
                <React.Fragment>
                  <SmallTextButton className="mr-30" onClick={() => setConfirmDeleteModal(true)}>
                    Delete team
                  </SmallTextButton>
                  <Button
                    jumbo
                    onClick={updateTeam}
                    text="Save"
                  />
                </React.Fragment>
              }

              {!props.id &&
                <Button
                  jumbo
                  onClick={createTeam}
                  text="Create"
                />
              }
            </div>
          </div>
        )}>
          <TabbedComponent
            start={0}
            panels={[
              {
                title: 'Profile',
                show: true,
                content: (
                  <div className="row align-items-start w-100">
                    <div className="column w-100">
                      {error && <ErrorComponent message={error} />}
                      {loading && <SpinnerComponent />}
                      {notification && <NotificationComponent text={notification} />}

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

                        <Header className="column flexer header">
                          <div className="row pb-5">
                            <HeaderName>{name}</HeaderName>
                          </div>
                          <div className="row">
                            {props.id &&
                              <HeaderMembers>{members.length} members</HeaderMembers>
                            }
                            <HeaderLink onClick={() => fileRef.current.click()}>Update profile image</HeaderLink>
                          </div>
                        </Header>
                      </div>

                      <div className="column p-20 flex-1 scroll w-100">
                        <InputComponent
                          label="Full name"
                          value={name}
                          onChange={e => setName(e.target.value)}
                          placeholder="Enter full name"
                        />

                        <TextareaComponent
                          label="Description"
                          value={description}
                          onChange={e => setDescription(e.target.value)}
                          placeholder="Add a description"
                          rows={5}
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
                    {error && <ErrorComponent message={error} />}
                    {loading && <SpinnerComponent />}
                    {notification && <NotificationComponent text={notification} />}

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

                    <Usernames className="row">
                      <UsernamesInput
                        placeholder="Comma seperated usernames or email addresses"
                        value={usernames}
                        onChange={(e) => setUsernames(e.target.value)}
                      />

                      <IconComponent
                        icon="TEAM_CHECK"
                        color="#EBEDEF"
                        className="mr-20 button"
                        size="1x"
                        onClick={createTeamMembers}
                      />
                    </Usernames>

                    {members.map((member, index) => {
                      return (
                        <UserComponent
                          key={index}
                          image={member.user.image}
                          color={member.user.color}
                          name={member.user.id == common.user.id ? member.user.name + " (You)" : member.user.name}
                          label={member.user.email}>

                          <Button
                            text=""
                            onClick={() => {
                              if (member.user.id == common.user.id) {
                                setConfirmSelfDeleteModal(true)
                              } else {
                                setConfirmMemberDeleteModal(true)
                                setMemberDeleteId(member.user.id)
                              }
                            }}
                            icon={<IconComponent
                              icon="TEAM_DELETE"
                              color="#868E96"
                              size="1x"
                            />}
                          />

                          <Button
                            onClick={() => updateTeamMemberAdmin(member.user.id, !member.admin)}
                            text={member.admin ? 'Remove Admin' : 'Make Admin'}
                          />
                        </UserComponent>
                      )
                    })}
                  </div>
                )
              }
            ]}
          />
      </ModalComponent>
    </ModalPortal>
  )
}

TeamModal.propTypes = {
  onClose: PropTypes.func,
  id: PropTypes.string,
  history: PropTypes.any,
}
