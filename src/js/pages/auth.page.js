import React from 'react'
import AuthService from '../services/auth.service'
import LoadingComponent from '../components/loading.component'
import ErrorComponent from '../components/error.component'
import { connect } from 'react-redux'
import GraphqlService from '../services/graphql.service'
import styled from 'styled-components'
import { Formik } from 'formik'
import * as Yup from 'yup'
import PropTypes from 'prop-types'
import { fetchUser } from '../actions'
import { Button } from '@weekday/elements'

const Auth = styled.div`
  height: 100%;
  width: 100%;
  position: fixed;
  top: 0px;
  left: 0px;
  z-index: 100;
  background: #08111d;
  background-image: url(../../images/pattern.png);
  background-size: 800px;
  background-repeat: no-repeat;
  background-position: center center;
`

const Container = styled.div`
  width: 400px;
  overflow: hidden;
  height: 650px;
  margin: auto;
  border-radius: 10px;
  background: white;
`

const Content = styled.div`
  flex: 1;
  width: 100%;
`

const Error = styled.div`
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
  border-top: 1px solid #f1f3f5;
`

const Avatar = styled.div`
  padding: 50px;
  width: 100%;
`

const Textarea = styled.textarea`
  color: #202529;
  font-size: 16px;
  font-weight: 400;
  border: none;
  border-top: 1px solid #f1f3f5;
  padding: 20px;
  width: 100%;
  text-align: center;
  resize: none;

  &::placeholder {
    color: #ebedef;
  }
`

const Input = styled.input`
  color: #202529;
  font-size: 30px;
  font-weight: 400;
  padding: 20px;
  width: 100%;
  text-align: center;
  border: none;
  border-top: 1px solid #f1f3f5;

  &.error {
    border-top: 1px solid red;
    border-bottom: 1px solid red;
  }

  &::placeholder {
    color: #ebedef;
  }
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

const BigSolidButton = styled.button`
  background-color: #007af5;
  color: white;
  font-size: 25px;
  font-weight: 600;
  padding: 20px 30px 20px 30px;
  border-radius: 5px;
  transition: background-color 0.25s, color 0.25s;
  cursor: pointer;
  text-align: center;

  &:hover {
    background-color: #0f081f;
    color: #007af5;
  }

  &:first-child {
    margin-right: 5px;
  }
`

const Members = styled.div`
  padding: 0px 50px 0px 50px;
  border-top: 1px solid #f1f3f5;
`

const Logo = styled.div`
  position: relative;
  margin-bottom: 40px;
  z-index: 1000;
`

const LogoText = styled.div`
  padding-left: 10px;
  position: relative;
  bottom: 2px;
  color: #007af5;
  font-size: 22px;
  font-weight: 400;
`

const Form = styled.form`
  width: 100%;
`

const Spacer = styled.div`
  height: 20px;
`

class AuthPage extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      view: 'signin',
      verify: false,
      error: null,
      loading: null,
    }

    this.signin = this.signin.bind(this)
    this.signup = this.signup.bind(this)
    this.resetPassword = this.resetPassword.bind(this)
    this.updatePassword = this.updatePassword.bind(this)
  }

  async componentDidMount() {
    try {
      const { token } = await AuthService.currentAuthenticatedUser()
      const { sub } = AuthService.parseJwt(token)

      this.props.fetchUser(sub)
      this.props.history.push('/app')
    } catch (e) {}
  }

  async signup(username, email, password, confirm) {
    this.setState({
      loading: true,
      error: null,
    })

    try {
      const auth = await AuthService.signup(email, username, password)

      this.setState({ loading: false })

      if (auth.status == 500) return this.setState({ error: 'Internal error' })
      if (auth.status == 401) return this.setState({ error: 'Username or email not available' })
      if (auth.status == 200) return this.setState({ view: 'signin' })
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
      const auth = await AuthService.signin(username, password)
      const data = await auth.json()

      this.setState({ loading: false })

      if (auth.status != 200) return this.setState({ error: 'Incorrect details' })
      if (auth.status == 200) {
        const { token, user } = data

        AuthService.saveToken(token)

        this.props.fetchUser(user)
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
      const auth = await AuthService.reset(email)
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
      const auth = await AuthService.update(email, password, code)
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

  // prettier-ignore
  render() {
    return(
      <Auth className="row">
        <Container className="column justify-content-center align-content-center align-items-center">
          <Logo className="row">
            <img src="../../images/logo.png" height="20"/>
            <LogoText>weekday</LogoText>
          </Logo>

          <LoadingComponent show={this.state.loading} />
          <ErrorComponent message={this.state.error} />

          {this.state.view == "password" &&
            <React.Fragment>
              <SmallText>
                Enter your email address and we'll send you a verification code to reset your password.
              </SmallText>

              {!this.state.verify &&
                <React.Fragment>
                  <Formik
                    initialValues={{ email: '' }}
                    onSubmit={(values, actions) => {
                      actions.resetForm()
                      this.resetPassword(values.email)
                    }}
                    validationSchema={Yup.object().shape({
                      email: Yup.string().email().required('Required'),
                    })}>
                    {props => {
                      const {
                        values,
                        touched,
                        errors,
                        dirty,
                        isSubmitting,
                        handleChange,
                        handleBlur,
                        handleSubmit,
                        handleReset,
                      } = props;

                      return (
                        <Form onSubmit={handleSubmit} className="column align-items-center">
                          <Input
                            type="text"
                            name="email"
                            value={values.email}
                            placeholder="Email"
                            onChange={handleChange}
                            onBlur={handleBlur}
                            className={errors.email && touched.email ? 'error' : null}
                          />

                          {errors.email && touched.email && <Error>{errors.email}</Error>}

                          <Footer className="column align-items-center">
                            <BigSolidButton type="submit" disabled={isSubmitting}>Send me a verification code</BigSolidButton>
                            <SmallTextButton onClick={() => this.setState({ view: 'signin', error: null })} className="mt-30">
                              Go back to sign in
                            </SmallTextButton>
                          </Footer>
                        </Form>
                      );
                    }}
                  </Formik>
                </React.Fragment>
              }

              {this.state.verify &&
                <React.Fragment>
                  <Formik
                    initialValues={{ email: '', password: '', code: '' }}
                    onSubmit={(values, actions) => {
                      actions.resetForm()
                      this.updatePassword(values.email, values.password, values.code)
                    }}
                    validationSchema={Yup.object().shape({
                      password: Yup.string().required('Required'),
                      email: Yup.string().email().required('Required'),
                      code: Yup.string().required('Required'),
                    })}>
                    {props => {
                      const {
                        values,
                        touched,
                        errors,
                        dirty,
                        isSubmitting,
                        handleChange,
                        handleBlur,
                        handleSubmit,
                        handleReset,
                      } = props;

                      return (
                        <Form onSubmit={handleSubmit} className="column align-items-center">
                          <Input
                            type="text"
                            name="email"
                            value={values.email}
                            placeholder="Email"
                            onChange={handleChange}
                            onBlur={handleBlur}
                            className={errors.email && touched.email ? 'error' : null}
                          />

                          {errors.email && touched.email && <Error>{errors.email}</Error>}

                          <Input
                            type="password"
                            name="password"
                            value={values.password}
                            placeholder="New Password"
                            onChange={handleChange}
                            onBlur={handleBlur}
                            className={errors.password && touched.password ? 'error' : null}
                          />

                          {errors.password && touched.password && <Error>{errors.password}</Error>}

                          <Input
                            type="text"
                            name="code"
                            value={values.code}
                            placeholder="Confirm code"
                            onChange={handleChange}
                            onBlur={handleBlur}
                            className={errors.code && touched.code ? 'error' : null}
                          />

                          {errors.code && touched.code && <Error>{errors.code}</Error>}

                          <Footer className="column align-items-center">
                            <BigSolidButton type="submit" disabled={isSubmitting}>Update Password</BigSolidButton>
                            <SmallTextButton onClick={() => this.setState({ verify: false, error: null })} className="mt-30">
                              Get another code
                            </SmallTextButton>
                          </Footer>
                        </Form>
                      );
                    }}
                  </Formik>
                </React.Fragment>
              }
            </React.Fragment>
          }

          {this.state.view == "signup" &&
            <React.Fragment>
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
                  email: Yup.string().email().required('Required'),
                  password: Yup.string().required('Required'),
                  confirm: Yup.string().oneOf([Yup.ref('password'), null], 'Passwords must match')
                })}>
                {props => {
                  const {
                    values,
                    touched,
                    errors,
                    dirty,
                    isSubmitting,
                    handleChange,
                    handleBlur,
                    handleSubmit,
                    handleReset,
                  } = props;

                  return (
                    <Form onSubmit={handleSubmit} className="column align-items-center">
                      <Input
                        type="text"
                        name="username"
                        value={values.username}
                        placeholder="Username"
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className={errors.username && touched.username ? 'error' : null}
                      />

                      {errors.username && touched.username && <Error>{errors.username}</Error>}

                      <Input
                        type="text"
                        name="email"
                        value={values.email}
                        placeholder="Email"
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className={errors.email && touched.email ? 'error' : null}
                      />

                      {errors.email && touched.email && <Error>{errors.email}</Error>}

                      <Input
                        type="password"
                        name="password"
                        value={values.password}
                        placeholder="Password"
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className={errors.password && touched.password ? 'error' : null}
                      />

                      {errors.password && touched.password && <Error>{errors.password}</Error>}

                      <Input
                        type="password"
                        name="confirm"
                        value={values.confirm}
                        placeholder="Confirm password"
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className={errors.confirm && touched.confirm ? 'error' : null}
                      />

                      {errors.confirm && touched.confirm && <Error>{errors.confirm}</Error>}

                      <Footer className="column align-items-center">
                        <BigSolidButton type="submit" disabled={isSubmitting}>Sign up</BigSolidButton>
                        <SmallTextButton onClick={() => this.setState({ view: 'signin', error: null })} className="mt-30">
                          Go back to sign in
                        </SmallTextButton>
                        <SmallTextButton className="mt-10">
                          By creating an account & using Weekday, you agree to our <strong>terms & conditions</strong>
                        </SmallTextButton>
                      </Footer>
                    </Form>
                  );
                }}
              </Formik>
            </React.Fragment>
          }

          {this.state.view == "signin" &&
            <React.Fragment>
              <SmallTextFaded>
                Please log in using your <br/>username & password
              </SmallTextFaded>

              <Formik
                initialValues={{ username: '', password: '' }}
                onSubmit={(values, actions) => {
                  actions.resetForm()
                  this.signin(values.username, values.password)
                }}
                validationSchema={Yup.object().shape({
                  username: Yup.string().required('Required'),
                  password: Yup.string().required('Required'),
                })}>
                {props => {
                  const {
                    values,
                    touched,
                    errors,
                    dirty,
                    isSubmitting,
                    handleChange,
                    handleBlur,
                    handleSubmit,
                    handleReset,
                  } = props;

                  return (
                    <Form onSubmit={handleSubmit} className="column align-items-center">
                      <Input
                        name="username"
                        type="text"
                        placeholder="Username"
                        value={values.username}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className={errors.username && touched.username ? 'error' : null}
                      />

                      {errors.username && touched.username && <Error>{errors.username}</Error>}

                      <Input
                        name="password"
                        type="password"
                        placeholder="Password"
                        value={values.password}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className={errors.password && touched.password ? 'error' : null}
                      />

                      {errors.password && touched.password && <Error>{errors.password}</Error>}

                      <Spacer />
                      <BigSolidButton type="submit" disabled={isSubmitting}>Sign in</BigSolidButton>
                      <SmallTextButton onClick={() => this.setState({ view: 'password' })} className="mt-30">
                        I've lost my password
                      </SmallTextButton>
                      <SmallTextButton onClick={() => this.setState({ view: 'signup' })} className="mt-10">
                        Create an account
                      </SmallTextButton>
                    </Form>
                  );
                }}
              </Formik>
            </React.Fragment>
          }
        </Container>
      </Auth>
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
