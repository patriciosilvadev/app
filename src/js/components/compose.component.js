import React from 'react'
import { connect } from 'react-redux'
import { Picker } from 'emoji-mart'
import styled from 'styled-components'
import moment from 'moment'
import PropTypes from 'prop-types'
import { openApp, updateLoading, updateError, updateRoom, updateRoomAddTyping, createRoomMessage, updateRoomMessage } from '../actions'
import UploadService from '../services/upload.service'
import GraphqlService from '../services/graphql.service'
import MessagingService from '../services/messaging.service'
import Keg from '@joduplessis/keg'
import { Attachment, Popup, User, Members, Spinner, Error, Notification, MessageMedia, Avatar } from '@weekday/elements'
import { bytesToSize } from '../helpers/util'
import { IconComponent } from './icon.component'

const UpdateContainer = styled.div`
  position: absolute;
  transform: translateY(-100%);
  background: #f8f9fa;
  border-top: 1px solid #e1e7eb;
  border-bottom: 1px solid #e1e7eb;
  width: 100%;
`

const UpdateText = styled.div`
  padding: 5px 10px 5px 10px;
  font-size: 12px;
  font-weight: 500;
  color: #adb5bd;
  font-weight: regular;
`

const UpdateCancel = styled.div`
  padding: 5px 10px 5px 10px;
  font-size: 12px;
  font-weight: 500;
  color: #007af5;
  font-weight: regular;
`

const ReplyPadding = styled.div`
  padding: 25px;
`

const ReplyContainer = styled.div`
  border: 1px solid #cbd4db;
  padding: 15px;
  border-radius: 10px;
  margin-bottom: 5px;
  margin-right: 5px;
`

const ReplyMessage = styled.div`
  font-weight: 500;
  font-size: 16px;
  font-style: normal;
  color: #151b26;
  display: inline-block;
`

const ReplyText = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: #adb5bd;
  font-weight: regular;
  margin-bottom: 10px;
  display: inline-block;
`

const ReplyName = styled.div`
  font-weight: 700;
  font-style: normal;
  font-size: 12px;
  color: #151b26;
  display: inline-block;
`

const ReplyMeta = styled.div`
  margin-left: 10px;
  font-size: 12px;
  font-weight: 600;
  color: #adb5bd;
  font-weight: regular;
`

const Compose = styled.div`
  width: 100%;
  padding: 0px;
  border-sizing: box-border;
  z-index: 2;
  border: ${props => (props.active ? '2px solid #007af5' : 'none')};
`

const InputContainer = styled.div`
  flex: 1;
  padding: 25px 25px 0px 25px;
`

const Attachments = styled.div`
  width: 100%;
  padding: 20px;
  background: #ffffff;
  border-top: 1px solid #ecf0f2;
  position: absolute;
  top: -1px;
  left: 0px;
  transform: translateY(-100%);
`

const Footer = styled.div`
  padding-top: 0px;
  padding: 25px;
  font-size: 12px;
  font-weight: 400;
  color: #cfd4d9;

  strong {
    font-weight: 700;
  }
`

const Input = styled.textarea`
  width: 100%;
  word-wrap: break-word;
  border: none;
  resize: none;
  overflow-y: scroll;
  transition: height 0.05s linear;
  display: block;
  background: transparent;
  color: #212123;
  font-size: 20px;
  font-weight: 400;

  &::placeholder {
    color: #cfd4d9;
  }
`

const DrawerContainer = styled.div`
  width: 100%;
  position: absolute;
  background: white;
  top: 0px;
  right: 0px;
  border-top-left-radius: 3px;
  border-top-right-radius: 3px;
  transform: translateY(-100%);
  border-top: 1px solid #ebedef;
  overflow: hidden;
  z-index: 100000;
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
  background-repeat: no-repeat;
  background-color: transparent;
  background-image: url(${props => props.image});
`

const CommandContainer = styled.div`
  width: 100%;
  padding-top: 10px;
  padding-bottom: 10px;
`

const CommandRow = styled.div`
  display: flex;
  flex: 1;
  flex-direction: row;
  align-items: stretch;
  align-content: center;
  justify-content: center;
  padding-right: 25px;
  padding-left: 25px;
  padding-top: 5px;
  padding-bottom: 5px;
`

const CommandDescription = styled.div`
  flex: 1;
  font-size: 12px;
  font-weight: 500;
  color: #adb5bd;
  font-weight: regular;
`

const CommandName = styled.div`
  font-weight: 500;
  font-style: normal;
  font-size: 12px;
  color: #151b26;
  padding-right: 10px;
`

class ComposeComponent extends React.Component {
  constructor(props) {
    super(props)

    /*
    Placeholder attachment for testing:
    {
      uri: "https://weekday-users.s3.us-west-2.amazonaws.com/18-9-2019/0a003170-d9df-11e9-938b-51a9e8e38b88.tester.jpg",
      mime: "image/jpeg",
      size: 17361,
      name: "tester.jpg",
      },
      {
      uri: "https://weekday-users.s3.us-west-2.amazonaws.com/18-9-2019/0a003170-d9df-11e9-938b-51a9e8e38b88.tester.jpg",
      mime: "image/jpeg",
      size: 17361,
      name: "testers.jpg",
      }
    }
    */
    this.state = {
      id: null,
      emoticonMenu: false,
      scrollHeight: 0,
      attachments: [],
      parent: [],
      text: '',
      mention: null,
      position: 0,
      members: [],
      commands: [],
      shift: false,
      error: null,
      loading: null,
      notification: null,
      isDragging: false,
    }

    this.composeRef = React.createRef()
    this.fileRef = React.createRef()
    this.dropZone = React.createRef()

    this.createRoomMessage = this.createRoomMessage.bind(this)
    this.updateRoomMessage = this.updateRoomMessage.bind(this)
    this.handleFileChange = this.handleFileChange.bind(this)
    this.handleKeyDown = this.handleKeyDown.bind(this)
    this.handleKeyUp = this.handleKeyUp.bind(this)
    this.insertAtCursor = this.insertAtCursor.bind(this)
    this.handleComposeChange = this.handleComposeChange.bind(this)
    this.updateComposeHeight = this.updateComposeHeight.bind(this)
    this.replaceWordAtCursor = this.replaceWordAtCursor.bind(this)
    this.onSend = this.onSend.bind(this)
    this.onDragOver = this.onDragOver.bind(this)
    this.handleActionClick = this.handleActionClick.bind(this)
    this.onDragEnd = this.onDragEnd.bind(this)
    this.onDrop = this.onDrop.bind(this)
    this.clearMessage = this.clearMessage.bind(this)
  }

  handleActionClick(action, payload = null) {
    this.props.openApp(action, payload)
  }

  onSend() {
    if (this.state.text == '') return

    // If this message is an app command
    if (this.state.text[0] == '/') {
      const textToMatch = this.state.text.slice(1).split(' ')[0].toLowerCase()

      // Reset our view
      // Members is just to be sure here - no other reason
      this.clearMessage()

      // Iterate over all the apps that have these action commands
      this.props.room.apps.map(app => {
        if (!app.active) return

        // Now iterate over all the commands
        app.app.commands.map(command => {
          // If there is a match of a command
          // DO NOT USE REGEX HERE
          // We want to match the whole word
          if (command.name.toLowerCase() == textToMatch) {
            // We rmeove the first word (which is the command name)
            const payload = this.state.text.split(' ').slice(1)
            const { action } = command

            // And call our action creator
            this.handleActionClick(action, payload)
          }
        })
      })
    // Otherwise carry on as normal
    } else {
      const id = this.props.message ? this.props.message.id : null
      const text = this.state.text
      const attachments = this.state.attachments
      const parent = this.props.reply ? (this.props.message ? this.props.message.id : null) : null

      // If it's a reply OR create
      if (!this.props.update) this.createRoomMessage(this.props.room.id, text, attachments, parent)

      // If it's an update
      if (this.props.update) this.updateRoomMessage(this.props.room.id, id, text, attachments)

      // Reset the message
      this.clearMessage()

      // And then resize our input textarea to default
      this.composeRef.style.height = '25px'
    }
  }

  async createRoomMessage(roomId, message, attachments, parentId) {
    const userName = this.props.user.name
    const userId = this.props.user.id
    const excerpt = userName.toString().split(' ')[0] + ': ' + message || message
    const teamId = this.props.team.id

    try {
      const { data } = await GraphqlService.getInstance().createRoomMessage({
        room: roomId,
        user: userId,
        parent: parentId,
        message,
        attachments
      })

      // The extra values are used for processing other info
      const roomMessage = {
        message: data.createRoomMessage,
        roomId,
        teamId,
      }

      // Create the message
      this.props.createRoomMessage(roomId, roomMessage)
      this.props.updateRoom(roomId, { excerpt })
    } catch (e) {}
  }

  async updateRoomMessage(roomId, messageId, message, attachments) {
    const userName = this.props.user.name
    const userId = this.props.user.id
    const excerpt = userName.toString().split(' ')[0] + ': ' + message || message
    const teamId = this.props.team.id

    try {
      const { data } = await GraphqlService.getInstance().updateRoomMessage(
        messageId,
        {
          message,
          attachments,
        }
      )

      const roomMessage = {
        message: { message, attachments },
        messageId,
        roomId,
        teamId,
      }

      this.props.updateRoomMessage(roomId, roomMessage)
      this.props.updateRoom(roomId, { excerpt })
    } catch (e) {}
  }

  clearMessage() {
    // Clear the parent/update message
    this.props.clearMessage()

    // Reset our state
    this.setState({ id: null, text: '', members: [], attachments: [], commands: [] })
  }

  async handleFileChange(e) {
    const files = e.target.files || []

    if (files.length == 0) return

    for (let file of files) {
      Keg.keg('compose').refill('uploads', file)
    }
  }

  insertAtCursor(text) {
    const { selectionStart } = this.composeRef
    const updatedText = [this.state.text.slice(0, selectionStart), text, this.state.text.slice(selectionStart)].join('')

    // Update the text & clos the menu
    // If it was an emoji, close it
    this.setState(
      {
        text: updatedText,
        emoticonMenu: false,
      },
      () => {
        this.composeRef.focus()
        this.updateComposeHeight()
      }
    )
  }

  // Fire first
  handleKeyDown(e) {
    // Enter
    if (e.keyCode == 13) e.preventDefault()

    // Shift
    if (e.keyCode == 16) this.setState({ shift: true })

    // Enter & Shift & no member popup
    if (e.keyCode == 13 && !this.state.shift && this.state.members.length == 0) this.onSend()

    // Enter & Shift
    if (e.keyCode == 13 && this.state.shift) this.insertAtCursor('\n')

    // Update typing
    this.props.updateRoomAddTyping(this.props.room.id, this.props.user.name, this.props.user.id)
  }

  // Fires second
  handleComposeChange(e) {
    const text = e.target.value

    this.setState({ text }, () => {
      // If the first word is the command shorthand
      // Then pass only the first word to look for available commands
      // First also remove the slash
      if (text[0] == '/') return this.populateCommands(text)

      const { selectionStart } = this.composeRef
      const wordArray = this.composeRef.value.slice(0, selectionStart).split(' ').length
      const word = this.composeRef.value.split(' ')[wordArray - 1]
      const firstLetter = word[0]

      if (firstLetter == '@') this.filterMembers(word)
      if (firstLetter != '@') this.setState({ members: [] })
    })
  }

  populateCommands(text) {
    const commands = []
    const textToMatch = text.slice(1).split(' ')[0].toLowerCase()

    // Find all active apps
    this.props.room.apps.map(app => {
      if (!app.active) return

      // and see if they have commands to list for the user
      app.app.commands.map(command => {
        if (command.name.toLowerCase().match(new RegExp(textToMatch + ".*"))) {
          commands.push(command)
        }
      })
    })

    this.setState({ commands })
  }

  // Fires 3rd
  handleKeyUp(e) {
    this.updateComposeHeight()

    if (e.keyCode == 16) this.setState({ shift: false })
  }

  filterMembers(name) {
    // Remove the @ sign
    // QuillJS seems to input some weird chars here that
    // we just need to strip out
    const username = name.replace('@', '')

    // Create the Regex test against the remaining word
    // Return 5 there is no match
    // Cap them at 5
    const members =
      username == ''
        ? this.props.room.members.filter((member, index) => index < 5)
        : this.props.room.members.filter((member, index) => index < 5 && member.user.name.toLowerCase().match(new RegExp(username.toLowerCase() + '.*')))

    // Create the brand the state object the component should use
    this.setState({ members })
  }

  updateComposeHeight() {
    this.setState({ height: this.state.text.split('\n').length * 25 })
  }

  replaceWordAtCursor(word) {
    const { selectionStart } = this.composeRef
    const wordArray = this.composeRef.value.slice(0, selectionStart).split(' ').length
    const mention = this.composeRef.value.split(' ')[wordArray - 1]
    let startingPosition = selectionStart
    let nextChar

    while (nextChar != '@') {
      nextChar = this.state.text[startingPosition]

      if (nextChar != '@') startingPosition--
    }

    // Remove the whole word - do not use the current selectionStart
    const endPosition = startingPosition + word.length

    // Replace & move the cursor forward
    this.setState({
      text: this.state.text.splice(startingPosition, endPosition, word),
      members: [],
    })

    // Refocus the input
    this.composeRef.focus()
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
    this.composeRef.focus()

    // Drag event listeners
    this.dropZone.addEventListener('dragover', this.onDragOver)
    this.dropZone.addEventListener('dragend', this.onDragEnd)
    this.dropZone.addEventListener('drop', this.onDrop)

    // Resize compose initiallyl
    this.updateComposeHeight()

    // Listen for file changes in attachments
    Keg.keg('compose').tap(
      'uploads',
      async (file, pour) => {
        this.setState({ loading: true })
        this.setState({ error: null })

        try {
          const result = await new UploadService(file)
          const { uri, mime, size, name } = await result.json()

          // Add the new files & increase the index
          // And pour again to process the next file
          this.setState(
            {
              attachments: [...this.state.attachments, ...[{ uri, mime, size, name }]],
            },
            () => {
              pour()
            }
          )
        } catch (e) {
          this.setState({ loading: false })
          this.setState({ error: e })
        }
      },
      () => {
        // This is the empty() callback
        // Stop loading when all is done
        this.setState({ loading: false })
      }
    )
  }

  componentWillUnmount() {
    this.dropZone.removeEventListener('dragover', this.onDragOver)
    this.dropZone.removeEventListener('dragend', this.onDragEnd)
    this.dropZone.removeEventListener('drop', this.onDrop)
  }

  static getDerivedStateFromProps(props, state) {
    if (!props.update) return null

    // Only update one
    if (props.message.id != state.id && props.update) {
      return {
        id: props.message.id,
        attachments: props.message.attachments,
        text: props.message.message,
        parent: props.message.parent,
      }
    }

    return null
  }

  // prettier-ignore
  render() {
    return (
      <Compose
        active={this.state.isDragging}
        ref={ref => this.dropZone = ref} className="column align-items-stretch">
        {this.state.error && <Error message={this.state.error} />}
        {this.state.loading && <Spinner />}
        {this.state.notification && <Notification text={this.state.notification} />}

        {this.props.update &&
          <UpdateContainer className="row">
            <UpdateText>
              Updating message

              {this.props.message.parent &&
                <span> - replying to {this.props.message.parent.user.name}</span>
              }
            </UpdateText>
            <div className="flexer"></div>
            <UpdateCancel className="button" onClick={this.clearMessage}>
              Cancel
            </UpdateCancel>
          </UpdateContainer>
        }

        {this.state.attachments.length != 0 &&
          <Attachments className="row">
            {this.state.attachments.map((attachment, index) => {
              return (
                <Attachment
                  key={index}
                  layout="compose"
                  uri={attachment.uri}
                  mime={attachment.mime}
                  size={attachment.size}
                  name={attachment.name}
                  createdAt={null}
                  onDeleteClick={() => this.setState({ attachments: this.state.attachments.filter((a, _) => {
                    return attachment.uri != a.uri
                  })})}
                />
              )
            })}
          </Attachments>
        }

        {this.state.members.length != 0 &&
          <DrawerContainer>
            <Members
              members={this.state.members}
              handleAccept={(member) => this.replaceWordAtCursor(`@${member.user.username} `)}
            />
          </DrawerContainer>
        }

        {this.state.commands.length != 0 &&
          <DrawerContainer>
            <CommandContainer>
              {this.state.commands.map((command, index) => {
                return (
                  <CommandRow key={index}>
                    <CommandName>/{command.name}</CommandName>
                    <CommandDescription>{command.description}</CommandDescription>
                  </CommandRow>
                )
              })}
            </CommandContainer>
          </DrawerContainer>
        }

        {this.props.message && this.props.reply &&
          <ReplyPadding className="column align-items-stretch flexer">
            <ReplyText>Replying to:</ReplyText>
            <ReplyContainer className="row justify-content-center">
              <div className="pl-10 column flexer">
                <div className="row">
                  <ReplyName>
                    {this.props.message.app ? this.props.message.app.name : this.props.message.user.name}
                  </ReplyName>
                  <ReplyMeta>{moment(this.props.message.createdAt).fromNow()}</ReplyMeta>
                </div>
                <ReplyMessage>
                  {this.props.message.message}
                </ReplyMessage>
              </div>
              <IconComponent
                icon="x"
                size={20}
                color="#565456"
                className="ml-15 button"
                onClick={this.props.clearMessage}
              />
            </ReplyContainer>
          </ReplyPadding>
        }

        <InputContainer className="row">
          <input
            className="hide"
            ref={(ref) => this.fileRef = ref}
            type="file"
            multiple
            onChange={this.handleFileChange}
          />

          <Input
            style={{ height: this.state.height }}
            ref={(ref) => this.composeRef = ref}
            placeholder="Say something"
            value={this.state.text}
            onKeyUp={this.handleKeyUp}
            onKeyDown={this.handleKeyDown}
            onChange={this.handleComposeChange}
          />

          {this.props.room.apps.map((app, index) => {
            if (!app.active) return
            if (!app.app.attachments) return
            if (app.app.attachments.length == 0) return

            return (
              <React.Fragment key={index}>
                {app.app.attachments.map((action, i) => {
                  return (
                    <AppIconContainer key={i} onClick={() => this.handleActionClick(action)}>
                      <AppIconImage image={action.icon} />
                    </AppIconContainer>
                  )
                })}
              </React.Fragment>
            )
          })}


          <Popup
            handleDismiss={() => this.setState({ emoticonMenu: false })}
            visible={this.state.emoticonMenu}
            width={350}
            direction="right-top"
            content={
              <Picker
                style={{ width: 350 }}
                set='emojione'
                title=""
                emoji=""
                showPreview={false}
                showSkinTones={false}
                onSelect={(emoji) => this.insertAtCursor(emoji.colons)}
              />
            }>
            <IconComponent
              icon="smile"
              size={20}
              color="#565456"
              className="ml-15 button"
              onClick={() => this.setState({ emoticonMenu: true })}
            />
          </Popup>

          <IconComponent
            icon="attachment"
            size={20}
            color="#565456"
            className="ml-15 button"
            onClick={() => this.fileRef.click()}
          />

          <IconComponent
            icon="at"
            size={20}
            color="#565456"
            className="ml-15 button"
            onClick={() => {
              this.insertAtCursor("@")
              this.filterMembers("")
            }}
          />

          <IconComponent
            icon="send"
            size={20}
            color="#565456"
            className="ml-15 button"
            onClick={this.onSend}
          />
        </InputContainer>

        <Footer className="row">
          <IconComponent
            icon="markdown"
            size={20}
            color="#cfd4d9"
            className="mr-10"
          />
          <span>Use <strong>**markdown**</strong> to format your message</span>
        </Footer>
      </Compose>
    )
  }
}

ComposeComponent.propTypes = {
  room: PropTypes.any,
  team: PropTypes.any,
  teams: PropTypes.any,
  user: PropTypes.any,
  message: PropTypes.any,
  reply: PropTypes.bool,
  update: PropTypes.bool,
  clearMessage: PropTypes.any,
  createRoomMessage: PropTypes.func,
  updateRoom: PropTypes.func,
  updateRoomMessage: PropTypes.func,
  updateRoomAddTyping: PropTypes.func,
  openApp: PropTypes.func,
}

const mapDispatchToProps = {
  createRoomMessage: (roomId, roomMessage) => createRoomMessage(roomId, roomMessage),
  updateRoomMessage: (roomId, roomMessage) => updateRoomMessage(roomId, roomMessage),
  updateRoomAddTyping: (roomId, userName, userId) => updateRoomAddTyping(roomId, userName, userId),
  updateRoom: (roomId, updatedRoom) => updateRoom(roomId, updatedRoom),
  openApp: (action, payload) => openApp(action, payload),
}

const mapStateToProps = state => {
  return {
    room: state.room,
    user: state.user,
    team: state.team,
    teams: state.teams,
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ComposeComponent)
