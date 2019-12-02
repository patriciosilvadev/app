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
import { Popup, Menu, Input, Textarea, Modal, Tabbed, Notification, Spinner, Error, User, Avatar, Button } from '@weekday/elements'
import { IconComponent } from './icon.component'
import { copyToClipboard } from '../helpers/util'
import { LINK_URL_PREFIX } from '../environment'
import { deleteTeam, updateTeam } from '../actions'
import { updateChannel, deleteChannel, createChannelMember, deleteChannelMember } from '../actions'

const TableRow = props => {
  const { member, user } = props
  const [menu, setMenu] = useState(false)
  const [confirmSelfDeleteModal, setConfirmSelfDeleteModal] = useState(false)
  const [confirmMemberDeleteModal, setConfirmMemberDeleteModal] = useState(false)
  const [roles, setRoles] = useState(false)
  const [memberDeleteId, setMemberDeleteId] = useState('')

  // prettier-ignore
  return (
    <React.Fragment>
      {confirmSelfDeleteModal &&
        <ConfirmModal
          onOkay={() => props.onLeave()}
          onCancel={() => setConfirmSelfDeleteModal(false)}
          text="Are you sure you want to leave this channel?"
          title="Are you sure?"
        />
      }

      {confirmMemberDeleteModal &&
        <ConfirmModal
          onOkay={() => props.onDelete(member.user.id)}
          onCancel={() => setConfirmMemberDeleteModal(false)}
          text="Are you sure you want to remove this person, it can not be undone?"
          title="Are you sure?"
        />
      }

      <tr>
        <Td>
          <Avatar
            size="medium"
            image={member.user.image}
            title={member.user.name}
          />
        </Td>
        <Td>
          <div className="bold">
            {member.user.id == user.id ? member.user.name + " (You)" : member.user.name}
          </div>
          <div className="color-l0">
            @{`${member.user.username}`}
          </div>
        </Td>
        <Td>
          <span className="">
            {member.user.timezone ? member.user.timezone.replace('_', ' ') : "Not set yet"}
          </span>
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
                    hide: (member.user.id != user.id),
                    icon: <IconComponent icon="user-minus" size={20} color="#acb5bd" />,
                    text: "Leave team",
                    onClick: () => setConfirmSelfDeleteModal(true),
                  },
                  {
                    hide: ((member.user.id == user.id) || (!props.permissible)),
                    icon: <IconComponent icon="user-minus" size={20} color="#acb5bd" />,
                    text: "Remove person from team",
                    onClick: () => setConfirmMemberDeleteModal(true),
                  },
                ]}
              />
            }>
            <IconComponent
              icon="more-v"
              size={20}
              thickness={2}
              color="#475669"
              className="button"
              onClick={() => setMenu(true)}
            />
          </Popup>
        </Td>
      </tr>
    </React.Fragment>
  )
}

export default function MembersChannelComponent(props) {
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(null)
  const [notification, setNotification] = useState(null)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(0)
  const [members, setMembers] = useState([])
  const [filter, setFilter] = useState('')
  const dispatch = useDispatch()
  const user = useSelector(state => state.user)
  const limit = 10

  const handleChannelMemberDelete = async userId => {
    setLoading(true)
    setError(null)

    try {
      const channelId = channel.id
      const teamId = props.team.id
      const userIds = [userId]
      const deleteChannelMember = await GraphqlService.getInstance().deleteChannelMember(channelId, userId)
      const updatedMembers = members.filter(member => member.user.id != userId)

      // Revoke access to people
      dispatch(deleteChannelMember(channelId, userId))
      setLoading(false)
      setConfirmMemberDeleteModal(false)
      setMembers(updatedMembers)

      // Tell this person to leave this channel - send to team
      MessagingService.getInstance().leaveChannel(userIds, teamId)
    } catch (e) {
      setLoading(false)
      setError('Error deleting member')
    }
  }

  const handleChannelLeave = async () => {
    setLoading(true)
    setError(null)

    try {
      const channelId = props.id
      const userId = user.id
      const teamId = props.team.id
      const deleteChannelMembe = await GraphqlService.getInstance().deleteChannelMember(channelId, userId)

      // Stop loading the spinners
      setLoading(false)

      // Don't sync this one - because its just for us
      // false is for syncing here
      dispatch(deleteChannelMember(channelId, userId))
      dispatch(deleteChannel(channelId, false))

      // Unsub frem receiving messages here
      MessagingService.getInstance().leave(channelId)

      // Redirect the user back to the landing page
      browserHistory.push(`/app/team/${teamId}/`)
      props.onClose()
    } catch (e) {
      setLoading(false)
      setError('Error deleting self')
    }
  }

  useEffect(() => {
    setMembers(props.members)
    setPages(Math.ceil(props.members.length / limit))
  }, [props.members])

  // prettier-ignore
  return (
    <React.Fragment>
      {error && <Error message={error} />}
      {loading && <Spinner />}
      {notification && <Notification text={notification} />}

      <div className="flexer p-20 w-100">
        <div className="row pb-20">
          <div className="column flexer">
            <div className="h5 color-d2 pb-5">{members.length} {members.length == 1 ? "Member" : "Members"}</div>
            <div className="p color-d0 bold">Displaying page {page} of {pages}</div>
          </div>
          <Buttons className="row">
            {page > 1 &&
              <div>
                <Button
                  size="small"
                  text="Previous"
                  theme="blue-border"
                  className="button"
                  onClick={() => setPage(page - 1)}
                />
              </div>
            }

            {page < pages &&
              <div>
                <Button
                  size="small"
                  text="Next"
                  theme="blue-border"
                  className="button"
                  onClick={() => setPage(page + 1)}
                />
              </div>
            }
          </Buttons>
        </div>

        <Input
          value={filter}
          onChange={e => setFilter(e.target.value)}
          placeholder="Filter members by name"
          className="mb-20"
        />

        <table width="100%" border="0" cellPadding={0} cellSpacing={0}>
          <thead>
            <tr>
              <Th></Th>
              <Th>Name</Th>
              <Th>Timezone</Th>
              <Th></Th>
            </tr>
          </thead>

          <tbody>
            {members.map((member, index) => {
              if (filter != "" && !member.user.name.toLowerCase().match(new RegExp(filter.toLowerCase() + ".*"))) return null
              if (index < ((page * limit) - limit) || index > (page * limit)) return null

              return (
                <TableRow
                  permissible={props.permissible}
                  key={index}
                  member={member}
                  user={user}
                  onLeave={handleChannelLeave}
                  onDelete={handleChannelMemberDelete}
                />
              )
            })}
          </tbody>
        </table>
      </div>
    </React.Fragment>
  )
}

MembersChannelComponent.propTypes = {
  members: PropTypes.array,
  team: PropTypes.any,
  createChannel: PropTypes.func,
  onClose: PropTypes.func,
  id: PropTypes.string,
  admin: PropTypes.bool,
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

const Td = styled.th`
  text-align: left;
  padding: 7px;
  font-weight: 400;
  color: #343a40;
  font-size: 14px;
  border-top: 1px solid #e9edef;
`
