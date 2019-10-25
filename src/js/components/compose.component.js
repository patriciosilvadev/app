import React from 'react'
import { connect } from 'react-redux'
import { Picker } from 'emoji-mart'
import styled from 'styled-components'
import moment from 'moment'
import PropTypes from 'prop-types'
import { updateLoading, updateError, updateRoomAddTyping, updateRoomDeleteTyping, createRoomMessage, updateRoomMessage } from '../actions'
import UploadService from '../services/upload.service'
import { DiMarkdown } from 'react-icons/di'
import { Subject } from 'rxjs'
import { debounceTime } from 'rxjs/operators'
import Keg from '@joduplessis/keg'
import { Attachment, Popup, User, Members, Spinner, Error, Notification, MessageMedia, Avatar } from '@weekday/elements'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { bytesToSize } from '../helpers/util'

const UpdateContainer = styled.div`
  position: absolute;
  transform: translateY(-100%);
  background: #F8F9FA;
  border-top: 1px solid #E1E7EB;
  border-bottom: 1px solid #E1E7EB;
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
  border: ${props => props.active ? "2px solid #007af5": "none"}
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

const MentionContainer = styled.div`
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
      text: 'Testing',
      mention: null,
      position: 0,
      members: [],
      shift: false,
      error: null,
      loading: null,
      notification: null,
      isDragging: false,
    }

    this.composeRef = React.createRef()
    this.fileRef = React.createRef()
    this.dropZone = React.createRef()

    this.onType$ = new Subject()

    this.handleFileChange = this.handleFileChange.bind(this)
    this.handleKeyDown = this.handleKeyDown.bind(this)
    this.handleKeyUp = this.handleKeyUp.bind(this)
    this.insertAtCursor = this.insertAtCursor.bind(this)
    this.handleComposeChange = this.handleComposeChange.bind(this)
    this.updateComposeHeight = this.updateComposeHeight.bind(this)
    this.replaceWordAtCursor = this.replaceWordAtCursor.bind(this)
    this.onSend = this.onSend.bind(this)
    this.subscription = null
    this.onDragOver = this.onDragOver.bind(this)
    this.onDragEnd = this.onDragEnd.bind(this)
    this.onDrop = this.onDrop.bind(this)
    this.clearMessage = this.clearMessage.bind(this)
  }

  onSend() {
    if (this.state.text == '') return

    const id = this.props.message ? this.props.message.id : null
    const text = this.state.text
    const attachments = this.state.attachments
    const parent = this.props.reply
                    ? this.props.message
                      ? this.props.message.id
                      : null
                    : null

    // If it's a reply OR create
    if (!this.props.update) this.props.createRoomMessage(text, attachments, parent)

    // If it's an update
    if (this.props.update) this.props.updateRoomMessage(id, text, attachments)

    // Reset the message
    this.clearMessage()

    // And then resize our input textarea to default
    this.composeRef.style.height = '25px'
  }

  clearMessage() {
    // Clear the parent/update message
    this.props.clearMessage()

    // Reset our state
    this.setState({ id: null, text: '', members: [], attachments: [] })
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

  handleKeyUp(e) {
    this.updateComposeHeight()

    if (e.keyCode == 16) this.setState({ shift: false })
  }

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
    this.props.updateRoomAddTyping(this.props.common.user.name, this.props.common.user.id)
  }

  handleComposeChange(e) {
    const text = e.target.value

    this.onType$.next(text)
    this.setState({ text }, () => {
      const { selectionStart } = this.composeRef
      const wordArray = this.composeRef.value.slice(0, selectionStart).split(' ').length
      const word = this.composeRef.value.split(' ')[wordArray - 1]
      const firstLetter = word[0]

      if (firstLetter == '@') this.filterMembers(word)
      if (firstLetter != '@') this.setState({ members: [] })
    })
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

    // Stop typing indicator after 1000 ms of inactivity
    this.subscription = this.onType$
      .pipe(debounceTime(1000))
      .subscribe(debounced => this.props.updateRoomDeleteTyping(this.props.common.user.name, this.props.common.user.id))

    // Listen for file changes in attachments
    Keg.keg('compose').tap('uploads', async (file, pour) => {
      this.setState({ loading: true })
      this.setState({ error: null })

      try {
        const result = await new UploadService(file)
        const { uri, mime, size, name } = await result.json()

        // Add the new files & increase the index
        // And pour again to process the next file
        this.setState({
          attachments: [
            ...this.state.attachments,
            ...[{ uri, mime, size, name }]
          ]
        }, () => pour())
      } catch (e) {
        this.setState({ loading: false })
        this.setState({ error: e })
      }
    }, () => {
      // This is the empty() callback
      // Stop loading when all is done
      this.setState({ loading: false })
    })
  }

  componentWillUnmount() {
    if (this.subscription) this.subscription.unsubscribe()

    // Drag event listeners
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
          <MentionContainer>
            <Members
              members={this.state.members}
              handleAccept={(member) => this.replaceWordAtCursor(`@${member.user.username} `)}
            />
          </MentionContainer>
        }

        {this.props.message && this.props.reply &&
          <ReplyPadding className="column align-items-stretch flexer">
            <ReplyText>Replying to:</ReplyText>
            <ReplyContainer className="row justify-content-center">
              <Avatar
                image={this.props.message.user.image}
                title={this.props.message.user.name}
                className="mr-15"
                size="medium"
              />

              <div className="column flexer">
                <div className="row">
                  <ReplyName>
                    {this.props.message.user.name}
                  </ReplyName>
                  <ReplyMeta>{moment(this.props.message.createdAt).fromNow()}</ReplyMeta>
                </div>
                <ReplyMessage>
                  {this.props.message.message}
                </ReplyMessage>
              </div>
              <FontAwesomeIcon
                className="ml-15 button"
                icon={["fal", "times"]}
                color="#565456"
                size="lg"
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
            <FontAwesomeIcon
              className="ml-15 button"
              icon={["fal", "smile"]}
              color="#565456"
              size="lg"
              onClick={() => this.setState({ emoticonMenu: true })}
            />
          </Popup>

          <FontAwesomeIcon
            className="ml-15 button"
            icon={["fal", "paperclip"]}
            color="#565456"
            size="lg"
            onClick={() => this.fileRef.click()}
          />

          <FontAwesomeIcon
            className="ml-15 button"
            icon={["fal", "at"]}
            color="#565456"
            size="lg"
            onClick={() => {
              this.insertAtCursor("@")
              this.filterMembers("")
            }}
          />

          {!this.props.update &&
            <FontAwesomeIcon
              className="ml-15 button"
              icon={["fal", "paper-plane"]}
              color="#565456"
              size="lg"
              onClick={this.onSend}
            />
          }

          {this.props.update &&
            <FontAwesomeIcon
              className="ml-15 button"
              icon={["fal", "check"]}
              color="#565456"
              size="lg"
              onClick={this.onSend}
            />
          }
        </InputContainer>

        <Footer className="row">
          <DiMarkdown
            color="#cfd4d9"
            size={18}
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
  common: PropTypes.any,
  message: PropTypes.any,
  reply: PropTypes.bool,
  update: PropTypes.bool,
  clearMessage: PropTypes.any,
  createRoomMessage: PropTypes.func,
  updateRoomMessage: PropTypes.func,
  updateRoomAddTyping: PropTypes.func,
  updateRoomDeleteTyping: PropTypes.func,
}

const mapDispatchToProps = {
  createRoomMessage: (text, attachments, parent) => createRoomMessage(text, attachments, parent),
  updateRoomMessage: (id, text, attachments) => updateRoomMessage(id, text, attachments),
  updateRoomAddTyping: (userName, userId) => updateRoomAddTyping(userName, userId),
  updateRoomDeleteTyping: (userName, userId) => updateRoomDeleteTyping(userName, userId),
}

const mapStateToProps = state => {
  return {
    room: state.room,
    common: state.common,
    team: state.team,
    teams: state.teams,
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ComposeComponent)
