import React, { useState, useEffect, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import styled from 'styled-components'
import ModalPortal from '../portals/modal.portal'
import PropTypes from 'prop-types'
import GraphqlService from '../services/graphql.service'
import UploadService from '../services/upload.service'
import { Button, Modal, Input, Textarea, Avatar, Notification, Spinner, Error } from '@weekday/elements'
import { validEmail, logger } from '../helpers/util'
import { createTeam } from '../actions'
import MessagingService from '../services/messaging.service'

const Container = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  align-content: center;
  justify-content: center;
  background: #f3f3f3;
  position: relative;
`

const Inner = styled.div`
  background: white;
  position: relative;
  height: 90%;
  width: 550px;
  border-radius: 30px;
  display: flex;
  align-items: center;
  align-content: center;
  justify-content: center;
  flex-direction: column;
`

const Logo = styled.div`
  position: absolute;
  top: 40px;
  left: 40px;
  z-index: 1000;
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-content: center;
  align-items: center;
  margin-right: auto;
`

const LogoText = styled.div`
  padding-left: 5px;
  position: relative;
  bottom: 2px;
  color: #007af5;
  font-size: 22px;
  font-weight: 400;
  font-family: 'hk_groteskmedium', helvetica;
`

const InputContainer = styled.div`
  width: 80%;
  padding: 5px;
`

const Text = styled.div``

export default function TeamOnboardingModal(props) {
  const [loading, setLoading] = useState(null)
  const [notification, setNotification] = useState(null)
  const [error, setError] = useState(null)
  const [step, setStep] = useState(1)
  const [image, setImage] = useState('')
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [shortcode, setShortcode] = useState('')
  const [emails, setEmails] = useState('')
  const [email1, setEmail1] = useState('')
  const [email2, setEmail2] = useState('')
  const [email3, setEmail3] = useState('')
  const [email4, setEmail4] = useState('')
  const dispatch = useDispatch()
  const fileRef = useRef(null)
  const user = useSelector(state => state.user)

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

  const handleNewTeamCreate = async () => {
    setLoading(true)
    setError(false)

    try {
      const { data } = await GraphqlService.getInstance().createTeam({
        name,
        description: '',
        image,
        members: [
          {
            user: user.id,
            role: 'ADMIN',
          },
        ],
      })

      setSlug(data.createTeam.slug)
      setShortcode(data.createTeam.shortcode)
      setLoading(false)
      setStep(3)
      dispatch(createTeam(data.createTeam))

      MessagingService.getInstance().join(data.createTeam.id)
    } catch (e) {
      logger(e)
      setLoading(false)
      setError(e)
    }
  }

  const handleNewTeamInvites = async () => {
    try {
      const emails = []

      // Check all our 4 email addresses here
      // If they are not black then they must be valid
      // Otherwise don't add them to be invited
      if (email1 != '') {
        if (!validEmail(email1)) return setError('Only valid emails are accepted')
        emails.push(email1)
      }

      if (email2 != '') {
        if (!validEmail(email2)) return setError('Only valid emails are accepted')
        emails.push(email2)
      }

      if (email3 != '') {
        if (!validEmail(email3)) return setError('Only valid emails are accepted')
        emails.push(email3)
      }

      if (email4 != '') {
        if (!validEmail(email4)) return setError('Only valid emails are accepted')
        emails.push(email4)
      }

      // Don't do anything if they haven't added emails
      if (emails.length == 0) return

      setLoading(true)
      setError(null)

      await GraphqlService.getInstance().inviteTeamMembers(name, slug, shortcode, emails.join(','))

      // Stop the loading
      setLoading(false)

      // And then cancel the modal
      props.onCancel()
    } catch (e) {
      setLoading(false)
      setError('Error creating team member')
    }
  }

  // prettier-ignore
  return (
    <ModalPortal>
      <Modal
        title="Create a new team"
        frameless={true}
        width="100%"
        height="100%"
        onClose={props.onCancel}>
        <React.Fragment>
          {error && <Error message={error} />}
          {loading && <Spinner />}
          {notification && <Notification text={notification} />}

          <Container>
            <Inner>
              {step == 1 &&
                <React.Fragment>
                  <img src="./team-onboarding.png" width="90%" />

                  <Text className="h1 mb-30 mt-30 color-d3">Start Something</Text>
                  <Text className="h3 mb-10 pl-20 pr-20 text-center color-d2">Please enter the shortcode to join this team</Text>
                  <Text className="h5 color-d0">Contact your team admin if you do not know the shortcode</Text>

                  <div className="column mt-30 align-items-center w-100">
                    <InputContainer>
                      <Input
                        placeholder="Team name"
                        inputSize="large"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </InputContainer>

                    <Button
                      onClick={() => name != "" ? setStep(2) : null}
                      size="large"
                      text="Next"
                    />

                    <div className="mt-30 color-blue h5 button" onClick={props.onCancel}>
                      No thanks, not now
                    </div>
                  </div>
                </React.Fragment>
              }

              {step == 2 &&
                <React.Fragment>
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
                    size="xxx-large"
                  />

                  <Text className="h1 mb-30 mt-30 color-d3">{name}</Text>
                  <Text className="h3 mb-10 pl-20 pr-20 text-center color-d2">Choose an image</Text>
                  <Text className="h5 color-d0 mb-30">
                    <span className="color-blue bold h5 button" onClick={() => fileRef.current.click()}>Click here</span> to choose an image for your new team
                  </Text>

                  <div className="row mt-30">
                    <Button
                      className="mr-10"
                      onClick={() => setStep(1)}
                      size="large"
                      text="Back"
                    />

                    <Button
                      onClick={handleNewTeamCreate}
                      size="large"
                      text="Create Team"
                    />
                  </div>

                  <div className="mt-30 color-blue h5 button" onClick={props.onCancel}>
                    No thanks, not now
                  </div>
                </React.Fragment>
              }

              {step == 3 &&
                <React.Fragment>
                  <Text className="h1 mb-30 mt-30 color-d3">Congratulations!</Text>
                  <Text className="h3 mb-10 pl-20 pr-20 text-center color-d2">Your team has been successfully created.</Text>
                  <Text className="h5 color-d0">Add more emails below to invite others to your team.</Text>

                  <div className="column mt-30 align-items-center w-100">
                    <InputContainer>
                      <Input
                        placeholder="Email address one"
                        inputSize="large"
                        value={email1}
                        onChange={(e) => setEmail1(e.target.value)}
                      />
                    </InputContainer>

                    <InputContainer>
                      <Input
                        placeholder="Email address two"
                        inputSize="large"
                        value={email2}
                        onChange={(e) => setEmail2(e.target.value)}
                      />
                    </InputContainer>

                    <InputContainer>
                      <Input
                        placeholder="Email address three"
                        inputSize="large"
                        value={email3}
                        onChange={(e) => setEmail3(e.target.value)}
                      />
                    </InputContainer>

                    <InputContainer>
                      <Input
                        placeholder="Email address four"
                        inputSize="large"
                        value={email4}
                        onChange={(e) => setEmail4(e.target.value)}
                      />
                    </InputContainer>

                    <Button
                      onClick={handleNewTeamInvites}
                      size="large"
                      text="Invite Now"
                      className="mt-30"
                    />

                    <div className="mt-30 color-blue h5 button" onClick={props.onCancel}>
                      Skip for now
                    </div>
                  </div>
                </React.Fragment>
              }
            </Inner>

            <Logo>
              <img src="./logo.png" height="20" alt="Weekday"/>
              <LogoText>weekday</LogoText>
            </Logo>
          </Container>
        </React.Fragment>
      </Modal>
    </ModalPortal>
  )
}

TeamOnboardingModal.propTypes = {
  onOkay: PropTypes.any,
  onCancel: PropTypes.any,
}