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
import { Button } from '@weekday/elements'
import RoomModal from '../modals/room.modal'
import MenuComponent from '../components/menu.component'
import ReactMarkdown from 'react-markdown'
import PopupComponent from '../components/popup.component'
import ConfirmModal from '../modals/confirm.modal'
import QuickUserComponent from '../components/quick-user.component'
import { MoreHorizOutlined, DeleteOutlined, AddOutlined, StarBorder, Star, CloseOutlined, CreateOutlined, PeopleOutline, Subject, VisibilityOffOutlined, VisibilityOutlined } from '@material-ui/icons'
import {
  deleteRoom,
  updateUserStarred,
  fetchRoom,
  createRoomMember,
  updateRoom,
  fetchRoomMessages,
  createRoomMessage,
  createRoomMessageReply,
  createRoomMessageReaction,
  deleteRoomMessageReaction,
} from '../actions'

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
  padding 0px 25px 0px 25px;
  display: flex;
  height: 70px;
`

const HeaderTitle = styled.div`
  font-size: 25px;
  font-weight: 600;
  font-style: normal;
  color: #040b1c;
  padding-left: 15px;
  transition: opacity 0.5s;
  display: inline-block;
  margin-right: 0px;
`

const HeaderButton = styled.div`
  margin-left: 15px;
  color: #adb5bd;
  font-size: 13px;
  font-weight: 500;
  transition: opacity 0.5s;
  position: relative;
  cursor: pointer;
`

const Messages = styled.div`
  flex: 1;
  overflow: scroll;
  width: 100%;
  border-bottom: 1px solid #f1f3f5;
  background: #f8f9fa;
`

const MessagesContainer = styled.div`
  width: 100%;
  padding: 25px;
  height: 1px; /* Important for the height to be set here */
`

const Blocked = styled.div`
  font-size: 13px;
  font-weight: 500;
  color: #343a40;
  padding: 10px;
`

const Welcome = styled.div`
  padding: 25px;
  padding-bottom: 35px;
  margin-bottom: 10px;
  border-bottom: 1px solid #f1f3f5;
  padding-top: 1000px;
`

const WelcomeTitle = styled.div`
  font-weight: 900;
  font-size: 60px;
  color: #040b1c;
  padding-bottom: 10px;
`

const WelcomeDescription = styled.div`
  font-weight: 400;
  font-size: 22px;
  color: #adb5bd;
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

class RoomPartial extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      manualScrolling: false,
      busy: false,
      page: 0,
      open: true,
      title: '',
      image: '',
      roomUpdateModal: false,
      confirmDeleteModal: false,
      starred: false,
      visibilityMenu: false,
    }

    this.messagesRef = React.createRef()
    this.scrollRef = React.createRef()
    this.handleScrollEvent = this.handleScrollEvent.bind(this)
    this.createRoomMessage = this.createRoomMessage.bind(this)
    this.updateRoomVisibility = this.updateRoomVisibility.bind(this)
    this.updateUserStarred = this.updateUserStarred.bind(this)
    this.deleteRoom = this.deleteRoom.bind(this)
  }

  scrollToBottom() {
    if (this.scrollRef) this.scrollRef.scrollTop = this.scrollRef.scrollHeight
  }

  handleScrollEvent(e) {
    if (this.scrollRef.scrollTop == 0) this.fetchRoomMessages()

    if (this.scrollRef.offsetHeight == this.scrollRef.scrollHeight - this.scrollRef.scrollTop + 1) {
      this.setState({ manualScrolling: false })
    } else {
      this.setState({ manualScrolling: true })
    }
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
    if (this.state.open) this.props.fetchRoom(this.props.match.params.roomId)

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
      if (this.state.open) this.fetchedRoomMessages()
    })
  }

  componentDidUpdate(prevProps) {
    // Scroll to the correct position after fetchRoomMessages
    // if (this.state.scrollHeight != this.scrollRef.scrollHeight) this.scrollRef.scrollTop = this.scrollRef.scrollHeight - this.state.scrollHeight
    // If the room ID updates - then refetch all the data
    if (this.props.match.params.roomId != prevProps.match.params.roomId) {
      if (this.state.open) this.props.fetchRoom(this.props.match.params.roomId)
    }
  }

  componentWillUnmount() {
    this.scrollRef.removeEventListener('scroll', this.handleScrollEvent)
  }

  updateUserStarred(starred) {
    const userId = this.props.common.user.id
    const roomId = this.props.room.id

    this.props.updateUserStarred(userId, roomId, starred)
  }

  updateRoomVisibility(visibility) {
    this.setState({ visibilityMenu: false })
    this.props.updateRoom(visibility)
  }

  deleteRoom() {
    this.setState({ confirmModal: false })
    this.props.deleteRoom(this.props.room.id)
    this.props.history.push(`/app/team/${this.props.team.id}/`)
  }

  static getDerivedStateFromProps(props, state) {
    if (props.room.id == undefined || props.room.id == '') return null

    const isMember = !!props.room.members.filter(member => member.user.id == props.common.user.id).flatten()
    const isPublic = props.room.public
    const open = isMember || isPublic
    const starred = props.common.user.starred.indexOf(props.room.id) != -1

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
            onClose={() => this.setState({ roomUpdateModal: false })}
          />
        }

        {this.state.confirmDeleteModal &&
          <ConfirmModal
            onOkay={this.deleteRoom}
            onCancel={() => this.setState({ confirmDeleteModal: false })}
            text="Are you sure you want to delete this room?"
            title="Are you sure?"
          />
        }

        <Room className="column flexer align-items-center align-items-stretch">
          {!this.state.open &&
            <Blocked>
              Sorry, you are not allowed to view this channel
            </Blocked>
          }

          {this.state.open &&
            <Header className="row">
              <Avatar
                image={this.state.image}
                title={this.state.title}
                size="medium"
              />

              <HeaderTitle>
                {this.state.title}
              </HeaderTitle>

              <HeaderButton onClick={() => this.updateUserStarred(!this.state.starred)}>
                {this.state.starred && <Star htmlColor="#EBB403" fontSize="default" />}
                {!this.state.starred && <StarBorder htmlColor="#babec9" fontSize="default" />}
              </HeaderButton>

              <HeaderButton>
                {this.props.room.public && <VisibilityOutlined htmlColor="#acb5bd" fontSize="default" />}
                {!this.props.room.public && <VisibilityOffOutlined htmlColor="#acb5bd" fontSize="default" />}
              </HeaderButton>

              <PopupComponent
                handleDismiss={() => this.setState({ visibilityMenu: false })}
                visible={this.state.visibilityMenu} width={275} direction="right-bottom"
                content={
                  <div className="column flexer">
                    <MenuComponent
                      items={[
                        { icon: <CreateOutlined htmlColor="#acb5bd" fontSize="default" />, text: "Details", label: 'Update room details', onClick: (e) => this.setState({ visibilityMenu: false, roomUpdateModal: true }), hide: !(!this.props.room.private && this.props.room.user.id == this.props.common.user.id) },
                        { icon: <VisibilityOutlined htmlColor="#acb5bd" fontSize="default" />, text: "Public to your team", label: 'Anyone in your team can join', onClick: (e) => this.updateRoomVisibility({ visibilityMenu: false, private: false, public: true }) },
                        { icon: <VisibilityOffOutlined htmlColor="#acb5bd" fontSize="default" />, text: "Private to members", label: 'Only people you\'ve added can join', onClick: (e) => this.updateRoomVisibility({ visibilityMenu: false, private: false, public: false }) },
                        { icon: <DeleteOutlined htmlColor="#acb5bd" fontSize="default" />, text: "Delete", label: 'Delete room', onClick: (e) => this.setState({ visibilityMenu: false, confirmDeleteModal: true }) },
                      ]}
                    />
                  </div>
                }>
                <HeaderButton onClick={() => this.setState({ visibilityMenu: true })}>
                  <MoreHorizOutlined
                    htmlColor="#acb5bd"
                    fontSize="default"
                  />
                </HeaderButton>
              </PopupComponent>

              <div className="flexer"></div>

              <Button
                text="Manage Members"
                size="small"
                theme="blue-border"
                className="mr-15"
                onClick={() => this.setState({ roomUpdateModal: true })}
              />

              <QuickUserComponent
                teamId={this.props.team.id}
                visible={this.state.userMenu}
                width={250}
                direction="right-bottom"
                handleDismiss={() => this.setState({ userMenu: false })}
                handleAccept={({ user }) => this.createRoomMember(user)}>
                <Avatar
                  className="mr-5"
                  size="medium"
                  circle
                  image={null}
                  color="#007AF5"
                  title=""
                  onClick={() => this.setState({ userMenu:true })}>
                  <AddOutlined
                    htmlColor="#007AF5"
                    fontSize="small"
                  />
                </Avatar>
              </QuickUserComponent>

              {this.props.room.members.slice(0,3).map((member, index) => {
                return (
                  <Avatar
                    className="mr-5"
                    size="medium"
                    circle
                    image={member.user.image}
                    title={member.user.name}
                    key={index}
                    onDeleteClick={() => this.props.common.user.id != member.user.id ? this.deleteRoomMember(member.user) : this.setState({ confirmModal: true })}
                    deleteIcon={
                      <CloseOutlined
                        htmlColor="#ffffff"
                        fontSize="small"
                      />
                    }
                  />
                )
              })}

              <Avatar
                className="hide"
                size="medium"
                circle
                image={null}
                color="#007AF5"
                title={this.props.room.members.length.numberShorthand()}
                onClick={() => this.setState({ userMenu:true })}
              />
            </Header>
          }

          <Messages ref={(ref) => this.scrollRef = ref}>
            {this.state.open &&
              <React.Fragment>
                <Welcome>
                  <WelcomeUser className="row">
                    <Avatar
                      title={this.props.room.user.name}
                      image={this.props.room.user.image}
                      size="small"
                    />
                    <WelcomeUserName>
                      Started by {this.props.room.user.name}
                    </WelcomeUserName>
                  </WelcomeUser>
                  <WelcomeTitle>
                    {this.state.title}
                  </WelcomeTitle>
                  <WelcomeDescription>
                    <ReactMarkdown source={this.props.room.description} />
                  </WelcomeDescription>
                </Welcome>

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
              </React.Fragment>
            }
          </Messages>

          {this.state.open &&
            <ComposeComponent
              onSend={this.createRoomMessage}
              members={this.props.room.members}
              compact={false}
            />
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
  deleteRoom: PropTypes.func,
  createRoomMessage: PropTypes.func,
  createRoomMessageReply: PropTypes.func,
  createRoomMessageReaction: PropTypes.func,
  deleteRoomMessageReaction: PropTypes.func,
  updateUserStarred: PropTypes.func,
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
  updateUserStarred: (userId, roomId, starred) => updateUserStarred(userId, roomId, starred),
  deleteRoom: roomId => deleteRoom(roomId),
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
