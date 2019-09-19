import React, { useState } from 'react'
import { Avatar } from '@weekday/elements'
import AttachmentComponent from './attachment.component'
import moment from 'moment'
import ComposeComponent from './compose.component'
import styled from 'styled-components'
import { Picker, Emoji } from 'emoji-mart'
import PopupComponent from '../components/popup.component'
import chroma from 'chroma-js'
import ReactMarkdown from 'react-markdown'
import PropTypes from 'prop-types'
import IconComponentSmile from '../icons/User/user-smile-line'
import IconComponentReply from '../icons/Business/reply-line'

const Message = styled.div`
  margin-bottom: 20px;
  width: 100%;
`

const Bubble = styled.div`
  flex: 1;
  /*min-width: 30%;*/
  width: 100%;
`

const Tools = styled.div`
  padding: 10px;
  background: white;
  box-shadow: 0px 0px 10px 0px rgba(0, 0, 0, 0.05);
  border-radius: 5px;
  position: absolute;
  right: 0px;
  top: 0px;
`

const Meta = styled.div`
  margin-left: 10px;
  font-size: 14px;
  color: #adb5bd;
  font-weight: regular;
`

const User = styled.div`
  color: #212123;
  font-weight: 600;
  font-style: normal;
  font-size: 14px;
`

const Text = styled.div`
  font-size: 14px;
  color: #212123;
  font-weight: 400;
  line-height: 1.4;
  padding-top: 5px;
  padding-bottom: 5px;

  strong {
    font-weight: bold;
  }

  p {
    padding: 0px;
    margin: 0px;
  }

  code {
    background: #FAFAFA;
    border: 1px solid #EAEAEA;
    border-left: 3px solid #007af5;
    color: #666;
    border-radius: 5px;
    page-break-inside: avoid;
    font-family: monospace;
    font-size: 14px;
    margin-top: 5px;
    line-height: 1.6;
    max-width: 100%;
    overflow: auto;
    padding: 1em 1.5em;
    display: block;
    word-wrap: break-word;
  }

  pre {
  }
`

const Compose = styled.div`
  margin-top: 20px;
  width: 100%;
`

const Reactions = styled.div`
  padding-top: 5px;
  padding-bottom: 10px;

  .reaction {
    padding: 3px;
    margin-right: 2px;

    .name {
      font-size: 12px;
      font-weight: 500;
      color: #8e8a8c;
      padding-left: 5px;
    }
  }
`

const Attachments = styled.div`
  padding-top: 5px;
`

const Replies = styled.div`
  position: relative;
  width: 100%;
  padding-top: 10px;
`

const ReplyContainer = styled.div`
  margin-top: 2px;
`

const ReplyText = styled.div`
  padding: 10px;
  border-radius: 100px;
  background: ${props =>
    props.color
      ? chroma(props.color)
          .desaturate(3)
          .brighten(2.5)
      : '#f8f9fa'};
  font-size: 13px;
  color: ${props => (props.color ? props.color : '#495057')};
  display: inline-block;

  strong {
    font-weight: 800;
  }
`

export default function MessageComponent(props) {
  const [reply, setReply] = useState(false)
  const [over, setOver] = useState(false)
  const [emoticons, setEmoticons] = useState(false)

  const deleteRoomMessageReaction = reaction => {
    setEmoticons(false)

    // Only this user can do this
    if (reaction.split('__')[1] != props.currentUser.id) return

    props.deleteRoomMessageReaction(props.id, reaction)
  }

  const createRoomMessageReaction = emoticon => {
    setEmoticons(false)

    props.createRoomMessageReaction(props.id, `${emoticon}__${props.currentUser.id}__${props.currentUser.name.split(' ')[0]}`)
  }

  const createRoomMessageReply = (text, attachments) => {
    setReply(false)

    props.createRoomMessageReply(props.id, currentUser.id, text, attachments)
  }

  // prettier-ignore
  return (
    <Message className="column" onMouseEnter={() => setOver(true)} onMouseLeave={() => setOver(false)}>
      <div className="row align-items-start w-100">
        <Avatar
          image={props.user.image}
          title={props.user.name}
          className="mr-15"
          size="medium"
        />

        <div className="column w-100">
          <Bubble className="column">
            <div className="row w-100 relative">
              <User>{props.user.name}</User>
              <Meta>{moment(props.createdAt).fromNow()}</Meta>

              {over &&
                <Tools className="row">
                  <PopupComponent
                    handleDismiss={() => setEmoticons(false)}
                    visible={emoticons}
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
                        onSelect={(emoji) => createRoomMessageReaction(emoji.colons)}
                      />
                    }>

                    <IconComponentSmile
                      fill="#CFD4D9"
                      size={18}
                      className="button mr-10"
                      onClick={() => setEmoticons(true)}
                    />
                  </PopupComponent>

                  <IconComponentReply
                    fill="#CFD4D9"
                    size={18}
                    className="button"
                    onClick={() => setReply(!reply)}
                  />
                </Tools>
              }
            </div>

            <Text>
              <ReactMarkdown source={props.message} />
            </Text>

            {props.reactions &&
              <React.Fragment>
                {props.reactions.length != 0 &&
                  <Reactions className="row">
                    {props.reactions.map((reaction, index) => {
                      const reactionParts = reaction.split('__')
                      const emoticon = reactionParts[0]
                      const userName = reactionParts[2]

                      return (
                        <div key={index} className="row button reaction" onClick={() => deleteRoomMessageReaction(reaction)}>
                          <Emoji
                            emoji={emoticon}
                            size={16}
                            set='emojione'
                          />
                          <span className="name">{userName}</span>
                        </div>
                      )
                    })}
                  </Reactions>
                }
              </React.Fragment>
            }

            {props.attachments &&
              <React.Fragment>
                {props.attachments.length != 0 &&
                  <Attachments>
                    {props.attachments.map((attachment, index) => {
                      return (
                        <AttachmentComponent
                          key={index}
                          layout="message"
                          size={attachment.size}
                          mime={attachment.mime}
                          uri={attachment.uri}
                          name={attachment.name}
                          createdAt={attachment.createdAt}
                          onDownloadClick={() => window.open(attachment.uri)}
                        />
                      )
                    })}
                  </Attachments>
                }
              </React.Fragment>
            }

            {props.replies &&
              <React.Fragment>
                {props.replies.length != 0 &&
                  <Replies>
                    {props.replies.map((r, ri) => {
                      return (
                        <ReplyContainer key={ri}>
                          <ReplyText color={props.currentUser.id == r.user.id ? r.user.color : null}>
                            <strong>@{r.user.username}</strong> {r.reply}
                          </ReplyText>
                        </ReplyContainer>
                      )
                    })}
                  </Replies>
                }
              </React.Fragment>
            }

            {reply &&
              <Compose>
                <ComposeComponent
                  onSend={createRoomMessageReply}
                  compact={true}
                />
              </Compose>
            }
          </Bubble>
        </div>
      </div>
    </Message>
  )
}

MessageComponent.propTypes = {
  id: PropTypes.string,
  reactions: PropTypes.array,
  roomId: PropTypes.string,
  currentUser: PropTypes.object,
  user: PropTypes.object,
  attachments: PropTypes.array,
  message: PropTypes.string,
  replies: PropTypes.array,
  createdAt: PropTypes.string,
  members: PropTypes.array,
  createRoomMessageReply: PropTypes.func,
  createRoomMessageReaction: PropTypes.func,
  deleteRoomMessageReaction: PropTypes.func,
}
