import React from 'react'
import { connect } from 'react-redux'
import RoomComponent from '../components/room.component'
import { Avatar } from '@weekday/elements'
import GraphqlService from '../services/graphql.service'
import '../helpers/extensions'
import styled from 'styled-components'
import { BrowserRouter as Router, Link } from 'react-router-dom'
import RoomModal from '../modals/room.modal'
import { Subject } from 'rxjs'
import { debounceTime } from 'rxjs/operators'
import PropTypes from 'prop-types'
import { createRoom, fetchRooms, fetchStarredRooms, fetchTeam } from '../actions'
import IconComponent from '../components/icon.component'
import TeamModal from '../modals/team.modal'

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
  padding-top: 5px;
`

const HeaderSubtitleTeam = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: #475669;
`

const HeaderSubtitleTeamLink = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: #007af5;
  margin-left: 5px;
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

const FooterButton = styled.div`
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  padding: 25px;
  cursor: pointer;

  &:hover {
    opacity: 0.75;
  }
`

const FooterButtonText = styled.div`
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
      teamModal: false,
      roomModal: false,
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
    this.subscription = null
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
    this.setState({ filter: '', showFilter: false }, () => this.props.createRoom(null, "", null, this.props.team.id, user))
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
        {/* Update an existing team */}
        {this.state.teamModal &&
          <TeamModal
            id={this.props.team.id}
            onClose={() => this.setState({ teamModal: false })}
          />
        }

        {/* Create a new room */}
        {this.state.roomModal &&
          <RoomModal
            id={null}
            onClose={() => this.setState({ roomModal: false })}
          />
        }

        <Header className="row">
          <Avatar
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
            <HeaderSubtitle className="row">
              <HeaderSubtitleTeam>
                {this.props.team.name}
              </HeaderSubtitleTeam>
              <HeaderSubtitleTeamLink
                className="button"
                onClick={() => this.setState({ teamModal: true })}>
                View Team
              </HeaderSubtitleTeamLink>
            </HeaderSubtitle>
          </div>
        </Header>

        <SearchContainer className="row">
          <IconComponent
            icon="SEARCH"
            color="#475669"
            size="1x"
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
                <RoomComponent
                  dark
                  className="w-100"
                  active={false}
                  unread={null}
                  title={`Create channel "${this.state.filter}"`}
                  image={null}
                  excerpt={null}
                  public={null}
                  private={null}
                  onClick={() => this.props.createRoom(this.state.filter, "", null, this.props.team.id, null)}
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
                const to = `/app/team/${room.team.id}/room/${room.id}`

                return (
                  <Link className="w-100" key={index} to={to}>
                    <RoomComponent
                      dark
                      active={pathname.indexOf(room.id) != -1}
                      unread={unread}
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
                      active={pathname.indexOf(room.id) != -1}
                      unread={unread}
                      title={room.title}
                      image={room.image}
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
                      active={pathname.indexOf(room.id) != -1}
                      unread={unread}
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
        </div>

        <FooterButton className="row" onClick={() => this.setState({ roomModal: true })}>
          <IconComponent
            color="#475669"
            icon="ROOMS_ADD_ROOM"
            size="1x"
            className="mr-10"
          />
          <FooterButtonText>
            Create New Channel
          </FooterButtonText>
        </FooterButton>
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
)(RoomsPartial)
