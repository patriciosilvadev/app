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
import ChannelModal from '../modals/channel.modal'
import ReactMarkdown from 'react-markdown'
import MessagingService from '../services/messaging.service'
import DatabaseService from '../services/database.service'
import ConfirmModal from '../modals/confirm.modal'
import { openApp, updateLoading, updateError, deleteChannel, updateUserStarred, hydrateChannel, createChannelMember, updateChannel, hydrateChannelMessages } from '../actions'
import ComposeComponent from '../components/compose.component'
import { Popup, Menu, Avatar, Spinner, Notification } from '@weekday/elements'
import QuickUserComponent from '../components/quick-user.component'
import { Subject } from 'rxjs'
import { debounceTime } from 'rxjs/operators'
import MessagesComponent from './messages.component'
import { IconComponent } from './icon.component'
import Keg from '@joduplessis/keg'

class ChannelComponent extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      manualScrolling: false,
      busy: false,
      page: 1,
      open: true,
      title: '',
      image: '',
      channelUpdateModal: false,
      channelUpdateModalStart: 0,
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
    this.updateChannelVisibility = this.updateChannelVisibility.bind(this)
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

  handleActionClick(action) {
    this.props.openApp(action)
  }

  onSearch(e) {
    const query = e.target.value
    this.setState({ searchQuery: query })
    this.onSearch$.next(query)
  }

  async fetchResults() {
    if (this.state.searchQuery == '') return this.setState({ searchResults: null })

    const query = this.state.searchQuery
    const channelId = this.props.channel.id

    try {
      const { data } = await GraphqlService.getInstance().searchMessages(channelId, query)

      // Update our UI with our results
      // Remove ourselves
      this.setState({ searchResults: data.searchMessages })
    } catch (e) {}
  }

  composeTypingNames() {
    // Don't include ourselves
    const typingUsers = this.props.channel.typing.filter(t => t.userId != this.props.user.id)

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

    if (this.scrollRef.scrollTop == 0) this.fetchChannelMessages()

    if (this.scrollRef.offsetHeight >= offsetHeight) {
      this.setState({ manualScrolling: false })
    } else {
      this.setState({ manualScrolling: true })
    }
  }

  async fetchChannel(channelId) {
    try {
      const { data } = await GraphqlService.getInstance().channel(channelId)

      // Populate our channel - this will fetch page 0 of messages
      this.props.hydrateChannel(data.channel)

      // Clear all the markers for read/unread
      DatabaseService.getInstance().read(channelId)
    } catch (e) {}
  }

  async fetchChannelMessages() {
    // Don't refetch messages every time it's triggered
    // We need to wait if there's already a fetch in progress
    if (this.state.busy) return

    // Set it as busy to not allow more messages to be fetch
    this.setState({ busy: true })

    // Get new messages - start from page 1
    // populating the channel always fetches from page 0
    const channelId = this.props.channel.id
    const { page } = this.state

    try {
      const { data } = await GraphqlService.getInstance().channelMessages(channelId, page)

      // Add the new messages to the channel
      this.props.hydrateChannelMessages(data.channelMessages)

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
    if (this.state.open) this.fetchChannel(this.props.match.params.channelId)

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
    // Scroll to the correct position after fetchChannelMessages
    // if (this.state.scrollHeight != this.scrollRef.scrollHeight) this.scrollRef.scrollTop = this.scrollRef.scrollHeight - this.state.scrollHeight
    // If the channel ID updates - then refetch all the data
    if (this.props.match.params.channelId != prevProps.match.params.channelId) {
      if (this.state.open) this.fetchChannel(this.props.match.params.channelId)
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
    const channelId = this.props.channel.id

    try {
      await GraphqlService.getInstance().updateUserStarred(userId, channelId, starred)

      this.props.updateUserStarred(channelId, starred)
    } catch (e) {}
  }

  async updateChannelVisibility(updatedChannelVisibility) {
    const channelId = this.props.channel.id
    const teamId = this.props.team.id

    // These messages have to be sent to the team
    if (!updatedChannelVisibility.public) MessagingService.getInstance().leaveChannelTeam(teamId, channelId)
    if (updatedChannelVisibility.public) MessagingService.getInstance().joinChannelTeam(teamId, channelId)

    try {
      await GraphqlService.getInstance().updateChannel(channelId, updatedChannelVisibility)

      this.setState({ visibilityMenu: false })
      this.props.updateChannel(channelId, updatedChannelVisibility)
    } catch (e) {}
  }

  setUpdateMessage(message) {
    this.setState({ message, update: true, reply: false })
  }

  setReplyMessage(message) {
    this.setState({ message, update: false, reply: true })
  }

  static getDerivedStateFromProps(props, state) {
    if (props.channel.id == undefined || props.channel.id == '') return null

    const isMember = !!props.channel.members.filter(member => member.user.id == props.user.id).flatten()
    const isPublic = props.channel.public
    const open = isMember || isPublic
    const starred = props.user.starred.indexOf(props.channel.id) != -1
    const muted = props.user.muted.indexOf(props.channel.id) != -1
    const archived = props.user.archived.indexOf(props.channel.id) != -1
    const permissible = props.team.role == 'ADMIN' || props.channel.user.id == props.user.id

    const title = props.channel.private
      ? props.channel.members
          .map(member => member.user.name)
          .filter(name => name != props.user.name)
          .flatten()
      : props.channel.title

    const image = props.channel.private
      ? props.channel.members
          .map(member => member.user.image)
          .filter(image => image != props.user.image)
          .flatten()
      : props.channel.image

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
        {this.state.channelUpdateModal &&
          <ChannelModal
            permissible={this.state.permissible}
            id={this.props.channel.id}
            members={this.props.channel.members}
            start={this.state.channelUpdateModalStart}
            onClose={() => this.setState({ channelUpdateModal: false })}
          />
        }

        <Channel ref={ref => this.dropZone = ref} className="column flexer align-items-center align-items-stretch">
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
              Sorry, you are not allowed to view this
            </Blocked>
          }

          {/* Only show the header to people who can see this channel */}
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
                    {this.props.channel.members.length.numberShorthand()} &nbsp;
                    {this.props.channel.members.length == 1 ? "member" : "members"}
                  </HeaderText>

                  {!this.props.channel.private && this.state.permissible &&
                    <div
                      className="ml-10 row button"
                      onClick={() => this.setState({ channelUpdateModal: true, channelUpdateModalStart: 1 })}>
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

              {this.props.channel.apps.filter(app => app.active).map((app, index) => {
                if (!app.active) return
                if (!app.app.shortcuts) return
                if (app.app.shortcuts.length == 0) return

                return (
                  <React.Fragment key={index}>
                    {app.app.shortcuts.map((button, i) => {
                      return (
                        <AppIconContainer key={i} onClick={() => this.handleActionClick({
                            ...button.action,
                            token: app.token,
                          })}>
                          <AppIconImage image={button.icon} />
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

              {!this.props.channel.private &&
                <React.Fragment>
                  <IconComponent
                    icon="info"
                    size={20}
                    color="#acb5bd"
                    thickness={1.5}
                    className="ml-15 button"
                    onClick={() => this.setState({ channelUpdateModal: true, channelUpdateModalStart: 0 })}
                  />

                  <IconComponent
                    icon="users"
                    size={26}
                    thickness={0}
                    color="#acb5bd"
                    className="ml-15 button"
                    onClick={() => this.setState({ channelUpdateModal: true, channelUpdateModalStart: 1 })}
                  />

                  <Popup
                    handleDismiss={() => this.setState({ visibilityMenu: false })}
                    visible={this.state.visibilityMenu}
                    width={275}
                    direction="right-bottom"
                    content={
                      <Menu
                        items={[
                          { hide: this.props.channel.private, icon: <IconComponent icon="eye" size={20} color="#acb5bd" />, text: "Public", label: 'Everyone in your team has access', onClick: (e) => this.updateChannelVisibility({ private: false, public: true }) },
                          { hide: this.props.channel.private, icon: <IconComponent icon="eye-off" size={20} color="#acb5bd" />, text: "Private", label: 'Members of this channel only', onClick: (e) => this.updateChannelVisibility({ private: false, public: false }) },
                        ]}
                      />
                    }>
                    <IconComponent
                      icon={this.props.channel.public ? "eye" : "eye-off"}
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

          {(this.props.channel.public && !this.props.channel.public) &&
            <Notification text="This team channel is public" />
          }

          <MessagesContainer ref={(ref) => this.scrollRef = ref}>
            {/* Primary message list + header */}
            {this.state.open && !this.state.searchResults &&
              <React.Fragment>
                {this.props.channel.private && <PaddingToKeepMessagesDown />}

                {!this.props.channel.private &&
                  <Welcome>
                    <WelcomeUser className="row">
                      <Avatar
                        title={this.props.channel.user.name}
                        image={this.props.channel.user.image}
                        size="small"
                      />

                      <WelcomeUserName>
                        Started by {this.props.channel.user.name} - {moment(this.props.channel.createdAt).fromNow()}
                      </WelcomeUserName>
                    </WelcomeUser>

                    <WelcomeTitle>
                      {this.state.title}
                    </WelcomeTitle>

                    {this.props.channel.description &&
                      <WelcomeDescription>
                        <ReactMarkdown source={this.props.channel.description} />
                      </WelcomeDescription>
                    }

                    {/* If there is no channel description */}
                    {/* Then give the user the option to update it */}
                    {/* But only if they can */}
                    {!this.props.channel.description && this.state.permissible &&
                      <WelcomeDescriptionUpdate
                        className="button"
                        onClick={() => this.setState({ channelUpdateModal: true, channelUpdateModalStart: 0 })}>
                        Add some more context about this conversation here
                      </WelcomeDescriptionUpdate>
                    }
                  </Welcome>
                }

                <MessagesInner ref={(ref) => this.messagesRef = ref}>
                  <MessagesComponent
                    messages={this.props.channel.messages}
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
        </Channel>
      </React.Fragment>
    )
  }
}

ChannelComponent.propTypes = {
  team: PropTypes.any,
  channel: PropTypes.any,
  user: PropTypes.any,
  hydrateChannel: PropTypes.func,
  hydrateChannelMessages: PropTypes.func,
  updateChannel: PropTypes.func,
  updateUserStarred: PropTypes.func,
  openApp: PropTypes.func,
}

const mapDispatchToProps = {
  hydrateChannel: channel => hydrateChannel(channel),
  hydrateChannelMessages: messages => hydrateChannelMessages(messages),
  updateChannel: (channelId, updatedChannel) => updateChannel(channelId, updatedChannel),
  updateUserStarred: (channelId, starred) => updateUserStarred(channelId, starred),
  openApp: action => openApp(action),
}

const mapStateToProps = state => {
  return {
    team: state.team,
    user: state.user,
    channel: state.channel,
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ChannelComponent)

const Dropzone = styled.div`
  background: rgba(255, 255, 255, 0.8);
  height: 100%;
  width: 100%;
  z-index: 10;
  position: absolute;
  top: 0px;
  left: 0px;
  display: ${props => (props.active ? 'flex' : 'none')};
  flex-direction: column;
  align-items: center;
  align-content: center;
  justify-content: center;
`

const Channel = styled.div`
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
