import React, { useState } from 'react'
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
import PropTypes from 'prop-types'
import { createChannel, hydrateChannels, hydrateTeam, updateChannelUserStatus, updateUserStatus, updateUserMuted, updateUserArchived } from '../actions'
import TeamModal from '../modals/team.modal'
import { Toggle, Popup, Menu, Avatar, Tooltip } from '@tryyack/elements'
import QuickInputComponent from '../components/quick-input.component'
import AuthService from '../services/auth.service'
import { version } from '../../../package.json'
import { logger } from '../helpers/util'

const Channel = props => {
  const [over, setOver] = useState(false)
  const [menu, setMenu] = useState(false)

  return (
    <ChannelContainer
      onClick={props.onClick ? props.onClick : null}
      onMouseEnter={() => setOver(true)}
      onMouseLeave={() => {
        setOver(false)
        setMenu(false)
      }}
      unread={props.unread}
      active={props.active}
    >
      <ChannelContainerPadding>
        <Avatar dark presence={props.presence} size="medium" image={props.image} title={props.title} />

        <ChannelContents>
          <ChannelInnerContents>
            <ChannelTitle active={props.active || props.unread != 0}>{props.title}</ChannelTitle>

            {props.muted && <IconComponent icon="bell-off" color="#626d7a" size={15} thickness={1.5} style={{ marginRight: 5 }} />}

            {!props.public && !props.private && <IconComponent icon="eye-off" color="#626d7a" size={15} thickness={1.5} />}

            <div className="flexer" />
          </ChannelInnerContents>

          {props.excerpt && (
            <ChannelExcerpt>
              <ChannelExcerptText active={props.active || props.unread != 0}>{props.excerpt}</ChannelExcerptText>
            </ChannelExcerpt>
          )}
        </ChannelContents>
      </ChannelContainerPadding>

      {over && props.onMutedClick && props.onArchivedClick && (
        <Popup
          handleDismiss={() => setMenu(false)}
          visible={menu}
          width={200}
          direction="right-bottom"
          content={
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
          }
        >
          <ChannelMoreIcon
            onClick={e => {
              e.stopPropagation()
              setMenu(true)
            }}
          >
            <IconComponent icon="more-h" color="#626d7a" size={15} thickness={1.5} />
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
  title: PropTypes.string,
  image: PropTypes.string,
  icon: PropTypes.string,
  label: PropTypes.string,
  excerpt: PropTypes.string,
  public: PropTypes.bool,
  private: PropTypes.bool,
  presence: PropTypes.string,
  onClick: PropTypes.any,
  onMutedClick: PropTypes.any,
  onArchivedClick: PropTypes.any,
}

const ChannelContainer = styled.div`
  background: ${props => (props.active ? '#202027' : 'transparent')};
  display: flex;
  flex-direction: row;
  align-items: center;
  align-content: center;
  justify-content: center;
  position: relative;
  cursor: pointer;
  margin-bottom: 5px;
  padding-right: 25px;
`

const ChannelContainerPadding = styled.div`
  flex: 1;
  padding: 3px 0px 3px 25px;
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
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
  font-size: 11px;
  color: white;
  font-weight: 600;
  margin-left: 5px;
`

const ChannelTitle = styled.div`
  cursor: pointer;
  font-size: 15px;
  font-weight: 500;
  color: ${props => (props.active ? 'white' : '#626d7a')};
  white-space: wrap;
  max-width: 140px;
  /*letter-spacing: -0.5px;*/
  margin-right: 5px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
`

const ChannelExcerpt = styled.div`
  flex: 1;
  margin-top: 1px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
  overflow: hidden;
`

const ChannelExcerptText = styled.span`
  font-size: 13px;
  color: #626d7a;
  font-weight: 400;
  white-space: nowrap;
  text-overflow: ellipsis;
  display: block;
  overflow: hidden;
  max-width: 200px;
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
      channelPopup: false,
      accountModal: false,
      accountMenu: false,
      statusMenu: false,
      archivedVisible: false,
      starred: [],
      muted: [],
      archived: [],
      public: [],
      private: [],
      loading: false,
      error: false,
    }

    this.filterRef = React.createRef()

    this.createChannel = this.createChannel.bind(this)
    this.createPrivateChannel = this.createPrivateChannel.bind(this)
    this.createPublicChannel = this.createPublicChannel.bind(this)
    this.handleKeyPress = this.handleKeyPress.bind(this)
    this.fetchResults = this.fetchResults.bind(this)
    this.onSearch = this.onSearch.bind(this)
    this.updateUserMuted = this.updateUserMuted.bind(this)
    this.updateUserArchived = this.updateUserArchived.bind(this)
    this.updateUserStatus = this.updateUserStatus.bind(this)

    this.onSearch$ = new Subject()
    this.subscription = null

    this.renderAccountModal = this.renderAccountModal.bind(this)
    this.renderTeamModal = this.renderTeamModal.bind(this)

    this.renderHeader = this.renderHeader.bind(this)
    this.renderSearch = this.renderSearch.bind(this)
    this.renderSearchResults = this.renderSearchResults.bind(this)
    this.renderStarred = this.renderStarred.bind(this)
    this.renderPublic = this.renderPublic.bind(this)
    this.renderPrivate = this.renderPrivate.bind(this)
    this.renderArchived = this.renderArchived.bind(this)
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
      .filter(channel => channel.title.toLowerCase().match(new RegExp(state.filter.toLowerCase() + '.*')))
    const mutedChannels = props.channels
      .filter((channel, index) => props.user.muted.indexOf(channel.id) != -1)
      .filter(channel => channel.title.toLowerCase().match(new RegExp(state.filter.toLowerCase() + '.*')))
    const archivedChannels = props.channels
      .filter((channel, index) => props.user.archived.indexOf(channel.id) != -1)
      .filter(channel => channel.title.toLowerCase().match(new RegExp(state.filter.toLowerCase() + '.*')))
    const publicChannels = props.channels
      .filter((channel, index) => !channel.private && props.user.starred.indexOf(channel.id) == -1 && props.user.archived.indexOf(channel.id) == -1)
      .filter(channel => channel.title.toLowerCase().match(new RegExp(state.filter.toLowerCase() + '.*')))
    const privateChannels = props.channels
      .filter((channel, index) => channel.private && props.user.starred.indexOf(channel.id) == -1 && props.user.archived.indexOf(channel.id) == -1)
      .filter(channel => {
        const title = channel.members.reduce((title, member) => (member.user.id != props.user.id ? title + member.user.name : title), '')

        return title.toLowerCase().match(new RegExp(state.filter.toLowerCase() + '.*'))
      })

    return {
      starred: starredChannels,
      muted: mutedChannels,
      archived: archivedChannels,
      private: privateChannels,
      public: publicChannels,
    }
  }

  createPrivateChannel(user) {
    const title = null
    const description = null
    const image = null
    const teamId = this.props.team.id
    const otherUserId = user.id
    const userId = this.props.user.id

    this.createChannel(title, description, image, teamId, userId, otherUserId)
    this.setState({ filter: '', showFilter: false })
  }

  createPublicChannel(title) {
    const description = null
    const image = null
    const teamId = this.props.team.id
    const otherUserId = null
    const userId = this.props.user.id

    this.createChannel(title, description, image, teamId, userId, otherUserId)
    this.setState({ filter: '', showFilter: false })
  }

  async createChannel(title, description, image, teamId, userId, otherUserId) {
    try {
      // 1. Find channels where there rae only 2 members
      // 2. Remove the argument-user from the members array, should only be 1 left afterwards (us)
      const channel = otherUserId
        ? this.props.channels
            .filter(channel => channel.members.length == 2 && channel.private)
            .filter(channel => channel.members.filter(member => member.user.id == otherUserId).length == 1)
            .flatten()
        : null

      // 3. If it's found - then go there
      if (channel) return this.props.history.push(`/app/team/${teamId}/channel/${channel.id}`)

      // Create the default member array
      // If user isn't null - then it's a private channel
      const members = otherUserId ? [{ user: otherUserId }, { user: userId }] : [{ user: userId }]

      // Otherwise create the new channel
      // 1) Create the channel object based on an open channel or private
      // 2) Default public channel is always members only
      const { data } = await GraphqlService.getInstance().createChannel({
        title,
        description,
        image,
        members,
        team: teamId,
        user: userId,
        messages: [],
        public: false,
        private: otherUserId ? true : false,
      })

      const channelData = data.createChannel
      const channelId = channelData.id

      this.props.createChannel(channelData)

      // Join this channel ourselves
      MessagingService.getInstance().join(channelId)

      // If it's a private conversation - then incite the other optersons
      if (otherUserId) MessagingService.getInstance().joinChannel([otherUserId], channelId)

      // Navigate there
      browserHistory.push(`/app/team/${teamId}/channel/${channelId}`)
    } catch (e) {}
  }

  componentDidMount() {
    this.filterRef.addEventListener('keyup', this.handleKeyPress)

    // Here we handle the delay for the yser typing in the search field
    this.subscription = this.onSearch$.pipe(debounceTime(250)).subscribe(debounced => this.fetchResults())

    // Get the team ID (if any)
    const { teamId } = this.props.match.params
    const userId = this.props.user.id

    // Fetch the team & channels
    this.fetchData(teamId, userId)
  }

  async fetchData(teamId, userId) {
    this.setState({ loading: true, error: null })

    try {
      // await GraphqlService.getInstance().channels(teamId, userId)
      // Not sure why I was using the above to seperate the calls
      const team = await GraphqlService.getInstance().team(teamId, userId)
      const channels = team.data.team.channels
      const channelIds = channels.map(channel => channel.id)

      // Kill the loading
      this.setState({ loading: false, error: null })

      // Join the channels
      MessagingService.getInstance().joins(channelIds)

      // Populate our stores
      this.props.hydrateChannels(channels)
      this.props.hydrateTeam(team.data.team)
    } catch (e) {
      this.setState({ loading: false, error: e })
    }
  }

  componentDidUpdate(prevProps) {
    const { teamId } = this.props.match.params
    const userId = this.props.user.id

    if (teamId != prevProps.match.params.teamId) this.fetchData(teamId, userId)
  }

  componentWillUnmount() {
    this.filterRef.removeEventListener('keyup', this.handleKeyPress)

    if (this.subscription) this.subscription.unsubscribe()
  }

  handleKeyPress(e) {
    if (e.keyCode == 27) this.setState({ filter: '', showFilter: false })
  }

  async fetchResults() {
    if (this.state.filter == '') return

    try {
      const { data } = await GraphqlService.getInstance().search(this.props.team.id, this.state.filter)
      const results = []

      // Create a results object for the users
      data.search.map(user => {
        results.push({
          id: user.id,
          name: user.name,
          username: user.username,
          image: user.image,
          role: user.role,
        })
      })

      // Update our UI with our results
      // Remove ourselves
      this.setState({ results: results.filter(result => result.id != this.props.user.id) })
    } catch (e) {}
  }

  onSearch(e) {
    const search = e.target.value
    this.setState({ filter: search })
    this.onSearch$.next(search)
    if (search == '') this.setState({ results: [] })
  }

  // Child render functions that compose the
  // parts of the channels sidebar
  renderHeader() {
    return (
      <Header className="row">
        <Avatar dark size="medium" image={this.props.user.image} title={this.props.user.name} className="mr-10" />

        <HeaderTitles className="column">
          {/*<HeaderTeam>{this.props.team.name}</HeaderTeam>*/}
          <HeaderTitle className="align-items-center">
            {this.props.user.name} − {this.props.team.name}
          </HeaderTitle>
          <QuickInputComponent
            visible={this.state.statusMenu}
            width={300}
            direction="left-bottom"
            handleDismiss={() => this.setState({ statusMenu: false })}
            handleAccept={status => this.setState({ statusMenu: false }, () => this.updateUserStatus(this.props.user.id, this.props.team.id, status))}
            placeholder={this.props.user.status}
          >
            <HeaderSubtitle className="button" onClick={() => this.setState({ statusMenu: true })}>
              {this.props.user.status || 'Update your status'}
            </HeaderSubtitle>
          </QuickInputComponent>
        </HeaderTitles>

        <Popup
          handleDismiss={this._closeUserMenu.bind(this)}
          visible={this.state.accountMenu}
          width={275}
          direction="left-bottom"
          content={
            <React.Fragment>
              <AccountMenuHeader className="column align-items-center">
                <Avatar size="medium" image={this.props.user.image} title={this.props.user.name} />

                <AccountMenuTitle>{this.props.user.name}</AccountMenuTitle>

                <AccountMenuSubtitle>{this.props.team.name}</AccountMenuSubtitle>
              </AccountMenuHeader>

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
                    icon: <IconComponent icon="list" size={20} color="#acb5bd" />,
                    text: 'Team directory',
                    onClick: this._openTeamDirectory.bind(this),
                  },
                  {
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

              <AccountMenuBuild>Build {version}</AccountMenuBuild>
            </React.Fragment>
          }
        >
          <IconComponent icon="chevron-down" size={20} thickness={2} color="#626d7a" className="button" onClick={this._openUserMenu.bind(this)} />
        </Popup>
      </Header>
    )
  }

  renderSearch() {
    return (
      <SearchContainer className="row">
        <SearchInner className="row">
          <IconComponent icon="search" size={15} color="#626d7a" thickness={2} className="ml-10" />

          <SearchInput ref={ref => (this.filterRef = ref)} visible={this.state.showFilter} value={this.state.filter} onChange={this.onSearch} placeholder="Start Conversation" />
        </SearchInner>
      </SearchContainer>
    )
  }

  renderSearchResults() {
    if (this.state.results.length == 0) return null

    return (
      <React.Fragment>
        <Heading>Results</Heading>

        {this.state.results.map((user, index) => {
          return (
            <Channel
              key={index}
              active={false}
              unread={null}
              title={user.name}
              image={user.image}
              excerpt={user.username}
              public={null}
              private={null}
              onClick={() => this.createPrivateChannel(user)}
            />
          )
        })}

        {this.state.results.length == 0 && (
          <Channel
            active={false}
            unread={null}
            title={`Create '${this.state.filter}'`}
            image={null}
            excerpt={null}
            public={null}
            private={null}
            onClick={() => this.createPublicChannel(this.state.filter)}
          />
        )}
      </React.Fragment>
    )
  }

  renderStarred() {
    if (this.state.starred.length == 0) return null

    const { pathname } = this.props.history.location

    return (
      <React.Fragment>
        <Heading>Favourites</Heading>

        {this.state.starred.map((channel, index) => {
          const title = channel.private ? channel.members.reduce((title, member) => (member.user.id != this.props.user.id ? title + member.user.name : title), '') : channel.title
          const image = channel.private ? channel.members.reduce((image, member) => (member.user.id != this.props.user.id ? image + member.user.image : image), '') : channel.image
          const unread = this.props.common.unread.filter(row => channel.id == row.doc.channel).flatten()
          const unreadCount = unread ? unread.doc.count : 0
          const to = `/app/team/${channel.team.id}/channel/${channel.id}`
          const muted = this.props.user.muted.indexOf(channel.id) != -1
          const archived = this.props.user.archived.indexOf(channel.id) != -1

          return (
            <Channel
              key={index}
              active={pathname.indexOf(channel.id) != -1}
              unread={muted ? 0 : unreadCount}
              title={title}
              image={image}
              excerpt={channel.excerpt}
              public={channel.public}
              private={channel.private}
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
              visible={this.state.channelPopup}
              width={250}
              direction="right-bottom"
              handleDismiss={() => this.setState({ channelPopup: false })}
              handleAccept={name => this.setState({ channelPopup: false }, () => this.createPublicChannel(name))}
              placeholder="New channel name"
            >
              <IconComponent icon="plus-circle" size={15} color="#626d7a" thickness={2} className="button" onClick={() => this.setState({ channelPopup: true })} />
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
              active={pathname.indexOf(channel.id) != -1}
              unread={muted ? 0 : unreadCount}
              title={channel.title}
              image={channel.image}
              excerpt={channel.excerpt}
              public={channel.public}
              private={channel.private}
              muted={muted}
              archived={archived}
              onClick={() => this.props.history.push(`/app/team/${channel.team.id}/channel/${channel.id}`)}
              onArchivedClick={() => this.updateUserArchived(this.props.user.id, channel.id, !archived)}
              onMutedClick={() => this.updateUserMuted(this.props.user.id, channel.id, !muted)}
            />
          )
        })}
      </React.Fragment>
    )
  }

  renderPrivate() {
    if (this.state.private.length == 0) return null

    const { pathname } = this.props.history.location

    return (
      <React.Fragment>
        <Heading>Private Conversations</Heading>

        {this.state.private.map((channel, index) => {
          if (this.props.user.starred.indexOf(channel.id) != -1) return

          const title = channel.members.reduce((title, member) => (member.user.id != this.props.user.id ? title + member.user.name : title), '')
          const image = channel.members.reduce((image, member) => (member.user.id != this.props.user.id ? image + member.user.image : image), '')
          const unread = this.props.common.unread.filter(row => channel.id == row.doc.channel).flatten()
          const unreadCount = unread ? unread.doc.count : 0
          const muted = this.props.user.muted.indexOf(channel.id) != -1
          const archived = this.props.user.archived.indexOf(channel.id) != -1

          // Get the other users' presence
          const timeSnapshot = new Date().getTime()
          const otherMember = channel.members.filter(member => member.user.id != this.props.user.id).flatten()
          const otherMemberStatus = otherMember.user.status
          const otherMemberTimezone = otherMember.user.timezone
          const otherMemberPresence = this.props.presences.users.filter(user => user.userId == otherMember.user.id).flatten()
          const presence = otherMemberPresence ? (timeSnapshot - otherMemberPresence.userTime > 15000 ? 'away' : 'online') : null

          return (
            <Channel
              key={index}
              presence={presence}
              active={pathname.indexOf(channel.id) != -1}
              unread={muted ? 0 : unreadCount}
              title={title}
              image={image}
              excerpt={otherMemberStatus}
              public={channel.public}
              private={channel.private}
              muted={muted}
              archived={archived}
              onClick={() => this.props.history.push(`/app/team/${channel.team.id}/channel/${channel.id}`)}
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
              const title = channel.private ? channel.members.reduce((title, member) => (member.user.id != this.props.user.id ? title + member.user.name : title), '') : channel.title
              const image = channel.private ? channel.members.reduce((image, member) => (member.user.id != this.props.user.id ? image + member.user.image : image), '') : channel.image
              const unread = this.props.common.unread.filter(row => channel.id == row.doc.channel).flatten()
              const unreadCount = unread ? unread.doc.count : 0
              const to = `/app/team/${channel.team.id}/channel/${channel.id}`
              const muted = this.props.user.muted.indexOf(channel.id) != -1
              const archived = this.props.user.archived.indexOf(channel.id) != -1

              return (
                <Channel
                  key={index}
                  active={pathname.indexOf(channel.id) != -1}
                  unread={muted ? 0 : unreadCount}
                  title={title}
                  image={image}
                  excerpt={channel.excerpt}
                  public={channel.public}
                  private={channel.private}
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

    return <TeamModal id={this.props.team.id} start={this.state.teamModalStart} createChannel={this.createChannel} onClose={() => this.setState({ teamModal: false })} />
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
        {this.renderSearch()}

        <ChannelsContainer>
          {this.renderSearchResults()}
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
  updateUserStatus: status => updateUserStatus(status),
  updateChannelUserStatus: (userId, teamId, status) => updateChannelUserStatus(userId, teamId, status),
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
  width: 350px;
  height: 100%;
  position: relative;
  z-index: 2;
  background: white;
  background: #18181d;
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
  padding 25px;
  transition: background-color 0.5s;
`

const HeaderTitles = styled.div`
  flex: 1;
  padding-left: 10px;
`

const HeaderTeam = styled.div`
  font-size: 11px;
  font-weight: 500;
  color: #626d7a;
`

const HeaderTitle = styled.div`
  font-size: 15px;
  font-weight: 500;
  font-style: normal;
  color: white;
  transition: opacity 0.5s;
  display: inline-block;
  margin-top: 3px;
  margin-bottom: 0px;
  height: 20px;
`

const HeaderSubtitle = styled.div`
  font-size: 13px;
  font-weight: 500;
  color: #626d7a;
`

const AccountMenuHeader = styled.div`
  padding: 20px;
  width: 100%;
  flex: 1;
  border-bottom: 1px solid #f1f3f5;
`

const AccountMenuTitle = styled.div`
  font-size: 14px;
  font-weight: 400;
  font-style: normal;
  color: #343a40;
  transition: opacity 0.5s;
  display: inline-block;
  flex: 1;
  padding: 10px 5px 0px 5px;
`

const AccountMenuSubtitle = styled.div`
  font-size: 13px;
  font-weight: 500;
  color: #cfd4d9;
  padding: 5px 5px 5px 5px;
`

const AccountMenuBuild = styled.div`
  font-size: 11px;
  font-weight: 400;
  color: #cfd4d9;
  padding: 10px;
  border-top: 1px solid #f1f3f5;
`

const HeaderSubtitleLink = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: #007af5;
`

const SearchInput = styled.input`
  font-size: 14px;
  border: none;
  width: 100%;
  padding: 5px;
  color: white;
  font-weight: 500;
  background: transparent;

  &::placeholder {
    color: #626d7a;
  }
`

const SearchContainer = styled.div`
  width: 100%;
  background: #202027;
`

const SearchInner = styled.div`
  border-radius: 3px;
  flex: 1;
  margin: 10px;
  margin-top: 0px;
  margin-bottom: 0px;
  padding: 5px;
  padding-top: 10px;
  padding-bottom: 10px;
`

const Heading = styled.div`
  margin: 25px 25px 15px 25px;
  font-size: 10px;
  font-weight: 700;
  color: #626d7a;
  letter-spacing: 1px;
  text-transform: uppercase;
  flex: 1;
`
