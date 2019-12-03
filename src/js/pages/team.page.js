import React, { useState, useEffect } from 'react'
import AuthService from '../services/auth.service'
import styled from 'styled-components'
import PropTypes from 'prop-types'
import { Loading, Error, Input, Button, Notification, Avatar } from '@weekday/elements'
import GraphqlService from '../services/graphql.service'

const Container = styled.div`
  background: #f3f3f3;
  width: 100%;
  height: 100%;
  position: absolute;
  left: 0px;
  top: 0px;
  display: flex;
  align-items: center;
  align-content: center;
  justify-content: center;
`

const Inputs = styled.div`
  position: relative;
  width: 300px;
  border-radius: 30px;
  display: flex;
  align-items: center;
  align-content: center;
  justify-content: center;
  flex-direction: column;
`

const Inner = styled.div`
  background: white;
  position: relative;
  height: 650px;
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

const Text = styled.div``

export default props => {
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [joined, setJoined] = useState(false)
  const [image, setImage] = useState('')
  const [name, setName] = useState('')
  const [notification, setNotification] = useState(false)
  const [shortcode, setShortcode] = useState('')

  const handleTeamJoin = async () => {
    setLoading(true)
    setError(false)
    setNotification(false)

    if (shortcode == '') {
      setError('Please enter a shortcode')
      setLoading(false)

      return
    }

    try {
      const { userId } = await AuthService.currentAuthenticatedUser()
      const { slug } = props.match.params
      const { data } = await GraphqlService.getInstance().joinTeam(slug, userId, shortcode)

      setLoading(false)

      if (!data.joinTeam) setError('Could not join team')
      if (data.joinTeam) {
        setJoined(true)
        setNotification('successfully joined team')
      }
    } catch (e) {
      setLoading(false)
      setNotification(false)
      setError('Could not join team')
    }
  }

  useEffect(() => {
    ;(async () => {
      try {
        setLoading(true)

        const { data } = await GraphqlService.getInstance().teamSlug(props.match.params.slug)

        setImage(data.teamSlug.image)
        setName(data.teamSlug.name)
        setLoading(false)
      } catch (e) {
        setLoading(false)
        setError('This team does not exist')
      }
    })()
  }, [])

  // prettier-ignore
  return (
    <React.Fragment>
      <Error message={error} />
      <Notification text={notification} />

      <Container className="column">
        <Loading show={loading} />

        {!joined &&
          <Inner>
            <Avatar
              image={image}
              title={name}
              className="mb-20"
              size="xx-large"
            />
            <Text className="h1 mb-30 mt-10 color-d3">{name}</Text>
            <Text className="h3 mb-10 pl-20 pr-20 text-center color-d2">Please enter the shortcode to join this team</Text>
            <Text className="h5 color-d0">Contact your team admin if you do not know the shortcode</Text>
            <Inputs>
              <Input
                placeholder="Enter shortcode here"
                inputSize="large"
                className="mt-30"
                value={shortcode}
                onChange={e => setShortcode(e.target.value)}
              />
              <Button
                onClick={handleTeamJoin}
                size="large"
                text="Join Now"
              />
            </Inputs>
          </Inner>
        }

        {joined &&
          <Inner>
            <Avatar
              image={image}
              title={name}
              className="mb-20"
              size="xx-large"
            />
            <Text className="h1 mb-30 mt-10 color-d3">{name}</Text>
            <Text className="h3 mb-10 pl-20 pr-20 text-center color-d2">Congratulations</Text>
            <Text className="h5 color-d0">You have successfully joined this team. Click on the button to start.</Text>
            <Inputs>
              <Button
                onClick={() => props.history.push('/app')}
                size="large"
                text="Start"
              />
            </Inputs>
          </Inner>
        }

        <Logo>
          <img src="./logo.png" height="20" alt="Weekday"/>
          <LogoText>weekday</LogoText>
        </Logo>
      </Container>
    </React.Fragment>
  )
}
