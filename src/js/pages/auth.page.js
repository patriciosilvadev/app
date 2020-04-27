import React, { useState } from 'react'
import AuthService from '../services/auth.service'
import { connect } from 'react-redux'
import GraphqlService from '../services/graphql.service'
import styled from 'styled-components'
import { Formik } from 'formik'
import * as Yup from 'yup'
import PropTypes from 'prop-types'
import { fetchUser } from '../actions'
import { Loading, Button, Error, Input, Textarea, Select } from '@tryyack/elements'
import Zero from '@joduplessis/zero'
import moment from 'moment'

class AuthPage extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      view: 'signin',
      verify: false,
      error: null,
      loading: null,
      timezone: 0,
      userId: null,
      token: null,
    }

    this.signin = this.signin.bind(this)
    this.signup = this.signup.bind(this)
    this.signupOnboarding = this.signupOnboarding.bind(this)
    this.resetPassword = this.resetPassword.bind(this)
    this.updatePassword = this.updatePassword.bind(this)

    this.renderPasswordReset = this.renderPasswordReset.bind(this)
    this.renderPasswordUpdate = this.renderPasswordUpdate.bind(this)
    this.renderSignupOnboarding = this.renderSignupOnboarding.bind(this)
    this.renderSignup = this.renderSignup.bind(this)
    this.renderSignin = this.renderSignin.bind(this)

    this.AccountService = Zero.container().get('AccountService')
  }

  async signupOnboarding(payload) {
    const { userId, timezone, token } = this.state

    this.setState({
      loading: true,
      error: null,
    })

    try {
      const request = await this.AccountService.accountUpdate(userId, { ...payload, timezone: moment.tz.names()[timezone] })
      const result = await request.json()

      this.setState({ loading: false })

      if (request.status == 500) return this.setState({ error: 'Internal error' })
      if (request.status == 401) return this.setState({ error: 'Error' })
      if (request.status == 200) {
        this.props.fetchUser(userId)
        this.props.history.push('/app?onboarding=true')
      }
    } catch (e) {
      this.setState({
        loading: false,
        error: 'There has been an error',
      })
    }
  }

  async componentDidMount() {
    try {
      const { token } = await AuthService.currentAuthenticatedUser()
      const { sub } = AuthService.parseJwt(token)

      this.props.fetchUser(sub)
      this.props.history.push('/app')
      this.setState({ timezones: moment.tz.names() })
    } catch (e) {}
  }

  async signup(username, email, password, confirm) {
    this.setState({
      loading: true,
      error: null,
    })

    try {
      const request = await this.AccountService.signup(email, username, password)
      const result = await request.json()

      this.setState({ loading: false })

      if (request.status == 500) return this.setState({ error: 'Internal error' })
      if (request.status == 401) return this.setState({ error: 'Username or email not available' })
      if (request.status == 200) {
        const { user, token } = result
        const userId = user._id

        // Save our token
        AuthService.saveToken(token)

        // And then let the user onboard
        this.setState({
          view: 'signup-onboarding',
          userId,
          token,
        })
      }
    } catch (e) {
      this.setState({
        loading: false,
        error: 'Username not available',
      })
    }
  }

  async signin(username, password) {
    this.setState({
      loading: true,
      error: null,
    })

    try {
      const auth = await this.AccountService.signin(username, password)
      const data = await auth.json()

      this.setState({ loading: false })

      if (auth.status != 200) return this.setState({ error: 'Incorrect details' })
      if (auth.status == 200) {
        const { token, userId } = data

        AuthService.saveToken(token)
        this.props.fetchUser(userId)
        this.props.history.push('/app')
      }
    } catch (e) {
      this.setState({
        loading: false,
        error: 'Username not available',
      })
    }
  }

  async resetPassword(email) {
    this.setState({
      loading: true,
      error: null,
    })

    try {
      const auth = await this.AccountService.resetPassword(email)
      const data = await auth.json()

      this.setState({ loading: false })

      if (auth.status != 200) return this.setState({ error: 'Email not found' })
      if (auth.status == 200) return this.setState({ verify: true })
    } catch (e) {
      this.setState({
        loading: false,
        error: 'Not found',
      })
    }
  }

  async updatePassword(email, password, code) {
    this.setState({
      loading: true,
      error: null,
    })

    try {
      const auth = await this.AccountService.updatePasswordReset(email, password, code)
      const data = await auth.json()

      this.setState({ loading: false })

      if (auth.status != 200) return this.setState({ error: 'Not found' })
      if (auth.status == 200) return this.setState({ verify: false, view: 'signin' })
    } catch (e) {
      this.setState({
        loading: false,
        error: 'Not found',
      })
    }
  }

  // Render functions for the auth page
  // Making it easier (to read)
  renderPasswordReset() {
    if (!this.state.verify && this.state.view == 'password') {
      return (
        <Container className="column justify-content-center align-content-center align-items-stretch">
          <Formik
            initialValues={{ email: '' }}
            onSubmit={(values, actions) => {
              actions.resetForm()
              this.resetPassword(values.email)
            }}
            validationSchema={Yup.object().shape({
              email: Yup.string()
                .email()
                .required('Required'),
            })}
          >
            {props => {
              const { values, touched, errors, dirty, isSubmitting, handleChange, handleBlur, handleSubmit, handleReset } = props

              return (
                <Form onSubmit={handleSubmit} className="column align-items-center">
                  <div className="h5 color-d0 p-30 text-center">Enter your email address and we'll send you a verification code to reset your password.</div>

                  <InputContainer>
                    <Input
                      type="text"
                      name="email"
                      value={values.email}
                      inputSize="large"
                      placeholder="Email"
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={errors.email && touched.email ? 'error' : null}
                    />
                  </InputContainer>

                  {errors.email && touched.email && <ErrorText>{errors.email}</ErrorText>}

                  <Footer className="column align-items-center">
                    <Button size="large" type="submit" disabled={isSubmitting} text="Send me a code" />
                    <SmallTextButton onClick={() => this.setState({ view: 'signin', error: null })} className="mt-30">
                      Go back to sign in
                    </SmallTextButton>
                  </Footer>
                </Form>
              )
            }}
          </Formik>
        </Container>
      )
    }

    return null
  }

  renderPasswordUpdate() {
    if (this.state.verify && this.state.view == 'password') {
      return (
        <Container className="column justify-content-center align-content-center align-items-stretch">
          <Formik
            initialValues={{ email: '', password: '', confirm: '', code: '' }}
            onSubmit={(values, actions) => {
              actions.resetForm()
              this.updatePassword(values.email, values.password, values.code)
            }}
            validationSchema={Yup.object().shape({
              password: Yup.string().required('Required'),
              confirm: Yup.string()
                .required('Required')
                .oneOf([Yup.ref('password'), null], 'Passwords must match'),
              email: Yup.string()
                .email()
                .required('Required'),
              code: Yup.string().required('Required'),
            })}
          >
            {props => {
              const { values, touched, errors, dirty, isSubmitting, handleChange, handleBlur, handleSubmit, handleReset } = props

              return (
                <Form onSubmit={handleSubmit} className="column align-items-center">
                  <div className="p-30 h5 color-d0 text-center">Enter your verification code & new password.</div>

                  <InputContainer>
                    <Input
                      type="text"
                      name="email"
                      inputSize="large"
                      value={values.email}
                      placeholder="Email"
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={errors.email && touched.email ? 'error' : null}
                    />
                  </InputContainer>

                  {errors.email && touched.email && <ErrorText>{errors.email}</ErrorText>}

                  <InputContainer>
                    <Input
                      type="password"
                      name="password"
                      inputSize="large"
                      value={values.password}
                      placeholder="New password"
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={errors.password && touched.password ? 'error' : null}
                    />
                  </InputContainer>

                  <InputContainer>
                    <Input
                      type="password"
                      name="confirm"
                      inputSize="large"
                      value={values.confirm}
                      placeholder="Verify new password"
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={errors.confirm && touched.confirm ? 'error' : null}
                    />
                  </InputContainer>

                  {errors.confirm && touched.confirm && <ErrorText>{errors.confirm}</ErrorText>}

                  <InputContainer>
                    <Input
                      type="text"
                      name="code"
                      inputSize="large"
                      value={values.code}
                      placeholder="Confirm code"
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={errors.code && touched.code ? 'error' : null}
                    />
                  </InputContainer>

                  {errors.code && touched.code && <ErrorText>{errors.code}</ErrorText>}

                  <Footer className="column align-items-center">
                    <Button size="large" type="submit" disabled={isSubmitting} text="Update Password" />
                    <SmallTextButton onClick={() => this.setState({ verify: false, error: null })} className="mt-30">
                      Get another code
                    </SmallTextButton>
                  </Footer>
                </Form>
              )
            }}
          </Formik>
        </Container>
      )
    }

    return null
  }

  renderSignupOnboarding() {
    if (this.state.view == 'signup-onboarding') {
      return (
        <Container className="column justify-content-center align-content-center align-items-stretch">
          <Formik
            initialValues={{
              name: '',
              description: '',
              role: '',
            }}
            onSubmit={(values, actions) => {
              actions.resetForm()
              this.signupOnboarding(values)
            }}
            validationSchema={Yup.object().shape({
              name: Yup.string().required('Required'),
              description: Yup.string().required('Required'),
              role: Yup.string().required('Required'),
            })}
          >
            {props => {
              const { values, touched, errors, dirty, isSubmitting, handleChange, handleBlur, handleSubmit, handleReset } = props

              return (
                <Form onSubmit={handleSubmit} className="column align-items-center w-100">
                  <div className="h1 mt-30 color-d3 text-center">Tell us a bit about yourself</div>
                  <div className="h4 mb-30 mt-20 color-d0 text-center">Add some more detail about yourself</div>

                  <InputContainer>
                    <Input
                      type="text"
                      name="name"
                      inputSize="large"
                      autocomplete="off"
                      value={values.name}
                      placeholder="Full name"
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={errors.name && touched.name ? 'error' : null}
                    />
                  </InputContainer>

                  {errors.name && touched.name && <ErrorText>{errors.name}</ErrorText>}

                  <InputContainer>
                    <Input
                      type="text"
                      name="role"
                      inputSize="large"
                      autocomplete="off"
                      value={values.role}
                      placeholder="Current role"
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={errors.role && touched.role ? 'error' : null}
                    />
                  </InputContainer>

                  {errors.role && touched.role && <ErrorText>{errors.role}</ErrorText>}

                  <InputContainer>
                    <Textarea
                      rows={3}
                      type="password"
                      name="description"
                      textareaSize="large"
                      autocomplete="off"
                      value={values.description}
                      placeholder="Bio"
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={errors.description && touched.description ? 'error' : null}
                    />
                  </InputContainer>

                  {errors.description && touched.description && <ErrorText>{errors.description}</ErrorText>}

                  <InputContainer>
                    <Select
                      label="Your timezone"
                      onSelect={index => this.setState({ timezone: index })}
                      selected={this.state.timezone}
                      size="large"
                      options={moment.tz.names().map((timezone, index) => {
                        return {
                          option: timezone.replace('_', ' '),
                          value: timezone,
                        }
                      })}
                    />
                  </InputContainer>

                  <Footer className="column align-items-center">
                    <Button size="large" type="submit" disabled={isSubmitting} text="Complete" />
                    <SmallTextButton onClick={() => this.setState({ view: 'signin', error: null })} className="mt-30">
                      Just let me sign in already
                    </SmallTextButton>
                    <a href="https://yack.co" target="_blank" className="color-l1 a text-center mt-10">
                      By creating an account & using Yack, you agree to our <strong>terms & conditions</strong>
                    </a>
                  </Footer>
                </Form>
              )
            }}
          </Formik>
        </Container>
      )
    }

    return null
  }

  renderSignup() {
    if (this.state.view == 'signup') {
      return (
        <Container className="column justify-content-center align-content-center align-items-stretch">
          <Formik
            initialValues={{
              username: '',
              email: '',
              password: '',
              confirm: '',
            }}
            onSubmit={(values, actions) => {
              actions.resetForm()
              this.signup(values.username, values.email, values.password, values.confirm)
            }}
            validationSchema={Yup.object().shape({
              username: Yup.string().required('Required'),
              email: Yup.string()
                .email()
                .required('Required'),
              password: Yup.string().required('Required'),
              confirm: Yup.string().oneOf([Yup.ref('password'), null], 'Passwords must match'),
            })}
          >
            {props => {
              const { values, touched, errors, dirty, isSubmitting, handleChange, handleBlur, handleSubmit, handleReset } = props

              return (
                <Form onSubmit={handleSubmit} className="column align-items-center w-100">
                  <div className="h1 mb-30 mt-30 color-d3">Create an account</div>

                  <InputContainer>
                    <Input
                      type="text"
                      name="username"
                      inputSize="large"
                      autocomplete="off"
                      value={values.username}
                      placeholder="Username"
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={errors.username && touched.username ? 'error' : null}
                    />
                  </InputContainer>

                  {errors.username && touched.username && <ErrorText>{errors.username}</ErrorText>}

                  <InputContainer>
                    <Input
                      type="text"
                      name="email"
                      inputSize="large"
                      autocomplete="off"
                      value={values.email}
                      placeholder="Email"
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={errors.email && touched.email ? 'error' : null}
                    />
                  </InputContainer>

                  {errors.email && touched.email && <ErrorText>{errors.email}</ErrorText>}

                  <InputContainer>
                    <Input
                      type="password"
                      name="password"
                      inputSize="large"
                      autocomplete="off"
                      value={values.password}
                      placeholder="Password"
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={errors.password && touched.password ? 'error' : null}
                    />
                  </InputContainer>

                  {errors.password && touched.password && <ErrorText>{errors.password}</ErrorText>}

                  <InputContainer>
                    <Input
                      type="password"
                      name="confirm"
                      inputSize="large"
                      autocomplete="off"
                      value={values.confirm}
                      placeholder="Confirm password"
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={errors.confirm && touched.confirm ? 'error' : null}
                    />
                  </InputContainer>

                  {errors.confirm && touched.confirm && <ErrorText>{errors.confirm}</ErrorText>}

                  <Footer className="column align-items-center">
                    <Button size="large" type="submit" disabled={isSubmitting} text="Sign up" />
                    <SmallTextButton onClick={() => this.setState({ view: 'signin', error: null })} className="mt-30">
                      Go back to sign in
                    </SmallTextButton>
                    <a href="https://yack.co" target="_blank" className="color-l1 a text-center mt-10">
                      By creating an account, you agree to our
                      <a href="https://yack.co/termsofuse" target="_blank">
                        <strong>terms of use</strong>
                      </a>{' '}
                      &
                      <a href="https://yack.co/privacypolicy" target="_blank">
                        <strong>privacy policy</strong>
                      </a>
                    </a>
                  </Footer>
                </Form>
              )
            }}
          </Formik>
        </Container>
      )
    }

    return null
  }

  renderSignin() {
    if (this.state.view == 'signin') {
      return (
        <Container className="column justify-content-center align-content-center align-items-stretch">
          <div className="h1 mb-30 mt-30 color-d3">Sign in</div>

          <div className="h5 color-d0">Please log in using your username & password</div>

          <Formik
            initialValues={{ username: '', password: '' }}
            onSubmit={(values, actions) => {
              actions.resetForm()
              this.signin(values.username, values.password)
            }}
            validationSchema={Yup.object().shape({
              username: Yup.string().required('Required'),
              password: Yup.string().required('Required'),
            })}
          >
            {props => {
              const { values, touched, errors, dirty, isSubmitting, handleChange, handleBlur, handleSubmit, handleReset } = props

              return (
                <Form onSubmit={handleSubmit} className="column align-items-center w-100">
                  <InputContainer>
                    <Input
                      name="username"
                      type="text"
                      inputSize="large"
                      placeholder="Username"
                      autocomplete="off"
                      value={values.username}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={errors.username && touched.username ? 'error' : null}
                    />
                  </InputContainer>

                  {errors.username && touched.username && <ErrorText>{errors.username}</ErrorText>}

                  <InputContainer>
                    <Input
                      name="password"
                      type="password"
                      placeholder="Password"
                      inputSize="large"
                      autocomplete="off"
                      value={values.password}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={errors.password && touched.password ? 'error' : null}
                    />
                  </InputContainer>

                  {errors.password && touched.password && <ErrorText>{errors.password}</ErrorText>}

                  <Spacer />

                  <Button size="large" type="submit" disabled={isSubmitting} text="Sign in" />
                  <SmallTextButton onClick={() => this.setState({ view: 'password', error: null })} className="mt-30">
                    I've lost my password
                  </SmallTextButton>
                  <SmallTextButton onClick={() => this.setState({ view: 'signup', error: null })} className="mt-10">
                    Create an account
                  </SmallTextButton>
                </Form>
              )
            }}
          </Formik>
        </Container>
      )
    }

    return null
  }

  render() {
    return (
      <React.Fragment>
        <Error message={this.state.error} />

        <Auth>
          <Logo>
            <img src="logo.svg" height="20" alt="Yack" />
            <LogoText>yack</LogoText>
          </Logo>

          <Loading show={this.state.loading} />
          {this.state.view == 'password' && (
            <Container className="column justify-content-center align-content-center align-items-stretch">
              {this.renderPasswordReset()}
              {this.renderPasswordUpdate()}
            </Container>
          )}

          {this.renderSignupOnboarding()}
          {this.renderSignup()}
          {this.renderSignin()}
        </Auth>
      </React.Fragment>
    )
  }
}

AuthPage.propTypes = {
  fetchUser: PropTypes.func,
}

const mapDispatchToProps = {
  fetchUser: userId => fetchUser(userId),
}

export default connect(
  null,
  mapDispatchToProps
)(AuthPage)

const Auth = styled.div`
  height: 100%;
  width: 100%;
  position: fixed;
  top: 0px;
  left: 0px;
  display: flex;
  flex-direction: column;
  align-items: center;
  align-content: center;
  justify-content: center;
  background: #f3f3f3;
  position: relative;
`

const Container = styled.div`
  background: white;
  position: relative;
  width: 550px;
  border-radius: 30px;
  display: flex;
  align-items: center;
  align-content: center;
  justify-content: center;
  flex-direction: column;
  padding-top: 50px;
  padding-bottom: 50px;
`

const Content = styled.div`
  flex: 1;
  width: 100%;
`

const ErrorText = styled.div`
  width: 100%;
  color: red;
  padding: 0px 0px 10px 0px;
  text-align: center;
  font-size: 10px;
  font-weight: 700;
`

const Text = styled.div`
  color: #202529;
  font-size: 28px;
  font-weight: 600;
  padding: 20px;
  text-align: center;
`

const SmallText = styled.div`
  color: #202529;
  font-size: 20px;
  font-weight: 600;
  padding: 20px;
  text-align: center;
`

const SmallTextFaded = styled.div`
  color: #cfd4d9;
  font-size: 20px;
  font-weight: 600;
  padding: 20px;
  text-align: center;
`

const Header = styled.div`
  border-bottom: 1px solid #f1f3f5;
  width: 100%;
`

const Footer = styled.div`
  width: 100%;
  padding: 20px;
`

const Avatar = styled.div`
  padding: 50px;
  width: 100%;
`

const Usernames = styled.div`
  width: 100%;
  border-top: 1px solid #f1f3f5;

  &::placeholder {
    color: #ebedef;
  }
`

const UsernamesInput = styled.input`
  color: #202529;
  font-size: 14px;
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

const UpdateButton = styled.div`
  position: absolute;
  bottom: 10px;
  right: 10px;
  background: white;
  border-radius: 100px;
  width: 30px;
  height: 30px;
  z-index: 10;
  cursor: pointer;
  transition: background 0.25s;

  &:hover {
    background: #0f081f;
  }

  svg {
    transition: fill 0.25s;
  }

  &:hover svg {
    fill: #007af5 !important;
  }
`

const SmallTextButton = styled.div`
  color: #adb5bd;
  font-size: 14px;
  font-weight: 500;
  text-decoration: none;
  cursor: pointer;
  text-align: center;

  &:hover {
    color: #007af5;
  }
`

const Members = styled.div`
  padding: 0px 50px 0px 50px;
  border-top: 1px solid #f1f3f5;
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

const Form = styled.form`
  padding: 20px;
`

const Spacer = styled.div`
  height: 20px;
`

const InputContainer = styled.div`
  width: 80%;
  padding: 5px;
`
