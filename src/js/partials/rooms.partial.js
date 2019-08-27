import React from 'react'
import { connect } from 'react-redux'
import RoomComponent from '../components/room.component'
import AvatarComponent from '../components/avatar.component'
import GraphqlService from '../services/graphql.service'
import '../helpers/extensions'
import AuthService from '../services/auth.service'
import styled from 'styled-components'
import { BrowserRouter as Router, Link } from 'react-router-dom'
import TeamModal from '../modals/team.modal'
import RoomModal from '../modals/room.modal'
import AccountModal from '../modals/account.modal'
import { Subject } from 'rxjs'
import { debounceTime } from 'rxjs/operators'
import PropTypes from 'prop-types'
import { createRoom, fetchRooms, fetchStarredRooms, fetchTeam } from '../actions'
import IconComponent from '../components/icon.component'

const Rooms = styled.div`
  width: 300px;
  display: flex;
  height: 100%;
  position: relative;
  z-index: 2;
  background: #08111d;
`

const Header = styled.div`
  background-color: transparent;
  width: 100%;
  padding: 25px 25px 0px 25px;
  border-bottom: 0px solid rgba(255, 255, 255, 0.05);
  transition: background-color 0.5s;
`

const HeaderTitle = styled.div`
  font-size: 14px;
  font-weight: 400;
  color: #8492a6;
`

const HeaderSubtitle = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: #475669;
`

const SearchInput = styled.input`
  font-size: 14px;
  border: none;
  background: transparent;
  width: 100%;
  color: #8492a6;

  &::placeholder {
    color: #475669;
  }
`

const SearchContainer = styled.div`
  background-color: transparent;
  width: 100%;
  padding: 25px 25px 0px 25px;
  border-bottom: 0px solid rgba(255, 255, 255, 0.05);
  transition: background-color 0.5s;
`

const Heading = styled.div`
  padding: 25px 25px 10px 25px;
  font-size: 11px;
  font-weight: 400;
  letter-spacing: 0.8px;
  text-transform: uppercase;
  color: #475669;
`

const Button = styled.div`
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  padding: 25px;
  cursor: pointer;

  &:hover {
    opacity: 0.75;
  }
`

const ButtonText = styled.div`
  color: #475669;
  font-weight: 400;
  font-size: 14px;

  &:hover {
    opacity: 0.75;
  }
`

class RoomsPartial extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      filter: '',
      results: [],
      roomCreateModal: false,
      starred: [],
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
    this.setState({ filter: '', showFilter: false }, () => this.props.createRoom(null, null, this.props.team.id, user))
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
    if (this.props.starred && !teamId) this.props.fetchStarredRooms(userId)
    if (!this.props.starred && teamId) this.props.fetchRooms(teamId, userId)
  }

  componentDidUpdate(prevProps) {
    const { teamId } = this.props.match.params
    const userId = this.props.common.user.id

    if (!prevProps.starred && this.props.starred) this.props.fetchStarredRooms(userId)
    if (!prevProps.starred && teamId != prevProps.match.params.teamId) this.props.fetchRooms(teamId, userId)
  }

  componentWillUnmount() {
    this.filterRef.removeEventListener('keyup', this.handleKeyPress)

    if (this.subscription) this.subscription.unsubscribe()
  }

  handleKeyPress(e) {
    if (e.keyCode == 27) this.setState({ filter: '', showFilter: false })
  }

  async fetchResults() {
    if (this.state.filter == '' && !this.props.starred) return

    try {
      const search = await GraphqlService.getInstance().search(this.props.team.id, this.state.filter)
      const results = []

      // Create a results object for the users
      search.data.searchUsers.map(user => {
        results.push({
          id: user.id,
          title: user.name,
          image: user.image,
          label: user.role,
          type: 'USER',
        })
      })

      // Create a results object for the rooms
      search.data.searchRooms.map(room => {
        results.push({
          id: room.id,
          title: room.title,
          image: room.image,
          label: 'CHANNEL',
          url: room.url,
          type: 'ROOM',
        })
      })

      // Update our UI with our results
      this.setState({ results })
    } catch (e) {}
  }

  onSearch(e) {
    const search = e.target.value
    this.setState({ filter: search })
    this.onSearch$.next(search)
  }

  // prettier-ignore
  render() {
    return (
      <Rooms className="column align-items-stretch">
        {/* Update an existing team */}
        {this.state.teamModal &&
          <TeamModal
            id={this.props.team.id}
            history={this.props.history}
            onClose={() => this.setState({ teamModal: false })}
          />
        }

        {/* Create a new team */}
        {this.state.teamCreateModal &&
          <TeamModal
            id={null}
            history={this.props.history}
            onClose={() => this.setState({ teamCreateModal: false })}
          />
        }

        {/* Update user account */}
        {this.state.accountModal &&
          <AccountModal
            id={this.props.common.user.id}
            onClose={() => this.setState({ accountModal: false })}
          />
        }

        {/* Create a new room */}
        {this.state.roomCreateModal &&
          <RoomModal
            team={this.props.team.id ? this.props.team : null}
            history={this.props.history}
            onClose={() => this.setState({ roomCreateModal: false })}
          />
        }

        <Header className="row">
          <AvatarComponent
            dark
            size="small"
            image={this.props.common.user.image}
            title={this.props.common.user.name}
            className="button"
          />

          <div className="column pl-10">
            <HeaderTitle>
              {this.props.common.user.name}
            </HeaderTitle>
            {this.props.team.name &&
              <HeaderSubtitle>
                {this.props.team.name}
              </HeaderSubtitle>
            }
          </div>
        </Header>

        <SearchContainer className="row">
          <IconComponent
            icon="ROOMS_SEARCH"
            color="#475669"
            className="mr-5"
          />

          <SearchInput
            ref={(ref) => this.filterRef = ref}
            visible={this.state.showFilter}
            value={this.state.filter}
            onChange={this.onSearch}
            placeholder="Search by name..."
          />
        </SearchContainer>

        <div className="flexer w-100 column align-items-stretch scroll">
          {this.state.filter != "" &&
            <React.Fragment>
              <Heading>Results</Heading>

              {this.state.results.map((result, index) => {
                return (
                  <RoomComponent
                    dark
                    className="w-100"
                    key={index}
                    active={false}
                    unread={null}
                    title={result.title}
                    image={result.image}
                    label={result.label}
                    excerpt={null}
                    public={null}
                    private={null}
                    onClick={() => result.type == "USER"
                      ? this.createPrivateRoom(result)
                      : this.navigateToRoom(result)
                    }
                  />
                )
              })}

              {this.state.results.length == 0 &&
                <RoomComponent
                  dark
                  className="w-100"
                  active={false}
                  unread={null}
                  title={`Create "${this.state.filter}"`}
                  image={null}
                  label="CHANNEL"
                  excerpt={null}
                  public={null}
                  private={null}
                  onClick={() => this.props.createRoom(this.state.filter, null, this.props.team.id, null)}
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
                const unread = this.props.common.unread.filter((row) => room.id == row.doc.room).length != 0
                const to = this.props.starred ? `/app/starred/room/${room.id}` : `/app/team/${room.team.id}/room/${room.id}`

                return (
                  <Link className="w-100" key={index} to={to}>
                    <RoomComponent
                      dark
                      active={room.id == this.props.room.id}
                      unread={unread}
                      title={title}
                      image={image}
                      label={this.props.starred ? room.team.name : null}
                      excerpt={room.excerpt}
                      public={room.public}
                      private={room.private}
                    />
                  </Link>
                )
              })}
            </React.Fragment>
          }

          {this.state.public.length != 0 &&
            <React.Fragment>
              <Heading>Channels</Heading>

              {this.state.public.map((room, index) => {
                if (this.props.common.user.starred.indexOf(room.id) != -1) return
                if (this.state.filter != "" && !room.title.toLowerCase().match(new RegExp(this.state.filter.toLowerCase() + ".*"))) return

                const title = room.private ? room.members.reduce((title, member) => member.user.id != this.props.common.user.id ? title + member.user.name : title, "") : room.title
                const image = room.private ? room.members.reduce((image, member) => member.user.id != this.props.common.user.id ? image + member.user.image : image, "") : room.image
                const unread = this.props.common.unread.filter((row) => room.id == row.doc.room).length != 0

                return (
                  <Link className="w-100" key={index} to={`/app/team/${room.team.id}/room/${room.id}`}>
                    <RoomComponent
                      dark
                      active={room.id == this.props.room.id}
                      unread={unread}
                      title={room.title}
                      image={room.image}
                      label={this.props.starred ? room.team.name : null}
                      excerpt={room.excerpt}
                      public={room.public}
                      private={room.private}
                    />
                  </Link>
                )
              })}
            </React.Fragment>
          }

          {this.state.private.length != 0 &&
            <React.Fragment>
              <Heading>Private Conversations</Heading>

              {this.state.private.map((room, index) => {
                if (this.props.common.user.starred.indexOf(room.id) != -1) return

                const title = room.members.reduce((title, member) => member.user.id != this.props.common.user.id ? title + member.user.name : title, "")
                const image = room.members.reduce((image, member) => member.user.id != this.props.common.user.id ? image + member.user.image : image, "")
                const unread = this.props.common.unread.filter((row) => room.id == row.doc.room).length != 0

                if (this.state.filter != "" && !title.toLowerCase().match(new RegExp(this.state.filter.toLowerCase() + ".*"))) return

                return (
                  <Link className="w-100" key={index} to={`/app/team/${room.team.id}/room/${room.id}`}>
                    <RoomComponent
                      dark
                      active={room.id == this.props.room.id}
                      unread={unread}
                      title={title}
                      image={image}
                      icon={null}
                      label={null}
                      excerpt={room.excerpt}
                      public={room.public}
                      private={room.private}
                    />
                  </Link>
                )
              })}
            </React.Fragment>
          }
        </div>

        {!this.props.starred &&
          <Button className="row" onClick={() => this.setState({ roomCreateModal: true })}>
            <IconComponent
              color="#475669"
              icon="ROOMS_ADD_ROOM"
              className="mr-10"
            />
            <ButtonText>
              Create New Channel
            </ButtonText>
          </Button>
        }
      </Rooms>
    )
  }
}

RoomsPartial.propTypes = {
  starred: PropTypes.bool,
  team: PropTypes.any,
  room: PropTypes.any,
  rooms: PropTypes.array,
  common: PropTypes.any,
  teams: PropTypes.array,
  createRoom: PropTypes.func,
  fetchRooms: PropTypes.func,
  fetchStarredRooms: PropTypes.func,
}

const mapDispatchToProps = {
  createRoom: (title, description, team, user) => createRoom(title, description, team, user),
  fetchRooms: (teamId, userId) => fetchRooms(teamId, userId),
  fetchStarredRooms: userId => fetchStarredRooms(userId),
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
)(RoomsPartial)
