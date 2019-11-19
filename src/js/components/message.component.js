import React, { useState, useEffect, memo, useRef } from 'react'
import ReactDOM from 'react-dom'
import moment from 'moment'
import styled from 'styled-components'
import { Picker, Emoji } from 'emoji-mart'
import chroma from 'chroma-js'
import ReactMarkdown from 'react-markdown'
import ModalPortal from '../portals/modal.portal'
import PropTypes from 'prop-types'
import ReactDOMServer from 'react-dom/server'
import ConfirmModal from '../modals/confirm.modal'
import marked from 'marked'
import { useSelector, useDispatch } from 'react-redux'
import { createRoomMessageReaction, deleteRoomMessageReaction, deleteRoomMessage, openApp, createRoomMessage, updateRoom } from '../actions'
import { Attachment, Popup, Avatar, Menu, Tooltip } from '@weekday/elements'
import { youtubeUrlParser, vimeoUrlParser, imageUrlParser, logger, decimalToMinutes } from '../helpers/util'
import GraphqlService from '../services/graphql.service'
import MessagingService from '../services/messaging.service'
import { IconComponent } from './icon.component'
import EventService from '../services/event.service'
import uuidv1 from 'uuid/v1'

export default memo(props => {
  const [message, setMessage] = useState(false)
  const [preview, setPreview] = useState(null)
  const [over, setOver] = useState(false)
  const [forwardMenu, setForwardMenu] = useState(false)
  const [confirmDeleteModal, setConfirmDeleteModal] = useState(false)
  const [emoticonMenu, setEmoticonMenu] = useState(false)
  const dispatch = useDispatch()
  const room = useSelector(state => state.room)
  const team = useSelector(state => state.team)
  const rooms = useSelector(state => state.rooms)
  const user = useSelector(state => state.user)
  const [youtubeVideos, setYoutubeVideos] = useState([])
  const [vimeoVideos, setVimeoVideos] = useState([])
  const [images, setImages] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [senderName, setSenderName] = useState(null)
  const [senderImage, setSenderImage] = useState(null)
  const [senderTimezone, setSenderTimezone] = useState('')
  const [senderTimezoneOffset, setSenderTimezoneOffset] = useState(null)
  const [appActions, setAppActions] = useState([])
  const [appPayload, setAppPayload] = useState('')
  const [appUrl, setAppUrl] = useState(null)
  const [appHeight, setAppHeight] = useState(0)
  const [appWidth, setAppWidth] = useState(200)
  const [weekdayId, setWeekdayId] = useState(null)
  const iframeRef = useRef(null)

  const handleForwardMessage = async(roomId) => {
    setForwardMenu(false)

    const userName = user.name
    const userId = user.id
    const excerpt = userName.toString().split(' ')[0] + ': ' + props.message.message || props.message.message
    const teamId = team.id
    const forwardedMessageContents = props.message.message
    const forwardedMessageAttachments = props.message.attachments
    const parentId = props.message.id

    try {
      const { data } = await GraphqlService.getInstance().createRoomMessage({
        room: roomId,
        user: userId,
        parent: parentId,
        message: forwardedMessageContents,
        attachments: forwardedMessageAttachments,
      })

      // The extra values are used for processing other info
      const roomMessage = {
        message: data.createRoomMessage,
        roomId,
        teamId,
      }

      // Create the message
      dispatch(createRoomMessage(roomId, roomMessage))
      dispatch(updateRoom(roomId, { excerpt }))
    } catch (e) {}
  }

  const handleActionClick = async (action, payload = null) => {
    dispatch(openApp(action, payload))
  }

  const handleDeleteRoomMessage = async () => {
    try {
      await GraphqlService.getInstance().deleteRoomMessage(messageId)

      dispatch(deleteRoomMessage(room.id, props.message.id))
      setConfirmDeleteModal(false)
    } catch (e) {
      logger(e)
    }
  }

  const handleDeleteRoomMessageReaction = async reaction => {
    // Only this user can do this
    if (reaction.split('__')[1] != user.id) return

    try {
      await GraphqlService.getInstance().deleteRoomMessageReaction(props.message.id, reaction)

      setEmoticonMenu(false)
      dispatch(deleteRoomMessageReaction(room.id, props.message.id, reaction))
    } catch (e) {
      logger(e)
    }
  }

  const handleCreateRoomMessageReaction = async emoticon => {
    try {
      const reaction = `${emoticon}__${user.id}__${user.name.split(' ')[0]}`

      await GraphqlService.getInstance().createRoomMessageReaction(props.message.id, reaction)

      setEmoticonMenu(false)
      dispatch(createRoomMessageReaction(room.id, props.message.id, reaction))
    } catch (e) {
      logger(e)
    }
  }

  const highlightMessage = (message, query) => {
    var reg = new RegExp(query, 'gi')
    return message.replace(reg, str => {
      return `<strong>${str}<strong>`
    })
  }

  useEffect(() => {
    EventService.getInstance().on('APP_WINDOW_MESSAGE', data => {
      if (data.weekdayId == weekdayId) {
        if (data.scrollHeight) {
          setAppHeight(parseInt(data.scrollHeight))
        }
      }
    });
  }, [props.message, weekdayId])

  useEffect(() => {
    setImages(props.message.message.split(' ').filter(p => imageUrlParser(p)).map(p => imageUrlParser(p)))
    setYoutubeVideos(props.message.message.split(' ').filter(p => youtubeUrlParser(p)).map(p => youtubeUrlParser(p)))
    setVimeoVideos(props.message.message.split(' ').filter(p => vimeoUrlParser(p)).map(p => vimeoUrlParser(p)))

    // Get the connected app
    setSenderImage(props.message.app ? props.message.app.app.image : props.message.user.image)
    setSenderName(props.message.app ? props.message.app.app.name : props.message.user.name)
    setSenderTimezone(props.message.user ? props.message.user.timezone ? props.message.user.timezone : "No timezone set" : "No timezone set")

    // Only set this for non apps & valid timezones
    if (!props.message.app && props.message.user.timezone) {
      const offsetMinutes = window.now.tz(props.message.user.timezone).utcOffset() / 60

      if (offsetMinutes < 0) setSenderTimezoneOffset(` -${decimalToMinutes(offsetMinutes * -1)}`)
      if (offsetMinutes >= 0) setSenderTimezoneOffset(` +${decimalToMinutes(offsetMinutes)}`)
    }

    // Only update our state if there are any
    if (props.message.app) {
      if (props.message.app.app.message) {
        setAppUrl(props.message.app.app.message.url)
        setAppActions(props.message.app.app.message.actions)
        setAppPayload(props.message.app.payload)
        setAppHeight(props.message.app.app.message.height)
        setAppWidth(props.message.app.app.message.width)
        setWeekdayId(uuidv1())
      }
    }
  }, [props.message])

  // Here we start processing the markdown
  // prettier-ignore
  useEffect(() => {
    const htmlMessage = marked(props.message.message)
    const compiledMessage = props.highlight
                                ? props.highlight != ""
                                  ? highlightMessage(htmlMessage, props.highlight)
                                  : htmlMessage
                                : htmlMessage

    // What we do here is replace the emoji symbol with one from EmojiOne
    const regex = new RegExp('(\:[a-zA-Z0-9-_+]+\:(\:skin-tone-[2-6]\:)?)', 'g')
    const partsOfTheMessageText = []
    let matchArr
    let lastOffset = 0

    // Match all instances of the emoji
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

    // Finally set the message after processnig
    setMessage(partsOfTheMessageText.join(''))
  }, [props.highlight, props.message])

  // prettier-ignore
  return (
    <Message
      className="column"
      onMouseEnter={() => setOver(true)}
      onMouseLeave={() => {
        setOver(false)
        setForwardMenu(false)
        setEmoticonMenu(false)
      }}>
      {confirmDeleteModal &&
        <ConfirmModal
          onOkay={handleDeleteRoomMessage}
          onCancel={() => setConfirmDeleteModal(false)}
          text="Are you sure you want to delete this?"
          title="Are you sure?"
        />
      }

      <div className="row align-items-start w-100">
        {!props.append &&
          <Tooltip text={`${senderTimezone.replace('_', ' ')}${senderTimezoneOffset ? senderTimezoneOffset : ''}`} direction="right">
            <Avatar
              image={senderImage}
              title={senderImage}
              size="medium"
            />
          </Tooltip>
        }

        {props.append && <AvatarBlank />}

        <div className="column flexer pl-15">
          <Bubble className="column">
            <div className="row w-100 relative">
              {!props.append &&
                <React.Fragment>
                  <User>{senderName}</User>
                  {props.message.app && <App>App</App>}
                  <Meta>
                    {moment(props.message.createdAt).tz(user.timezone).fromNow()}
                  </Meta>
                </React.Fragment>
              }

              {over &&
                <Tools className="row">
                  <Popup
                    handleDismiss={() => setEmoticonMenu(false)}
                    visible={emoticonMenu}
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
                    <IconComponent
                      icon="smile"
                      size={15}
                      color="#CFD4D9"
                      className="button mr-10"
                      onClick={() => setEmoticonMenu(true)}
                    />
                  </Popup>

                  <IconComponent
                    icon="delete"
                    size={15}
                    color="#CFD4D9"
                    className="button mr-10"
                    onClick={() => setConfirmDeleteModal(true)}
                  />

                  {!props.message.app &&
                    <React.Fragment>
                      {props.message.user.id == user.id &&
                        <IconComponent
                          icon="pen"
                          size={15}
                          color="#CFD4D9"
                          className="button mr-10"
                          onClick={() => props.setUpdateMessage(props.message)}
                        />
                      }
                    </React.Fragment>
                  }

                  <IconComponent
                    icon="reply"
                    size={15}
                    color="#CFD4D9"
                    className="button mr-10"
                    onClick={() => props.setReplyMessage(props.message)}
                  />

                  <Popup
                    handleDismiss={() => setForwardMenu(false)}
                    visible={forwardMenu}
                    width={275}
                    direction="right-top"
                    content={
                      <React.Fragment>
                        <div className="color-d2 h5 pl-15 pt-15 bold">
                          Forward to room:
                        </div>
                        <Menu
                          items={rooms.map((room) => {
                            const text = room.private ? room.members.reduce((title, member) => member.user.id != user.id ? title + member.user.name : title, "") : room.title

                            return {
                              text,
                              onClick: (e) => handleForwardMessage(room.id),
                            }
                          })}
                        />
                      </React.Fragment>
                    }>
                    <div>
                      <IconComponent
                        icon="forward"
                        size={15}
                        color="#CFD4D9"
                        className="button"
                        onClick={() => setForwardMenu(true)}
                      />
                    </div>
                  </Popup>
                </Tools>
              }
            </div>

            {props.message.parent &&
              <ParentPadding className="column align-items-stretch flexer">
                <ParentText>
                  {props.message.parent.room.id == room.id ? `Replying to:` : `Forwarded from ${props.message.parent.room.title}: `}
                </ParentText>
                <ParentContainer className="row justify-content-center">
                  <div className="column flexer">
                    <div className="row">
                      <ParentName>
                        {props.message.parent.app ? props.message.parent.app.name : props.message.parent.user.name}
                      </ParentName>
                      <ParentMeta>{moment(props.message.parent.createdAt).fromNow()}</ParentMeta>
                    </div>
                    <ParentMessage>
                      <ReactMarkdown source={props.message.parent.message} />
                    </ParentMessage>
                  </div>
                </ParentContainer>
              </ParentPadding>
            }

            <Text dangerouslySetInnerHTML={{__html: message}} />

            {preview &&
              <ModalPortal>
                <PreviewContainer className="row justify-content-center">
                  <PreviewClose>
                    <IconComponent
                      icon="x"
                      size={25}
                      color="#8DA2A5"
                      className="button"
                      onClick={() => setPreview(null)}
                    />
                  </PreviewClose>
                  <PreviewImage
                    image={preview}
                  />
                </PreviewContainer>
              </ModalPortal>
            }

            {props.message.attachments &&
              <React.Fragment>
                {props.message.attachments.length != 0 &&
                  <Attachments>
                    {props.message.attachments.map((attachment, index) => {
                      const isImage = attachment.mime.split('/')[0]

                      return (
                        <Attachment
                          key={index}
                          layout="message"
                          size={attachment.size}
                          mime={attachment.mime}
                          preview={attachment.preview}
                          uri={attachment.uri}
                          name={attachment.name}
                          createdAt={attachment.createdAt}
                          onPreviewClick={isImage ? () => setPreview(attachment.uri) : null}
                        />
                      )
                    })}
                  </Attachments>
                }
              </React.Fragment>
            }

            {images.map((image, index) => {
              const name = image.split('/')[image.split('/').length - 1]
              const extension = image.split('.')[image.split('.').length - 1]
              const mime = `image/${extension}`

              return (
                <Attachment
                  key={index}
                  layout="message"
                  size={null}
                  mime={mime}
                  preview={image}
                  uri={image}
                  name={name}
                  createdAt={props.message.createdAt}
                  onPreviewClick={() => setPreview(image)}
                />
              )
            })}

            {youtubeVideos.map((youtubeVideo, index) => {
              return (
                <iframe
                  key={index}
                  width={560}
                  height={300}
                  src={`https://www.youtube.com/embed/${youtubeVideo}`}
                  frameBorder={0}
                  allow="autoplay; encrypted-media"
                  allowFullScreen>
                </iframe>
              )
            })}

            {vimeoVideos.map((vimeoVideo, index) => {
              return (
                <iframe
                  key={index}
                  width={560}
                  height={300}
                  src={`https://player.vimeo.com/video/${vimeoVideo}`}
                  frameBorder={0}
                  allow="autoplay; encrypted-media"
                  allowFullScreen>
                </iframe>
              )
            })}

            {appUrl &&
              <AppUrl>
                <iframe
                  border="0"
                  ref={iframeRef}
                  src={`${appUrl}?channelId=${room.id}&userId=${user.id}&payload=${appPayload}&weekdayId=${weekdayId}`}
                  width={appWidth}
                  height={appHeight}>
                </iframe>
              </AppUrl>
            }

            {appActions.length != 0 &&
              <AppActions className="row">
                {appActions.map((action, index) => {
                  return (
                    <AppActionContainer
                      key={index}
                      className="row"
                      onClick={() => handleActionClick(action)}>
                      <AppActionImage image={action.icon} />
                      <AppActionText>{action.name}</AppActionText>
                    </AppActionContainer>
                  )
                })}
              </AppActions>
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
})

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
  border: 1px solid #f1f3f5;
  border-radius: 5px;
  position: absolute;
  right: 0px;
  top: 0px;
`

const Meta = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: #adb5bd;
  font-weight: regular;
`

const User = styled.div`
  color: #343a40;
  font-weight: 700;
  font-style: normal;
  font-size: 12px;
  margin-right: 10px;
`

const Text = styled.div`
  font-size: 14px;
  color: #333a40;
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
  border-left: 3px solid #007af5;
  padding: 0px 0px 0px 15px;
  margin-bottom: 5px;
  margin-top: 5px;
`

const ParentMessage = styled.div`
  font-weight: 400;
  font-size: 14px;
  font-style: normal;
  color: #868E95;
  display: inline-block;
  margin-top: 10px;

  strong {
    font-weight: bold;
  }

  p {
    padding: 0px;
    margin: 0px;
  }

  code {
    display :none;
  }

  pre {
    display :none;
  }
`

const ParentName = styled.div`
  color: #343a40;
  font-weight: 700;
  font-style: normal;
  font-size: 12px;
`

const ParentText = styled.div`
  font-size: 12px;
  font-weight: 400;
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

const PreviewContainer = styled.div`
  position: fixed;
  top: 0px;
  left: 0px;
  width: 100%;
  height: 100%;
  z-index: 1;
  background-color: rgba(4, 11, 28, 0.75);
`

const PreviewClose = styled.div`
  position: fixed;
  top: 0px;
  right: 0px;
  width: max-content;
  height: max-content;
  z-index: 1;
  padding: 20px;
`

const PreviewImage = styled.div`
  width: 80%;
  height: 80%;
  background-position: center center;
  background-image: url(${props => props.image});
  background-size: contain;
  border-radius: 5px;
`

const App = styled.div`
  background: #f0f3f5;
  border-radius: 3px;
  padding: 3px 6px 3px 6px;
  color: #b8c4ce;
  margin-right: 10px;
  font-size: 10px;
  font-weight: 600;
`

const AppUrl = styled.div`
  width: ${props => props.width}px;
  height: ${props => props.height}px;
  margin-bottom: 10px;
  border: 1px solid #e1e7eb;
  border-radius: 5px;
  overflow: hidden;

  iframe {
    border: none;
  }
`

const AppActions = styled.div`
`

const AppActionContainer = styled.div`
  padding: 5px;
  margin-right: 5px;
  cursor: pointer;
  opacity: 1;
  transition: opacity 0.25s;

  &:hover {
    opacity: 0.8;
  }
`

const AppActionText = styled.div`
  font-weight: 600;
  color: #b8c4ce;
  font-size: 10px;
`

const AppActionImage = styled.div`
  width: 15px;
  height: 15px;
  overflow: hidden;
  margin-right: 5px;
  background-size: contain;
  background-position: center center;
  background-color: transparent;
  background-repeat: no-repeat;
  background-image: url(${props => props.image});
`

const AvatarBlank = styled.div`
  width: 30px;
  height: 30px;
`
