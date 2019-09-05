import React from 'react'
import { connect } from 'react-redux'
import { Picker } from 'emoji-mart'
import AttachmentComponent from '../components/attachment.component'
import styled from 'styled-components'
import PopupComponent from '../components/popup.component'
import UserComponent from '../components/user.component'
import PropTypes from 'prop-types'
import IconComponent from '../components/icon.component'
import { updateLoading, updateError } from '../actions'
import UploadService from '../services/upload.service'

const Compose = styled.div`
  width: 100%;
  padding: ${props => (props.compact ? '0px' : '10px 25px 10px 25px')};
`

const InputContainer = styled.div`
  flex: 1;
  padding: ${props => (props.compact ? '10px' : '15px 0px 15px 0px')};
  background: ${props => (props.compact ? '#f8f9fa' : 'white')};
  flex: 1;
  border-radius: 25px;
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
  padding-bottom: 10px;
  font-size: 12px;
  font-weight: 400;
  color: #cfd4d9;

  strong {
    font-weight: 500;
  }
`

const Input = styled.textarea`
  width: 100%;
  word-wrap: break-word;
  border: none;
  resize: none;
  overflow-y: scroll;
  height: ${props => props.defaultheight}px;
  transition: height 0.15s linear;
  display: block;
  background: transparent;
  color: #212123;
  font-size: ${props => (props.compact ? '14px' : '17px')};
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
  transform: translateY(-100%);
  border-top: 1px solid #ebedef;
`

class ComposeComponent extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      emoticonMenu: false,
      scrollHeight: 0,
      attachments: [{thumbnail: "https://weekday-users.s3-us-west-2.amazonaws.com/test/2019_9_5/4530e1e0-cfc1-11e9-a7b6-fb87a3313afa.dsH1ib2b_400x400.jpg", uri: "https://weekday-users.s3-us-west-2.amazonaws.com/test/2019_9_5/4530e1e0-cfc1-11e9-a7b6-fb87a3313afa.dsH1ib2b_400x400.jpg", mime: "image/jpeg"}],
      text: '',
      mention: null,
      position: 0,
      members: [],
      shift: false,
    }

    this.composeRef = React.createRef()
    this.fileRef = React.createRef()

    this.handleFileChange = this.handleFileChange.bind(this)
    this.handleKeyDown = this.handleKeyDown.bind(this)
    this.handleKeyUp = this.handleKeyUp.bind(this)
    this.insertAtCursor = this.insertAtCursor.bind(this)
    this.handleComposeChange = this.handleComposeChange.bind(this)
    this.updateComposeHeight = this.updateComposeHeight.bind(this)
    this.replaceWordAtCursor = this.replaceWordAtCursor.bind(this)
    this.onSend = this.onSend.bind(this)
  }

  onSend() {
    this.props.onSend(this.state.text, this.state.attachments)
    this.setState({ text: '', members: [] })
    this.composeRef.style.height = '25px'
  }

  async handleFileChange(e) {
    if (e.target.files.length == 0) return

    this.props.updateLoading(true)
    this.props.updateError(null)

    try {
      const result = await new UploadService(e.target.files[0])
      const { data, mime } = await result.json()
      const { Location } = data

      // Update the state with the new file
      // This format is what the API expects
      this.props.updateLoading(false)
      this.setState({
        attachments: [...this.state.attachments, ...[{ thumbnail: Location, uri: Location, mime: mime.mime }]],
      })
    } catch (e) {
      this.props.updateLoading(false)
      this.props.updateError(e)
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
    if (e.keyCode == 16) this.setState({ shift: false })
  }

  handleKeyDown(e) {
    if (e.keyCode == 13) e.preventDefault()
    if (e.keyCode == 16) this.setState({ shift: true })

    // Plain enter
    if (e.keyCode == 13 && !this.state.shift && this.state.members.length == 0) {
      this.onSend()
    }

    // Shift & enter
    if (e.keyCode == 13 && this.state.shift) {
      this.insertAtCursor('\n')
    }

    // Up/Down
    if (e.keyCode == 13 && this.state.members.length != 0) {
      this.replaceWordAtCursor(`@${this.state.members[this.state.position].user.username} `)
    }

    // Up
    if (e.keyCode == 38 && this.state.members.length != 0) {
      e.preventDefault()
      this.setState({ position: this.state.position - 1 < 0 ? this.state.members.length - 1 : this.state.position - 1 })
    }

    // Down
    if (e.keyCode == 40 && this.state.members.length != 0) {
      e.preventDefault()
      this.setState({ position: this.state.position + 1 == this.state.members.length ? 0 : this.state.position + 1 })
    }
  }

  handleComposeChange(e) {
    this.setState({ text: e.target.value }, () => {
      const { selectionStart } = this.composeRef
      const wordArray = this.composeRef.value.slice(0, selectionStart).split(' ').length
      const word = this.composeRef.value.split(' ')[wordArray - 1]
      const firstLetter = word[0]

      if (firstLetter == '@') this.filterMembers(word)
      if (firstLetter != '@') this.setState({ members: [] })

      this.updateComposeHeight()
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
        ? this.props.members.filter((member, index) => index < 5)
        : this.props.members.filter((member, index) => index < 5 && member.user.name.toLowerCase().match(new RegExp(username.toLowerCase() + '.*')))

    // Create the brand the state object the component should use
    this.setState({ members })
  }

  updateComposeHeight() {
    this.composeRef.style.height = '25px'
    this.composeRef.style.height = this.composeRef.scrollHeight + 'px'
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

  componentDidMount() {
    this.composeRef.focus()
  }

  componentDidUpdate() {}

  // prettier-ignore
  render() {
    return (
      <Compose compact={this.props.compact} className="column align-items-stretch">
        {this.state.attachments.length != 0 &&
          <Attachments className="row">
            {this.state.attachments.map((attachment, index) => {
              return (
                <AttachmentComponent
                  key={index}
                  size="large"
                  uri={attachment.uri}
                  mime={attachment.mime}
                  thumbnail={attachment.thumbnail}
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
            {this.state.members.map((member, index) => {
              return (
                <UserComponent
                  key={index}
                  className="button"
                  active={index == this.state.position}
                  image={member.user.image}
                  color={member.user.color}
                  name={member.user.name}
                  label={member.user.username}
                  onClick={() => this.replaceWordAtCursor(`@${member.user.username} `)}>
                </UserComponent>
              )
            })}
          </MentionContainer>
        }

        <InputContainer
          compact={this.props.compact}
          className="row">

          <input
            className="hide"
            ref={(ref) => this.fileRef = ref}
            type="file"
            multiple
            onChange={this.handleFileChange}
          />

          <Input
            ref={(ref) => this.composeRef = ref}
            placeholder="Say something"
            value={this.state.text}
            compact={this.props.compact}
            defaultHeight={25}
            onKeyUp={this.handleKeyUp}
            onKeyDown={this.handleKeyDown}
            onChange={this.handleComposeChange}
          />

          <PopupComponent
            handleDismiss={() => this.setState({ emoticonMenu: false })}
            visible={this.state.emoticonMenu}
            width={350}
            direction="left-top"
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
              icon="COMPOSE_EMOTICON"
              color="#565456"
              className="button"
              onClick={() => this.setState({ emoticonMenu: true })}
            />
          </PopupComponent>

          <IconComponent
            icon="COMPOSE_ATTACHMENT"
            color="#565456"
            className="ml-15 button"
            onClick={() => this.fileRef.click()}
          />

          {!this.props.compact &&
            <React.Fragment>
              <IconComponent
                icon="COMPOSE_AT"
                color="#565456"
                className="ml-15 button"
                onClick={() => this.insertAtCursor("@")}
              />

              <IconComponent
                icon="COMPOSE_SEND"
                color="#565456"
                className="ml-15 button"
                onClick={this.onSend}
              />
            </React.Fragment>
          }
        </InputContainer>

        {!this.props.compact &&
          <Footer>
            Use can you <strong>**markdown**</strong> to format your message
          </Footer>
        }
      </Compose>
    )
  }
}

ComposeComponent.propTypes = {
  team: PropTypes.any,
  teams: PropTypes.any,
  common: PropTypes.any,
  onSend: PropTypes.func,
  members: PropTypes.array,
  compact: PropTypes.bool,
  updateLoading: PropTypes.func,
  updateError: PropTypes.func,
}

const mapDispatchToProps = {
  updateLoading: loading => updateLoading(loading),
  updateError: error => updateLoading(error),
}

const mapStateToProps = state => {
  return {
    common: state.common,
    team: state.team,
    teams: state.teams,
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ComposeComponent)
