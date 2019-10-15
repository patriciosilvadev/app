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
import ReactDOMServer from 'react-dom/server'
import marked from 'marked'
import { SentimentSatisfiedOutlined, ReplyOutlined } from '@material-ui/icons'
import { useSelector, useDispatch } from 'react-redux'
import { createRoomMessageReaction, deleteRoomMessageReaction } from '../actions'
import ReplyModal from '../modals/reply.modal'

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
  font-weight: 600;
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
  font-size: 16px;
  color: #212123;
  font-weight: 500;
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
    background: white;
    border: 1px solid #eaeaea;
    border-left: 5px solid #007af5;
    color: #495057;
    border-radius: 2px;
    page-break-inside: avoid;
    font-family: Menlo, monospace;
    font-size: 10px;
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
      font-weight: 800;
      color: #212123;
      padding-left: 5px;
    }
  }
`

const Attachments = styled.div`
  padding-top: 5px;
`

const ParentPadding = styled.div`
  padding: 0px;
`

const ParentContainer = styled.div`
  border: 1px solid #cbd4db;
  padding: 15px;
  border-radius: 10px;
  margin-bottom: 5px;
  margin-top: 5px;
`

const ParentMessage = styled.div`
  font-weight: 500;
  font-size: 16px;
  font-style: normal;
  color: #151b26;
  display: inline-block;
`

const ParentName = styled.div`
  font-weight: 700;
  font-style: normal;
  font-size: 12px;
  color: #151b26;
  display: inline-block;
`

const ParentText = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: #adb5bd;
  font-weight: regular;
  margin-bottom: 10px;
  margin-top: 10px;
  display: inline-block;
`

const ParentMeta = styled.div`
  margin-left: 10px;
  font-size: 12px;
  font-weight: 600;
  color: #adb5bd;
  font-weight: regular;
`

export default function MessageComponent(props) {
  const [over, setOver] = useState(false)
  const [emoticons, setEmoticons] = useState(false)
  const dispatch = useDispatch()
  const room = useSelector(state => state.room)
  const common = useSelector(state => state.common)

  const handleDeleteRoomMessageReaction = reaction => {
    setEmoticons(false)

    // Only this user can do this
    if (reaction.split('__')[1] != common.user.id) return

    dispatch(deleteRoomMessageReaction(props.message.id, reaction))
  }

  const handleCreateRoomMessageReaction = emoticon => {
    setEmoticons(false)
    dispatch(createRoomMessageReaction(props.message.id, `${emoticon}__${common.user.id}__${common.user.name.split(' ')[0]}`))
  }

  // Here we start processing the markdown
  const compiledMessage = marked(props.message.message)

  let matchArr
  let lastOffset = 0

  // prettier-ignore
  const regex = new RegExp('(\:[a-zA-Z0-9-_+]+\:(\:skin-tone-[2-6]\:)?)', 'g')
  const partsOfTheMessageText = []

  while ((matchArr = regex.exec(compiledMessage)) !== null) {
    const previousText = compiledMessage.substring(lastOffset, matchArr.index)
    if (previousText.length) partsOfTheMessageText.push(previousText)

    lastOffset = matchArr.index + matchArr[0].length

    const emoji = ReactDOMServer.renderToStaticMarkup(
      <Emoji
        emoji={matchArr[0]}
        set="emojione"
        size={22}
        fallback={(em, props) => {
          return em ? `:${em.short_names[0]}:` : props.emoji
        }}
      />
    )

    if (emoji) {
      partsOfTheMessageText.push(emoji)
    } else {
      partsOfTheMessageText.push(matchArr[0])
    }
  }

  const finalPartOfTheText = compiledMessage.substring(lastOffset, compiledMessage.length)

  if (finalPartOfTheText.length) partsOfTheMessageText.push(finalPartOfTheText)

  const message = partsOfTheMessageText.join('')

  // prettier-ignore
  return (
    <Message className="column" onMouseEnter={() => setOver(true)} onMouseLeave={() => setOver(false)}>
      <div className="row align-items-start w-100">
        <Avatar
          image={props.message.user.image}
          title={props.message.user.name}
          className="mr-15"
          size="medium"
        />

        <div className="column w-100">
          <Bubble className="column">
            <div className="row w-100 relative">
              <User>{props.message.user.name}</User>
              <Meta>{moment(props.message.createdAt).fromNow()}</Meta>

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
                        onSelect={(emoji) => handleCreateRoomMessageReaction(emoji.colons)}
                      />
                    }>

                    <SentimentSatisfiedOutlined
                      htmlColor="#CFD4D9"
                      fontSize="small"
                      className="button mr-10"
                      onClick={() => setEmoticons(true)}
                    />
                  </PopupComponent>

                  <ReplyOutlined
                    htmlColor="#CFD4D9"
                    fontSize="small"
                    className="button"
                    onClick={props.setReplyMessage}
                  />
                </Tools>
              }
            </div>

            {props.message.parent &&
              <ParentPadding className="column align-items-stretch flexer">
                <ParentText>Replying to:</ParentText>
                <ParentContainer className="row justify-content-center">
                  <div className="column flexer">
                    <div className="row">
                      <ParentName>
                        {props.message.parent.user.name}
                      </ParentName>
                      <ParentMeta>{moment(props.message.parent.createdAt).fromNow()}</ParentMeta>
                    </div>
                    <ParentMessage>
                      {props.message.parent.message}
                    </ParentMessage>
                  </div>
                </ParentContainer>
              </ParentPadding>
            }

            <Text dangerouslySetInnerHTML={{__html: message}} />

            {props.message.attachments &&
              <React.Fragment>
                {props.message.attachments.length != 0 &&
                  <Attachments>
                    {props.message.attachments.map((attachment, index) => {
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

            {props.message.reactions &&
              <React.Fragment>
                {props.message.reactions.length != 0 &&
                  <Reactions className="row">
                    {props.message.reactions.map((reaction, index) => {
                      const reactionParts = reaction.split('__')
                      const emoticon = reactionParts[0]
                      const userName = reactionParts[2]

                      return (
                        <div key={index} className="row button reaction" onClick={() => handleDeleteRoomMessageReaction(reaction)}>
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
          </Bubble>
        </div>
      </div>
    </Message>
  )
}

MessageComponent.propTypes = {
  id: PropTypes.string,
  message: PropTypes.object,
  setReplyMessage: PropTypes.any,
}
