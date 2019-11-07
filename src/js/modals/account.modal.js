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
import { Text } from '../elements'

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
  color: #d93025;
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
  margin-left: 10px;
`

const MailAddress = styled.div`
  color: #007af5;
  font-size: 12px;
  font-weight: 600;
`

const MailStatus = styled.div`
  color: #858e96;
  font-size: 12px;
  font-weight: 400;
`

const EmailAddress = props => {
  const [over, setOver] = useState(false)

  // prettier-ignore
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

        setImage(user.image)
        setUsername(user.username)
        setName(user.name || '')
        setRole(user.role || '')
        setDescription(user.description || '')
        setEmail(user.email)
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

  const handleNewEmailAddressConfirm = async emailAddress => {
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

  const handleNewEmailAddressDelete = async emailAddress => {
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
    setLoading(true)
    setError(false)

    try {
      const updatedUser = { name, role, description, username, image }
      const userId = props.id

      await GraphqlService.getInstance().updateUser(userId, updatedUser)

      dispatch(updateUser(updatedUser))
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

                    <div className="column pl-10">
                        <div className="row pb-5">
                          <Text color="d" display="h3">{name}</Text>
                        </div>
                        <div className="row">
                          <Text color="m" display="p" className="mr-10">{role}</Text>
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
                      <Text color="d" display="h3">Connected email addresses</Text>
                      <Text color="m" display="p" className="mb-30">Use your Weekday account with more than just 1 email address.</Text>

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
                      <Text color="d" display="h3">Change & update your password</Text>
                      <Text color="m" display="p" className="mb-30">You need to know your old password.</Text>

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
                      <Text color="d" display="h3">Here be dragons!</Text>
                      <Text color="m" display="p" className="mb-30">This cannot be undone.</Text>

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
