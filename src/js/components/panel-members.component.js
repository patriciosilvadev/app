import React, { useState, useEffect, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { connect } from 'react-redux'
import styled from 'styled-components'
import moment from 'moment'
import ModalPortal from '../portals/modal.portal'
import PropTypes from 'prop-types'
import { Attachment, Popup, Button, Modal, Error, Spinner, Input } from '@tryyack/elements'
import { IconComponent } from './icon.component'
import PreviewComponent from './preview.component'
import { parseMessageMarkdown } from '../helpers/util'
import GraphqlService from '../services/graphql.service'
import { useParams, useHistory } from 'react-router-dom'
import PanelComponent from './panel.component'

const TableRow = props => {
  const { member, user } = props
  const [menu, setMenu] = useState(false)
  const [confirmSelfDeleteModal, setConfirmSelfDeleteModal] = useState(false)
  const [confirmMemberDeleteModal, setConfirmMemberDeleteModal] = useState(false)
  const [roles, setRoles] = useState(false)
  const [memberDeleteId, setMemberDeleteId] = useState('')

  return (
    <React.Fragment>
      {confirmSelfDeleteModal && (
        <ConfirmModal onOkay={() => props.onLeave()} onCancel={() => setConfirmSelfDeleteModal(false)} text="Are you sure you want to leave this channel?" title="Are you sure?" />
      )}

      {confirmMemberDeleteModal && (
        <ConfirmModal
          onOkay={() => props.onDelete(member.user.id)}
          onCancel={() => setConfirmMemberDeleteModal(false)}
          text="Are you sure you want to remove this person, it can not be undone?"
          title="Are you sure?"
        />
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
                    hide: member.user.id == user.id || !props.hasAdminPermission,
                    icon: <IconComponent icon="user-minus" size={20} color="#acb5bd" />,
                    text: 'Remove person from team',
                    onClick: () => setConfirmMemberDeleteModal(true),
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

class PanelMembersComponent extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      loading: false,
      error: null,
      busy: false,
      page: 0,
      members: [],
      filter: '',
    }

    this.scrollRef = React.createRef()

    this.handleScrollEvent = this.handleScrollEvent.bind(this)
    this.handleChannelMemberDelete = this.handleChannelMemberDelete.bind(this)
    this.handleChannelLeave = this.handleChannelLeave.bind(this)
    this.fetchChannelMembers = this.fetchChannelMembers.bind(this)
  }

  async fetchChannelMembers() {}

  async handleChannelMemberDelete(userId) {}

  async handleChannelLeave() {}

  /* handleChannelMemberDelete = async userId => {
    setLoading(true)
    setError(null)

    try {
      const channelId = props.channelId
      const teamId = props.teamId
      const userIds = [userId]
      const { data } = await GraphqlService.getInstance().deleteChannelMember(channelId, userId)
      const updatedMembers = members.filter(member => member.user.id != userId)

      // Revoke access to people
      dispatch(deleteChannelMember(channelId, userId))
      setLoading(false)
      setMembers(updatedMembers)

      // Tell this person to leave this channel - send to team
      MessagingService.getInstance().leaveChannel(userIds, teamId)
    } catch (e) {
      setLoading(false)
      setError('Error deleting member')
    }
  }

  handleChannelLeave = async () => {
    setLoading(true)
    setError(null)

    try {
      const channelId = props.channelId
      const teamId = props.teamId
      const userId = user.id
      const { data } = await GraphqlService.getInstance().deleteChannelMember(channelId, userId)

      // Don't sync this one - because its just for us
      // false is for syncing here
      dispatch(deleteChannelMember(channelId, userId))
      dispatch(deleteChannel(channelId, false))
      setLoading(false)

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

   */

  componentDidMount() {
    this.fetchChannelMembers()

    this.scrollRef.addEventListener('scroll', this.handleScrollEvent)
  }

  componentWillUnmount() {
    this.scrollRef.removeEventListener('scroll', this.handleScrollEvent)
  }

  async handleScrollEvent(e) {
    // If the user scvrolls up - then fetch more messages
    // 0 = the top of the container
    if (this.scrollRef.scrollTop + this.scrollRef.clientHeight >= this.scrollRef.scrollHeight) this.fetchChannelMembers()
  }

  render() {
    return (
      <PanelComponent title="Channel Members" onClose={this.props.onClose}>
        {this.state.error && <Error message={this.state.error} />}
        {this.state.loading && <Spinner />}

        <MembersText>
          There {this.props.channel.totalMembers == 1 ? 'is' : 'are'} <strong>{this.props.channel.totalMembers}</strong> {this.props.channel.totalMembers == 1 ? 'member' : 'members'} in this channel
        </MembersText>

        <Members>
          <MembersScrollContainer ref={ref => (this.scrollRef = ref)}>
            <div className="p-20">
              <div className="row mb-20">
                <Input value={this.state.filter} onChange={e => this.setState({ filter: e.target.value })} placeholder="Filter members by name" className="mr-5" />
                <Button text="Add" theme="muted" size="small" onClick={this.props.onMemberAdd} />
              </div>

              <table width="100%" border="0" cellPadding={0} cellSpacing={0}>
                <tbody>
                  {this.state.members.map((member, index) => {
                    if (this.state.filter != '' && !member.user.name.toLowerCase().match(new RegExp(this.state.filter.toLowerCase() + '.*'))) return null

                    return (
                      <TableRow
                        hasAdminPermission={this.props.hasAdminPermission}
                        key={index}
                        member={member}
                        user={this.props.user}
                        onLeave={this.handleChannelLeave}
                        onDelete={this.handleChannelMemberDelete}
                      />
                    )
                  })}
                </tbody>
              </table>
            </div>
          </MembersScrollContainer>
        </Members>
      </PanelComponent>
    )
  }
}

const mapDispatchToProps = {}

const mapStateToProps = state => {
  return {
    user: state.user,
    team: state.team,
    channel: state.channel,
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(PanelMembersComponent)

PanelMembersComponent.propTypes = {
  onClose: PropTypes.func,
  onMemberAdd: PropTypes.func,
  user: PropTypes.any,
  team: PropTypes.any,
  channel: PropTypes.any,
  hasAdminPermission: PropTypes.bool,
}

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

const Text = styled.div`
  font-size: 14px;
  color: #acb5bd;
  font-weight: 400;

  line-height: 1.2;
  padding: 0px 0px 20px 0px;
  margin-top: 5px;
  margin-bottom: 5px;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  width: 100%;

  strong {
    font-weight: bold;
  }

  p {
    padding: 0px;
    margin: 0px;
  }

  code {
    background: white;
    border: 1px solid #eaeaea;
    border-left: 5px solid #007af5;
    color: #495057;
    border-radius: 2px;
    page-break-inside: avoid;
    font-family: Menlo, monospace;
    font-size: 10px;
    margin-top: 5px;
    line-height: 1.6;
    max-width: 100%;
    overflow: auto;
    padding: 1em 1.5em;
    display: block;
    word-wrap: break-word;
  }

  pre {
  }
`

const Members = styled.div`
  padding: 20px;
  padding-top: 10px;
  padding-bottom: 0px;
  flex: 1;
  width: 100%;
  position: relative;
`

const MembersText = styled.div`
  font-size: 14px;
  font-weight: 400;
  color: #adb5bd;
  font-weight: regular;
  margin: 20px;
  margin-bottom: 0px;
`

const MembersScrollContainer = styled.div`
  position: absolute;
  left: 0px;
  top: 0px;
  width: 100%;
  height: 100%;
  overflow: scroll;
`
