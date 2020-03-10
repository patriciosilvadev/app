import React, { useState, useEffect, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { connect } from 'react-redux'
import styled from 'styled-components'
import moment from 'moment'
import ModalPortal from '../portals/modal.portal'
import PropTypes from 'prop-types'
import { Attachment, Popup, Button, Modal, Error, Spinner, Avatar, Menu, Notification } from '@tryyack/elements'
import { IconComponent } from './icon.component'
import PreviewComponent from './preview.component'
import { parseMessageMarkdown } from '../helpers/util'
import GraphqlService from '../services/graphql.service'
import { useParams, useHistory } from 'react-router-dom'
import PanelComponent from './panel.component'
import { Subject } from 'rxjs'
import { debounceTime } from 'rxjs/operators'
import MembersModal from '../modals/members.modal'
import ConfirmModal from '../modals/confirm.modal'

const TableRow = props => {
  const { member, user } = props
  const [confirmSelfDeleteModal, setConfirmSelfDeleteModal] = useState(false)
  const [confirmMemberDeleteModal, setConfirmMemberDeleteModal] = useState(false)

  return (
    <React.Fragment>
      {confirmSelfDeleteModal && (
        <ConfirmModal
          onOkay={() => {
            props.onLeave()
            setConfirmSelfDeleteModal(false)
          }}
          onCancel={() => setConfirmSelfDeleteModal(false)}
          text="Are you sure you want to leave this channel?"
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

      <tr>
        <Td width={30}>
          <Avatar size="medium" image={member.user.image} title={member.user.name} />
        </Td>
        <Td>
          <div className="bold">{member.user.id == user.id ? member.user.name + ' (You)' : member.user.name}</div>
          <div className="color-l0">
            @{`${member.user.username}`}
            {member.user.timezone ? ` − ${member.user.timezone.replace('_', ' ')}` : ''}
          </div>
        </Td>
        <Td>
          <IconComponent
            icon="delete"
            size={15}
            thickness={2}
            color="#aeb5bc"
            className="button"
            onClick={() => {
              if (user.id == member.user.id) {
                setConfirmSelfDeleteModal(true)
              } else {
                setConfirmMemberDeleteModal(true)
              }
            }}
          />
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
      notification: null,
      error: null,
      busy: false,
      page: 0,
      members: [],
      results: [],
      filter: '',
      membersModal: false,
    }

    this.scrollRef = React.createRef()
    this.filterRef = React.createRef()

    this.handleScrollEvent = this.handleScrollEvent.bind(this)
    this.handleChannelMemberDelete = this.handleChannelMemberDelete.bind(this)
    this.handleChannelLeave = this.handleChannelLeave.bind(this)
    this.fetchChannelMembers = this.fetchChannelMembers.bind(this)
    this.fetchResults = this.fetchResults.bind(this)
    this.onSearch = this.onSearch.bind(this)

    this.onSearch$ = new Subject()
    this.subscription = null
  }

  async fetchChannelMembers(refresh = false) {
    this.setState({
      loading: true,
      error: null,
    })

    try {
      const { channelId } = this.props
      const { data } = await GraphqlService.getInstance().channelMembers(channelId, this.state.page)

      // Update our users & bump the page
      this.setState({
        loading: false,
        members: refresh ? data.channelMembers : [...this.state.members, ...data.channelMembers],
        results: [],
      })
    } catch (e) {
      this.setState({
        loading: false,
        error: 'Error fetching members',
      })
    }
  }

  async handleChannelMemberDelete(userId) {
    this.setState({
      loading: true,
      error: null,
    })

    try {
      const { channelId } = this.props

      // Make the API call
      await GraphqlService.getInstance().deleteChannelMember(channelId, userId)

      // Stop loading
      this.setState({ loading: false })

      // Refresh the member list
      // They will be told from the API to leave
      this.fetchChannelMembers(true)
    } catch (e) {
      this.setState({
        loading: false,
        error: 'Error deleting member',
      })
    }
  }

  async handleChannelLeave() {
    this.setState({
      loading: true,
      error: null,
    })

    try {
      const { channelId, teamId } = this.props
      const userId = this.props.user.id
      const { data } = await GraphqlService.getInstance().deleteChannelMember(channelId, userId)

      // Stop loading
      this.setState({ loading: false })

      // We will get a notification from the server to:
      // Unsubscribe AGAIN & also delete the channel from the store
      // Refresh the member list (just in case)
      this.fetchChannelMembers(true)

      // Unsub frem receiving messages here
      MessagingService.getInstance().leave(channelId)

      // Redirect the user back to the landing page
      browserHistory.push(`/app/team/${teamId}/`)
      props.onClose()
    } catch (e) {
      this.setState({
        loading: false,
        error: 'Error leaving channel',
      })
    }
  }

  componentDidMount() {
    this.fetchChannelMembers()

    // Here we handle the delay for the yser typing in the search field
    this.subscription = this.onSearch$.pipe(debounceTime(1000)).subscribe(debounced => this.fetchResults())

    // Listen for the user scroll
    this.scrollRef.addEventListener('scroll', this.handleScrollEvent)
  }

  componentWillUnmount() {
    this.scrollRef.removeEventListener('scroll', this.handleScrollEvent)

    // Remove the search filter
    if (this.subscription) this.subscription.unsubscribe()
  }

  onSearch(e) {
    const search = e.target.value
    this.setState({ filter: search })
    this.onSearch$.next(search)
    if (search == '') this.setState({ results: [] })
  }

  async fetchResults() {
    if (this.state.filter == '') return

    this.setState({
      loading: true,
      error: null,
    })

    try {
      const { channelId } = this.props
      const { data } = await GraphqlService.getInstance().searchChannelMembers(channelId, this.state.filter)

      // Update our users & bump the page
      this.setState({
        loading: false,
        results: data.searchChannelMembers,
      })
    } catch (e) {
      this.setState({
        loading: false,
        error: 'Error searching members',
      })
    }
  }

  async handleScrollEvent(e) {
    // If the user scvrolls up - then fetch more messages
    // 0 = the top of the container
    if (this.scrollRef.scrollTop + this.scrollRef.clientHeight >= this.scrollRef.scrollHeight) {
      this.setState({ page: this.state.page + 1 }, () => {
        this.fetchChannelMembers()
      })
    }
  }

  render() {
    return (
      <React.Fragment>
        {this.state.membersModal && (
          <MembersModal
            hasAdminPermission={this.props.hasAdminPermission}
            channelId={this.props.channelId}
            teamId={this.props.teamId}
            onClose={() => this.setState({ membersModal: false })}
            onSuccess={() => {
              // Close
              this.setState({ membersModal: false })

              // Refetch
              this.fetchChannelMembers(true)
            }}
          />
        )}

        <PanelComponent title="Channel Members" onClose={this.props.onClose}>
          {this.state.error && <Error message={this.state.error} onDismiss={() => this.setState({ error: null })} />}
          {this.state.notification && <Notification text={this.state.notification} onDismiss={() => this.setState({ notification: null })} />}
          {this.state.loading && <Spinner />}

          {this.state.results.length == 0 && (
            <MembersText>
              There {this.props.channel.totalMembers == 1 ? 'is' : 'are'} <strong>{this.props.channel.totalMembers}</strong> {this.props.channel.totalMembers == 1 ? 'member' : 'members'} in this
              channel
            </MembersText>
          )}

          {this.state.results.length != 0 && (
            <MembersText>
              There {this.state.results.length == 1 ? 'is' : 'are'} <strong>{this.state.results.length}</strong> {this.state.results.length == 1 ? 'member' : 'members'} in your search
            </MembersText>
          )}

          <div className="p-20 w-100">
            <div className="row">
              <Input ref={ref => (this.filterRef = ref)} value={this.state.filter} onChange={this.onSearch} placeholder="Filter members by name" className="mr-5" />
              <Button text="Add" theme="muted" size="small" onClick={() => this.setState({ membersModal: true })} />
            </div>
          </div>

          <Members>
            <MembersScrollContainer ref={ref => (this.scrollRef = ref)}>
              <div className="p-20 pt-0">
                {this.state.results.length == 0 && (
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
                            onLeave={() => this.handleChannelLeave()}
                            onDelete={userId => this.handleChannelMemberDelete(userId)}
                          />
                        )
                      })}
                    </tbody>
                  </table>
                )}

                {this.state.results.length != 0 && (
                  <table width="100%" border="0" cellPadding={0} cellSpacing={0}>
                    <tbody>
                      {this.state.results.map((member, index) => {
                        if (this.state.filter != '' && !member.user.name.toLowerCase().match(new RegExp(this.state.filter.toLowerCase() + '.*'))) return null

                        return (
                          <TableRow
                            hasAdminPermission={this.props.hasAdminPermission}
                            key={index}
                            member={member}
                            user={this.props.user}
                            onLeave={() => this.handleChannelLeave()}
                            onDelete={userId => this.handleChannelMemberDelete(userId)}
                          />
                        )
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </MembersScrollContainer>
          </Members>
        </PanelComponent>
      </React.Fragment>
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
  hasAdminPermission: PropTypes.bool,
  channelId: PropTypes.string,
  teamId: PropTypes.string,
  user: PropTypes.any,
  team: PropTypes.any,
  channel: PropTypes.any,
}

const Input = styled.input`
  font-size: 14px;
  border-radius: 5px;
  width: 100%;
  padding: 10px;
  color: #626d7a;
  font-weight: 500;
  background: transparent;
  border: 1px solid #e9edef;

  &::placeholder {
    color: #e9edef;
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
