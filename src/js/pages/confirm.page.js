import React, { useState, useEffect } from 'react'
import AuthService from '../services/auth.service'
import LoadingComponent from '../components/loading.component'
import ErrorComponent from '../components/error.component'
import styled from 'styled-components'
import PropTypes from 'prop-types'

const Confirm = styled.div`
  height: 100%;
  width: 100%;
  background: #f5f4f1;
  position: fixed;
  top: 0px;
  left: 0px;
  z-index: 100;
  background-image: url(https://mir-s3-cdn-cf.behance.net/project_modules/2800_opt_1/36a4b478530457.5ca746a72e431.jpg);
  background-size: contain;
`

const Container = styled.div`
  width: 400px;
  overflow: hidden;
  height: 650px;
  margin: auto;
  border-radius: 10px;
  background: white;
`

const Text = styled.div`
  color: #202529;
  font-size: 28px;
  font-weight: 600;
  padding: 20px;
  text-align: center;
  width: 100%;
`

const Logo = styled.div`
  position: absolute;
  top: 20px;
  right: 20px;
  background: #0f081f;
  border-radius: 100px;
`

const LogoText = styled.div`
  padding: 10px 15px 10px 15px;
  color: #007af5;
  font-size: 18px;
  font-weight: 400;
`

export default props => {
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const [block, setBlock] = useState(false)

  useEffect(() => {
    // VVV wtf is this - Prettier requires the ";"
    ;(async () => {
      setLoading(true)

      try {
        const auth = AuthService.confirm(props.match.params.token)

        setLoading(false)

        if (auth.status != 200) setBlock(true)
        if (auth.status == 200) setConfirmed(true)
      } catch (e) {
        setLoading(false)
        setError('Error')
      }
    })()
  }, null)

  // prettier-ignore
  return (
    <Confirm className="row">
      <LoadingComponent show={loading} />

      <Container className="column justify-content-center align-content-center">
        <ErrorComponent message={error} />

        {!block && confirmed && <Text>Your account has been confirmed</Text>}
        {!block && !confirmed && <Text>Checking...</Text>}
        {block && <Text>Not found</Text>}
      </Container>

      <Logo>
        <LogoText>weekday</LogoText>
      </Logo>
    </Confirm>
  )
}
