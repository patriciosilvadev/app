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
import { createRoom, fetchRooms, fetchTeam } from '../actions'
import TeamModal from '../modals/team.modal'
import { SettingsOutlined, CreateOutlined, Search, AddCircleOutline, KeyboardArrowDownOutlined } from '@material-ui/icons'
import { GroupWorkOutlined, AddOutlined, AccountCircleOutlined, ExitToAppOutlined, HelpOutlineOutlined, AddBoxOutlined, AddToPhotosOutlined } from '@material-ui/icons'
import { Toggle, Popup, Menu, Avatar, Room } from '@weekday/elements'
import QuickInputComponent from '../components/quick-input.component'

const Rooms = styled.div`
  width: 300px;
  display: flex;
  height: 100%;
  position: relative;
  z-index: 1;
  background: white;
  background: #F8F9FA;
  background: #040B1C;
  border-right: 1px solid #f1f3f5;
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

const Heading = styled.div`
  padding: 25px 25px 10px 25px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.8px;
  text-transform: uppercase;
  color: #475669;
`

const RoomsContainer = styled.div`
  flex: 1;
  width: 100%;
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
      starred: [],
      public: [],
      private: [],
    }

    this.filterRef = React.createRef()
    this.signout = this.signout.bind(this)
    this.createPrivateRoom = this.createPrivateRoom.bind(this)
    this.navigateToRoom = this.navigateToRoom.bind(this)
    this.handleKeyPress = this.handleKeyPress.bind(this)
    this.fetchResults = this.fetchResults.bind(this)
    this.onSearch = this.onSearch.bind(this)
    this.onSearch$ = new Subject()
    this.subscription = null
  }

  async signout() {
    await AuthService.signout()
    await GraphqlService.signout()

    this.props.history.push('/auth')
  }

  static getDerivedStateFromProps(props, state) {
    const starredRooms = props.rooms.filter((room, index) => props.common.user.starred.indexOf(room.id) != -1)
    const privateRooms = props.rooms.filter((room, index) => room.private && props.common.user.starred.indexOf(room.id) == -1)
    const publicRooms = props.rooms.filter((room, index) => !room.private && props.common.user.starred.indexOf(room.id) == -1)

    return {
      starred: starredRooms,
      private: privateRooms,
      public: publicRooms,
    }
  }

  createPrivateRoom(user) {
    this.props.createRoom(null, '', null, this.props.team.id, user)
    this.setState({ filter: '', showFilter: false })
  }

  createPublicRoom() {
    this.props.createRoom(this.state.filter, '', null, this.props.team.id, null)
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

  // prettier-ignore
  render() {
    const { pathname } = this.props.history.location

    return (
      <Rooms className="column align-items-stretch">
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

          <div className="column w-100">
            <HeaderTitle>
              {this.props.common.user.name}
            </HeaderTitle>

            <HeaderSubtitle>
              {this.props.team.name}
            </HeaderSubtitle>
          </div>

          <Popup
            handleDismiss={() => this.setState({ accountMenu: false })}
            visible={this.state.accountMenu}
            width={275}
            direction="left-bottom"
            content={
              <div className="column flexer">
                <AccountMenuHeader className="column align-items-center">
                  <Avatar
                    size="medium"
                    image={this.props.common.user.image}
                    title={this.props.common.user.name}
                    className="mr-10"
                  />

                  <AccountMenuTitle>
                    {this.props.common.user.name}
                  </AccountMenuTitle>

                  <AccountMenuSubtitle>
                    {this.props.team.name}
                  </AccountMenuSubtitle>

                  {/*
                  <Toggle
                    on={true}
                    onChange={(value) => {
                      console.log('RoomsComponent', value)
                    }}
                  />
                  */}
                </AccountMenuHeader>
                <Menu
                  items={[
                    { icon: <SettingsOutlined htmlColor="#acb5bd" fontSize="default" />, text: "Account setting", onClick: (e) => this.setState({ accountMenu: false, accountModal: true }) },
                    { icon: <GroupWorkOutlined htmlColor="#acb5bd" fontSize="default" />, text: "Team settings", onClick: (e) => this.setState({ accountMenu: false, teamModal: true }) },
                    { icon: <ExitToAppOutlined htmlColor="#acb5bd" fontSize="default" />, text: "Signout", onClick: (e) => this.setState({ accountMenu: false }, () => this.signout()) },
                    { icon: <HelpOutlineOutlined htmlColor="#acb5bd" fontSize="default" />, text: "Help", onClick: (e) => this.setState({ accountMenu: false }) },
                  ]}
                />
              </div>
            }>
            <div>
              <KeyboardArrowDownOutlined
                htmlColor="#475669"
                fontSize="default"
                className="button"
                onClick={() => this.setState({ accountMenu: true })}
              />
            </div>
          </Popup>
        </Header>

        <SearchContainer className="row">
          <SearchInner className="row">
            <Search
              htmlColor="#475669"
              fontSize="default"
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

        <RoomsContainer className="column align-items-stretch scroll">
          {this.state.filter != "" &&
            <React.Fragment>
              <Heading>Results</Heading>

              {this.state.results.map((result, index) => {
                return (
                  <Room
                    className="w-100"
                    key={index}
                    active={false}
                    unread={null}
                    title={result.name}
                    image={result.image}
                    excerpt={result.username}
                    public={null}
                    private={null}
                    onClick={() => this.createPrivateRoom(result)}
                  />
                )
              })}

              {this.state.results.length == 0 &&
                <Room
                  className="w-100"
                  active={false}
                  unread={null}
                  title={`Create channel "${this.state.filter}"`}
                  image={null}
                  excerpt={null}
                  public={null}
                  private={null}
                  onClick={() => this.createPublicRoom()}
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

                return (
                  <Link className="w-100" key={index} to={to}>
                    <Room
                      active={pathname.indexOf(room.id) != -1}
                      unread={unreadCount}
                      title={title}
                      image={image}
                      excerpt={room.excerpt}
                      public={room.public}
                      private={room.private}
                    />
                  </Link>
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
              handleAccept={(name) => this.setState({ roomPopup: false }, () => this.props.createRoom(name, '', null, this.props.team.id, null))}
              placeholder="New room name">
              <AddCircleOutline
                htmlColor="#475669"
                fontSize="small"
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

            return (
              <Link className="w-100" key={index} to={`/app/team/${room.team.id}/room/${room.id}`}>
                <Room
                  active={pathname.indexOf(room.id) != -1}
                  unread={unreadCount}
                  title={room.title}
                  image={room.image}
                  excerpt={room.excerpt}
                  public={room.public}
                  private={room.private}
                />
              </Link>
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

                if (this.state.filter != "" && !title.toLowerCase().match(new RegExp(this.state.filter.toLowerCase() + ".*"))) return

                return (
                  <Link className="w-100" key={index} to={`/app/team/${room.team.id}/room/${room.id}`}>
                    <Room
                      active={pathname.indexOf(room.id) != -1}
                      unread={unreadCount}
                      title={title}
                      image={image}
                      icon={null}
                      excerpt={room.excerpt}
                      public={room.public}
                      private={room.private}
                    />
                  </Link>
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
  teams: PropTypes.array,
  createRoom: PropTypes.func,
  fetchRooms: PropTypes.func,
  fetchStarredRooms: PropTypes.func,
  fetchTeam: PropTypes.func,
}

const mapDispatchToProps = {
  createRoom: (title, description, image, team, user) => createRoom(title, description, image, team, user),
  fetchRooms: (teamId, userId) => fetchRooms(teamId, userId),
  fetchStarredRooms: userId => fetchStarredRooms(userId),
  fetchTeam: teamId => fetchTeam(teamId),
}

const mapStateToProps = state => {
  return {
    common: state.common,
    team: state.team,
    rooms: state.rooms,
    room: state.room,
    teams: state.teams,
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(RoomsComponent)
