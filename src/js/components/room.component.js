import React, { memo } from 'react'
import moment from 'moment'
import { connect } from 'react-redux'
import UploadService from '../services/upload.service'
import '../helpers/extensions'
import styled from 'styled-components'
import PropTypes from 'prop-types'
import GraphqlService from '../services/graphql.service'
import EventService from '../services/event.service'
import { Button } from '@weekday/elements'
import RoomModal from '../modals/room.modal'
import ReactMarkdown from 'react-markdown'
import MessagingService from '../services/messaging.service'
import DatabaseService from '../services/database.service'
import ConfirmModal from '../modals/confirm.modal'
import { updateLoading, updateError, deleteRoom, updateUserStarred, hydrateRoom, createRoomMember, updateRoom, hydrateRoomMessages } from '../actions'
import ComposeComponent from '../components/compose.component'
import { Popup, Menu, Avatar, Spinner, Notification } from '@weekday/elements'
import QuickUserComponent from '../components/quick-user.component'
import { Subject } from 'rxjs'
import { debounceTime } from 'rxjs/operators'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import MessagesComponent from './messages.component'

const Room = styled.div`
  background: white;
  height: 100%;
  flex: 1;
  padding-left: 0px;
  padding-right: 0px;
  position: relative;
  z-index: 1;
`

const Header = styled.div`
  width: 100%;
  background: transparent;
  border-bottom: 1px solid #f1f3f5;
  background: white;
  padding 15px 25px 15px 25px;
  display: flex;
`

const HeaderTitle = styled.div`
  font-size: 25px;
  font-weight: 600;
  font-style: normal;
  color: #040b1c;
  transition: opacity 0.5s;
  display: inline-block;
  margin-bottom: 2px;
  width: max-content;
`

const HeaderText = styled.div`
  font-size: 11px;
  font-weight: 600;
  font-style: normal;
  color: #acb5bd;
  transition: opacity 0.5s;
  display: inline-block;
  margin-right: 0px;
`

const HeaderLink = styled.div`
  font-size: 11px;
  font-weight: 600;
  font-style: normal;
  color: #007af5;
  transition: opacity 0.5s;
  display: inline-block;
  margin-right: 0px;
`

const HeaderButton = styled.div`
  transition: opacity 0.5s;
  position: relative;
  cursor: pointer;
`

const HeaderSearchContainer = styled.div`
  border: 3px solid #f1f3f5;
  background: white;
  border-radius: 10px;
  padding 5px;
  transition: width 0.5s;
  width: ${props => (props.focus ? '300px' : '200px')};
  margin-right: 10px;
`

const HeaderSearchInput = styled.input`
  font-size: 14px;
  font-weight: 400;
  flex: 1;
  background: transparent;
  font-style: normal;
  color: #212123;
  border: none;
  outline: none;

  &::placeholder {
    color: #acb5bd;
  }
`

const Blocked = styled.div`
  font-size: 13px;
  font-weight: 500;
  color: #343a40;
  padding: 10px;
`

const Typing = styled.div`
  font-weight: 400;
  font-size: 12px;
  color: "#adb5bd";
  border-bottom: 1px solid #f1f3f5;
  padding: 10px 25px 10px 25px
  width: 100%;
`

const MessagesContainer = styled.div`
  position: relative;
  flex: 1;
  overflow: scroll;
  width: 100%;
  background: #f8f9fa;
  background: white;
`

const MessagesInner = styled.div`
  width: 100%;
  padding: 25px;
  height: 1px; /* Important for the height to be set here */
`

const Welcome = styled.div`
  padding: 25px;
  padding-bottom: 35px;
  margin-bottom: 10px;
  border-bottom: 1px solid #f1f3f5;
  padding-top: 1000px;
`

const WelcomeTitle = styled.div`
  font-weight: 500;
  font-size: 60px;
  color: #040b1c;
  padding-bottom: 10px;
`

const WelcomeDescriptionUpdate = styled.div`
  font-weight: 400;
  font-size: 18px;
  color: #adb5bd;
  font-style: italic;
`

const WelcomeDescription = styled.div`
  font-weight: 400;
  font-size: 18px;
  color: #adb5bd;

  * {
    font-weight: 400;
    font-size: 18px;
    color: #adb5bd;
  }
`

const WelcomeUser = styled.div`
  margin-bottom: 10px;
`

const WelcomeUserName = styled.div`
  font-weight: 500;
  font-size: 12px;
  color: #adb5bd;
  padding-left: 10px;
`

const PaddingToKeepMessagesDown = styled.div`
  height: 1500px;
`

const AppIconContainer = styled.div`
  padding: 5px;
  margin-left: 15px;
  cursor: pointer;
  opacity: 1;
  transition: opacity 0.25s;

  &:hover {
    opacity: 0.8;
  }
`

const AppIconImage = styled.div`
  width: 20px;
  height: 20px;
  overflow: hidden;
  background-size: contain;
  background-position: center center;
  background-color: transparent;
  background-image: url(${props => props.image});
`

class RoomComponent extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      manualScrolling: false,
      busy: false,
      page: 1,
      open: true,
      title: '',
      image: '',
      roomUpdateModal: false,
      roomUpdateModalStart: 0,
      message: null,
      reply: false,
      update: false,
      starred: false,
      visibilityMenu: false,
      lastTypingTime: 0,
      typing: '',
      searchFocus: false,
      searchResults: null,
      searchQuery: '',
      loading: false,
      error: false,
    }

    this.messagesRef = React.createRef()
    this.scrollRef = React.createRef()

    this.handleScrollEvent = this.handleScrollEvent.bind(this)
    this.updateRoomVisibility = this.updateRoomVisibility.bind(this)
    this.updateUserStarred = this.updateUserStarred.bind(this)
    this.scrollToBottom = this.scrollToBottom.bind(this)
    this.composeTypingNames = this.composeTypingNames.bind(this)
    this.fetchResults = this.fetchResults.bind(this)
    this.onSearch = this.onSearch.bind(this)
    this.setUpdateMessage = this.setUpdateMessage.bind(this)
    this.setReplyMessage = this.setReplyMessage.bind(this)
    this.handleActionClick = this.handleActionClick.bind(this)
    this.updateUserStarred = this.updateUserStarred.bind(this)

    this.onSearch$ = new Subject()
    this.subscription = null
  }

  handleActionClick(action) {
    console.log('Action handler')
  }

  onSearch(e) {
    const query = e.target.value
    this.setState({ searchQuery: query })
    this.onSearch$.next(query)
  }

  async fetchResults() {
    if (this.state.searchQuery == '') return this.setState({ searchResults: null })

    const query = this.state.searchQuery
    const roomId = this.props.room.id

    try {
      const { data } = await GraphqlService.getInstance().searchMessages(roomId, query)

      // Update our UI with our results
      // Remove ourselves
      this.setState({ searchResults: data.searchMessages })
    } catch (e) {}
  }

  composeTypingNames() {
    // Don't include ourselves
    const typingUsers = this.props.room.typing.filter(t => t.userId != this.props.user.id)

    if (typingUsers.length == 0) {
      return ''
    } else {
      return typingUsers.map(t => t.userName).join(', ') + ' is typing'
    }
  }

  scrollToBottom() {
    // If there is no scroll ref
    if (!this.scrollRef) return

    // If the user is scrolling
    if (this.state.manualScrolling) return

    // Move it right down
    this.scrollRef.scrollTop = this.scrollRef.scrollHeight
  }

  handleScrollEvent(e) {
    const offsetHeight = this.scrollRef.scrollHeight - this.scrollRef.scrollTop

    if (this.scrollRef.scrollTop == 0) this.fetchRoomMessages()

    if (this.scrollRef.offsetHeight >= offsetHeight) {
      this.setState({ manualScrolling: false })
    } else {
      this.setState({ manualScrolling: true })
    }
  }

  async fetchRoom(roomId) {
    try {
      const { data } = await GraphqlService.getInstance().room(roomId)

      // Populate our room - this will fetch page 0 of messages
      this.props.hydrateRoom(data.room)

      // Clear all the markers for read/unread
      DatabaseService.getInstance().read(roomId)
    } catch (e) {}
  }

  async fetchRoomMessages() {
    // Don't refetch messages every time it's triggered
    // We need to wait if there's already a fetch in progress
    if (this.state.busy) return

    // Set it as busy to not allow more messages to be fetch
    this.setState({ busy: true })

    // Get new messages - start from page 1
    // populating the room always fetches from page 0
    const roomId = this.props.room.id
    const { page } = this.state

    try {
      const { data } = await GraphqlService.getInstance().roomMessages(roomId, page)

      // Add the new messages to the room
      this.props.hydrateRoomMessages(data.roomMessages)

      // Increase the next page & open the scroll event for more messages fetches
      this.setState({
        page: this.state.page + 1,
        busy: false,
      })
    } catch (e) {}
  }

  componentDidMount() {
    if (this.state.open) this.fetchRoom(this.props.match.params.roomId)

    // Here we handle the delay for the yser typing in the search field
    this.subscription = this.onSearch$.pipe(debounceTime(250)).subscribe(debounced => this.fetchResults())

    // Event listener for the scroll
    this.scrollRef.addEventListener('scroll', this.handleScrollEvent)
    this.setState({ manualScrolling: false })
  }

  componentDidUpdate(prevProps) {
    // Scroll to the correct position after fetchRoomMessages
    // if (this.state.scrollHeight != this.scrollRef.scrollHeight) this.scrollRef.scrollTop = this.scrollRef.scrollHeight - this.state.scrollHeight
    // If the room ID updates - then refetch all the data
    if (this.props.match.params.roomId != prevProps.match.params.roomId) {
      if (this.state.open) this.fetchRoom(this.props.match.params.roomId)
    }

    // Scroll down
    this.scrollToBottom()
  }

  componentWillUnmount() {
    this.scrollRef.removeEventListener('scroll', this.handleScrollEvent)
    if (this.subscription) this.subscription.unsubscribe()
  }

  async updateUserStarred(starred) {
    const userId = this.props.user.id
    const roomId = this.props.room.id

    try {
      await GraphqlService.getInstance().updateUserStarred(userId, roomId, starred)

      this.props.updateUserStarred(roomId, starred)
    } catch (e) {}
  }

  async updateRoomVisibility(updatedRoomVisibility) {
    const roomId = this.props.room.id
    const teamId = this.props.team.id

    // These messages have to be sent to the team
    if (!updatedRoomVisibility.public) MessagingService.getInstance().leaveRoomTeam(teamId, roomId)
    if (updatedRoomVisibility.public) MessagingService.getInstance().joinRoomTeam(teamId, roomId)

    try {
      await GraphqlService.getInstance().updateRoom(roomId, updatedRoomVisibility)

      this.setState({ visibilityMenu: false })
      this.props.updateRoom(roomId, updatedRoomVisibility)
    } catch (e) {}
  }

  setUpdateMessage(message) {
    this.setState({ message, update: true, reply: false })
  }

  setReplyMessage(message) {
    this.setState({ message, update: false, reply: true })
  }

  static getDerivedStateFromProps(props, state) {
    if (props.room.id == undefined || props.room.id == '') return null

    const isMember = !!props.room.members.filter(member => member.user.id == props.user.id).flatten()
    const isPublic = props.room.public
    const open = isMember || isPublic
    const starred = props.user.starred.indexOf(props.room.id) != -1
    const muted = props.user.muted.indexOf(props.room.id) != -1
    const archived = props.user.archived.indexOf(props.room.id) != -1

    const title = props.room.private
      ? props.room.members
          .map(member => member.user.name)
          .filter(name => name != props.user.name)
          .flatten()
      : props.room.title

    const image = props.room.private
      ? props.room.members
          .map(member => member.user.image)
          .filter(image => image != props.user.image)
          .flatten()
      : props.room.image

    return {
      open,
      title,
      image,
      starred,
    }
  }

  // prettier-ignore
  render() {
    return (
      <React.Fragment>
        {this.state.roomUpdateModal &&
          <RoomModal
            id={this.props.room.id}
            members={this.props.room.members}
            start={this.state.roomUpdateModalStart}
            onClose={() => this.setState({ roomUpdateModal: false })}
          />
        }

        <Room className="column flexer align-items-center align-items-stretch">
          {!this.state.open &&
            <Blocked>
              Sorry, you are not allowed to view this channel
            </Blocked>
          }

          {/* Only show the header to people who can see this room */}
          {this.state.open &&
            <Header className="row">
              <Avatar
                image={this.state.image}
                title={this.state.title}
                size="medium"
              />

              <div className="column ml-10">
                <HeaderTitle>
                  {this.state.title}
                </HeaderTitle>

                {/* Member header subtitle */}
                <div className="row">
                  <HeaderText>
                    {this.props.room.members.length.numberShorthand()} &nbsp;
                    {this.props.room.members.length == 1 ? "member" : "members"}
                  </HeaderText>

                  {!this.props.room.private &&
                    <div
                      className="ml-10 row button"
                      onClick={() => this.setState({ roomUpdateModal: true, roomUpdateModalStart: 1 })}>
                      <FontAwesomeIcon
                        className="mr-5"
                        icon={["fal", "plus"]}
                        color="#007af5"
                        size="xs"
                      />
                      <HeaderLink>Add New</HeaderLink>
                    </div>
                  }
                </div>
              </div>

              <div className="flexer"></div>

              <HeaderSearchContainer
                className="row"
                focus={this.state.searchFocus}>
                <FontAwesomeIcon
                  icon={["far", "search"]}
                  color="#acb5bd"
                  size="sm"
                  className="ml-10 mr-10"
                />

                <HeaderSearchInput
                  placeholder="Search"
                  value={this.state.searchQuery}
                  onChange={this.onSearch}
                  onFocus={() => this.setState({ searchFocus: true })}
                  onBlur={() => this.setState({ searchFocus: false })}
                />

                {this.state.searchResults &&
                  <FontAwesomeIcon
                    className="button"
                    icon={["fal", "times"]}
                    color="#acb5bd"
                    size="sm"
                    onClick={() => this.setState({ searchResults: null, searchQuery: '' })}
                  />
                }
              </HeaderSearchContainer>

              {this.props.room.apps.map((app, index) => {
                if (!app.active) return
                if (!app.app.shortcuts) return
                if (app.app.shortcuts.length == 0) return

                return (
                  <React.Fragment key={index}>
                    {app.app.shortcuts.map((action, i) => {
                      return (
                        <AppIconContainer key={i} onClick={() => this.handleActionClick(action)}>
                          <AppIconImage image={action.icon} />
                        </AppIconContainer>
                      )
                    })}
                  </React.Fragment>
                )
              })}

              <HeaderButton onClick={() => this.updateUserStarred(!this.state.starred)} className="mr-15 ml-15">
                {this.state.starred && <FontAwesomeIcon icon={["fal", "star"]} color="#EBB403" size="lg" />}
                {!this.state.starred && <FontAwesomeIcon icon={["fal", "star"]} color="#babec9" size="lg" />}
              </HeaderButton>

              {!this.props.room.private &&
                <React.Fragment>
                  <FontAwesomeIcon
                    icon={["fal", "info-circle"]}
                    color="#acb5bd"
                    size="lg"
                    className="mr-15 button"
                    onClick={() => this.setState({ roomUpdateModal: true, roomUpdateModalStart: 0 })}
                  />

                  <FontAwesomeIcon
                    icon={["fal", "at"]}
                    color="#acb5bd"
                    size="lg"
                    className="mr-15 button"
                    onClick={() => this.setState({ roomUpdateModal: true, roomUpdateModalStart: 1 })}
                  />

                  <Popup
                    handleDismiss={() => this.setState({ visibilityMenu: false })}
                    visible={this.state.visibilityMenu}
                    width={275}
                    direction="right-bottom"
                    content={
                      <Menu
                        items={[
                          { hide: this.props.room.private, icon: <FontAwesomeIcon icon={["fal", "eye"]} color="#acb5bd" size="lg" />, text: "Public", label: 'Everyone in your team has access', onClick: (e) => this.updateRoomVisibility({ private: false, public: true }) },
                          { hide: this.props.room.private, icon: <FontAwesomeIcon icon={["fal", "low-vision"]} color="#acb5bd" size="lg" />, text: "Private", label: 'Only members of this channel have access', onClick: (e) => this.updateRoomVisibility({ private: false, public: false }) },
                        ]}
                      />
                    }>
                    <HeaderButton onClick={() => this.setState({ visibilityMenu: true })}>
                      {this.props.room.public && <FontAwesomeIcon icon={["fal", "eye"]} color="#babec9" size="lg" />}
                      {!this.props.room.public && <FontAwesomeIcon icon={["fal", "low-vision"]} color="#babec9" size="lg" />}
                    </HeaderButton>
                  </Popup>
                </React.Fragment>
              }
            </Header>
          }

          {this.props.room.public &&
            <Notification
              text="This team channel is public"
            />
          }

          <MessagesContainer ref={(ref) => this.scrollRef = ref}>
            {/* Primary message list + header */}
            {this.state.open && !this.state.searchResults &&
              <React.Fragment>
                {this.props.room.private && <PaddingToKeepMessagesDown />}

                {!this.props.room.private &&
                  <Welcome>
                    <WelcomeUser className="row">
                      <Avatar
                        title={this.props.room.user.name}
                        image={this.props.room.user.image}
                        size="small"
                      />

                      <WelcomeUserName>
                        Started by {this.props.room.user.name} - {moment(this.props.room.createdAt).fromNow()}
                      </WelcomeUserName>
                    </WelcomeUser>

                    <WelcomeTitle>
                      {this.state.title}
                    </WelcomeTitle>

                    {this.props.room.description &&
                      <WelcomeDescription>
                        <ReactMarkdown source={this.props.room.description} />
                      </WelcomeDescription>
                    }

                    {/* If there is no room description */}
                    {/* Then give the user the option to update it */}
                    {!this.props.room.description &&
                      <WelcomeDescriptionUpdate
                        className="button"
                        onClick={() => this.setState({ roomUpdateModal: true, roomUpdateModalStart: 0 })}>
                        Add some more context about this conversation here
                      </WelcomeDescriptionUpdate>
                    }
                  </Welcome>
                }

                <MessagesInner ref={(ref) => this.messagesRef = ref}>
                  <MessagesComponent
                    messages={this.props.room.messages}
                    highlight={this.state.searchQuery}
                    setUpdateMessage={this.setUpdateMessage}
                    setReplyMessage={this.setReplyMessage}
                  />
                </MessagesInner>
              </React.Fragment>
            }

            {/* Search result display */}
            {/* We use the welcome style do display search info */}
            {this.state.open && this.state.searchResults &&
              <React.Fragment>
                <Welcome>
                  <WelcomeDescription>
                    <ReactMarkdown source={`Your search returned ${this.state.searchResults.length} ${this.state.searchResults.length == 1 ? "message" : "messages"}`} />
                  </WelcomeDescription>
                </Welcome>

                <MessagesInner ref={(ref) => this.messagesRef = ref}>
                  <MessagesComponent
                    messages={this.state.searchResults}
                    highlight={this.state.searchQuery}
                    setUpdateMessage={this.setUpdateMessage}
                    setReplyMessage={this.setReplyMessage}
                  />
                </MessagesInner>
              </React.Fragment>
            }
          </MessagesContainer>

          <Typing>
            {this.composeTypingNames()}
          </Typing>

          {this.state.open &&
            <ComposeComponent
              reply={this.state.reply}
              update={this.state.update}
              message={this.state.message}
              clearMessage={() => this.setState({ message: null, update: false, reply: false })}
            />
          }
        </Room>
      </React.Fragment>
    )
  }
}

RoomComponent.propTypes = {
  team: PropTypes.any,
  room: PropTypes.any,
  user: PropTypes.any,
  hydrateRoom: PropTypes.func,
  hydrateRoomMessages: PropTypes.func,
  updateRoom: PropTypes.func,
  updateUserStarred: PropTypes.func,
}

const mapDispatchToProps = {
  hydrateRoom: room => hydrateRoom(room),
  hydrateRoomMessages: messages => hydrateRoomMessages(messages),
  updateRoom: (roomId, updatedRoom) => updateRoom(roomId, updatedRoom),
  updateUserStarred: (roomId, starred) => updateUserStarred(roomId, starred),
}

const mapStateToProps = state => {
  return {
    team: state.team,
    user: state.user,
    room: state.room,
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(RoomComponent)
