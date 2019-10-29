import React, { useState, useRef, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import GraphqlService from '../services/graphql.service'
import UploadService from '../services/upload.service'
import AuthService from '../services/auth.service'
import styled from 'styled-components'
import { Formik } from 'formik'
import ConfirmModal from './confirm.modal'
import * as Yup from 'yup'
import PropTypes from 'prop-types'
import { updateUser } from '../actions'
import ModalPortal from '../portals/modal.portal'
import { Avatar, Button, Input, Textarea, Notification, Modal, Tabbed, Spinner, Error } from '@weekday/elements'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

const Header = styled.div`
  flex: 1;
`

const TitleText = styled.div`
  color: #483545;
  font-size: 14px;
  font-weight: 400;
`

const SubtitleText = styled.div`
  color: #858e96;
  font-size: 12px;
  font-weight: 400;
`

const MailTable = styled.table`
  margin-bottom: 50px;
  margin-top: 50px;
`

const MailTableCell = styled.td`
  border-bottom: 1px solid #edf0f2;
  height: 30px;
`

const MailButtonConfirm = styled.span`
  color: #007af5;
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
  margin-left: 10px;
`

const MailButtonDelete = styled.span`
  color: #D93025;
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
  margin-left: 10px;
`

const MailAddress = styled.div`
  color:#007af5;
  font-size: 12px;
  font-weight: 600;
`

const MailStatus = styled.div`
  color: #858e96;
  font-size: 12px;
  font-weight: 400;
`

const HeaderLink = styled.div`
  color: #00a8ff;
  font-size: 12px;
  font-weight: 400;
  padding-left: 10px;
  cursor: pointer;
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

const EmailAddress = props => {
  const [over, setOver] = useState(false)

  return (
    <tr onMouseEnter={() => setOver(true)} onMouseLeave={() => setOver(false)}>
      <MailTableCell width="40%"><MailAddress>{props.email.address}</MailAddress></MailTableCell>
      <MailTableCell width="30%"><MailStatus>{props.email.confirmed ? "Confirmed" : "Not confirmed"}</MailStatus></MailTableCell>
      <MailTableCell>
        {over &&
          <React.Fragment>
            {!props.email.confirmed &&
              <MailButtonConfirm onClick={() => props.onConfirm(props.email.address)} className="button">Confirm</MailButtonConfirm>
            }

            <MailButtonDelete onClick={() => props.onDelete(props.email.address)} className="button">Delete</MailButtonDelete>
          </React.Fragment>
        }
      </MailTableCell>
    </tr>
  )
}

export default function AccountModal(props) {
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(null)
  const [notification, setNotification] = useState(null)
  const [image, setImage] = useState('')
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [role, setRole] = useState('')
  const [description, setDescription] = useState('')
  const [email, setEmail] = useState([])
  const [newEmailAddress, setNewEmailAddress] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('')
  const [confirmAccountDeleteModal, setConfirmAccountDeleteModal] = useState('')
  const dispatch = useDispatch()
  const fileRef = useRef(null)

  useEffect(() => {
    ;(async () => {
      try {
        setLoading(true)

        const { data } = await GraphqlService.getInstance().user(props.id)
        const user = data.user

        setImage(user.image || '')
        setName(user.name || '')
        setUsername(user.username || '')
        setRole(user.role || '')
        setDescription(user.description || '')
        setEmail(user.email || '')
        setLoading(false)
      } catch (e) {
        setLoading(false)
        setError('Error getting data')
      }
    })()
  }, {})

  const handleAccountDelete = async () => {
    setLoading(true)
    setError(false)

    try {
      const userId = props.id
      await AuthService.accountDelete(userId)
      AuthService.signout()
      window.location.reload()

    } catch (e) {
      setLoading(false)
      setError('There has been an error')
    }
  }

  const handlePasswordUpdate = async () => {
    if (newPassword != newPasswordConfirm) return setError('Passwords must match')

    setLoading(true)
    setError(false)

    try {
      const userId = props.id
      const auth = await AuthService.updatePassword(userId, currentPassword, newPassword)

      if (auth.status == 401) {
        setError('Wrong password')
        setLoading(false)
      } else {
        setLoading(false)
        setNotification('Successfully updated')
      }
    } catch (e) {
      setLoading(false)
      setError('There has been an error')
    }
  }

  const handleNewEmailAddressConfirm = async (emailAddress) => {
    setLoading(true)
    setError(false)

    try {
      const userId = props.id
      const auth = await AuthService.confirmEmail(emailAddress, userId)

      setLoading(false)
      setNotification('We have sent you a confirmation email')
    } catch (e) {
      setLoading(false)
      setError('There has been an error')
    }
  }

  const handleNewEmailAddressDelete = async (emailAddress) => {
    if (email.length == 1) return setError('You need at least 1 connected email address')

    setLoading(true)
    setError(false)

    try {
      const userId = props.id
      const auth = await AuthService.deleteEmail(emailAddress, userId)

      setLoading(false)
      setNotification('Succesfully removed email')
      setEmail(email.filter(e => e.address != emailAddress))
    } catch (e) {
      setLoading(false)
      setError('There has been an error')
    }
  }

  const handleNewEmailAddressAdd = async () => {
    if (newEmailAddress.trim() == '') return setError('This field is mandatory')

    setLoading(true)
    setError(false)

    try {
      const userId = props.id
      const auth = await AuthService.addEmail(newEmailAddress, userId)

      if (auth.status == 401) {
        setError('Email is already taken')
        setLoading(false)
      } else {
        setLoading(false)
        setEmail([...email, { address: newEmailAddress, confirmed: false }])
        setNewEmailAddress('')
        setNotification('Succesfully added new email')
      }
    } catch (e) {
      setLoading(false)
      setError('There has been an error')
    }
  }

  const handleSubmit = async () => {
    if (email.trim() == '') return setError('This field is mandatory')

    setLoading(true)
    setError(false)

    try {
      const updatedUser = { name, role, email, description, username, image }
      const userId = props.id

      await GraphqlService.getInstance().updateUser(userId, updatedUser)

      dispatch({ type: 'UPDATE_USER', payload: updatedUser })

      setLoading(false)
      setNotification('Succesfully updated')
    } catch (e) {
      setLoading(false)
      setError('Email or username are taken')
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

  // prettier-ignore
  return (
    <ModalPortal>
      <Modal
        title="Account"
        width={700}
        height="90%"
        onClose={props.onClose}>

        <Tabbed
          start={0}
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
                        circle
                      />

                      <Header className="column">
                        <div className="row pb-5">
                          <TitleText>{name}</TitleText>
                        </div>
                        <div className="row">
                          <SubtitleText>{role}</SubtitleText>
                          <HeaderLink onClick={() => fileRef.current.click()}>Update profile image</HeaderLink>
                        </div>
                      </Header>
                    </div>

                    <div className="column p-20 flex-1 scroll w-100">
                      <Input
                        label="Full name"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="Enter full name"
                      />

                      <Input
                        label="Role"
                        value={role}
                        onChange={e => setRole(e.target.value)}
                        placeholder="Enter your role"
                      />

                      <Input
                        label="Username"
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        placeholder="Username"
                      />

                      <Textarea
                        label="Description"
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        placeholder="Enter bio"
                        rows={2}
                      />

                      <Button
                        onClick={handleSubmit}
                        text="Save"
                      />
                    </div>
                  </div>
                </div>
              )
            },
            {
              title: 'Email accounts',
              show: true,
              content: (
                <div className="row align-items-start w-100">
                  <div className="column w-100">
                    {error && <Error message={error} />}
                    {loading && <Spinner />}
                    {notification && <Notification text={notification} />}

                    <div className="column p-20 flex-1 scroll w-100">
                      <TitleText>Connected email addresses</TitleText>
                      <SubtitleText>Use your Weekday account with more than just 1 email address.</SubtitleText>

                      <MailTable width="100%">
                        <tbody>
                          {email.map((e, index) => (
                            <EmailAddress
                              key={index}
                              onDelete={handleNewEmailAddressDelete}
                              onConfirm={handleNewEmailAddressConfirm}
                              email={e}
                            />
                          ))}
                        </tbody>
                      </MailTable>

                      <Input
                        label="Connect another email address"
                        value={newEmailAddress}
                        onChange={e => setNewEmailAddress(e.target.value)}
                        placeholder="Enter your email"
                      />
                      <Button
                        text="Add"
                        onClick={handleNewEmailAddressAdd}
                      />
                    </div>
                  </div>
                </div>
              )
            },
            {
              title: 'Security',
              show: true,
              content: (
                <div className="row align-items-start w-100">
                  <div className="column w-100">
                    {error && <Error message={error} />}
                    {loading && <Spinner />}
                    {notification && <Notification text={notification} />}

                    <div className="column p-20 flex-1 scroll w-100">
                      <TitleText>Change your password</TitleText>
                      <SubtitleText className="mb-30">Update your password</SubtitleText>

                      <Input
                        label="Current password"
                        value={currentPassword}
                        onChange={e => setCurrentPassword(e.target.value)}
                        placeholder=""
                        type="password"
                        autocomplete="no"
                      />

                      <Input
                        label="New password"
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        placeholder=""
                        type="password"
                        autocomplete="no"
                      />

                      <Input
                        label="Confirm new password"
                        value={newPasswordConfirm}
                        onChange={e => setNewPasswordConfirm(e.target.value)}
                        placeholder=""
                        type="password"
                        autocomplete="no"
                      />
                      <Button
                        text="Update"
                        onClick={handlePasswordUpdate}
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
                    {error && <Error message={error} />}
                    {loading && <Spinner />}
                    {notification && <Notification text={notification} />}

                    {confirmAccountDeleteModal &&
                      <ConfirmModal
                        onOkay={handleAccountDelete}
                        onCancel={() => setConfirmAccountDeleteModal(false)}
                        text="Are you sure you want to delete your account, it can not be undone?"
                        title="Are you sure?"
                      />
                    }

                    <div className="column p-20 flex-1 scroll w-100">
                      <TitleText>Delete your account</TitleText>
                      <SubtitleText className="mb-30">Here be dragons! This cannot be undone.</SubtitleText>

                      <Button
                        text="Delete"
                        onClick={() => setConfirmAccountDeleteModal(true)}
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

AccountModal.propTypes = {
  onClose: PropTypes.func,
  id: PropTypes.string,
}
