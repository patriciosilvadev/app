import React, { useState, useRef, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import GraphqlService from '../services/graphql.service'
import UploadService from '../services/upload.service'
import AuthService from '../services/auth.service'
import AccountService from '../services/account.service'
import { API_HOST, JWT } from '../environment'
import styled from 'styled-components'
import { Formik } from 'formik'
import ConfirmModal from './confirm.modal'
import * as Yup from 'yup'
import PropTypes from 'prop-types'
import { updateUser } from '../actions'
import ModalPortal from '../portals/modal.portal'
import { Avatar, Button, Input, Textarea, Notification, Modal, Tabbed, Spinner, Error, Select } from '@weekday/elements'
import { CardElement, injectStripe, StripeProvider, Elements } from 'react-stripe-elements'
import { STRIPE_API_KEY } from '../environment'

const moment = require('moment-timezone')

const createStripeElementOptions = {
  style: {
    base: {
      'fontSize': '16px',
      'color': '#424770',
      'fontFamily': 'Open Sans, sans-serif',
      'letterSpacing': '0.025em',
      '::placeholder': {
        color: '#aab7c4',
      },
    },
    invalid: {
      color: '#c23d4b',
    },
  },
}

class _CardForm extends React.Component {
  state = {
    errorMessage: '',
  }

  handleChange = ({ error }) => {
    if (error) {
      this.setState({ errorMessage: error.message })
    }
  }

  handleSubmit = evt => {
    evt.preventDefault()

    if (this.props.stripe) {
      this.props.stripe.createToken().then(this.props.handleResult)
    } else {
      console.log("Stripe.js hasn't loaded yet.")
    }
  }

  render() {
    return (
      <form className="border-top mt-20 pt-20">
        <CardElement onChange={this.handleChange} {...createStripeElementOptions} />

        <div className="p color-red mt-20" role="alert">
          {this.state.errorMessage}
        </div>

        <div className="row mt-20">
          <Button onClick={this.handleSubmit.bind(this)} text="Add" size="small" className="mr-10" />
          <Button onClick={this.props.onCancel} text="Cancel" size="small" />
        </div>
      </form>
    )
  }
}

const CardForm = injectStripe(_CardForm)

export default function AccountModal(props) {
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(null)
  const [notification, setNotification] = useState(null)
  const [image, setImage] = useState('')
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [role, setRole] = useState('')
  const [description, setDescription] = useState('')
  const [timezone, setTimezone] = useState(0)
  const [emails, setEmails] = useState([])
  const [invoices, setInvoices] = useState([])
  const [cards, setCards] = useState([])
  const [newCard, setNewCard] = useState(false)
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
        setEmails(user.emails)
        setCards(user.cards)
        setInvoices(user.invoices)
        setTimezone(moment.tz.names().indexOf(user.timezone))
        setLoading(false)
      } catch (e) {
        setLoading(false)
        setError('Error getting data')
      }
    })()
  }, [])

  const handleAccountDelete = async () => {
    setLoading(true)
    setError(false)

    try {
      const userId = props.id
      await AccountService.accountDelete(userId)
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
      const auth = await AccountService.updatePassword(userId, currentPassword, newPassword)

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

  const handleSubmit = async () => {
    setLoading(true)
    setError(false)

    try {
      const updatedUser = { name, role, description, username, image, timezone: moment.tz.names()[timezone] }
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

  // Email management
  const handleEmailAddressConfirm = async emailAddress => {
    setLoading(true)
    setError(false)

    try {
      const userId = props.id
      const auth = await AccountService.confirmEmail(emailAddress, userId)

      setLoading(false)
      setNotification('We have sent you a confirmation email')
    } catch (e) {
      setLoading(false)
      setError('There has been an error')
    }
  }

  const handleEmailAddressDelete = async emailAddress => {
    if (emails.length == 1) return setError('You need at least 1 connected email address')

    if (confirm('Are you sure?')) {
      setLoading(true)
      setError(false)

      try {
        const userId = props.id
        const auth = await AccountService.deleteEmail(emailAddress, userId)

        setLoading(false)
        setNotification('Succesfully removed email')
        setEmails(emails.filter(e => e.address != emailAddress))
      } catch (e) {
        setLoading(false)
        setError('There has been an error')
      }
    }
  }

  const handleEmailAddressAdd = async () => {
    if (newEmailAddress.trim() == '') return setError('This field is mandatory')

    setLoading(true)
    setError(false)

    try {
      const userId = props.id
      const auth = await AccountService.addEmail(newEmailAddress, userId)

      if (auth.status == 401) {
        setError('Email is already taken')
        setLoading(false)
      } else {
        setLoading(false)
        setEmails([...emails, { address: newEmailAddress, confirmed: false }])
        setNewEmailAddress('')
        setNotification('Succesfully added new email')
      }
    } catch (e) {
      setLoading(false)
      setError('There has been an error')
    }
  }

  // Credit card management
  const handleCardActive = async token => {
    setLoading(true)
    setError(false)

    try {
      const userId = props.id
      const auth = await AccountService.activateCard(userId, token)

      setLoading(false)
      setNotification('Successfully set default card')
      setCards(
        cards.map(card => {
          return {
            token: card.token,
            vendor: card.vendor,
            card: card.card,
            active: token == card.token,
          }
        })
      )
    } catch (e) {
      setLoading(false)
      setError('There has been an error')
    }
  }

  const handleCardDelete = async token => {
    if (confirm('Are you sure?')) {
      setLoading(true)
      setError(false)

      try {
        const userId = props.id
        const auth = await AccountService.deleteCard(userId, token)

        setLoading(false)
        setNotification('Succesfully removed card')
        setCards(cards.filter(card => card.token != token))
      } catch (e) {
        setLoading(false)
        setError('There has been an error')
      }
    }
  }

  const handleCardAdd = async result => {
    const {
      token: {
        card: { brand, last4 },
        id,
      },
    } = result
    const token = id
    const card = last4
    const vendor = brand
    const active = cards.length == 0
    const userId = props.id

    setLoading(true)
    setError(false)

    try {
      await AccountService.addCard(userId, token, vendor, card, active)

      setLoading(false)
      setCards([...cards, { token, vendor, card, active }])
      setNewCard(false)
      setNotification('Succesfully added new card')
    } catch (e) {
      console.log(e)
      setLoading(false)
      setError('There has been an error')
    }
  }

  // Render functions to make things easier
  const renderProfile = () => {
    return (
      <div className="row align-items-start w-100">
        <div className="column w-100">
          {error && <Error message={error} />}
          {loading && <Spinner />}
          {notification && <Notification text={notification} />}

          <div className="row w-100 p-20">
            <input accept="image/png,image/jpg" type="file" className="hide" ref={fileRef} onChange={handleFileChange} />

            <Avatar image={image} className="mr-20" size="large" circle />

            <div className="column pl-10">
              <div className="row pb-5">
                <Text className="h5 color-d2">{name}</Text>
              </div>
              <div className="row">
                <Text className="p color-blue button bold" onClick={() => fileRef.current.click()}>
                  Update profile image
                </Text>
              </div>
            </div>
          </div>

          <div className="column p-20 flex-1 scroll w-100">
            <Input label="Full name" value={name} onChange={e => setName(e.target.value)} placeholder="Enter full name" className="mb-20" />

            <Input label="Role" value={role} onChange={e => setRole(e.target.value)} placeholder="Enter your role" className="mb-20" />

            <Input label="Username" value={username} onChange={e => setUsername(e.target.value)} placeholder="Username" className="mb-20" />

            <Textarea label="Description" value={description} onChange={e => setDescription(e.target.value)} placeholder="Enter bio" className="mb-20" rows={2} />

            <div className="mb-20 w-100">
              <Select
                label="Your timezone"
                onSelect={index => setTimezone(index)}
                selected={timezone}
                options={moment.tz.names().map((timezone, index) => {
                  return {
                    option: timezone.replace('_', ' '),
                    value: timezone,
                  }
                })}
              />
            </div>

            <Button theme="blue-border" size="small" onClick={handleSubmit} text="Save" />
          </div>
        </div>
      </div>
    )
  }

  const renderEmailAccounts = () => {
    return (
      <div className="row align-items-start w-100">
        <div className="column w-100">
          {error && <Error message={error} />}
          {loading && <Spinner />}
          {notification && <Notification text={notification} />}

          <div className="column p-20 flex-1 scroll w-100">
            <Text className="color-d2 h5 mb-10">Connected email addresses</Text>
            <Text className="color-d0 p mb-30">Use your Weekday account with more than just 1 email address.</Text>

            <Table width="100%">
              <tbody>
                {emails.map((email, index) => (
                  <EmailAddressRow key={index} onDelete={handleEmailAddressDelete} onConfirm={handleEmailAddressConfirm} email={email} />
                ))}
              </tbody>
            </Table>

            <Input label="Connect another email address" value={newEmailAddress} onChange={e => setNewEmailAddress(e.target.value)} placeholder="Enter your email" />

            <Button text="Add" theme="blue-border" size="small" className="mt-20" onClick={handleEmailAddressAdd} />
          </div>
        </div>
      </div>
    )
  }

  const renderSecurity = () => {
    return (
      <div className="row align-items-start w-100">
        <div className="column w-100">
          {error && <Error message={error} />}
          {loading && <Spinner />}
          {notification && <Notification text={notification} />}

          <div className="column p-20 flex-1 scroll w-100">
            <Text className="color-d2 h5 mb-10">Change & update your password</Text>
            <Text className="color-d0 p mb-30">You need to know your old password.</Text>

            <Input label="Current password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} placeholder="" type="password" autocomplete="no" className="mb-20" />

            <Input label="New password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="" type="password" autocomplete="no" className="mb-20" />

            <Input label="Confirm new password" value={newPasswordConfirm} onChange={e => setNewPasswordConfirm(e.target.value)} placeholder="" type="password" autocomplete="no" className="mb-20" />

            <Button text="Update" theme="blue-border" size="small" onClick={handlePasswordUpdate} />
          </div>
        </div>
      </div>
    )
  }

  const renderDangerZone = () => {
    return (
      <div className="row align-items-start w-100">
        <div className="column w-100">
          {error && <Error message={error} />}
          {loading && <Spinner />}
          {notification && <Notification text={notification} />}

          {confirmAccountDeleteModal && (
            <ConfirmModal
              onOkay={handleAccountDelete}
              onCancel={() => setConfirmAccountDeleteModal(false)}
              text="Are you sure you want to delete your account, it can not be undone?"
              title="Are you sure?"
            />
          )}

          <div className="column p-20 flex-1 scroll w-100">
            <Text className="color-red h5 mb-10">Here be dragons!</Text>
            <Text className="color-d0 p mb-30">This cannot be undone.</Text>

            <Button theme="red" text="Delete" onClick={() => setConfirmAccountDeleteModal(true)} />
          </div>
        </div>
      </div>
    )
  }

  const renderCreditCards = () => {
    return (
      <div className="row align-items-start w-100">
        <div className="column w-100">
          {error && <Error message={error} />}
          {loading && <Spinner />}
          {notification && <Notification text={notification} />}

          <div className="column p-20 flex-1 scroll w-100">
            <Text className="color-d2 h5 mb-10">Credit Cards</Text>
            <Text className="color-d0 p mb-30">Add multiple cards, only 1 can be active at a time.</Text>

            <Table width="100%">
              <tbody>
                {cards.map((card, index) => (
                  <CreditCardRow key={index} onDelete={handleCardDelete} onActive={handleCardActive} card={card} />
                ))}
              </tbody>
            </Table>

            {!newCard && (
              <div className="row mt-20">
                <Button text="Add New Card" theme="blue-border" size="small" onClick={() => setNewCard(true)} />
              </div>
            )}

            {newCard && (
              <div className="w-100">
                <StripeProvider apiKey={STRIPE_API_KEY}>
                  <Elements>
                    <CardForm handleResult={handleCardAdd} onCancel={() => setNewCard(false)} />
                  </Elements>
                </StripeProvider>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  const renderInvoices = () => {
    return (
      <div className="row align-items-start w-100">
        <div className="column w-100">
          {error && <Error message={error} />}
          {loading && <Spinner />}
          {notification && <Notification text={notification} />}

          <div className="column p-20 flex-1 scroll w-100">
            <Text className="color-d2 h5 mb-10">Invoices</Text>

            <Table width="100%">
              <tbody>
                {invoices.map((invoice, index) => (
                  <InvoiceRow key={index} invoice={invoice} />
                ))}
              </tbody>
            </Table>
          </div>
        </div>
      </div>
    )
  }

  return (
    <ModalPortal>
      <Modal title="Account" width={700} height="90%" onClose={props.onClose}>
        <Tabbed
          start={0}
          panels={[
            {
              title: 'Profile',
              show: true,
              content: renderProfile(),
            },
            {
              title: 'Email accounts',
              show: true,
              content: renderEmailAccounts(),
            },
            {
              title: 'Security',
              show: true,
              content: renderSecurity(),
            },
            {
              title: 'Credit Cards',
              show: true,
              content: renderCreditCards(),
            },
            {
              title: 'Invoices',
              show: true,
              content: renderInvoices(),
            },
            {
              title: 'Danger zone',
              show: true,
              content: renderDangerZone(),
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

const InvoiceRow = props => {
  const [over, setOver] = useState(false)

  return (
    <tr onMouseEnter={() => setOver(true)} onMouseLeave={() => setOver(false)}>
      <TableCell width="40%">
        <InvoiceDescription>{props.invoice.team.name}</InvoiceDescription>
      </TableCell>
      <TableCell width="30%">
        <InvoiceDate>{moment(props.invoice.createdAt).format('mm dd YYYY')}</InvoiceDate>
      </TableCell>
      <TableCell>
        {over && (
          <React.Fragment>
            <InvoiceDownloadButton href={`${API_HOST}/billing/download_invoice/${props.invoice.id}`} target="_blank" className="button mr-20">
              Download
            </InvoiceDownloadButton>
          </React.Fragment>
        )}
      </TableCell>
    </tr>
  )
}

const CreditCardRow = props => {
  const [over, setOver] = useState(false)

  return (
    <tr onMouseEnter={() => setOver(true)} onMouseLeave={() => setOver(false)}>
      <TableCell width="40%">
        <CardNumber>xxxx-xxxx-xxxx-{props.card.card}</CardNumber>
      </TableCell>
      <TableCell width="30%">
        <CardStatus>{props.card.active ? 'Active' : ''}</CardStatus>
      </TableCell>
      <TableCell>
        {over && (
          <React.Fragment>
            {!props.card.active && (
              <CardButtonActive onClick={() => props.onActive(props.card.token)} className="button mr-20">
                Make active
              </CardButtonActive>
            )}

            <CardButtonDelete onClick={() => props.onDelete(props.card.token)} className="button">
              Delete
            </CardButtonDelete>
          </React.Fragment>
        )}
      </TableCell>
    </tr>
  )
}

const EmailAddressRow = props => {
  const [over, setOver] = useState(false)

  return (
    <tr onMouseEnter={() => setOver(true)} onMouseLeave={() => setOver(false)}>
      <TableCell width="40%">
        <MailAddress>{props.email.address}</MailAddress>
      </TableCell>
      <TableCell width="30%">
        <MailStatus>{props.email.confirmed ? 'Confirmed' : 'Not confirmed'}</MailStatus>
      </TableCell>
      <TableCell>
        {over && (
          <React.Fragment>
            {!props.email.confirmed && (
              <MailButtonConfirm onClick={() => props.onConfirm(props.email.address)} className="button">
                Confirm
              </MailButtonConfirm>
            )}

            <MailButtonDelete onClick={() => props.onDelete(props.email.address)} className="button">
              Delete
            </MailButtonDelete>
          </React.Fragment>
        )}
      </TableCell>
    </tr>
  )
}

const Text = styled.div``

const Table = styled.table`
  margin-bottom: 50px;
  margin-top: 20px;
`

const TableCell = styled.td`
  border-bottom: 1px solid #edf0f2;
  height: 30px;
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

const InvoiceDescription = styled.div`
  color: #007af5;
  font-size: 12px;
  font-weight: 600;
`

const InvoiceDate = styled.div`
  color: #858e96;
  font-size: 12px;
  font-weight: 400;
`

const InvoiceDownloadButton = styled.a`
  color: #007af5;
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
  margin-left: 10px;
`

const CardNumber = styled.div`
  color: #007af5;
  font-size: 12px;
  font-weight: 600;
`

const CardStatus = styled.div`
  color: #858e96;
  font-size: 12px;
  font-weight: 400;
`

const CardButtonActive = styled.span`
  color: #007af5;
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
  margin-left: 10px;
`

const CardButtonDelete = styled.span`
  color: #d93025;
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
  margin-left: 10px;
`
