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
import { createRoom, fetchRooms, fetchTeam } from '../actions'
import TeamModal from '../modals/team.modal'
import { SettingsOutlined, CreateOutlined, Search, AddCircleOutline } from '@material-ui/icons'
import QuickInputComponent from '../components/quick-input.component'

const Rooms = styled.div`
  width: 350px;
  display: flex;
  height: 100%;
  position: relative;
  z-index: 2;
  background: white;
  border-right: 1px solid #f1f3f5;
`

const Header = styled.div`
  background-color: transparent;
  width: 100%;
  padding 0px 25px 0px 25px;
  border-bottom: 1px solid #f1f3f5;
  transition: background-color 0.5s;
  height: 70px;
`

const HeaderTitle = styled.div`
  font-size: 18px;
  font-weight: 600;
  font-style: normal;
  color: #040b1c;
  transition: opacity 0.5s;
  display: inline-block;
  flex: 1;
`

const HeaderSubtitle = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: #475669;
`

const HeaderSubtitleLink = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: #007af5;
`

const SearchInput = styled.input`
  font-size: 16px;
  border: none;
  width: 100%;
  padding: 15px;
  color: #495057;
  font-weight: 500;
  background: transparent;

  &::placeholder {
    color: #acb5bd;
  }
`

const SearchInner = styled.div`
  border-radius: 3px;
  background: #f8f9fa;
  flex: 1;
  margin: 10px;
  margin-right: 0px;
`

const SearchContainer = styled.div`
  width: 100%;
  border-bottom: 1px solid #f1f3f5;
  height: 70px;
`

const Heading = styled.div`
  padding: 25px 25px 10px 25px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.8px;
  text-transform: uppercase;
  color: #475669;
`

class RoomsPartial extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      filter: '',
      results: [],
      teamModal: false,
      roomPopup: false,
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
        {/* Update an existing team */}
        {this.state.teamModal &&
          <TeamModal
            id={this.props.team.id}
            onClose={() => this.setState({ teamModal: false })}
          />
        }

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
              placeholder="Search by name..."
            />
          </SearchInner>

          <SettingsOutlined
            htmlColor="#acb5bd"
            fontSize="default"
            className="mr-20 ml-20 button"
            onClick={() => this.setState({ teamModal: true })}
          />
        </SearchContainer>

        <Header className="row hide">
          <HeaderTitle>
            {this.props.team.name}
          </HeaderTitle>
          <div className="row">
          </div>
        </Header>

        <div className="flexer w-100 column align-items-stretch scroll">
          {this.state.filter != "" &&
            <React.Fragment>
              <Heading>Results</Heading>

              {this.state.results.map((result, index) => {
                return (
                  <RoomComponent
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
                const unread = this.props.common.unread.filter((row) => room.id == row.doc.room).length != 0
                const to = `/app/team/${room.team.id}/room/${room.id}`

                return (
                  <Link className="w-100" key={index} to={to}>
                    <RoomComponent
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

          <Heading className="row">
            <span className="flexer">
              {this.props.team.name} Channels
            </span>

            <QuickInputComponent
              visible={this.state.roomPopup}
              width={300}
              direction="right-bottom"
              handleDismiss={() => this.setState({ roomPopup: false })}
              handleAccept={(name) => this.setState({ roomPopup: false }, () => this.props.createRoom(name, '', null, this.props.team.id, null))}
              placeholder="New room name">
              <AddCircleOutline
                htmlColor="#babec9"
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
            const unread = this.props.common.unread.filter((row) => room.id == row.doc.room).length != 0

            return (
              <Link className="w-100" key={index} to={`/app/team/${room.team.id}/room/${room.id}`}>
                <RoomComponent
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
