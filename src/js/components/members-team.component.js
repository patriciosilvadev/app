import React, { useState, useRef, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import GraphqlService from '../services/graphql.service'
import UploadService from '../services/upload.service'
import ConfirmModal from '../modals/confirm.modal'
import PropTypes from 'prop-types'
import MessagingService from '../services/messaging.service'
import ModalPortal from '../portals/modal.portal'
import { browserHistory } from '../services/browser-history.service'
import styled from 'styled-components'
import { Popup, Menu, Input, Textarea, Modal, Tabbed, Notification, Spinner, Error, User, Avatar, Button } from '@tryyack/elements'
import { IconComponent } from './icon.component'
import { copyToClipboard } from '../helpers/util'
import { deleteTeam, updateTeam } from '../actions'

const TableRow = props => {
  const { member, user } = props
  const [menu, setMenu] = useState(false)
  const [confirmSelfDeleteModal, setConfirmSelfDeleteModal] = useState(false)
  const [confirmMemberDeleteModal, setConfirmMemberDeleteModal] = useState(false)
  const [confirmMemberBillingModal, setConfirmMemberBillingModal] = useState(false)
  const [roles, setRoles] = useState(false)
  const [memberDeleteId, setMemberDeleteId] = useState('')

  return (
    <React.Fragment>
      {confirmMemberBillingModal && (
        <ConfirmModal
          onOkay={() => {
            props.onBilling(member.user.id)
            setConfirmMemberBillingModal(false)
          }}
          onCancel={() => setConfirmMemberBillingModal(false)}
          text="Are you sure you want to make this person the billing contact?"
          title="Are you sure?"
        />
      )}

      {confirmSelfDeleteModal && (
        <ConfirmModal
          onOkay={() => {
            props.onLeave()
            setConfirmSelfDeleteModal(false)
          }}
          onCancel={() => setConfirmSelfDeleteModal(false)}
          text="Are you sure you want to leave this team?"
          title="Are you sure?"
        />
      )}

      {confirmMemberDeleteModal && (
        <ConfirmModal
          onOkay={() => {
            props.onDelete(member.user.id)
            setConfirmMemberDeleteModal(false)
          }}
          onCancel={() => setConfirmMemberDeleteModal(false)}
          text="Are you sure you want to remove this person, it can not be undone?"
          title="Are you sure?"
        />
      )}

      {props.billing && (
        <tr>
          <td className="p-5 p color-d1 background-l5" colSpan={5}>
            {member.user.name} is the billing contact for this team
          </td>
        </tr>
      )}

      <tr>
        <Td>
          <Avatar size="medium" image={member.user.image} title={member.user.name} />
        </Td>
        <Td>
          <div className="bold">{member.user.id == user.id ? member.user.name + ' (You)' : member.user.name}</div>
          <div className="color-l0">@{`${member.user.username}`}</div>
        </Td>
        <Td>
          <Popup
            handleDismiss={() => setRoles(false)}
            visible={roles}
            width={200}
            direction="right-bottom"
            content={
              <Menu
                items={[
                  { text: `Admin ${member.role == 'ADMIN' ? '(current)' : ''}`, onClick: () => props.onRoleChange(member.user.id, 'ADMIN') },
                  { text: `Member ${member.role == 'MEMBER' ? '(current)' : ''}`, onClick: () => props.onRoleChange(member.user.id, 'MEMBER') },
                  { text: `Guest ${member.role == 'GUEST' ? '(current)' : ''}`, onClick: () => props.onRoleChange(member.user.id, 'GUEST') },
                ]}
              />
            }
          >
            <span className="color-blue button bold underline" onClick={() => (props.admin ? setRoles(true) : null)}>
              {member.role.toTitleCase()}
            </span>
          </Popup>
        </Td>
        <Td>
          <span className="">{member.user.timezone ? member.user.timezone.replace('_', ' ') : 'Not set yet'}</span>
        </Td>
        <Td>
          <Popup
            handleDismiss={() => setMenu(false)}
            visible={menu}
            width={275}
            direction="right-bottom"
            content={
              <Menu
                items={[
                  {
                    hide: member.user.id != user.id,
                    icon: <IconComponent icon="user-minus" size={20} color="#acb5bd" />,
                    text: 'Leave team',
                    onClick: () => setConfirmSelfDeleteModal(true),
                  },
                  {
                    hide: member.user.id == user.id || !props.admin,
                    icon: <IconComponent icon="user-minus" size={20} color="#acb5bd" />,
                    text: 'Remove person from team',
                    onClick: () => setConfirmMemberDeleteModal(true),
                  },
                  {
                    icon: <IconComponent icon="message-circle" size={20} color="#acb5bd" />,
                    text: 'Start conversation',
                    onClick: () => props.onConversationStart(member.user.id),
                  },
                  {
                    hide: props.billing || !props.admin,
                    icon: <IconComponent icon="flag" size={20} color="#acb5bd" />,
                    text: 'Make billing contact',
                    onClick: () => setConfirmMemberBillingModal(true),
                  },
                ]}
              />
            }
          >
            <IconComponent icon="more-v" size={20} thickness={2} color="#475669" className="button" onClick={() => setMenu(true)} />
          </Popup>
        </Td>
      </tr>
    </React.Fragment>
  )
}

export default function MembersTeamComponent(props) {
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(null)
  const [notification, setNotification] = useState(null)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(0)
  const [billingUser, setBillingUser] = useState({})
  const [members, setMembers] = useState([])
  const [filter, setFilter] = useState('')
  const dispatch = useDispatch()
  const user = useSelector(state => state.user)
  const limit = 10

  const handleTeamMemberBilling = async userId => {
    setLoading(true)
    setError(null)

    try {
      const teamId = props.id
      const updatedBillingUser = members.filter(member => member.user.id == userId).flatten().user

      await GraphqlService.getInstance().updateTeamBillingUser(teamId, userId)

      setLoading(false)
      setBillingUser(updatedBillingUser)

      // Now update the parent
      props.onBillingUserUpdate(updatedBillingUser)
    } catch (e) {
      setLoading(false)
      setError('Error setting admin')
    }
  }

  const handleTeamMemberRoleChange = async (userId, role) => {
    setLoading(true)
    setError(null)

    try {
      const teamId = props.id

      await GraphqlService.getInstance().updateTeamMemberRole(teamId, userId, role)

      setLoading(false)
      setMembers(members.map(member => (member.user.id == userId ? { ...member, role } : member)))
    } catch (e) {
      setLoading(false)
      setError('Error setting admin')
    }
  }

  const handleTeamMemberDelete = async userId => {
    if (billing.id == userId) return setError('Please change the billing contact first')

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

  const handleTeamLeave = async () => {
    if (billing.id == user.id) return setError('Please change the billing contact first')

    setLoading(true)
    setError(null)

    try {
      const teamId = props.id
      const userId = user.id
      const deleteTeamMember = await GraphqlService.getInstance().deleteTeamMember(teamId, userId)

      setLoading(false)

      // Don't sync this one - because its just for us
      // false is for syncing here
      dispatch(deleteTeam(teamId, false))

      MessagingService.getInstance().leave(teamId)

      // Redirect the user back to the landing page
      browserHistory.push('/app')
      props.onClose()
    } catch (e) {
      setLoading(false)
      setError('Error deleting self')
    }
  }

  const handleTeamMemberConversationStart = async otherUserId => {
    const title = null
    const description = null
    const image = null
    const teamId = props.id
    const userId = user.id

    props.createChannel(title, description, image, teamId, userId, otherUserId)
    props.onClose()
  }

  useEffect(() => {
    setBillingUser(props.billingUser)
    setMembers(props.members)
    setPages(Math.ceil(props.members.length / limit))
  }, [props.members])

  return (
    <React.Fragment>
      {error && <Error message={error} onDismiss={() => setError(false)} />}
      {loading && <Spinner />}
      {notification && <Notification text={notification} onDismiss={() => setNotification(false)} />}

      <div className="flexer p-20 w-100">
        <div className="row pb-20">
          <div className="column flexer">
            <div className="h5 color-d2 mb-10">
              {members.length} {members.length == 1 ? 'Member' : 'Members'}
            </div>
            <div className="p color-d0">
              Displaying page {page} of {pages}
            </div>
          </div>
          <Buttons className="row">
            {page > 1 && (
              <div>
                <Button text="Previous" theme="muted" className="button" onClick={() => setPage(page - 1)} />
              </div>
            )}

            {page < pages && (
              <div>
                <Button text="Next" theme="muted" className="button" onClick={() => setPage(page + 1)} />
              </div>
            )}
          </Buttons>
        </div>

        <Input value={filter} onChange={e => setFilter(e.target.value)} placeholder="Filter members by name" className="mb-20" />

        <table width="100%" border="0" cellPadding={0} cellSpacing={0}>
          <thead>
            <tr>
              <Th></Th>
              <Th>Name</Th>
              <Th>Role</Th>
              <Th>Timezone</Th>
              <Th></Th>
            </tr>
          </thead>

          <tbody>
            {members.map((member, index) => {
              if (filter != '' && !member.user.name.toLowerCase().match(new RegExp(filter.toLowerCase() + '.*'))) return null
              if (index < page * limit - limit || index > page * limit) return null

              const memberUserId = member.user.id
              const billingUserId = billingUser.id

              return (
                <TableRow
                  billing={memberUserId == billingUserId}
                  admin={props.admin}
                  key={index}
                  member={member}
                  user={user}
                  onLeave={handleTeamLeave}
                  onDelete={handleTeamMemberDelete}
                  onBilling={handleTeamMemberBilling}
                  onConversationStart={handleTeamMemberConversationStart}
                  onRoleChange={handleTeamMemberRoleChange}
                />
              )
            })}
          </tbody>
        </table>
      </div>
    </React.Fragment>
  )
}

MembersTeamComponent.propTypes = {
  members: PropTypes.array,
  createChannel: PropTypes.func,
  onClose: PropTypes.func,
  id: PropTypes.string,
  admin: PropTypes.bool,
  billing: PropTypes.any,
}

const Buttons = styled.div`
  div:nth-child(2) {
    margin-left: 5px;
  }
`

const Th = styled.th`
  text-align: left;
  padding: 7px;
  font-weight: 500;
  color: #aeb5bc;
  font-size: 12px;
`

const Td = styled.td`
  text-align: left;
  padding: 7px;
  font-weight: 400;
  color: #343a40;
  font-size: 14px;
  border-top: 1px solid #e9edef;
`
