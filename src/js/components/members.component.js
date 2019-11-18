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

export default function MembersComponent(props) {
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(null)
  const [notification, setNotification] = useState(null)
  const [menu, setMenu] = useState(null)
  const [page, setPage] = useState(1)
  const [filter, setFilter] = useState('')
  const dispatch = useDispatch()
  const user = useSelector(state => state.user)
  const limit = 10
  const totalPages = Math.ceil(props.members.length / limit)

  // prettier-ignore
  return (
    <div className="flexer p-20 w-100">
      <div className="row pb-20">
        <div className="column flexer">
          <div className="h5 color-d2 pb-5">{props.members.length} {props.members.length == 1 ? "Member" : "Members"}</div>
          <div className="p color-d0 bold">Displaying page {page} of {totalPages}</div>
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

          {page < totalPages &&
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
            <Th>Role</Th>
            <Th>Timezone</Th>
            <Th></Th>
          </tr>
        </thead>
        <tbody>
        {props.members.map((member, index) => {
          if (filter != "" && !member.user.name.toLowerCase().match(new RegExp(filter.toLowerCase() + ".*"))) return null
          if (index < ((page * limit) - limit) || index > (page * limit)) return null

          return (
            <tr key={index}>
              <Td width="50">
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
                  {member.user.role}
                </span>
              </Td>
              <Td>
                <span className="">
                  {member.user.timezone.replace('_', ' ')}
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
                          icon: <IconComponent icon="delete" size={20} color="#acb5bd" />,
                          text: "Delete this user",
                          onClick: () => handleDeleteClick(member)
                        },
                        {
                          icon: <IconComponent icon="settings" size={20} color="#acb5bd" />,
                          text: "Toggle admin",
                          onClick: () => updateTeamMemberAdmin(member.user.id, !member.admin),
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
          )
        })}
        </tbody>
      </table>
    </div>
  )
}

MembersComponent.propTypes = {
  members: PropTypes.array,
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
  color: #AEB5BC;
  font-size: 12px;
`

const Td = styled.th`
  text-align: left;
  padding: 7px;
  font-weight: 400;
  color: #343A40;
  font-size: 14px;
  border-top: 1px solid #E9EDEF;
`
