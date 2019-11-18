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
import { openApp, updateLoading, updateError, deleteRoom, updateUserStarred, hydrateRoom, createRoomMember, updateRoom, hydrateRoomMessages } from '../actions'
import ComposeComponent from '../components/compose.component'
import { Popup, Menu, Avatar, Spinner, Notification } from '@weekday/elements'
import QuickUserComponent from '../components/quick-user.component'
import { Subject } from 'rxjs'
import { debounceTime } from 'rxjs/operators'
import MessagesComponent from './messages.component'
import { IconComponent } from './icon.component'
import Keg from '@joduplessis/keg'

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
      isDragging: false,
      permissible: false,
    }

    this.messagesRef = React.createRef()
    this.scrollRef = React.createRef()
    this.dropZone = React.createRef()
    this.dropMask = React.createRef()

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

    this.onDragOver = this.onDragOver.bind(this)
    this.onDragEnd = this.onDragEnd.bind(this)
    this.onDrop = this.onDrop.bind(this)

    this.onSearch$ = new Subject()
    this.subscription = null
  }

  handleActionClick(action, payload = null) {
    this.props.openApp(action, payload)
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

  onDragOver(e) {
    e.stopPropagation()
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'

    this.setState({ isDragging: true })
  }

  onDragEnd(e) {
    e.stopPropagation()
    e.preventDefault()

    this.setState({ isDragging: false })
  }

  onDrop(e) {
    e.stopPropagation()
    e.preventDefault()

    this.setState({ isDragging: false })

    const files = e.dataTransfer.files || []

    if (files.length == 0) return

    for (let file of files) {
      Keg.keg('compose').refill('uploads', file)
    }
  }

  componentDidMount() {
    if (this.state.open) this.fetchRoom(this.props.match.params.roomId)

    // Here we handle the delay for the yser typing in the search field
    this.subscription = this.onSearch$.pipe(debounceTime(250)).subscribe(debounced => this.fetchResults())

    // Event listener for the scroll
    this.scrollRef.addEventListener('scroll', this.handleScrollEvent)
    this.setState({ manualScrolling: false })

    // Drag event listeners
    this.dropZone.addEventListener('dragover', this.onDragOver)
    this.dropMask.addEventListener('dragleave', this.onDragEnd)
    this.dropMask.addEventListener('dragend', this.onDragEnd)
    this.dropMask.addEventListener('drop', this.onDrop)
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
    this.dropZone.removeEventListener('dragover', this.onDragOver)
    this.dropMask.removeEventListener('dragleave', this.onDragEnd)
    this.dropMask.removeEventListener('dragend', this.onDragEnd)
    this.dropMask.removeEventListener('drop', this.onDrop)

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
    const permissible = props.team.role == 'ADMIN' || props.room.user.id == props.user.id

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
      permissible,
    }
  }

  // prettier-ignore
  render() {
    return (
      <React.Fragment>
        {this.state.roomUpdateModal &&
          <RoomModal
            permissible={this.state.permissible}
            id={this.props.room.id}
            members={this.props.room.members}
            start={this.state.roomUpdateModalStart}
            onClose={() => this.setState({ roomUpdateModal: false })}
          />
        }

        <Room ref={ref => this.dropZone = ref} className="column flexer align-items-center align-items-stretch">
          <Dropzone active={this.state.isDragging} ref={ref => this.dropMask = ref}>
            <svg
              enableBackground="new 0 0 511.999 511.999"
              height={100}
              width={100}
              viewBox="0 0 511.999 511.999">
                <g>
                  <path d="m422.651 225.765v248.961c0 20.586-16.688 37.273-37.273 37.273h-306.206c-20.586 0-37.273-16.688-37.273-37.273v-390.003c0-20.591 16.692-37.273 37.273-37.273h165.159z" fill="#bed8fb"/>
                  <path d="m126.622 464.55c-20.586 0-37.273-16.688-37.273-37.273v-390.004c-.001-20.591 16.691-37.273 37.273-37.273h165.158c28.395 0 178.32 149.924 178.32 178.316v248.961c0 20.586-16.688 37.273-37.273 37.273z" fill="#ddeafb"/>
                  <path d="m470.1 178.319v15.767c0-33.195-26.918-60.113-60.113-60.113h-36.587c-20.581 0-37.273-16.692-37.273-37.273v-36.587c0-33.195-26.918-60.113-60.113-60.113h15.767c28.39 0 55.627 11.28 75.701 31.355l71.264 71.264c20.073 20.074 31.354 47.31 31.354 75.7z" fill="#bed8fb"/>
                  <g fill="#80b4fb">
                    <path d="m242.615 284.564v108.975c0 4.701 3.811 8.512 8.512 8.512h57.194c4.701 0 8.512-3.811 8.512-8.512v-108.975h24.315c7.583 0 11.381-9.168 6.019-14.53l-54.331-54.331c-7.241-7.241-18.982-7.241-26.223 0l-54.331 54.331c-5.362 5.362-1.564 14.53 6.019 14.53z"/>
                    <path d="m213.396 185.797h132.656c9.161 0 16.587-7.426 16.587-16.587v-.456c0-9.161-7.426-16.587-16.587-16.587h-132.656c-9.161 0-16.587 7.426-16.587 16.587v.456c0 9.16 7.426 16.587 16.587 16.587z"/>
                  </g>
                </g>
              </svg>
              <div className="h2 color-d4 mt-30">Drop Files</div>
              <div className="h5 color-d1 mt-30">Drop your files here to upload</div>
          </Dropzone>

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

                  {!this.props.room.private && this.state.permissible &&
                    <div
                      className="ml-10 row button"
                      onClick={() => this.setState({ roomUpdateModal: true, roomUpdateModalStart: 1 })}>
                      <IconComponent
                        icon="plus"
                        size={15}
                        color="#007af5"
                        thickness={2}
                        className="mr-5"
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
                <IconComponent
                  icon="search"
                  size={15}
                  color="#acb5bd"
                  thickness={2}
                  className="ml-10 mr-10"
                  onClick={() => this.setState({ searchResults: null, searchQuery: '' })}
                />

                <HeaderSearchInput
                  placeholder="Search"
                  value={this.state.searchQuery}
                  onChange={this.onSearch}
                  onFocus={() => this.setState({ searchFocus: true })}
                  onBlur={() => this.setState({ searchFocus: false })}
                />

                {this.state.searchResults &&
                  <IconComponent
                    icon="x"
                    size={15}
                    thickness={2}
                    color="#acb5bd"
                    className="button"
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

              <IconComponent
                icon="star"
                size={20}
                thickness={1.5}
                color={this.state.starred ? "#edd264" : "#babec9"}
                onClick={() => this.updateUserStarred(!this.state.starred)}
                className="ml-15 button"
              />

              {!this.props.room.private &&
                <React.Fragment>
                  <IconComponent
                    icon="info"
                    size={20}
                    color="#acb5bd"
                    thickness={1.5}
                    className="ml-15 button"
                    onClick={() => this.setState({ roomUpdateModal: true, roomUpdateModalStart: 0 })}
                  />

                  <IconComponent
                    icon="users"
                    size={26}
                    thickness={0}
                    color="#acb5bd"
                    className="ml-15 button"
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
                          { hide: this.props.room.private, icon: <IconComponent icon="eye" size={20} color="#acb5bd" />, text: "Public", label: 'Everyone in your team has access', onClick: (e) => this.updateRoomVisibility({ private: false, public: true }) },
                          { hide: this.props.room.private, icon: <IconComponent icon="eye-off" size={20} color="#acb5bd" />, text: "Private", label: 'Members of this channel only', onClick: (e) => this.updateRoomVisibility({ private: false, public: false }) },
                        ]}
                      />
                    }>
                    <IconComponent
                      icon={this.props.room.public ? "eye" : "eye-off"}
                      size={20}
                      thickness={1.5}
                      color="#acb5bd"
                      className="ml-15 button"
                      onClick={() => this.state.permissible ? this.setState({ visibilityMenu: true }) : null}
                    />
                  </Popup>
                </React.Fragment>
              }
            </Header>
          }

          {(this.props.room.public && !this.props.room.public) &&
            <Notification text="This team channel is public" />
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
                    {/* But only if they can */}
                    {!this.props.room.description && this.state.permissible &&
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
  openApp: PropTypes.func,
}

const mapDispatchToProps = {
  hydrateRoom: room => hydrateRoom(room),
  hydrateRoomMessages: messages => hydrateRoomMessages(messages),
  updateRoom: (roomId, updatedRoom) => updateRoom(roomId, updatedRoom),
  updateUserStarred: (roomId, starred) => updateUserStarred(roomId, starred),
  openApp: (action, payload) => openApp(action, payload),
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

const Dropzone = styled.div`
  background: rgba(255, 255, 255, 0.8);
  height: 100%;
  width: 100%;
  z-index: 10;
  position: absolute;
  top: 0px;
  left: 0px;
  display: ${props => props.active ? 'flex' : 'none'};
  flex-direction: column;
  align-items: center;
  align-content: center;
  justify-content: center;
`

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
    padding: 0px;
    margin: 0px;
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
  background-repeat: no-repeat;
  background-image: url(${props => props.image});
`
