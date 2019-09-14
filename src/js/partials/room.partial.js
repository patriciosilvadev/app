import React from 'react'
import { connect } from 'react-redux'
import { Avatar } from '@weekday/elements'
import UploadService from '../services/upload.service'
import MessageComponent from '../components/message.component'
import '../helpers/extensions'
import ComposeComponent from '../components/compose.component'
import styled from 'styled-components'
import PropTypes from 'prop-types'
import EventService from '../services/event.service'
import { fetchRoom, createRoomMember, updateRoom, fetchRoomMessages, createRoomMessage, createRoomMessageReply, createRoomMessageReaction, deleteRoomMessageReaction } from '../actions'
import { Button } from '@weekday/elements'

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
  background: #202529;
  background: white;
  padding 15px 25px 15px 25px;
`

const HeaderTitle = styled.div`
  cursor: pointer;
  font-size: 24px;
  font-weight: 700;
  font-style: normal;
  color: #040b1c;
  padding-left: 15px;
`

const HeaderDescription = styled.div`
  margin-left: 10px;
  padding: 10px;
  border-radius: 5px;
  cursor: pointer;
  color: #adb5bd;
  font-size: 14px;
  font-weight: 400;
  display: inline-block;
  border: 2px solid white;

  &:hover,
  &:focus {
    border: 2px solid #EEF2F7;
  }
`

const Messages = styled.div`
  flex: 1;
  overflow: scroll;
  width: 100%;
  border-bottom: 1px solid #f1f3f5;
`

const MessagesContainer = styled.div`
  width: 100%;
  padding: 25px;
  height: 1px; /* Important for the height to be set here */
`

const Joinable = styled.div`
  padding: 25px;
  width: 100%;
`

const JoinableText = styled.div`
  font-size: 13px;
  font-weight: 500;
  color: #343a40;
  padding-left: 10px;
`

const Blocked = styled.div`
  font-size: 13px;
  font-weight: 500;
  color: #343a40;
  padding: 10px;
`

class RoomPartial extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      manualScrolling: false,
      busy: false,
      page: 0,
      blocked: true,
      unblocked: false,
      open: false,
      title: '',
      image: '',
    }

    this.messagesRef = React.createRef()
    this.scrollRef = React.createRef()
    this.avatarRef = React.createRef()
    this.titleRef = React.createRef()
    this.descriptionRef = React.createRef()

    this.handleAvatarChange = this.handleAvatarChange.bind(this)
    this.handleScrollEvent = this.handleScrollEvent.bind(this)

    this.updateRoomDescription = this.updateRoomDescription.bind(this)
    this.updateRoomTitle = this.updateRoomTitle.bind(this)
    this.updateRoomImage = this.updateRoomImage.bind(this)
    this.joinRoom = this.joinRoom.bind(this)
    this.createRoomMessage = this.createRoomMessage.bind(this)
  }

  scrollToBottom() {
    if (this.scrollRef) this.scrollRef.scrollTop = this.scrollRef.scrollHeight
  }

  async handleAvatarChange(e) {
    if (e.target.files.length == 0) return

    try {
      const result = await new UploadService(e.target.files[0])
      const { data, mime } = await result.json()
      const { Location } = data

      // Update the room
      this.updateRoomImage(Location)
    } catch (e) {}
  }

  handleScrollEvent(e) {
    if (this.scrollRef.scrollTop == 0) this.fetchRoomMessages()

    if (this.scrollRef.offsetHeight == this.scrollRef.scrollHeight - this.scrollRef.scrollTop + 1) {
      this.setState({ manualScrolling: false })
    } else {
      this.setState({ manualScrolling: true })
    }
  }

  updateRoomDescription(e) {
    this.props.updateRoom({ description: e.target.innerText })
  }

  updateRoomTitle(e) {
    this.props.updateRoom({ title: e.target.innerText })
  }

  updateRoomImage(image) {
    this.props.updateRoom({ image })
  }

  joinRoom() {
    this.props.createRoomMember({
      id: this.props.common.user.id,
      name: this.props.common.user.name,
      email: this.props.common.user.email,
      username: this.props.common.user.username,
      image: this.props.common.user.image,
      role: this.props.common.user.role,
      color: this.props.common.user.color,
    })
  }

  createRoomMessage(text, attachments) {
    this.props.createRoomMessage(text, attachments)

    // Scroll down
    this.scrollToBottom()

    // Reset the state
    this.setState({
      manualScrolling: false,
      text: '',
      attachments: [],
    })
  }

  fetchRoomMessages() {
    if (this.state.busy) return

    // Get new messages
    this.props.fetchRoomMessages(this.state.page)

    // Save the height of the messages area
    // Important for when we update their scroll position
    this.setState({
      page: this.state.page + 1,
      busy: true,
    })
  }

  fetchedRoomMessages() {
    this.setState({ busy: false })
  }

  componentDidMount() {
    this.props.fetchRoom(this.props.match.params.roomId)

    // Event listener for the scroll
    this.scrollRef.addEventListener('scroll', this.handleScrollEvent)
    this.setState({ manualScrolling: false })

    // Keep it scrolled down if they remain at the bottom
    // and if it's not on manual
    setInterval(() => {
      if (!this.state.manualScrolling && this.scrollRef) this.scrollToBottom()
    }, 500)

    // Enabling/disabling message fetches - always true
    EventService.get().on('fetchedRoomMessages', payload => {
      this.fetchedRoomMessages()
    })
  }

  componentDidUpdate(prevProps) {
    // Scroll to the correct position after fetchRoomMessages
    // if (this.state.scrollHeight != this.scrollRef.scrollHeight) this.scrollRef.scrollTop = this.scrollRef.scrollHeight - this.state.scrollHeight
    // If the room ID updates - then refetch all the data
    if (this.props.match.params.roomId != prevProps.match.params.roomId) this.props.fetchRoom(this.props.match.params.roomId)
  }

  componentWillUnmount() {
    this.scrollRef.removeEventListener('scroll', this.handleScrollEvent)
  }

  static getDerivedStateFromProps(props, state) {
    if (props.room.id == undefined || props.room.id == '') return null

    const open = !!props.room.members.filter(member => member.user.id == props.common.user.id).flatten()
    const blocked = !open && (props.room.private || !props.room.public)
    const unblocked = !open && !props.room.private && props.room.public
    const title = props.room.private
      ? props.room.members
          .map(member => member.user.name)
          .filter(name => name != props.common.user.name)
          .flatten()
      : props.room.title
    const image = props.room.private
      ? props.room.members
          .map(member => member.user.image)
          .filter(image => image != props.common.user.image)
          .flatten()
      : props.room.image

    return {
      open,
      blocked,
      unblocked,
      title,
      image,
    }
  }

  // prettier-ignore
  render() {
    return (
      <React.Fragment>
        <Room className="column flexer align-items-center align-items-stretch">
          <Header className="row">
            <input
              accept="image/png,image/jpg"
              type="file"
              className="hide"
              ref={(ref) => this.avatarRef = ref}
              onChange={this.handleAvatarChange}
            />

            <Avatar
              image={this.state.image}
              title={this.state.title}
              size="medium"
              className="button"
              onClick={() => this.avatarRef.click()}
            />

            <HeaderTitle
              contentEditable
              suppressContentEditableWarning
              onBlur={this.updateRoomTitle}
              ref={(ref) => this.titleRef = ref}>
              {this.state.title}
            </HeaderTitle>

            <HeaderDescription
              contentEditable
              suppressContentEditableWarning
              onBlur={this.updateRoomDescription}
              ref={(ref) => this.descriptionRef = ref}
              onFocus={() => {
                var range = document.createRange();
                range.selectNodeContents(this.descriptionRef);
                var sel = window.getSelection();
                sel.removeAllRanges();
                sel.addRange(range);
              }}>
              {this.props.room.description == "" ? "Add a description" : this.props.room.description}
            </HeaderDescription>
          </Header>

          <Messages ref={(ref) => this.scrollRef = ref}>
            {!this.state.blocked &&
              <MessagesContainer ref={(ref) => this.messagesRef = ref}>
                {this.props.room.messages.map((message, index) => {
                  return (
                    <MessageComponent
                      key={index}
                      id={message.id}
                      reactions={message.reactions}
                      roomId={this.props.room.id}
                      currentUser={this.props.common.user}
                      user={message.user}
                      attachments={message.attachments}
                      message={message.message}
                      replies={message.replies}
                      createdAt={message.createdAt}
                      members={this.props.room.members}
                      createRoomMessageReply={this.props.createRoomMessageReply}
                      createRoomMessageReaction={this.props.createRoomMessageReaction}
                      deleteRoomMessageReaction={this.props.deleteRoomMessageReaction}
                    />
                  )
                })}
              </MessagesContainer>
            }
          </Messages>

          {/* If they are not blocked, but are not members yet */}
          {this.state.unblocked &&
            <Joinable className="row">
              <Button
                onClick={this.joinRoom}
                text="Join Conversation"
              />
              <JoinableText>
                You are not part of this channel
              </JoinableText>
            </Joinable>
          }

          {/* Only if they are a member */}
          {this.state.open &&
            <ComposeComponent
              onSend={this.createRoomMessage}
              members={this.props.room.members}
              compact={false}
            />
          }

          {/* If they are not blocked, and are members */}
          {this.state.blocked &&
            <Blocked>
              Sorry, you are not allowed to view this channel
            </Blocked>
          }
        </Room>
      </React.Fragment>
    )
  }
}

RoomPartial.propTypes = {
  team: PropTypes.any,
  room: PropTypes.any,
  common: PropTypes.any,
  fetchRoom: PropTypes.func,
  createRoom: PropTypes.func,
  fetchRoomMessages: PropTypes.func,
  createRoomMember: PropTypes.func,
  updateRoom: PropTypes.func,
  createRoomMessage: PropTypes.func,
  createRoomMessageReply: PropTypes.func,
  createRoomMessageReaction: PropTypes.func,
  deleteRoomMessageReaction: PropTypes.func,
}

const mapDispatchToProps = {
  fetchRoom: url => fetchRoom(url),
  createRoom: (title, description, team, user) => createRoom(title, description, team, user),
  fetchRoomMessages: page => fetchRoomMessages(page),
  createRoomMember: user => createRoomMember(user),
  updateRoom: updatedRoom => updateRoom(updatedRoom),
  createRoomMessage: (text, attachments) => createRoomMessage(text, attachments),
  createRoomMessageReply: (messageId, userId, text, attachments) => createRoomMessageReply(messageId, userId, text, attachments),
  createRoomMessageReaction: (messageId, reaction) => createRoomMessageReaction(messageId, reaction),
  deleteRoomMessageReaction: (messageId, reaction) => deleteRoomMessageReaction(messageId, reaction),
}

const mapStateToProps = state => {
  return {
    common: state.common,
    team: state.team,
    room: state.room,
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(RoomPartial)
