import React, { useState, useRef, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Avatar } from '@weekday/elements'
import GraphqlService from '../services/graphql.service'
import NotificationComponent from '../components/notification.component'
import ModalComponent from '../components/modal.component'
import UploadService from '../services/upload.service'
import TabbedComponent from '../components/tabbed.component'
import SpinnerComponent from '../components/spinner.component'
import ErrorComponent from '../components/error.component'
import styled from 'styled-components'
import { Formik } from 'formik'
import * as Yup from 'yup'
import PropTypes from 'prop-types'
import { updateUser } from '../actions'
import ModalPortal from '../portals/modal.portal'
import { Button } from '@weekday/elements'
import { InputComponent } from '../components/input.component'
import { TextareaComponent } from '../components/textarea.component'

const Header = styled.div`
  flex: 1;
`

const HeaderName = styled.div`
  color: #483545;
  font-size: 14px;
  font-weight: 400;
`

const HeaderRole = styled.div`
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

export default function AccountModal(props) {
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(null)
  const [notification, setNotification] = useState(null)
  const [image, setImage] = useState('')
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [role, setRole] = useState('')
  const [description, setDescription] = useState('')
  const [email, setEmail] = useState('')
  const dispatch = useDispatch()
  const fileRef = useRef(null)

  useEffect(() => {
    ;(async () => {
      try {
        setLoading(true)

        const { data } = await GraphqlService.getInstance().user(props.id)
        const user = data.user

        setImage(user.image)
        setName(user.name)
        setUsername(user.username)
        setRole(user.role)
        setDescription(user.description)
        setEmail(user.email)
        setLoading(false)
      } catch (e) {
        setLoading(false)
        setError('Error getting data')
      }
    })()
  }, {})

  const handleSubmit = async () => {
    if (email.trim() == '') return setError('This field is mandatory')

    setLoading(true)
    setError(true)

    try {
      const updatedUser = { name, role, email, description, username, image }
      const userId = props.id

      await GraphqlService.getInstance().updateUser(userId, updatedUser)

      dispatch({ type: 'UPDATE_USER', payload: updatedUser })

      setLoading(false)
      setNotification('Succesfully updated')
    } catch (e) {
      setLoading(false)
      setError('Error uploading file')
    }
  }

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
    <ModalPortal>
      <ModalComponent
        title="Account"
        width={700}
        height="90%"
        onClose={props.onClose}
        footer={(
          <div className="column w-100 align-items-stretch">
            <div className="mb-20 mr-20 ml-20 row flex-1 justify-content-end">
              <div className="flexer" />
              <Button
                jumbo
                onClick={handleSubmit}
                text="Save"
              />
            </div>
          </div>
        )}>

        <TabbedComponent
          start={3}
          panels={[
            {
              title: 'Billing',
              show: true,
              content: <div></div>
            },
            {
              title: 'Invoices',
              show: true,
              content: <div></div>
            },
            {
              title: 'Notifications',
              show: true,
              content: <div></div>
            },
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
                        circle
                      />

                      <Header className="column">
                        <div className="row pb-5">
                          <HeaderName>{name}</HeaderName>
                        </div>
                        <div className="row">
                          <HeaderRole>{role}</HeaderRole>
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

                      <InputComponent
                        label="Role"
                        value={role}
                        onChange={e => setRole(e.target.value)}
                        placeholder="Enter your role"
                      />

                      <InputComponent
                        label="Username"
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        placeholder="Username"
                      />

                      <InputComponent
                        label="Email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="Enter your email"
                      />

                      <TextareaComponent
                        label="Description"
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        placeholder="Enter bio"
                        rows={2}
                      />
                    </div>
                  </div>
                </div>
              )
            }
          ]}
        />
      </ModalComponent>
    </ModalPortal>
  )
}

AccountModal.propTypes = {
  onClose: PropTypes.func,
  id: PropTypes.string,
}
