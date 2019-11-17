import React from 'react'
import { connect } from 'react-redux'
import GraphqlService from '../services/graphql.service'
import MessagingService from '../services/messaging.service'
import '../helpers/extensions'
import styled from 'styled-components'
import { BrowserRouter as Router, Link } from 'react-router-dom'
import RoomModal from '../modals/room.modal'
import AccountModal from '../modals/account.modal'
import { Subject } from 'rxjs'
import { debounceTime } from 'rxjs/operators'
import { IconComponent } from './icon.component'
import PropTypes from 'prop-types'
import { createRoom, hydrateRooms, hydrateTeam, updateRoomUserStatus, updateUserStatus, updateUserMuted, updateUserArchived } from '../actions'
import TeamModal from '../modals/team.modal'
import { Toggle, Popup, Menu, Avatar, Room, Tooltip } from '@weekday/elements'
import QuickInputComponent from '../components/quick-input.component'
import AuthService from '../services/auth.service'
import { version } from '../../../package.json'
import { logger } from '../helpers/util'

class RoomsComponent extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      filter: '',
      results: [],
      teamModal: false,
      roomPopup: false,
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

    this.createPrivateRoom = this.createPrivateRoom.bind(this)
    this.createPublicRoom = this.createPublicRoom.bind(this)
    this.handleKeyPress = this.handleKeyPress.bind(this)
    this.fetchResults = this.fetchResults.bind(this)
    this.onSearch = this.onSearch.bind(this)
    this.updateUserMuted = this.updateUserMuted.bind(this)
    this.updateUserArchived = this.updateUserArchived.bind(this)
    this.updateUserStatus = this.updateUserStatus.bind(this)

    this.onSearch$ = new Subject()
    this.subscription = null
  }

  async updateUserStatus(userId, teamId, status) {
    try {
      await GraphqlService.getInstance().updateUser(userId, { status })

      this.props.updateUserStatus(status)
      this.props.updateRoomUserStatus(userId, teamId, status)
    } catch (e) {
      logger(e)
    }
  }

  async updateUserArchived(userId, roomId, archived) {
    try {
      await GraphqlService.getInstance().updateUserArchived(userId, roomId, archived)

      this.props.updateUserArchived(userId, roomId, archived)
    } catch (e) {
      logger(e)
    }
  }

  async updateUserMuted(userId, roomId, muted) {
    try {
      await GraphqlService.getInstance().updateUserMuted(userId, roomId, muted)

      this.props.updateUserMuted(userId, roomId, muted)
    } catch (e) {
      logger(e)
    }
  }

  static getDerivedStateFromProps(props, state) {
    const starredRooms = props.rooms.filter((room, index) => props.user.starred.indexOf(room.id) != -1)
    const mutedRooms = props.rooms.filter((room, index) => props.user.muted.indexOf(room.id) != -1)
    const archivedRooms = props.rooms.filter((room, index) => props.user.archived.indexOf(room.id) != -1)
    const privateRooms = props.rooms.filter((room, index) => room.private && props.user.starred.indexOf(room.id) == -1 && props.user.archived.indexOf(room.id) == -1)
    const publicRooms = props.rooms.filter((room, index) => !room.private && props.user.starred.indexOf(room.id) == -1 && props.user.archived.indexOf(room.id) == -1)

    return {
      starred: starredRooms,
      muted: mutedRooms,
      archived: archivedRooms,
      private: privateRooms,
      public: publicRooms,
    }
  }

  createPrivateRoom(user) {
    const title = null
    const description = null
    const image = null
    const teamId = this.props.team.id
    const initialOtherUserId = user.id
    const userId = this.props.user.id

    this.createRoom(title, description, image, teamId, userId, initialOtherUserId)
    this.setState({ filter: '', showFilter: false })
  }

  createPublicRoom(title) {
    const description = null
    const image = null
    const teamId = this.props.team.id
    const initialOtherUserId = null
    const userId = this.props.user.id

    this.createRoom(title, description, image, teamId, userId, initialOtherUserId)
    this.setState({ filter: '', showFilter: false })
  }

  async createRoom(title, description, image, teamId, userId, initialOtherUserId) {
    try {
      // 1. Find rooms where there rae only 2 members
      // 2. Remove the argument-user from the members array, should only be 1 left afterwards (us)
      const room = initialOtherUserId
        ? this.props.rooms
            .filter(room => room.members.length == 2 && room.private)
            .filter(room => room.members.filter(member => member.user.id == initialOtherUserId).length == 1)
            .flatten()
        : null

      // 3. If it's found - then go there
      if (room) return this.props.history.push(`/app/team/${teamId}/room/${room.id}`)

      // Create the default member array
      // If user isn't null - then it's a private room
      const members = initialOtherUserId ? [{ user: initialOtherUserId }, { user: userId }] : [{ user: userId }]

      // Otherwise create the new room
      // 1) Create the room object based on an open room or private
      // 2) Default public room is always members only
      const { data } = await GraphqlService.getInstance().createRoom({
        title,
        description,
        image,
        members,
        team: teamId,
        user: userId,
        messages: [],
        public: false,
        private: initialOtherUserId ? true : false,
      })

      const roomData = data.createRoom
      const roomId = roomData.id

      this.props.createRoom(roomData)

      // Join this room ourselves
      MessagingService.getInstance().join(roomId)

      // If it's a private conversation - then incite the other optersons
      if (initialOtherUserId) MessagingService.getInstance().joinRoom([initialOtherUserId], roomId)

      // Navigate there
      browserHistory.push(`/app/team/${teamId}/room/${roomId}`)
    } catch (e) {}
  }

  componentDidMount() {
    this.filterRef.addEventListener('keyup', this.handleKeyPress)

    // Here we handle the delay for the yser typing in the search field
    this.subscription = this.onSearch$.pipe(debounceTime(250)).subscribe(debounced => this.fetchResults())

    // Get the team ID (if any)
    const { teamId } = this.props.match.params
    const userId = this.props.user.id

    // Fetch the team & rooms
    this.fetchData(teamId, userId)
  }

  async fetchData(teamId, userId) {
    this.setState({ loading: true, error: null })

    try {
      const team = await GraphqlService.getInstance().team(teamId)
      const rooms = await GraphqlService.getInstance().rooms(teamId, userId)
      const roomIds = rooms.data.rooms.map(room => room.id)

      this.setState({ loading: false, error: null })

      // Join the rooms
      MessagingService.getInstance().joins(roomIds)

      // Populate our stores
      this.props.hydrateRooms(rooms.data.rooms)
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

  _openAccountSettings() {
    this.setState({ accountMenu: false, accountModal: true })
  }

  _openTeamSettings() {
    this.setState({ accountMenu: false, teamModal: true })
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

  // prettier-ignore
  render() {
    const { pathname } = this.props.history.location

    return (
      <Rooms className="column">
        {this.state.teamModal &&
          <TeamModal
            id={this.props.team.id}
            onClose={() => this.setState({ teamModal: false })}
          />
        }

        {this.state.accountModal &&
          <AccountModal
            id={this.props.user.id}
            onClose={() => this.setState({ accountModal: false })}
          />
        }

        <Header className="row">
          <Avatar
            size="medium"
            image={this.props.user.image}
            title={this.props.user.name}
            className="mr-10"
          />

          <div className="column flexer pl-10">
            <HeaderTeam>
              {this.props.team.name}
            </HeaderTeam>

            <HeaderTitle>
              {this.props.user.name}
            </HeaderTitle>

            <QuickInputComponent
              visible={this.state.statusMenu}
              width={300}
              direction="left-bottom"
              handleDismiss={() => this.setState({ statusMenu: false })}
              handleAccept={(status) => this.setState({ statusMenu: false }, () => this.updateUserStatus(this.props.user.id, this.props.team.id, status))}
              placeholder={this.props.user.status}>

              <HeaderSubtitle
                className="button"
                onClick={() => this.setState({ statusMenu: true })}>
                {this.props.user.status || "Update your status"}
              </HeaderSubtitle>
            </QuickInputComponent>
          </div>

          <Popup
            handleDismiss={this._closeUserMenu.bind(this)}
            visible={this.state.accountMenu}
            width={275}
            direction="left-bottom"
            content={
              <React.Fragment>
                <AccountMenuHeader className="column align-items-center">
                  <Avatar
                    size="medium"
                    image={this.props.user.image}
                    title={this.props.user.name}
                  />

                  <AccountMenuTitle>
                    {this.props.user.name}
                  </AccountMenuTitle>

                  <AccountMenuSubtitle>
                    {this.props.team.name}
                  </AccountMenuSubtitle>
                </AccountMenuHeader>

                <Menu
                  items={[
                    {
                      icon: <IconComponent icon="profile" size={20} color="#acb5bd" />,
                      text: "Account settings",
                      onClick: this._openAccountSettings.bind(this)
                    },
                    {
                      icon: <IconComponent icon="settings" size={20} color="#acb5bd" />,
                      text: "Team settings",
                      onClick: this._openTeamSettings.bind(this),
                    },
                    {
                      icon: <IconComponent icon="logout" size={20} color="#acb5bd" />,
                      text: "Signout",
                      onClick: this._signout.bind(this),
                    },
                  ]}
                />

                <AccountMenuBuild>
                  Build {version}
                </AccountMenuBuild>
              </React.Fragment>
            }>
            <IconComponent
              icon="chevron-down"
              size={20}
              thickness={2}
              color="#475669"
              className="button"
              onClick={this._openUserMenu.bind(this)}
            />
          </Popup>
        </Header>

        <SearchContainer className="row">
          <SearchInner className="row">
            <IconComponent
              icon="search"
              size={15}
              color="#475669"
              thickness={2}
              className="ml-15"
            />

            <SearchInput
              ref={(ref) => this.filterRef = ref}
              visible={this.state.showFilter}
              value={this.state.filter}
              onChange={this.onSearch}
              placeholder="Start Conversation"
            />
          </SearchInner>
        </SearchContainer>

        <RoomsContainer>
          {this.state.filter != "" &&
            <React.Fragment>
              <Heading>Results</Heading>

              {this.state.results.map((user, index) => {
                return (
                  <Room
                    key={index}
                    active={false}
                    unread={null}
                    title={user.name}
                    image={user.image}
                    excerpt={user.username}
                    public={null}
                    private={null}
                    onClick={() => this.createPrivateRoom(user)}
                  />
                )
              })}

              {this.state.results.length == 0 &&
                <Room
                  active={false}
                  unread={null}
                  title={`Create '${this.state.filter}'`}
                  image={null}
                  excerpt={null}
                  public={null}
                  private={null}
                  onClick={() => this.createPublicRoom(this.state.filter)}
                />
              }
            </React.Fragment>
          }

          {this.state.starred.length != 0 &&
            <React.Fragment>
              <Heading>Favourites</Heading>

              {this.state.starred.map((room, index) => {
                if (this.state.filter != "" && !room.title.toLowerCase().match(new RegExp(this.state.filter.toLowerCase() + ".*"))) return

                const title = room.private ? room.members.reduce((title, member) => member.user.id != this.props.user.id ? title + member.user.name : title, "") : room.title
                const image = room.private ? room.members.reduce((image, member) => member.user.id != this.props.user.id ? image + member.user.image : image, "") : room.image
                const unread = this.props.common.unread.filter((row) => room.id == row.doc.room).flatten()
                const unreadCount = unread ? unread.doc.count : 0
                const to = `/app/team/${room.team.id}/room/${room.id}`
                const muted = this.props.user.muted.indexOf(room.id) != -1
                const archived = this.props.user.archived.indexOf(room.id) != -1

                return (
                  <Room
                    key={index}
                    active={pathname.indexOf(room.id) != -1}
                    unread={unreadCount}
                    title={title}
                    image={image}
                    excerpt={room.excerpt}
                    public={room.public}
                    private={room.private}
                    muted={muted}
                    archived={archived}
                    onClick={() => this.props.history.push(to)}
                    onArchivedClick={() => this.updateUserArchived(this.props.user.id, room.id, !archived)}
                    onMutedClick={() => this.updateUserMuted(this.props.user.id, room.id, !muted)}
                  />
                )
              })}
            </React.Fragment>
          }

          <div className="row pr-25">
            <Heading>
              Channels
            </Heading>

            <QuickInputComponent
              visible={this.state.roomPopup}
              width={250}
              direction="right-bottom"
              handleDismiss={() => this.setState({ roomPopup: false })}
              handleAccept={(name) => this.setState({ roomPopup: false }, () => this.createPublicRoom(name))}
              placeholder="New channel name">
              <IconComponent
                icon="plus-circle"
                size={15}
                color="#475669"
                thickness={2}
                className="button"
                onClick={() => this.setState({ roomPopup: true })}
              />
            </QuickInputComponent>
          </div>

          {this.state.public.map((room, index) => {
            if (this.props.user.starred.indexOf(room.id) != -1) return
            if (this.state.filter != "" && !room.title.toLowerCase().match(new RegExp(this.state.filter.toLowerCase() + ".*"))) return

            const unread = this.props.common.unread.filter((row) => room.id == row.doc.room).flatten()
            const unreadCount = unread ? unread.doc.count : 0
            const muted = this.props.user.muted.indexOf(room.id) != -1
            const archived = this.props.user.archived.indexOf(room.id) != -1

            return (
              <Room
                key={index}
                active={pathname.indexOf(room.id) != -1}
                unread={unreadCount}
                title={room.title}
                image={room.image}
                excerpt={room.excerpt}
                public={room.public}
                private={room.private}
                muted={muted}
                archived={archived}
                onClick={() => this.props.history.push(`/app/team/${room.team.id}/room/${room.id}`)}
                onArchivedClick={() => this.updateUserArchived(this.props.user.id, room.id, !archived)}
                onMutedClick={() => this.updateUserMuted(this.props.user.id, room.id, !muted)}
              />
            )
          })}

          {this.state.private.length != 0 &&
            <React.Fragment>
              <Heading>Private Conversations</Heading>

              {this.state.private.map((room, index) => {
                if (this.props.user.starred.indexOf(room.id) != -1) return

                const title = room.members.reduce((title, member) => member.user.id != this.props.user.id ? title + member.user.name : title, "")
                const image = room.members.reduce((image, member) => member.user.id != this.props.user.id ? image + member.user.image : image, "")
                const unread = this.props.common.unread.filter((row) => room.id == row.doc.room).flatten()
                const unreadCount = unread ? unread.doc.count : 0
                const muted = this.props.user.muted.indexOf(room.id) != -1
                const archived = this.props.user.archived.indexOf(room.id) != -1

                // Filter based on users search
                if (this.state.filter != "" && !title.toLowerCase().match(new RegExp(this.state.filter.toLowerCase() + ".*"))) return

                // Get the other users' presence
                const snapshot = new Date().getTime()
                const otherMember = room.members.filter(member => member.user.id != this.props.user.id).flatten()
                const otherMemberStatus = otherMember.user.status
                const otherMemberTimezone = otherMember.user.timezone
                const otherMemberPresence = this.props.presences.users.filter(user => user.userId == otherMember.user.id).flatten()
                const presence = otherMemberPresence
                                  ? ((snapshot - otherMemberPresence.userTime) > 15000)
                                    ? "away"
                                    : "online"
                                  : null

                return (
                  <Room
                    key={index}
                    presence={presence}
                    active={pathname.indexOf(room.id) != -1}
                    unread={unreadCount}
                    title={title}
                    image={image}
                    excerpt={otherMemberStatus}
                    public={room.public}
                    private={room.private}
                    muted={muted}
                    archived={archived}
                    onClick={() => this.props.history.push(`/app/team/${room.team.id}/room/${room.id}`)}
                    onArchivedClick={() => this.updateUserArchived(this.props.user.id, room.id, !archived)}
                    onMutedClick={() => this.updateUserMuted(this.props.user.id, room.id, !muted)}
                  />
                )
              })}
            </React.Fragment>
          }

          {this.state.archived.length != 0 &&
            <Heading className="button" onClick={() => this.setState({ archivedVisible: !this.state.archivedVisible })}>
              {this.state.archivedVisible ? "Hide archived" : "See archived"}
            </Heading>
          }

          {this.state.archived.length != 0 && this.state.archivedVisible &&
            <React.Fragment>
              {this.state.archived.map((room, index) => {
                if (this.state.filter != "" && !room.title.toLowerCase().match(new RegExp(this.state.filter.toLowerCase() + ".*"))) return

                const title = room.private ? room.members.reduce((title, member) => member.user.id != this.props.user.id ? title + member.user.name : title, "") : room.title
                const image = room.private ? room.members.reduce((image, member) => member.user.id != this.props.user.id ? image + member.user.image : image, "") : room.image
                const unread = this.props.common.unread.filter((row) => room.id == row.doc.room).flatten()
                const unreadCount = unread ? unread.doc.count : 0
                const to = `/app/team/${room.team.id}/room/${room.id}`
                const muted = this.props.user.muted.indexOf(room.id) != -1
                const archived = this.props.user.archived.indexOf(room.id) != -1

                return (
                  <Room
                    key={index}
                    active={pathname.indexOf(room.id) != -1}
                    unread={unreadCount}
                    title={title}
                    image={image}
                    excerpt={room.excerpt}
                    public={room.public}
                    private={room.private}
                    muted={muted}
                    archived={archived}
                    onClick={() => this.props.history.push(to)}
                    onArchivedClick={(e) => this.updateUserArchived(this.props.user.id, room.id, !archived)}
                    onMutedClick={() => this.updateUserMuted(this.props.user.id, room.id, !muted)}
                  />
                )
              })}
            </React.Fragment>
          }
        </RoomsContainer>
      </Rooms>
    )
  }
}

RoomsComponent.propTypes = {
  starred: PropTypes.bool,
  team: PropTypes.any,
  room: PropTypes.any,
  rooms: PropTypes.array,
  common: PropTypes.any,
  user: PropTypes.any,
  presences: PropTypes.any,
  teams: PropTypes.array,
  createRoom: PropTypes.func,
  hydrateRooms: PropTypes.func,
  hydrateTeam: PropTypes.func,
  updateUserStatus: PropTypes.func,
  updateUserMuted: PropTypes.func,
  updateUserArchived: PropTypes.func,
}

const mapDispatchToProps = {
  updateUserStatus: (status) => updateUserStatus(status),
  updateRoomUserStatus: (userId, teamId, status) => updateRoomUserStatus(userId, teamId, status),
  updateUserMuted: (userId, roomId, muted) => updateUserMuted(userId, roomId, muted),
  updateUserArchived: (userId, roomId, archived) => updateUserArchived(userId, roomId, archived),
  createRoom: room => createRoom(room),
  hydrateRooms: rooms => hydrateRooms(rooms),
  hydrateTeam: team => hydrateTeam(team),
}

const mapStateToProps = state => {
  return {
    common: state.common,
    user: state.user,
    team: state.team,
    rooms: state.rooms,
    room: state.room,
    teams: state.teams,
    presences: state.presences,
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(RoomsComponent)

const Rooms = styled.div`
  width: 300px;
  height: 100%;
  position: relative;
  z-index: 2;
  background: white;
  background: #f8f9fa;
  background: #040b1c;
  border-right: 1px solid #f1f3f5;
`

const RoomsContainer = styled.div`
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

const HeaderTitle = styled.div`
  font-size: 14px;
  font-weight: 500;
  font-style: normal;
  color: white;
  transition: opacity 0.5s;
  display: inline-block;
  flex: 1;
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
