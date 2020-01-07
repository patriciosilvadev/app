import React from 'react'
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
import { Toggle, Popup, Menu, Avatar, Channel, Tooltip } from '@weekday/elements'
import QuickInputComponent from '../components/quick-input.component'
import AuthService from '../services/auth.service'
import { version } from '../../../package.json'
import { logger } from '../helpers/util'

class ChannelsComponent extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      filter: '',
      results: [],
      teamModal: true,
      teamModalStart: 4,
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
    const starredChannels = props.channels.filter((channel, index) => props.user.starred.indexOf(channel.id) != -1)
    const mutedChannels = props.channels.filter((channel, index) => props.user.muted.indexOf(channel.id) != -1)
    const archivedChannels = props.channels.filter((channel, index) => props.user.archived.indexOf(channel.id) != -1)
    const privateChannels = props.channels.filter((channel, index) => channel.private && props.user.starred.indexOf(channel.id) == -1 && props.user.archived.indexOf(channel.id) == -1)
    const publicChannels = props.channels.filter((channel, index) => !channel.private && props.user.starred.indexOf(channel.id) == -1 && props.user.archived.indexOf(channel.id) == -1)

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
  }

  // Child render functions that compose the
  // parts of the channels sidebar
  renderHeader() {
    return (
      <Header className="row">
        <Avatar size="medium" image={this.props.user.image} title={this.props.user.name} className="mr-10" />

        <HeaderTitles className="column">
          <HeaderTeam>{this.props.team.name}</HeaderTeam>

          <HeaderTitle className="align-items-center">{this.props.user.name}</HeaderTitle>

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
          <IconComponent icon="chevron-down" size={20} thickness={2} color="#475669" className="button" onClick={this._openUserMenu.bind(this)} />
        </Popup>
      </Header>
    )
  }

  renderSearch() {
    return (
      <SearchContainer className="row">
        <SearchInner className="row">
          <IconComponent icon="search" size={15} color="#475669" thickness={2} className="ml-15" />

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
          if (this.state.filter != '' && !channel.title.toLowerCase().match(new RegExp(this.state.filter.toLowerCase() + '.*'))) return

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
              unread={unreadCount}
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
    if (this.state.public.length == 0) return null

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
              <IconComponent icon="plus-circle" size={15} color="#475669" thickness={2} className="button" onClick={() => this.setState({ channelPopup: true })} />
            </QuickInputComponent>
          )}
        </div>

        {this.state.public.map((channel, index) => {
          if (this.props.user.starred.indexOf(channel.id) != -1) return
          if (this.state.filter != '' && !channel.title.toLowerCase().match(new RegExp(this.state.filter.toLowerCase() + '.*'))) return

          const unread = this.props.common.unread.filter(row => channel.id == row.doc.channel).flatten()
          const unreadCount = unread ? unread.doc.count : 0
          const muted = this.props.user.muted.indexOf(channel.id) != -1
          const archived = this.props.user.archived.indexOf(channel.id) != -1

          return (
            <Channel
              key={index}
              active={pathname.indexOf(channel.id) != -1}
              unread={unreadCount}
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

          // Filter based on users search
          if (this.state.filter != '' && !title.toLowerCase().match(new RegExp(this.state.filter.toLowerCase() + '.*'))) return

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
              unread={unreadCount}
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
              if (this.state.filter != '' && !channel.title.toLowerCase().match(new RegExp(this.state.filter.toLowerCase() + '.*'))) return

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
                  unread={unreadCount}
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
  width: 300px;
  height: 100%;
  position: relative;
  z-index: 2;
  background: white;
  background: #1a1f36;
  background: #040b1c;
  border-right: 1px solid #f1f3f5;
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
  border-bottom: 1px solid #0a152e;
  transition: background-color 0.5s;
`

const HeaderTitles = styled.div`
  flex: 1;
  padding-left: 10px;
`

const HeaderTitle = styled.div`
  font-size: 14px;
  font-weight: 500;
  font-style: normal;
  color: white;
  transition: opacity 0.5s;
  display: inline-block;
  margin-top: 3px;
  margin-bottom: 3px;
  height: 20px;
`

const HeaderTeam = styled.div`
  font-size: 11px;
  font-weight: 600;
  color: #475669;
`

const HeaderSubtitle = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: #475669;
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
    color: #324057;
  }
`

const SearchInner = styled.div`
  border-radius: 3px;
  flex: 1;
  margin: 10px;
`

const SearchContainer = styled.div`
  width: 100%;
  border-bottom: 1px solid #0a152e;
`

const Heading = styled.div`
  margin: 20px 25px 20px 25px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.8px;
  text-transform: uppercase;
  color: #475669;
  flex: 1;
`
