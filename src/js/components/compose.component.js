import React from 'react'
import { connect } from 'react-redux'
import { Picker } from 'emoji-mart'
import AttachmentComponent from '../components/attachment.component'
import styled from 'styled-components'
import PopupComponent from '../components/popup.component'
import UserComponent from '../components/user.component'
import PropTypes from 'prop-types'
import { updateLoading, updateError } from '../actions'
import UploadService from '../services/upload.service'
import { MessageMedia } from '@weekday/elements'
import MembersComponent from '../components/members.component'
import { SentimentSatisfiedOutlined, AttachFileOutlined, AlternateEmailOutlined, SendOutlined } from '@material-ui/icons'
import { DiMarkdown } from 'react-icons/di'

const Compose = styled.div`
  width: 100%;
  padding: ${props => (props.compact ? '0px' : '10px 25px 10px 25px')};
`

const InputContainer = styled.div`
  flex: 1;
  padding: ${props => (props.compact ? '10px' : '15px 0px 15px 0px')};
  background: ${props => (props.compact ? '#f8f9fa' : 'white')};
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
  transition: height 0.05s linear;
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

    /*
    Placeholder attachment for testing:
    {
     uri: "https://weekday-users.s3.us-west-2.amazonaws.com/18-9-2019/0a003170-d9df-11e9-938b-51a9e8e38b88.tester.jpg",
     mime: "image/jpeg",
     size: 17361,
     name: "tester.jpg",
     createdAt: new Date(),
    }
    */
    this.state = {
      emoticonMenu: false,
      scrollHeight: 0,
      attachments: [],
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
    this.setState({ text: '', members: [], attachments: [] })
    this.composeRef.style.height = '25px'
  }

  async handleFileChange(e) {
    if (e.target.files.length == 0) return

    this.props.updateLoading(true)
    this.props.updateError(null)

    try {
      const result = await new UploadService(e.target.files[0])
      const { uri, mime, size, name } = await result.json()

      // Update the state with the new file
      // This format is what the API expects
      this.props.updateLoading(false)
      this.setState({
        attachments: [...this.state.attachments, ...[{ uri, mime, size, name }]],
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
  }

  handleComposeChange(e) {
    this.setState({ text: e.target.value }, () => {
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
        ? this.props.members.filter((member, index) => index < 5)
        : this.props.members.filter((member, index) => index < 5 && member.user.name.toLowerCase().match(new RegExp(username.toLowerCase() + '.*')))

    // Create the brand the state object the component should use
    this.setState({ members })
  }

  updateComposeHeight() {
    this.setState({ height: this.state.text.split('\n').length * (this.props.compact ? 20 : 25) })
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
    this.updateComposeHeight()
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
            <MembersComponent
              members={this.state.members}
              handleAccept={(member) => this.replaceWordAtCursor(`@${member.user.username} `)}
            />
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
            style={{ height: this.state.height }}
            ref={(ref) => this.composeRef = ref}
            placeholder="Say something"
            value={this.state.text}
            compact={this.props.compact}
            onKeyUp={this.handleKeyUp}
            onKeyDown={this.handleKeyDown}
            onChange={this.handleComposeChange}
          />

          {!this.props.compact &&
            <React.Fragment>
              <PopupComponent
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
                <SentimentSatisfiedOutlined
                  htmlColor="#565456"
                  className="button ml-15"
                  fontSize="small"
                  onClick={() => this.setState({ emoticonMenu: true })}
                />
              </PopupComponent>

              <AttachFileOutlined
                htmlColor="#565456"
                fontSize="small"
                className="ml-15 button"
                onClick={() => this.fileRef.click()}
              />

              <AlternateEmailOutlined
                htmlColor="#565456"
                fontSize="small"
                className="ml-15 button"
                onClick={() => {
                  this.insertAtCursor("@")
                  this.filterMembers("")
                }}
              />

              <SendOutlined
                htmlColor="#565456"
                className="ml-15 button"
                fontSize="small"
                onClick={this.onSend}
              />
            </React.Fragment>
          }
        </InputContainer>

        {!this.props.compact &&
          <Footer className="row">
            <DiMarkdown
              color="#cfd4d9"
              size={18}
              className="mr-10"
            />
            <span>Use can you <strong>**markdown**</strong> to format your message</span>
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
