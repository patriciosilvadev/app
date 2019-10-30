import React from 'react'
import { connect } from 'react-redux'
import GraphqlService from '../services/graphql.service'
import '../helpers/extensions'
import styled from 'styled-components'
import { BrowserRouter as Router, Link } from 'react-router-dom'
import RoomModal from '../modals/room.modal'
import AccountModal from '../modals/account.modal'
import { Subject } from 'rxjs'
import { debounceTime } from 'rxjs/operators'
import PropTypes from 'prop-types'
import { createRoom, fetchRooms, fetchTeam, updateUserStatus, updateUserMuted, updateUserArchived } from '../actions'
import TeamModal from '../modals/team.modal'
import { Toggle, Popup, Menu, Avatar, Room } from '@weekday/elements'
import QuickInputComponent from '../components/quick-input.component'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import AuthService from '../services/auth.service'

const Rooms = styled.div`
  width: 300px;
  height: 100%;
  position: relative;
  z-index: 1;
  background: white;
  background: #F8F9FA;
  background: #040B1C;
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
  font-weight: 500;
  font-style: normal;
  color: #343A40;
  transition: opacity 0.5s;
  display: inline-block;
  flex: 1;
  padding: 5px;
`

const AccountMenuSubtitle = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: #CFD4D9;
  padding: 5px 5px 5px 5px;
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

const ArchivedButton = styled.div`
  padding: 25px 25px 10px 25px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.8px;
  text-transform: uppercase;
  color: #475669;
`

const Heading = styled.div`
  padding: 25px 25px 10px 25px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.8px;
  text-transform: uppercase;
  color: #475669;
`

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
    }

    this.filterRef = React.createRef()

    this.createPrivateRoom = this.createPrivateRoom.bind(this)
    this.navigateToRoom = this.navigateToRoom.bind(this)
    this.handleKeyPress = this.handleKeyPress.bind(this)
    this.fetchResults = this.fetchResults.bind(this)
    this.onSearch = this.onSearch.bind(this)

    this.onSearch$ = new Subject()
    this.subscription = null
  }

  static getDerivedStateFromProps(props, state) {
    const starredRooms = props.rooms.filter((room, index) => props.common.user.starred.indexOf(room.id) != -1)
    const mutedRooms = props.rooms.filter((room, index) => props.common.user.muted.indexOf(room.id) != -1)
    const archivedRooms = props.rooms.filter((room, index) => props.common.user.archived.indexOf(room.id) != -1)
    const privateRooms = props.rooms.filter((room, index) => room.private && props.common.user.starred.indexOf(room.id) == -1 && props.common.user.archived.indexOf(room.id) == -1)
    const publicRooms = props.rooms.filter((room, index) => !room.private && props.common.user.starred.indexOf(room.id) == -1 && props.common.user.archived.indexOf(room.id) == -1)

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
    const userId = this.props.common.user.id

    this.props.createRoom(title, description, image, teamId, userId, initialOtherUserId)
    this.setState({ filter: '', showFilter: false })
  }

  createPublicRoom(title) {
    const description = null
    const image = null
    const teamId = this.props.team.id
    const initialOtherUserId = null
    const userId = this.props.common.user.id

    this.props.createRoom(title, description, image, teamId, userId, initialOtherUserId)
    this.setState({ filter: '', showFilter: false })
  }

  navigateToRoom(room) {
    this.setState({ filter: '', showFilter: false }, () => this.props.history.push(`/team/${this.props.team.id}/room/${room.id}`))
  }

  componentDidMount() {
    this.filterRef.addEventListener('keyup', this.handleKeyPress)

    // Here we handle the delay for the yser typing in the search field
    this.subscription = this.onSearch$.pipe(debounceTime(250)).subscribe(debounced => this.fetchResults())

    // Get the team ID (if any)
    const { teamId } = this.props.match.params
    const userId = this.props.common.user.id

    // If it exists, fetch
    this.props.fetchRooms(teamId, userId)
    this.props.fetchTeam(teamId, userId)
  }

  componentDidUpdate(prevProps) {
    const { teamId } = this.props.match.params
    const userId = this.props.common.user.id

    if (teamId != prevProps.match.params.teamId) {
      this.props.fetchRooms(teamId, userId)
      this.props.fetchTeam(teamId, userId)
    }
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
      this.setState({ results: results.filter(result => result.id != this.props.common.user.id) })
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
    this.setState({
      accountMenu: false
    }, async () => {
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
            id={this.props.common.user.id}
            onClose={() => this.setState({ accountModal: false })}
          />
        }

        <Header className="row">
          <Avatar
            size="medium"
            image={this.props.common.user.image}
            title={this.props.common.user.name}
            className="mr-10"
          />

          <div className="column flexer pl-10">
            <HeaderTeam>
              {this.props.team.name}
            </HeaderTeam>

            <HeaderTitle>
              {this.props.common.user.name}
            </HeaderTitle>

            <QuickInputComponent
              visible={this.state.statusMenu}
              width={300}
              direction="left-bottom"
              handleDismiss={() => this.setState({ statusMenu: false })}
              handleAccept={(status) => this.setState({ statusMenu: false }, () => this.props.updateUserStatus(this.props.common.user.id, this.props.team.id, status))}
              placeholder={this.props.common.user.status}>

              <HeaderSubtitle
                className="button"
                onClick={() => this.setState({ statusMenu: true })}>
                {this.props.common.user.status || "Update your status"}
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
                    image={this.props.common.user.image}
                    title={this.props.common.user.name}
                  />

                  <AccountMenuTitle>
                    {this.props.common.user.name}
                  </AccountMenuTitle>

                  <AccountMenuSubtitle>
                    {this.props.team.name}
                  </AccountMenuSubtitle>
                </AccountMenuHeader>

                <Menu
                  items={[
                    {
                      icon: <FontAwesomeIcon icon={["fal", "cog"]} color="#acb5bd" size="lg" />,
                      text: "Account settings",
                      onClick: this._openAccountSettings.bind(this)
                    },
                    {
                      icon: <FontAwesomeIcon icon={["fal", "users-cog"]} color="#acb5bd" size="lg" />,
                      text: "Team settings",
                      onClick: this._openTeamSettings.bind(this),
                    },
                    {
                      icon: <FontAwesomeIcon icon={["fal", "sign-out"]} color="#acb5bd" size="lg" />,
                      text: "Signout",
                      onClick: this._signout.bind(this),
                    },
                  ]}
                />
              </React.Fragment>
            }>
            <div>
              <FontAwesomeIcon
                icon={["fal", "chevron-down"]}
                color="#475669"
                size="sm"
                className="button"
                onClick={this._openUserMenu.bind(this)}
              />
            </div>
          </Popup>
        </Header>

        <SearchContainer className="row">
          <SearchInner className="row">
            <FontAwesomeIcon
              icon={["far", "search"]}
              color="#475669"
              size="sm"
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
                  title={`Create channel "${this.state.filter}"`}
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

                const title = room.private ? room.members.reduce((title, member) => member.user.id != this.props.common.user.id ? title + member.user.name : title, "") : room.title
                const image = room.private ? room.members.reduce((image, member) => member.user.id != this.props.common.user.id ? image + member.user.image : image, "") : room.image
                const unread = this.props.common.unread.filter((row) => room.id == row.doc.room).flatten()
                const unreadCount = unread ? unread.doc.count : 0
                const to = `/app/team/${room.team.id}/room/${room.id}`
                const muted = this.props.common.user.muted.indexOf(room.id) != -1
                const archived = this.props.common.user.archived.indexOf(room.id) != -1

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
                    onArchivedClick={() => this.props.updateUserArchived(this.props.common.user.id, room.id, !archived)}
                    onMutedClick={() => this.props.updateUserMuted(this.props.common.user.id, room.id, !muted)}
                  />
                )
              })}
            </React.Fragment>
          }

          <Heading className="row">
            <span className="flexer">
              Channels
            </span>

            <QuickInputComponent
              visible={this.state.roomPopup}
              width={250}
              direction="right-bottom"
              handleDismiss={() => this.setState({ roomPopup: false })}
              handleAccept={(name) => this.setState({ roomPopup: false }, () => this.createPublicRoom(name))}
              placeholder="New channel name">
              <FontAwesomeIcon
                icon={["fal", "plus-circle"]}
                color="#475669"
                size="lg"
                className="button"
                onClick={() => this.setState({ roomPopup: true })}
              />
            </QuickInputComponent>
          </Heading>

          {this.state.public.map((room, index) => {
            if (this.props.common.user.starred.indexOf(room.id) != -1) return
            if (this.state.filter != "" && !room.title.toLowerCase().match(new RegExp(this.state.filter.toLowerCase() + ".*"))) return

            const title = room.private ? room.members.reduce((title, member) => member.user.id != this.props.common.user.id ? title + member.user.name : title, "") : room.title
            const image = room.private ? room.members.reduce((image, member) => member.user.id != this.props.common.user.id ? image + member.user.image : image, "") : room.image
            const unread = this.props.common.unread.filter((row) => room.id == row.doc.room).flatten()
            const unreadCount = unread ? unread.doc.count : 0
            const muted = this.props.common.user.muted.indexOf(room.id) != -1
            const archived = this.props.common.user.archived.indexOf(room.id) != -1

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
                onArchivedClick={() => this.props.updateUserArchived(this.props.common.user.id, room.id, !archived)}
                onMutedClick={() => this.props.updateUserMuted(this.props.common.user.id, room.id, !muted)}
              />
            )
          })}

          {this.state.private.length != 0 &&
            <React.Fragment>
              <Heading>Private Conversations</Heading>

              {this.state.private.map((room, index) => {
                if (this.props.common.user.starred.indexOf(room.id) != -1) return

                const title = room.members.reduce((title, member) => member.user.id != this.props.common.user.id ? title + member.user.name : title, "")
                const image = room.members.reduce((image, member) => member.user.id != this.props.common.user.id ? image + member.user.image : image, "")
                const unread = this.props.common.unread.filter((row) => room.id == row.doc.room).flatten()
                const unreadCount = unread ? unread.doc.count : 0
                const muted = this.props.common.user.muted.indexOf(room.id) != -1
                const archived = this.props.common.user.archived.indexOf(room.id) != -1

                // Filter based on users search
                if (this.state.filter != "" && !title.toLowerCase().match(new RegExp(this.state.filter.toLowerCase() + ".*"))) return

                // Get the other users' presence
                const otherMember = room.members.filter(member => member.user.id != this.props.common.user.id).flatten()
                const otherMemberStatus = otherMember.user.status
                const otherMemberPresence = this.props.presences.users.filter(user => user.userId == otherMember.user.id).flatten()
                const heartbeat = otherMemberPresence ? otherMemberPresence.heartbeat : null

                return (
                  <Room
                    key={index}
                    heartbeat={heartbeat}
                    active={pathname.indexOf(room.id) != -1}
                    unread={unreadCount}
                    title={title}
                    image={image}
                    icon={null}
                    excerpt={otherMemberStatus}
                    public={room.public}
                    private={room.private}
                    muted={muted}
                    archived={archived}
                    onClick={() => this.props.history.push(`/app/team/${room.team.id}/room/${room.id}`)}
                    onArchivedClick={() => this.props.updateUserArchived(this.props.common.user.id, room.id, !archived)}
                    onMutedClick={() => this.props.updateUserMuted(this.props.common.user.id, room.id, !muted)}
                  />
                )
              })}
            </React.Fragment>
          }

          {this.state.archived.length != 0 &&
            <ArchivedButton
              className="button"
              onClick={() => this.setState({ archivedVisible: !this.state.archivedVisible })}>
              {this.state.archivedVisible ? "Hide archived" : "See archived"}
            </ArchivedButton>
          }

          {this.state.archived.length != 0 && this.state.archivedVisible &&
            <React.Fragment>
              {this.state.archived.map((room, index) => {
                if (this.state.filter != "" && !room.title.toLowerCase().match(new RegExp(this.state.filter.toLowerCase() + ".*"))) return

                const title = room.private ? room.members.reduce((title, member) => member.user.id != this.props.common.user.id ? title + member.user.name : title, "") : room.title
                const image = room.private ? room.members.reduce((image, member) => member.user.id != this.props.common.user.id ? image + member.user.image : image, "") : room.image
                const unread = this.props.common.unread.filter((row) => room.id == row.doc.room).flatten()
                const unreadCount = unread ? unread.doc.count : 0
                const to = `/app/team/${room.team.id}/room/${room.id}`
                const muted = this.props.common.user.muted.indexOf(room.id) != -1
                const archived = this.props.common.user.archived.indexOf(room.id) != -1

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
                    onArchivedClick={(e) => this.props.updateUserArchived(this.props.common.user.id, room.id, !archived)}
                    onMutedClick={() => this.props.updateUserMuted(this.props.common.user.id, room.id, !muted)}
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
  presences: PropTypes.any,
  teams: PropTypes.array,
  createRoom: PropTypes.func,
  fetchRooms: PropTypes.func,
  fetchStarredRooms: PropTypes.func,
  fetchTeam: PropTypes.func,
  updateUserStatus: PropTypes.func,
  updateUserMuted: PropTypes.func,
  updateUserArchived: PropTypes.func,
}

const mapDispatchToProps = {
  updateUserStatus: (userId, teamId, status) => updateUserStatus(userId, teamId, status),
  createRoom: (title, description, image, teamId, userId, initialOtherUserId) => createRoom(title, description, image, teamId, userId, initialOtherUserId),
  fetchRooms: (teamId, userId) => fetchRooms(teamId, userId),
  fetchStarredRooms: userId => fetchStarredRooms(userId),
  fetchTeam: teamId => fetchTeam(teamId),
  updateUserMuted: (userId, roomId, muted) => updateUserMuted(userId, roomId, muted),
  updateUserArchived: (userId, roomId, archived) => updateUserArchived(userId, roomId, archived),
}

const mapStateToProps = state => {
  return {
    common: state.common,
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
