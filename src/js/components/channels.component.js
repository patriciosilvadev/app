import React, { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { connect } from 'react-redux'
import GraphqlService from '../services/graphql.service'
import MessagingService from '../services/messaging.service'
import '../helpers/extensions'
import styled from 'styled-components'
import { BrowserRouter as Router, Link } from 'react-router-dom'
import ChannelModal from '../modals/channel.modal'
import AccountModal from '../modals/account.modal'
import { Subject } from 'rxjs'
import { debounceTime } from 'rxjs/operators'
import { IconComponent } from './icon.component'
import QuickUserComponent from './quick-user.component'
import PropTypes from 'prop-types'
import {
  createChannel,
  hydrateChannels,
  hydrateTeam,
  updateUserDnd,
  updateChannelUserStatus,
  updateChannelUserPresence,
  updateUserPresence,
  updateUserStatus,
  updateUserMuted,
  updateUserArchived,
  updateTeamMemberPosition,
  updateChannel,
} from '../actions'
import TeamModal from '../modals/team.modal'
import { Toggle, Popup, Menu, Avatar, Tooltip, Input, Button, Select } from '@weekday/elements'
import QuickInputComponent from '../components/quick-input.component'
import AuthService from '../services/auth.service'
import { version } from '../../../package.json'
import { logger, shortenMarkdownText, getPresenceText } from '../helpers/util'
import moment from 'moment'
import { browserHistory } from '../services/browser-history.service'
import * as chroma from 'chroma-js'

const Channel = props => {
  const [over, setOver] = useState(false)
  const [menu, setMenu] = useState(false)
  const dispatch = useDispatch()
  const [iconCollapsable, setIconCollapsable] = useState(true)
  const icons = ['bell', 'pen', 'star', 'flag', 'smile', 'shield', 'monitor', 'smartphone', 'hash', 'compass', 'package', 'radio', 'box', 'lock', 'attachment', 'at', 'check', null]
  const colors = [
    '#810002',
    '#E50203',
    '#FF3F80',
    '#FF7FAA',
    '#F806EA',
    '#EA80FB',
    '#BF54EB',
    '#9B59B6',
    '#7C4DFF',
    '#0262e8',
    '#81B1FF',
    '#3182B6',
    '#0BBCD4',
    '#1CBC9B',
    '#2DCD6E',
    '#F9D900',
    '#B07E2D',
    '#FF7803',
    '#FF7803',
    '#FF7803',
    '#FF7803',
    //'#F0F3F5', need to handle light backgorunds with Chrome first
  ]
  const avatarTextColor = props.private
    ? null
    : props.color
    ? chroma(props.color)
        .desaturate(2)
        .brighten(2.25)
        .toString()
    : '#007af5'

  const handleUpdateIcon = async icon => {
    try {
      await GraphqlService.getInstance().updateChannel(props.id, { icon })

      dispatch(updateChannel(props.id, { icon }))
    } catch (e) {
      logger(e)
    }
  }

  const handleUpdateColor = async color => {
    try {
      await GraphqlService.getInstance().updateChannel(props.id, { color })

      dispatch(updateChannel(props.id, { color }))
    } catch (e) {
      logger(e)
    }
  }

  return (
    <ChannelContainer
      onClick={props.onClick}
      onMouseEnter={() => setOver(true)}
      onMouseLeave={() => {
        setOver(false)
        setMenu(false)
      }}
      unread={props.unread}
      active={props.active}
    >
      <ChannelContainerPadding>
        <Avatar muted={props.muted} color={props.color} presence={props.presence} textColor={avatarTextColor} size="small" image={props.private ? props.image : null} title={props.name}>
          {props.icon ? <IconComponent icon={props.icon} size={12} color={avatarTextColor} thickness={2} style={{ position: 'relative', top: -1 }} /> : null}
        </Avatar>

        <ChannelContents>
          <ChannelInnerContents>
            {!props.public && !props.private && <IconComponent icon="lock" color={props.active ? '#18181d' : '#858E96'} size={12} thickness={2.5} className="mr-5" />}
            {props.readonly && <IconComponent icon="radio" color={props.active ? '#18181d' : '#858E96'} size={12} thickness={2.5} className="mr-5" />}

            <ChannelTitle active={props.active || props.unread != 0}>{props.name}</ChannelTitle>

            <ChannelExcerpt>
              &nbsp;
              {props.excerpt && (
                <ChannelExcerptTextContainer>
                  <ChannelExcerptText active={props.active || props.unread != 0}>{shortenMarkdownText(props.excerpt)}</ChannelExcerptText>
                </ChannelExcerptTextContainer>
              )}
            </ChannelExcerpt>
          </ChannelInnerContents>
        </ChannelContents>
      </ChannelContainerPadding>

      {over && props.onMutedClick && props.onArchivedClick && (
        <Popup
          handleDismiss={() => setMenu(false)}
          visible={menu}
          width={200}
          direction="right-bottom"
          content={
            <React.Fragment>
              <Menu
                items={[
                  {
                    text: props.archived ? 'Unarchive' : 'Archive',
                    onClick: e => {
                      props.onArchivedClick()
                    },
                  },
                  {
                    text: props.muted ? 'Unmute' : 'Mute',
                    onClick: e => {
                      props.onMutedClick()
                    },
                  },
                ]}
              />

              {!props.private && (
                <React.Fragment>
                  <div className="row wrap p-15 border-top">
                    {colors.map((color, index) => (
                      <ColorCircle color={color} current={color == props.color} key={index} onClick={() => handleUpdateColor(color)} />
                    ))}
                  </div>

                  <div className="w-100 p-20 column align-items-start border-top">
                    <div className="row w-100">
                      <div className="p regular color-d2 flexer">Icon</div>
                      <IconComponent
                        icon={iconCollapsable ? 'chevron-up' : 'chevron-down'}
                        size={16}
                        thickness={3}
                        color="#acb5bd"
                        className="button"
                        onClick={() => setIconCollapsable(!iconCollapsable)}
                      />
                    </div>
                    <Collapsable className={iconCollapsable ? 'open' : ''}>
                      <div className="row wrap w-100 mt-10">
                        {icons.map((icon, index) => {
                          return (
                            <IconCircle current={icon == props.icon} key={index}>
                              <IconComponent icon={icon} size={16} color="#ACB5BD" thickness={1.5} onClick={() => handleUpdateIcon(icon)} />
                            </IconCircle>
                          )
                        })}
                      </div>
                    </Collapsable>
                  </div>
                </React.Fragment>
              )}
            </React.Fragment>
          }
        >
          <ChannelMoreIcon
            onClick={e => {
              e.stopPropagation()
              setMenu(true)
            }}
          >
            <IconComponent icon="more-h" color="#858E96" size={15} thickness={1.5} />
          </ChannelMoreIcon>
        </Popup>
      )}

      {props.unread > 0 && <ChannelBadge>{props.unread}</ChannelBadge>}
    </ChannelContainer>
  )
}

Channel.propTypes = {
  dark: PropTypes.bool,
  active: PropTypes.bool,
  muted: PropTypes.bool,
  archived: PropTypes.bool,
  unread: PropTypes.number,
  name: PropTypes.string,
  image: PropTypes.string,
  icon: PropTypes.string,
  label: PropTypes.string,
  excerpt: PropTypes.string,
  public: PropTypes.bool,
  private: PropTypes.bool,
  readonly: PropTypes.bool,
  presence: PropTypes.string,
  onClick: PropTypes.any,
  onMutedClick: PropTypes.any,
  onArchivedClick: PropTypes.any,
}

const IconCircle = styled.div`
  background: ${props => (props.selected ? '#F0F3F5' : 'white')};
  border-radius: 50%;
  width: 25px;
  height: 25px;
  display: flex;
  flex-direction: row;
  align-items: center;
  align-content: center;
  justify-content: center;

  &:hover {
    background: #f0f3f5;
  }
`

const ColorCircle = styled.div`
  background: ${props => props.color};
  width: 15px;
  height: 15px;
  border-radius: 50%;
  margin-right: 3px;
  margin-bottom: 3px;
  border: 1px solid ${props => (props.selected ? '#F0F3F5' : 'white')}

  &:hover {
    opacity: 0.75;
  }
`

const ChannelContainer = styled.div`
  display: flex;
  flex-direction: row;
  background: ${props => (props.active ? '#F0F3F5' : 'transparent')};
  align-items: center;
  align-content: center;
  justify-content: center;
  position: relative;
  cursor: pointer;
  margin-bottom: 0px;
  padding-right: 25px;
`

const ChannelContainerPadding = styled.div`
  flex: 1;
  padding: 5px 0px 5px 25px;
  display: flex;
  flex-direction: row;
  align-items: stretch;
  align-content: center;
  justify-content: center;
  position: relative;
`

const ChannelBadge = styled.div`
  padding: 3px 7px 3px 7px;
  border-radius: 10px;
  background-color: #007af5;
  font-size: 11px;
  color: white;
  font-weight: 600;
  margin-left: 5px;
`

const ChannelTitle = styled.div`
  cursor: pointer;
  font-size: 14px;
  font-weight: ${props => (props.active ? '600' : '500')};
  color: ${props => (props.active ? '#18181d' : '#858E96')};
  white-space: wrap;
  max-width: 140px;
  /*letter-spacing: -0.5px;*/
  margin-right: 5px;
`

const ChannelExcerpt = styled.div`
  flex: 1;
  overflow: hidden;
  position: relative;
`

const ChannelExcerptTextContainer = styled.div`
  overflow: hidden;
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0px;
  left: 0px;
  display: flex;
  flex-direction: row;
  align-items: center;
  align-content: center;
  justify-content: flex-start;
`

const ChannelExcerptText = styled.span`
  font-size: 14px;
  color: #858e96;
  font-weight: 400;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  align: left;
  opacity: 0.5;
`

const ChannelContents = styled.div`
  display: flex;
  flex-direction: column;
  align-items: stretch;
  align-content: flex-start;
  justify-content: flex-start;
  position: relative;
  flex: 1;
  padding-left: 10px;
`

const ChannelInnerContents = styled.div`
  flex: 1;
  display: flex;
  flex-direction: row;
  align-items: center;
  align-content: center;
  justify-content: center;
  position: relative;
`

const ChannelMoreIcon = styled.span`
  cursor: pointer;
  opacity: 1;
  transition: opacity 0.5s;
  display: inline-block;
  z-index: 5;
  right: 0px;
  top: 0px;
  display: flex;
  margin-left: 5px;
  margin-right: 4px;
  flex-direction: row;
  align-items: center;
  align-content: center;
  justify-content: center;

  &:hover {
    opacity: 0.75;
  }
`

class ChannelsComponent extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      filter: '',
      results: [],
      teamModal: false,
      teamModalStart: 0,
      channelPublicPopup: false,
      channelPrivatePopup: false,
      accountModal: false,
      accountMenu: false,
      presenceMenu: false,
      archivedVisible: false,
      starred: [],
      muted: [],
      archived: [],
      public: [],
      private: [],
      loading: false,
      error: false,
      positionCollapsableOpen: false,
      positionCollapsableInput: '',
      statusCollapsableOpen: false,
      statusCollapsableInput: '',
      dndCollapsableOpen: false,
      dndIndex: 0,
    }

    this.createChannel = this.createChannel.bind(this)
    this.createPrivateChannel = this.createPrivateChannel.bind(this)
    this.createPublicChannel = this.createPublicChannel.bind(this)
    this.updateUserMuted = this.updateUserMuted.bind(this)
    this.updateUserArchived = this.updateUserArchived.bind(this)
    this.updateUserStatus = this.updateUserStatus.bind(this)
    this.updateUserPresence = this.updateUserPresence.bind(this)
    this.updateUserDnd = this.updateUserDnd.bind(this)
    this.getCurrentDndIndex = this.getCurrentDndIndex.bind(this)
    this.handleTeamMemberPositionChange = this.handleTeamMemberPositionChange.bind(this)

    this.renderAccountModal = this.renderAccountModal.bind(this)
    this.renderTeamModal = this.renderTeamModal.bind(this)
    this.renderHeader = this.renderHeader.bind(this)
    this.renderStarred = this.renderStarred.bind(this)
    this.renderPublic = this.renderPublic.bind(this)
    this.renderPrivate = this.renderPrivate.bind(this)
    this.renderArchived = this.renderArchived.bind(this)
    this.renderDnd = this.renderDnd.bind(this)

    this.dndOptions = [{ option: 'Never', value: 0 }, { option: '1 hour', value: 1 }, { option: '8 hours', value: 8 }, { option: '12 hours', value: 12 }, { option: '24 hours', value: 24 }]
  }

  async handleTeamMemberPositionChange(position) {
    try {
      const teamId = this.props.team.id
      const userId = this.props.user.id

      await GraphqlService.getInstance().updateTeamMemberPosition(teamId, userId, position)

      this.props.updateTeamMemberPosition(position)
    } catch (e) {
      logger(e)
    }
  }

  getCurrentDndIndex() {
    return this.dndOptions.reduce((acc, dnd, index) => {
      return dnd.value == this.props.user.dnd ? acc + index : acc + 0
    }, 0)
  }

  async updateUserDnd(dnd) {
    try {
      const userId = this.props.user.id
      const teamId = this.props.team.id
      const dndUntil = moment()
        .add(dnd, 'hours')
        .toISOString()

      await GraphqlService.getInstance().updateUser(userId, { dnd, dndUntil })

      this.props.updateUserDnd(dnd, dndUntil)
    } catch (e) {
      logger(e)
    }
  }

  async updateUserPresence(presence) {
    this.setState({ presenceMenu: false })

    try {
      const userId = this.props.user.id
      const teamId = this.props.team.id

      await GraphqlService.getInstance().updateUser(userId, { presence })

      this.props.updateUserPresence(presence)
      this.props.updateChannelUserPresence(userId, teamId, status)
    } catch (e) {
      logger(e)
    }
  }

  async updateUserStatus(userId, teamId, status) {
    try {
      await GraphqlService.getInstance().updateUser(userId, { status })

      this.props.updateUserStatus(status)
      this.props.updateChannelUserStatus(userId, teamId, status)
    } catch (e) {
      logger(e)
    }
  }

  async updateUserArchived(userId, channelId, archived) {
    try {
      await GraphqlService.getInstance().updateUserArchived(userId, channelId, archived)

      this.props.updateUserArchived(userId, channelId, archived)
    } catch (e) {
      logger(e)
    }
  }

  async updateUserMuted(userId, channelId, muted) {
    try {
      await GraphqlService.getInstance().updateUserMuted(userId, channelId, muted)

      this.props.updateUserMuted(userId, channelId, muted)
    } catch (e) {
      logger(e)
    }
  }

  static getDerivedStateFromProps(props, state) {
    const starredChannels = props.channels
      .filter((channel, index) => props.user.starred.indexOf(channel.id) != -1)
      .filter(channel => {
        if (channel.otherUser.name) {
          return channel.otherUser.name.toLowerCase().match(new RegExp(state.filter.toLowerCase() + '.*'))
        } else {
          return channel.name.toLowerCase().match(new RegExp(state.filter.toLowerCase() + '.*'))
        }
      })
    const archivedChannels = props.channels
      .filter((channel, index) => props.user.archived.indexOf(channel.id) != -1)
      .filter(channel => {
        if (channel.otherUser.name) {
          return channel.otherUser.name.toLowerCase().match(new RegExp(state.filter.toLowerCase() + '.*'))
        } else {
          return channel.name.toLowerCase().match(new RegExp(state.filter.toLowerCase() + '.*'))
        }
      })
    const publicChannels = props.channels
      .filter((channel, index) => !channel.private && props.user.starred.indexOf(channel.id) == -1 && props.user.archived.indexOf(channel.id) == -1)
      .filter(channel => channel.name.toLowerCase().match(new RegExp(state.filter.toLowerCase() + '.*')))
    const privateChannels = props.channels
      .filter((channel, index) => channel.private && props.user.starred.indexOf(channel.id) == -1 && props.user.archived.indexOf(channel.id) == -1)
      .filter(channel => channel.otherUser.name.toLowerCase().match(new RegExp(state.filter.toLowerCase() + '.*')))

    return {
      starred: starredChannels,
      archived: archivedChannels,
      private: privateChannels,
      public: publicChannels,
    }
  }

  createPrivateChannel(user) {
    const name = null
    const description = null
    const image = null
    const teamId = this.props.team.id

    this.createChannel(name, description, image, teamId, user)
    this.setState({ filter: '', showFilter: false, results: [] })
  }

  createPublicChannel(name) {
    const description = null
    const image = null
    const teamId = this.props.team.id

    this.createChannel(name, description, image, teamId, null)
    this.setState({ filter: '', showFilter: false, results: [] })
  }

  async createChannel(name, description, image, teamId, otherUser) {
    try {
      // 1. Find channels where there are private
      // 2. Filter channels that have this private user as the otherUser (so it exists)
      const isPrivate = otherUser ? true : false
      const channel = isPrivate
        ? this.props.channels
            .filter(channel => channel.private)
            .filter(channel => channel.otherUser.id == otherUser.id)
            .flatten()
        : null

      // 3. If it's found - then go there first (don't create a new one)
      if (channel) return this.props.history.push(`/app/team/${teamId}/channel/${channel.id}`)

      // Otherwise create the new channel
      // 1) Create the channel object based on an open channel or private
      // 2) Seperate the members object for the API call
      const { user } = this.props
      const thisUser = { id: user.id, name: user.name, username: user.username }
      const { data } = await GraphqlService.getInstance().createChannel({
        thisUser,
        otherUser,
        channel: {
          name,
          description,
          image,
          team: teamId,
          user: user.id,
          messages: [],
          public: false,
          private: isPrivate,
        },
      })

      // Debug
      logger({ otherUser, thisUser })

      const channelData = data.createChannel
      const channelId = channelData.id
      const newChannel = await GraphqlService.getInstance().channel(channelId)

      // Update our redux store
      this.props.createChannel(newChannel.data.channel)

      // Join this channel ourselves
      MessagingService.getInstance().join(channelId)

      // Navigate there
      browserHistory.push(`/app/team/${teamId}/channel/${channelId}`)
    } catch (e) {
      logger(e)
    }
  }

  componentDidMount() {
    const { teamId } = this.props.match.params
    const userId = this.props.user.id

    // Fetch the team & channels
    this.fetchData(teamId, userId)
  }

  componentDidUpdate(prevProps) {
    const { teamId } = this.props.match.params
    const userId = this.props.user.id

    if (teamId != prevProps.match.params.teamId) this.fetchData(teamId, userId)
  }

  async fetchData(teamId, userId) {
    this.setState({ loading: true, error: null })

    try {
      // await GraphqlService.getInstance().channels(teamId, userId)
      // Not sure why I was using the above to seperate the calls
      const team = await GraphqlService.getInstance().teamChannelsComponent(teamId, userId)
      const channels = team.data.team.channels
      const channelIds = channels.map(channel => channel.id)

      // Kill the loading
      this.setState({ loading: false, error: null })

      // Join the channels
      MessagingService.getInstance().joins(channelIds)

      // Populate our stores
      this.props.hydrateTeam(team.data.team)
      this.props.hydrateChannels(channels)
    } catch (e) {
      this.setState({ loading: false, error: e })
    }
  }

  // Child render functions that compose the
  // parts of the channels sidebar
  renderDnd() {
    const { dnd, dndUntil, timezone } = this.props.user
    const currentDate = moment()
    const dndUntilDate = moment(dndUntil).tz(timezone)
    const currentDateIsAfterDndDate = currentDate.isAfter(dndUntilDate)
    const dndIsSet = !!dnd

    return (
      <div className="w-100 p-20 column align-items-start border-bottom">
        <div className="row w-100">
          <div className="p regular color-d2 flexer">Do not disturb</div>
          <Toggle
            on={dndIsSet && !currentDateIsAfterDndDate}
            onChange={() => {
              if (!dndIsSet || currentDateIsAfterDndDate) {
                this.updateUserDnd(1)
              } else {
                this.updateUserDnd(0)
              }
            }}
          />
        </div>
        <Collapsable className={dndIsSet && !currentDateIsAfterDndDate ? 'open' : ''}>
          <div className="column w-100 mt-10">
            <div className="small bold color-d2 flexer mb-10">Turn off notifications for:</div>
            <Select selected={this.getCurrentDndIndex()} options={this.dndOptions} onSelect={index => this.updateUserDnd(this.dndOptions[index].value)} />
          </div>
        </Collapsable>
      </div>
    )
  }

  renderHeader() {
    return (
      <div className="column w-100">
        <div className="row pl-25 pr-25 pt-15 pb-15 hide">
          <HeaderTeam>{this.props.team.name}</HeaderTeam>
          <HeaderRole>
            {this.props.team.position} - {this.props.user.timezone}
          </HeaderRole>
        </div>

        <Header className="row mt-20 pt-5">
          <Popup
            handleDismiss={() => this.setState({ presenceMenu: false })}
            visible={this.state.presenceMenu}
            width={200}
            direction="left-bottom"
            content={
              <Menu
                items={[
                  {
                    icon: <span style={{ fontSize: 14, color: '#36C5AB' }}>&#9679;</span>,
                    text: 'Online (default)',
                    onClick: () => this.updateUserPresence(null),
                  },
                  {
                    icon: <span style={{ fontSize: 14, color: '#FD9A00' }}>&#9679;</span>,
                    text: 'Away',
                    onClick: () => this.updateUserPresence('away'),
                  },
                  {
                    icon: <span style={{ fontSize: 14, color: '#FC1449' }}>&#9679;</span>,
                    text: 'Busy',
                    onClick: () => this.updateUserPresence('busy'),
                  },
                  {
                    icon: <span style={{ fontSize: 14, color: 'rgba(0,0,0,0.1)' }}>&#9679;</span>,
                    text: 'Invisible',
                    onClick: () => this.updateUserPresence('invisible'),
                  },
                ]}
              />
            }
          >
            <Avatar
              size="medium-large"
              image={this.props.user.image}
              title={this.props.user.name}
              className="mr-10"
              presence={this.props.user.presence ? (this.props.user.presence == 'invisible' ? 'invisible:user' : this.props.user.presence) : 'online'}
              onPresenceClick={() => this.setState({ presenceMenu: true })}
            />
          </Popup>

          <HeaderTitles className="column">
            <HeaderTitle className="align-items-center">{this.props.user.name}</HeaderTitle>
            <HeaderSubtitle>
              <div>{this.props.user.status || 'Update your status'}</div>
            </HeaderSubtitle>
          </HeaderTitles>

          <Popup
            handleDismiss={this._closeUserMenu.bind(this)}
            visible={this.state.accountMenu}
            width={300}
            direction="left-bottom"
            content={
              <React.Fragment>
                <div className="w-100 p-20 column align-items-center border-bottom">
                  <Avatar size="x-large" image={this.props.user.image} title={this.props.user.name} />
                  <div className="text-center h5 regular color-d3 mt-15">{this.props.user.name}</div>
                  <div className="text-center small bold color-l0 mt-5">{this.props.team.position}</div>
                </div>

                <div className="w-100 p-20 column align-items-start border-bottom">
                  <div className="row w-100">
                    <div className="p regular color-d2 flexer">Status</div>
                    <IconComponent
                      icon={this.state.statusCollapsableOpen ? 'chevron-up' : 'chevron-down'}
                      size={16}
                      thickness={3}
                      color="#acb5bd"
                      className="button"
                      onClick={() => {
                        this.setState({
                          statusCollapsableOpen: !this.state.statusCollapsableOpen,
                          statusCollapsableInput: this.props.user.status,
                        })
                      }}
                    />
                  </div>
                  <Collapsable className={this.state.statusCollapsableOpen ? 'open' : ''}>
                    <div className="row w-100 mt-10">
                      <Input placeholder="Update your status" value={this.state.statusCollapsableInput} onChange={e => this.setState({ statusCollapsableInput: e.target.value })} />
                      <Button
                        size="small"
                        className="ml-10"
                        text="Ok"
                        theme="muted"
                        onClick={() => {
                          this.updateUserStatus(this.props.user.id, this.props.team.id, this.state.statusCollapsableInput)
                          this.setState({ statusCollapsableOpen: false })
                        }}
                      />
                    </div>
                  </Collapsable>
                </div>

                <div className="w-100 p-20 column align-items-start border-bottom">
                  <div className="row w-100">
                    <div className="p regular color-d2 flexer">Team role</div>
                    <IconComponent
                      icon={this.state.positionCollapsableOpen ? 'chevron-up' : 'chevron-down'}
                      size={16}
                      thickness={3}
                      color="#acb5bd"
                      className="button"
                      onClick={() => {
                        this.setState({
                          positionCollapsableOpen: !this.state.positionCollapsableOpen,
                          positionCollapsableInput: this.props.team.position,
                        })
                      }}
                    />
                  </div>
                  <Collapsable className={this.state.positionCollapsableOpen ? 'open' : ''}>
                    <div className="row w-100 mt-10">
                      <Input placeholder="Update your role" value={this.state.positionCollapsableInput} onChange={e => this.setState({ positionCollapsableInput: e.target.value })} />
                      <Button
                        size="small"
                        className="ml-10"
                        text="Ok"
                        theme="muted"
                        onClick={() => {
                          this.handleTeamMemberPositionChange(this.state.positionCollapsableInput)
                          this.setState({ positionCollapsableOpen: false })
                        }}
                      />
                    </div>
                  </Collapsable>
                </div>

                {this.renderDnd()}

                <Menu
                  items={[
                    {
                      icon: <IconComponent icon="profile" size={20} color="#acb5bd" />,
                      text: 'Account settings',
                      onClick: this._openAccountSettings.bind(this),
                    },
                    {
                      icon: <IconComponent icon="settings" size={20} color="#acb5bd" />,
                      text: 'Team settings',
                      onClick: this._openTeamSettings.bind(this),
                    },
                    {
                      icon: <IconComponent icon="list" size={20} color="#acb5bd" thickness={1.5} />,
                      text: 'Team directory',
                      onClick: this._openTeamDirectory.bind(this),
                    },
                    {
                      hide: true,
                      icon: <IconComponent icon="flag" size={20} color="#acb5bd" />,
                      text: 'Team subscription',
                      onClick: this._openTeamSubscription.bind(this),
                    },
                    {
                      icon: <IconComponent icon="logout" size={20} color="#acb5bd" />,
                      text: 'Signout',
                      onClick: this._signout.bind(this),
                    },
                  ]}
                />

                <div className="small regular color-d0 p-20 border-top">Build {version}</div>
              </React.Fragment>
            }
          >
            <IconComponent icon="settings" size={16} thickness={2} color="#858E96" className="button" onClick={this._openUserMenu.bind(this)} />
          </Popup>
        </Header>
      </div>
    )
  }

  renderStarred() {
    if (this.state.starred.length == 0) return null

    const { pathname } = this.props.history.location

    return (
      <React.Fragment>
        <Heading>Favourites</Heading>

        {this.state.starred.map((channel, index) => {
          const unread = this.props.common.unread.filter(row => channel.id == row.doc.channel).flatten()
          const unreadCount = unread ? unread.doc.count : 0
          const to = `/app/team/${this.props.team.id}/channel/${channel.id}`
          const muted = this.props.user.muted.indexOf(channel.id) != -1
          const archived = this.props.user.archived.indexOf(channel.id) != -1

          return (
            <Channel
              key={index}
              id={channel.id}
              color={channel.color}
              icon={channel.icon}
              active={pathname.indexOf(channel.id) != -1}
              unread={muted ? 0 : unreadCount}
              name={channel.private ? channel.otherUser.name : channel.name}
              image={channel.private ? channel.otherUser.image : channel.image}
              excerpt={channel.private ? channel.otherUser.excerpt : channel.excerpt}
              public={channel.public}
              private={channel.private}
              readonly={channel.readonly}
              muted={muted}
              archived={archived}
              onClick={() => this.props.history.push(to)}
              onArchivedClick={() => this.updateUserArchived(this.props.user.id, channel.id, !archived)}
              onMutedClick={() => this.updateUserMuted(this.props.user.id, channel.id, !muted)}
            />
          )
        })}
      </React.Fragment>
    )
  }

  renderPublic() {
    // Not this one - we want to always show this one
    // if (this.state.public.length == 0) return null
    const { pathname } = this.props.history.location

    return (
      <React.Fragment>
        <div className="row pr-25">
          <Heading>Channels</Heading>

          {this.props.team.role != 'GUEST' && (
            <QuickInputComponent
              visible={this.state.channelPublicPopup}
              width={250}
              direction="right-bottom"
              handleDismiss={() => this.setState({ channelPublicPopup: false })}
              handleAccept={name => this.setState({ channelPublicPopup: false }, () => this.createPublicChannel(name))}
              placeholder="New channel name"
            >
              <IconComponent icon="plus-circle" size={15} color="#858E96" thickness={2} className="button" onClick={() => this.setState({ channelPublicPopup: true })} />
            </QuickInputComponent>
          )}
        </div>

        {this.state.public.map((channel, index) => {
          const unread = this.props.common.unread.filter(row => channel.id == row.doc.channel).flatten()
          const unreadCount = unread ? unread.doc.count : 0
          const muted = this.props.user.muted.indexOf(channel.id) != -1
          const archived = this.props.user.archived.indexOf(channel.id) != -1

          return (
            <Channel
              key={index}
              id={channel.id}
              color={channel.color}
              icon={channel.icon}
              active={pathname.indexOf(channel.id) != -1}
              unread={muted ? 0 : unreadCount}
              name={channel.name}
              image={channel.image}
              excerpt={channel.excerpt}
              public={channel.public}
              private={channel.private}
              readonly={channel.readonly}
              muted={muted}
              archived={archived}
              onClick={() => this.props.history.push(`/app/team/${this.props.team.id}/channel/${channel.id}`)}
              onArchivedClick={() => this.updateUserArchived(this.props.user.id, channel.id, !archived)}
              onMutedClick={() => this.updateUserMuted(this.props.user.id, channel.id, !muted)}
            />
          )
        })}
      </React.Fragment>
    )
  }

  renderPrivate() {
    const { pathname } = this.props.history.location

    return (
      <React.Fragment>
        <div className="row pr-25">
          <Heading>Private Conversations</Heading>

          <QuickUserComponent
            teamId={this.props.team.id}
            userId={this.props.user.id}
            visible={this.state.channelPrivatePopup}
            width={250}
            direction="right-bottom"
            handleDismiss={() => this.setState({ channelPrivatePopup: false })}
            handleAccept={({ user }) => {
              // Check to see if there are already people
              // Don't re-add people
              if (user.id == this.props.user.id) return

              // Otherwise all good - add them
              this.createPrivateChannel(user)
              this.setState({ channelPrivatePopup: false })
            }}
          >
            <IconComponent icon="plus-circle" size={15} color="#858E96" thickness={2} className="button" onClick={() => this.setState({ channelPrivatePopup: true })} />
          </QuickUserComponent>
        </div>

        {this.state.private.map((channel, index) => {
          if (this.props.user.starred.indexOf(channel.id) != -1) return

          const unread = this.props.common.unread.filter(row => channel.id == row.doc.channel).flatten()
          const unreadCount = unread ? unread.doc.count : 0
          const muted = this.props.user.muted.indexOf(channel.id) != -1
          const archived = this.props.user.archived.indexOf(channel.id) != -1
          const otherUserId = channel.otherUser.id
          const otherUserPresenceText = getPresenceText(this.props.presences[otherUserId])

          return (
            <Channel
              key={index}
              id={channel.id}
              color={channel.color}
              icon={channel.icon}
              presence={otherUserPresenceText}
              active={pathname.indexOf(channel.id) != -1}
              unread={muted ? 0 : unreadCount}
              name={channel.otherUser.name}
              image={channel.otherUser.image}
              excerpt={channel.otherUser.status}
              public={channel.public}
              private={channel.private}
              readonly={channel.readonly}
              muted={muted}
              archived={archived}
              onClick={() => this.props.history.push(`/app/team/${this.props.team.id}/channel/${channel.id}`)}
              onArchivedClick={() => this.updateUserArchived(this.props.user.id, channel.id, !archived)}
              onMutedClick={() => this.updateUserMuted(this.props.user.id, channel.id, !muted)}
            />
          )
        })}
      </React.Fragment>
    )
  }

  renderArchived() {
    if (this.state.archived.length == 0) return null

    const { pathname } = this.props.history.location

    return (
      <React.Fragment>
        <Heading className="button" onClick={() => this.setState({ archivedVisible: !this.state.archivedVisible })}>
          {this.state.archivedVisible ? 'Hide archived' : 'See archived'}
        </Heading>

        {this.state.archivedVisible && (
          <React.Fragment>
            {this.state.archived.map((channel, index) => {
              const unread = this.props.common.unread.filter(row => channel.id == row.doc.channel).flatten()
              const unreadCount = unread ? unread.doc.count : 0
              const to = `/app/team/${this.props.team.id}/channel/${channel.id}`
              const muted = this.props.user.muted.indexOf(channel.id) != -1
              const archived = this.props.user.archived.indexOf(channel.id) != -1

              return (
                <Channel
                  key={index}
                  id={channel.id}
                  color={channel.color}
                  icon={channel.icon}
                  active={pathname.indexOf(channel.id) != -1}
                  unread={muted ? 0 : unreadCount}
                  name={channel.private ? channel.otherUser.name : channel.name}
                  image={channel.private ? channel.otherUser.image : channel.image}
                  excerpt={channel.private ? channel.otherUser.status : channel.excerpt}
                  public={channel.public}
                  private={channel.private}
                  readonly={channel.readonly}
                  muted={muted}
                  archived={archived}
                  onClick={() => this.props.history.push(to)}
                  onArchivedClick={e => this.updateUserArchived(this.props.user.id, channel.id, !archived)}
                  onMutedClick={() => this.updateUserMuted(this.props.user.id, channel.id, !muted)}
                />
              )
            })}
          </React.Fragment>
        )}
      </React.Fragment>
    )
  }

  renderAccountModal() {
    if (!this.state.accountModal) return null

    return <AccountModal id={this.props.user.id} onClose={() => this.setState({ accountModal: false })} />
  }

  renderTeamModal() {
    if (!this.state.teamModal) return null

    return <TeamModal id={this.props.team.id} start={this.state.teamModalStart} createPrivateChannel={this.createPrivateChannel} onClose={() => this.setState({ teamModal: false })} />
  }

  // These unbounded functions
  // So we haven't bound these to THIS
  // Just is easier/quicker for now
  _openAccountSettings() {
    this.setState({ accountMenu: false, accountModal: true })
  }

  _openTeamSubscription() {
    this.setState({ accountMenu: false, teamModal: true, teamModalStart: 4 })
  }

  _openTeamSettings() {
    this.setState({ accountMenu: false, teamModal: true, teamModalStart: 0 })
  }

  _openTeamDirectory() {
    this.setState({ accountMenu: false, teamModal: true, teamModalStart: 1 })
  }

  _signout() {
    this.setState({ accountMenu: false }, async () => {
      await AuthService.signout()
      await GraphqlService.signout()

      this.props.history.push('/auth')
    })
  }

  _openUserMenu() {
    this.setState({ accountMenu: true })
  }

  _closeUserMenu() {
    this.setState({ accountMenu: false })
  }

  render() {
    return (
      <Channels className="column">
        {this.renderAccountModal()}
        {this.renderTeamModal()}

        {this.renderHeader()}

        <ChannelsContainer>
          {this.renderStarred()}
          {this.renderPublic()}
          {this.renderPrivate()}
          {this.renderArchived()}
        </ChannelsContainer>
      </Channels>
    )
  }
}

ChannelsComponent.propTypes = {
  starred: PropTypes.bool,
  team: PropTypes.any,
  channel: PropTypes.any,
  channels: PropTypes.array,
  common: PropTypes.any,
  user: PropTypes.any,
  presences: PropTypes.any,
  teams: PropTypes.array,
  createChannel: PropTypes.func,
  hydrateChannels: PropTypes.func,
  hydrateTeam: PropTypes.func,
  updateUserStatus: PropTypes.func,
  updateUserMuted: PropTypes.func,
  updateUserArchived: PropTypes.func,
}

const mapDispatchToProps = {
  updateTeamMemberPosition: position => updateTeamMemberPosition(position),
  updateUserDnd: dnd => updateUserDnd(dnd),
  updateUserStatus: status => updateUserStatus(status),
  updateUserPresence: presence => updateUserPresence(presence),
  updateChannelUserStatus: (userId, teamId, status) => updateChannelUserStatus(userId, teamId, status),
  updateChannelUserPresence: (userId, teamId, presence) => updateChannelUserPresence(userId, teamId, presence),
  updateUserMuted: (userId, channelId, muted) => updateUserMuted(userId, channelId, muted),
  updateUserArchived: (userId, channelId, archived) => updateUserArchived(userId, channelId, archived),
  createChannel: channel => createChannel(channel),
  hydrateChannels: channels => hydrateChannels(channels),
  hydrateTeam: team => hydrateTeam(team),
}

const mapStateToProps = state => {
  return {
    common: state.common,
    user: state.user,
    team: state.team,
    channels: state.channels,
    channel: state.channel,
    teams: state.teams,
    presences: state.presences,
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ChannelsComponent)

const Channels = styled.div`
  width: 300px;
  height: 100%;
  position: relative;
  z-index: 6;
  background: white;
  background: #f8f9fa;
  border-right: 0px solid #1f2d3d;
`

const ChannelsContainer = styled.div`
  flex: 1;
  overflow: scroll;
  width: 100%;
`

const Header = styled.div`
  background-color: transparent;
  width: 100%;
  padding 0px 25px 10px 25px;
  transition: background-color 0.5s;
`

const HeaderTitles = styled.div`
  flex: 1;
  padding-left: 10px;
`

const HeaderTeam = styled.span`
  font-size: 8px;
  font-weight: 800;
  color: #adb5bd;
  padding: 5px;
  border-radius: 3px;
  text-transform: uppercase;
  border-top-right-radius: 0px;
  border-bottom-right-radius: 0px;
`

const HeaderRole = styled.span`
  font-size: 8px;
  font-weight: 800;
  color: #adb5bd;
  padding: 5px;
  border-radius: 3px;
  border-top-left-radius: 0px;
  border-bottom-left-radius: 0px;
  text-transform: uppercase;
`

const HeaderTitle = styled.div`
  font-size: 15px;
  font-weight: 500;
  font-style: normal;
  color: #18181d;
  transition: opacity 0.5s;
  display: inline-block;
  margin-top: 0px;
  margin-bottom: 0px;
  height: 20px;
`

const HeaderSubtitle = styled.div`
  font-size: 14px;
  font-weight: 400;
  color: #858e96;
  overflow: hidden;
`

const Heading = styled.div`
  padding: 20px 25px 20px 25px;
  font-size: 13px;
  font-weight: 600;
  color: #858e96;
  /*letter-spacing: 1px;
  text-transform: uppercase;*/
  flex: 1;
`

const Collapsable = styled.div`
  width: 100%;
  max-height: 0;
  transition: max-height 0.15s ease-out;
  overflow: hidden;

  &.open {
    max-height: 500px;
    overflow: visible;
    transition: max-height 0.25s ease-in;
  }
`
