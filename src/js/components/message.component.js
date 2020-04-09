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
import {
  createChannelMessageReaction,
  deleteChannelMessageReaction,
  createChannelMessageLike,
  deleteChannelMessageLike,
  deleteChannelMessage,
  openApp,
  createChannelMessage,
  updateChannel,
} from '../actions'
import { Attachment, Popup, Avatar, Menu, Tooltip } from '@tryyack/elements'
import { urlParser, youtubeUrlParser, vimeoUrlParser, imageUrlParser, logger, decimalToMinutes, parseMessageMarkdown } from '../helpers/util'
import GraphqlService from '../services/graphql.service'
import MessagingService from '../services/messaging.service'
import OpengraphService from '../services/opengraph.service'
import { IconComponent } from './icon.component'
import EventService from '../services/event.service'
import uuidv1 from 'uuid/v1'
import PreviewComponent from './preview.component'

export default memo(props => {
  const [message, setMessage] = useState(false)
  const [preview, setPreview] = useState(null)
  const [over, setOver] = useState(false)
  const [forwardMenu, setForwardMenu] = useState(false)
  const [confirmDeleteModal, setConfirmDeleteModal] = useState(false)
  const [emoticonMenu, setEmoticonMenu] = useState(false)
  const dispatch = useDispatch()
  const channel = useSelector(state => state.channel)
  const team = useSelector(state => state.team)
  const channels = useSelector(state => state.channels)
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
  const [appButtons, setAppButtons] = useState([])
  const [appUrl, setAppUrl] = useState(null)
  const [appHeight, setAppHeight] = useState(0)
  const [appWidth, setAppWidth] = useState(200)
  const [resizeId, setResizeId] = useState(uuidv1())
  const iframeRef = useRef(null)
  const [ogTitle, setOgTitle] = useState(null)
  const [ogDescription, setOgDescription] = useState(null)
  const [ogImage, setOgImage] = useState(null)
  const [ogUrl, setOgUrl] = useState(null)

  const handleForwardMessage = async channelId => {
    setForwardMenu(false)

    const userName = user.name
    const userId = user.id
    const excerpt = userName.toString().split(' ')[0] + ': ' + props.message.message || props.message.message
    const teamId = team.id
    const forwardedMessageContents = props.message.message
    const forwardingOriginalTime = props.message.createdAt
    const forwardedMessageUser = props.message.user.id
    const forwardedMessageAttachments = props.message.attachments

    try {
      const { data } = await GraphqlService.getInstance().createChannelMessage({
        channel: channelId,
        user: forwardedMessageUser,
        forwardingUser: userId,
        forwardingOriginalTime,
        team: teamId,
        message: forwardedMessageContents,
        attachments: forwardedMessageAttachments,
      })

      // The extra values are used for processing other info
      const channelMessage = {
        message: data.createChannelMessage,
        channelId,
        teamId,
      }

      // Create the message
      dispatch(createChannelMessage(channelId, channelMessage))
      dispatch(updateChannel(channelId, { excerpt }))
    } catch (e) {}
  }

  const handleActionClick = async action => {
    dispatch(openApp(action))
  }

  const handleDeleteChannelMessage = async () => {
    try {
      const messageId = props.message.id

      await GraphqlService.getInstance().deleteChannelMessage(messageId)

      dispatch(deleteChannelMessage(channel.id, props.message.id))
      setConfirmDeleteModal(false)
    } catch (e) {
      logger(e)
    }
  }

  const handleDeleteChannelMessageReaction = async reaction => {
    // Only this user can do this
    if (reaction.split('__')[1] != user.id) return

    try {
      await GraphqlService.getInstance().deleteChannelMessageReaction(props.message.id, reaction)

      setEmoticonMenu(false)
      dispatch(deleteChannelMessageReaction(channel.id, props.message.id, reaction))
    } catch (e) {
      logger(e)
    }
  }

  const handleCreateChannelMessageReaction = async emoticon => {
    try {
      const reaction = `${emoticon}__${user.id}__${user.name.split(' ')[0]}`
      const exisitingReactions = props.message.reactions.filter(r => r == reaction)

      if (exisitingReactions.length != 0) return setEmoticonMenu(false)

      await GraphqlService.getInstance().createChannelMessageReaction(props.message.id, reaction)

      setEmoticonMenu(false)
      dispatch(createChannelMessageReaction(channel.id, props.message.id, reaction))
    } catch (e) {
      logger(e)
    }
  }

  const handleDeleteChannelMessageLike = async () => {
    try {
      await GraphqlService.getInstance().deleteChannelMessageLike(props.message.id, user.id)

      dispatch(deleteChannelMessageLike(channel.id, props.message.id, user.id))
    } catch (e) {
      logger(e)
    }
  }

  const handleCreateChannelMessageLike = async () => {
    try {
      await GraphqlService.getInstance().createChannelMessageLike(props.message.id, user.id)

      dispatch(createChannelMessageLike(channel.id, props.message.id, user.id))
    } catch (e) {
      logger(e)
    }
  }

  const handleChannelLikeOrUnlike = () => {
    const likes = props.message.likes || []
    const userLikes = likes.filter(like => like == user.id)
    const userLikedAlready = userLikes.length >= 1

    if (userLikedAlready) {
      handleDeleteChannelMessageLike()
    } else {
      handleCreateChannelMessageLike()
    }
  }

  const fetchOpengraphData = async url => {
    const response = await OpengraphService.fetchUrl(url)
    const { data } = await response.json()
    const processedUrl = data.ogUrl ? data.ogUrl : url

    if (data.ogUrl) setOgUrl(processedUrl)
    if (data.ogTitle) setOgTitle(data.ogTitle)
    if (data.ogDescription) setOgDescription(data.ogDescription)
    if (data.ogImage) {
      const firstImageUrl = data.ogImage.url ? data.ogImage.url : data.ogImage[0].url
      const fullPath = firstImageUrl.substring(0, 4).toLowerCase() == 'http'
      const basePath = processedUrl.split(' / ')[0]

      setOgImage(fullPath ? firstImageUrl : `${basePath}/${firstImageUrl}`)

      // Tell the channel component to scroll down
      EventService.getInstance().emit('FORCE_SCROLL_TO_BOTTOM', null)
    }
  }

  // General app & send info setup
  useEffect(() => {
    const parseUrls = urlParser(props.message.message)
    const firstUrl = parseUrls ? parseUrls[0] : null

    // Just fetch the first URL
    // Process othe rpopular media type that are not supported in OG necessarily
    if (firstUrl) fetchOpengraphData(firstUrl)

    // Display all images
    setImages(
      props.message.message
        .split(' ')
        .filter(p => imageUrlParser(p))
        .map(p => imageUrlParser(p))
    )

    // All Youtube videos
    setYoutubeVideos(
      props.message.message
        .split(' ')
        .filter(p => youtubeUrlParser(p))
        .map(p => youtubeUrlParser(p))
    )

    // All vimeo videos
    setVimeoVideos(
      props.message.message
        .split(' ')
        .filter(p => vimeoUrlParser(p))
        .map(p => vimeoUrlParser(p))
    )

    // Set sender details - and accommodate SYSTEM messages & APP messages
    setSenderImage(props.message.system ? '' : props.message.app ? props.message.app.app.image : props.message.user.image)
    setSenderName(props.message.system ? '' : props.message.app ? props.message.app.app.name : props.message.user.name)
    setSenderTimezone(props.message.user ? (props.message.user.timezone ? props.message.user.timezone : 'Your timezone') : 'Your timezone')

    // Only set this for non apps & valid timezones
    if (!props.message.app && props.message.user) {
      if (props.message.user.timezone) {
        const offsetMinutes =
          moment()
            .tz(props.message.user.timezone)
            .utcOffset() / 60

        if (offsetMinutes < 0) setSenderTimezoneOffset(` -${decimalToMinutes(offsetMinutes * -1)}`)
        if (offsetMinutes >= 0) setSenderTimezoneOffset(` +${decimalToMinutes(offsetMinutes)}`)
      }
    }

    // Only update our state if there are any
    if (props.message.app) {
      // Find the corresponding app ont he channel (needs to be active)
      const channelApp = channel.apps.filter(app => app.app.id == props.message.app.app.id && app.active).flatten()

      // Only if there is an app
      if (!channelApp) return

      // Otherwise carry on
      const channelAppToken = channelApp.token

      // This might be null
      const channelAppMessageButtons = props.message.app.app.message.buttons || []
      const appResourceId = props.message.app.resourceId
      const uniqueIdForResizeId = uuidv1()

      // resourceId is what we use to ID the resource on the app's server
      // This could be an ID - when a user creates a message they add this
      // so we can just feed it back to them
      if (props.message.app.app.message) {
        setAppHeight(props.message.app.app.message.height)
        setAppWidth(props.message.app.app.message.width)

        // Important that we add the channel token to the appAction.payload
        // This action is attached to all buttons - so we can assume this structure:
        setAppButtons(
          channelAppMessageButtons.map(button => {
            return {
              ...button,
              action: {
                ...button.action,
                token: channelApp.token,
              },
            }
          })
        )

        // URL for the message view
        const { url } = props.message.app.app.message

        // If the user has already added a query string or not
        if (url.indexOf('?') == -1) {
          setAppUrl(`${url}?token=${channelAppToken}&userId=${user.id}&resourceId=${appResourceId}&resizeId=${resizeId}`)
        } else {
          setAppUrl(`${url}&token=${channelAppToken}&userId=${user.id}&resourceId=${appResourceId}&resizeId=${resizeId}`)
        }
      }
    }
  }, [props.message])

  // Specifically watch our resizeId
  useEffect(() => {
    EventService.getInstance().on('SYNC_MESSAGE_HEIGHT', data => {
      console.log('SYNC_MESSAGE_HEIGHT → ', data)

      // AUTO_ADJUST_MESSAGE_HEIGHT will be received by ALL MESSAGE COMPONENTS
      // resizeId is auto generated to identify THIS SPECIFIC MESSAGE COMPONENT
      // Only adjust this specific height when received
      if (data.resizeId == resizeId) {
        if (data.resizeHeight) {
          // Resize the app message window
          setAppHeight(parseInt(data.resizeHeight))

          // Tell the channel component to scroll down
          EventService.getInstance().emit('FORCE_SCROLL_TO_BOTTOM', null)
        }
      }
    })
  }, [props.message, resizeId])

  // Here we start processing the markdown & text highighting
  useEffect(() => {
    setMessage(parseMessageMarkdown(props.message.message, props.highlight))
  }, [props.highlight, props.message])

  // Render functions for the message component
  // To make thigs easier to understand
  const renderName = () => {
    if (props.append) return null

    return (
      <React.Fragment>
        {!props.message.system && <User>{senderName}</User>}
        {props.message.app && <App>App</App>}

        <Date>
          {props.message.system && <span>{props.message.message} - </span>}

          {moment(props.message.forwardingOriginalTime ? props.message.forwardingOriginalTime : props.message.createdAt)
            .tz(user.timezone)
            .fromNow()}
        </Date>
      </React.Fragment>
    )
  }

  const renderAvatar = () => {
    if (!props.append && !props.message.system) {
      return (
        <Tooltip text={`${senderTimezone.replace('_', ' ')}${senderTimezoneOffset ? senderTimezoneOffset : ''}`} direction="right">
          <Avatar image={senderImage} title={senderImage} size="medium" />
        </Tooltip>
      )
    }

    if (props.append || props.message.system) return <AvatarBlank />

    return null
  }

  const renderTools = () => {
    if (!over || props.message.system) return null

    return (
      <Tools className="row">
        <Popup
          handleDismiss={() => setEmoticonMenu(false)}
          visible={emoticonMenu}
          width={350}
          direction="right-top"
          content={<Picker style={{ width: 350 }} set="emojione" title="" emoji="" showPreview={false} showSkinTones={false} onSelect={emoji => handleCreateChannelMessageReaction(emoji.colons)} />}
        >
          <IconComponent icon="smile" size={15} color="#CFD4D9" className="button mr-10" onClick={() => setEmoticonMenu(true)} />
        </Popup>

        <IconComponent icon="thumbs-up" size={15} color="#CFD4D9" className="button mr-10" onClick={() => handleChannelLikeOrUnlike()} />

        <IconComponent icon="delete" size={15} color="#CFD4D9" className="button mr-10" onClick={() => setConfirmDeleteModal(true)} />

        {!props.message.app && (
          <React.Fragment>
            {props.message.user.id == user.id && <IconComponent icon="pen" size={15} color="#CFD4D9" className="button mr-10" onClick={() => props.setUpdateMessage(props.message)} />}
          </React.Fragment>
        )}

        <IconComponent icon="reply" size={15} color="#CFD4D9" className="button mr-10" onClick={() => props.setReplyMessage(props.message)} />

        <Popup
          handleDismiss={() => setForwardMenu(false)}
          visible={forwardMenu}
          width={275}
          direction="right-top"
          content={
            <React.Fragment>
              <div className="color-d2 h5 pl-15 pt-15 bold">Forward to channel:</div>
              <Menu
                items={channels.map(c => {
                  const channelTitle = c.otherUser ? (c.otherUser.name ? c.otherUser.name : c.title) : c.title
                  return {
                    text: `${channelTitle} ${c.id == channel.id ? '(this channel)' : ''}`,
                    onClick: e => handleForwardMessage(c.id),
                  }
                })}
              />
            </React.Fragment>
          }
        >
          <div>
            <IconComponent icon="forward" size={15} color="#CFD4D9" className="button" onClick={() => setForwardMenu(true)} />
          </div>
        </Popup>
      </Tools>
    )
  }

  const renderParent = () => {
    if (props.message.parent) {
      if (props.message.parent.channel) {
        return (
          <ParentPadding className="column align-items-stretch flexer">
            <ParentText>{`Replying to: ${props.message.parent.channel.title}`}</ParentText>
            <ParentContainer className="row justify-content-center">
              <div className="column flexer">
                <div className="row">
                  <ParentName>{props.message.parent.app ? props.message.parent.app.name : props.message.parent.user.name}</ParentName>
                  <ParentDate>{moment(props.message.parent.createdAt).fromNow()}</ParentDate>
                </div>
                <ParentMessage>
                  <ReactMarkdown source={props.message.parent.message} />
                </ParentMessage>
              </div>
            </ParentContainer>
          </ParentPadding>
        )
      }
    }

    return null
  }

  const renderPreview = () => {
    if (!preview) return null

    return <PreviewComponent onClose={() => setPreview(null)} image={preview} />
  }

  const renderAttachments = () => {
    if (!props.message) return null
    if (!props.message.attachments) return null
    if (!props.message.attachments.length) return null
    if (props.message.attachments.length == 0) return null

    return (
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
    )
  }

  const renderMedia = () => {
    return (
      <React.Fragment>
        {images.map((image, index) => {
          const name = image.split('/')[image.split('/').length - 1]
          const extension = image.split('.')[image.split('.').length - 1]
          const mime = `image/${extension}`

          return (
            <Attachment key={index} layout="message" size={null} mime={mime} preview={image} uri={image} name={name} createdAt={props.message.createdAt} onPreviewClick={() => setPreview(image)} />
          )
        })}

        {youtubeVideos.map((youtubeVideo, index) => {
          return <iframe key={index} width={560} height={300} src={`https://www.youtube.com/embed/${youtubeVideo}`} frameBorder={0} allow="autoplay; encrypted-media" allowFullScreen></iframe>
        })}

        {vimeoVideos.map((vimeoVideo, index) => {
          return <iframe key={index} width={560} height={300} src={`https://player.vimeo.com/video/${vimeoVideo}`} frameBorder={0} allow="autoplay; encrypted-media" allowFullScreen></iframe>
        })}
      </React.Fragment>
    )
  }

  const renderOpengraph = () => {
    if (!ogTitle) return null

    return (
      <UrlPreview className="button" href={ogUrl} target="_blank">
        {ogImage && <img className="mb-5" src={ogImage} height="200" />}
        {ogTitle && <div className="h4 color-d3 mb-5">{ogTitle}</div>}
        {ogDescription && <div className="p color-d0">{ogDescription}</div>}
      </UrlPreview>
    )
  }

  const renderApp = () => {
    if (!appUrl) return null

    return (
      <AppUrl>
        <iframe border="0" ref={iframeRef} src={appUrl} width={appWidth} height={appHeight}></iframe>
      </AppUrl>
    )
  }

  const renderAppButtons = () => {
    if (!appButtons) return null
    if (!appButtons.length) return null
    if (appButtons.length == 0) return null

    return (
      <AppActions className="row">
        {appButtons.map((button, index) => {
          return (
            <AppActionContainer key={index} className="row" onClick={() => handleActionClick(button.action)}>
              <AppActionImage image={button.icon} />
              <AppActionText>{button.text}</AppActionText>
            </AppActionContainer>
          )
        })}
      </AppActions>
    )
  }

  const renderReactionsLikes = () => {
    if (!props.message) return null

    const reactions = props.message.reactions || []
    const likes = props.message.likes || []

    if (reactions.length == 0 && likes.length == 0) return null

    return (
      <div className="row">
        {likes.length != 0 && (
          <Likes className="button row" onClick={() => handleChannelLikeOrUnlike()}>
            <IconComponent icon="thumbs-up" size={15} color="#617691" thickness={1.5} />

            <Like>{likes.length}</Like>
          </Likes>
        )}

        {reactions.length != 0 && (
          <Reactions className="row">
            {reactions.map((reaction, index) => {
              const reactionParts = reaction.split('__')
              const emoticon = reactionParts[0]
              const userName = reactionParts[2]

              return (
                <div key={index} className="row button reaction" onClick={() => handleDeleteChannelMessageReaction(reaction)}>
                  <Emoji emoji={emoticon} size={18} set="emojione" />
                </div>
              )
            })}
          </Reactions>
        )}
      </div>
    )
  }

  const renderMessage = () => {
    // Do not render the message text if it's a system message
    if (props.message.system) return null

    return <Text dangerouslySetInnerHTML={{ __html: message }} />
  }

  const renderForwardingUser = () => {
    if (!props.message.forwardingUser) return null

    return (
      <ForwardingUserContainer className="row">
        <ForwardingUser>
          Forwarded from {props.message.forwardingUser.name}{' '}
          {moment(props.message.createdAt)
            .tz(user.timezone)
            .fromNow()}
        </ForwardingUser>
      </ForwardingUserContainer>
    )
  }

  return (
    <Message
      className="column"
      onMouseEnter={() => setOver(true)}
      onMouseLeave={() => {
        setOver(false)
        setForwardMenu(false)
        setEmoticonMenu(false)
      }}
    >
      {confirmDeleteModal && <ConfirmModal onOkay={handleDeleteChannelMessage} onCancel={() => setConfirmDeleteModal(false)} text="Are you sure you want to delete this?" title="Are you sure?" />}

      {renderForwardingUser()}
      <div className="row align-items-start w-100">
        {renderAvatar()}

        <div className="column flexer pl-15">
          <Bubble className="column">
            <div className="row w-100 relative">
              {renderName()}
              {renderTools()}
            </div>

            {renderParent()}
            {renderMessage()}
            {renderPreview()}
            {renderOpengraph()}
            {renderAttachments()}
            {renderMedia()}
            {renderApp()}
            {renderAppButtons()}
            {renderReactionsLikes()}
          </Bubble>
        </div>
      </div>
    </Message>
  )
})

const UrlPreview = styled.a`
  border-left: 3px solid #007af5;
  padding: 0px 0px 0px 15px;
  margin-bottom: 20px;
  margin-top: 5px;
  cursor: pointer;
`

const Message = styled.div`
  margin-bottom: 10px;
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

const Date = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #adb5bd;
  font-weight: regular;
`

const ForwardingUserContainer = styled.div`
  width: 100%;
  padding-bottom: 5px;
  margin-bottom: 10px;
`

const ForwardingUser = styled.div`
  color: #343a40;
  font-weight: 400;
  font-style: normal;
  font-size: 12px;
  font-style: italic;
  margin-right: 5px;
`

const User = styled.div`
  color: #343a40;
  font-weight: 600;
  font-style: normal;
  font-size: 14px;
  margin-right: 5px;
`

const Text = styled.div`
  font-size: 14px;
  color: #333a40;
  font-weight: 400;
  line-height: 1.4;
  padding-top: 5px;
  padding-bottom: 5px;

  blockquote {
    border-left: 5px solid #007af5;
    font-size: 14px;
    margin: 0px;
    padding: 0px;
    padding-left: 1em;
  }

  del {
    text-decoration: line-through;
  }

  i {
    font-weight: bold;
    font-style: italic;
    font-size: 14px;
  }

  b,
  strong {
    font-weight: bold;
    font-size: 14px;
  }

  p {
    padding: 0px;
    margin: 0px;
    font-size: 14px;
  }

  code {
    background: white;
    border: 1px solid #eaeaea;
    border-left: 5px solid #007af5;
    color: #495057;
    border-radius: 2px;
    page-break-inside: avoid;
    font-family: monospace !important;
    font-size: 12px;
    margin-top: 5px;
    line-height: 1.6;
    max-width: 100%;
    overflow: auto;
    padding: 1em 1.5em;
    display: block;
    word-wrap: break-word;
  }

  pre {
    font-size: 14px;
    font-family: monospace !important;
  }
`

const Compose = styled.div`
  margin-top: 20px;
  width: 100%;
`

const Likes = styled.div`
  padding: 5px;
  border-radius: 10px;
  margin-right: 5px;
  background-color: #f6f7fa;
`

const Like = styled.div`
  color: #617691;
  margin-left: 5px;
  position: relative;
  top: 1px;
  font-size: 11px;
  font-weight: 600;
`

const Reactions = styled.div`
  padding-top: 10px;
  padding-bottom: 10px;

  .reaction {
    padding: 3px;
    margin-right: 2px;
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
  color: #868e95;
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
    display: none;
    font-family: monospace !important;
  }

  pre {
    display: none;
    font-family: monospace !important;
  }
`

const ParentName = styled.div`
  color: #343a40;
  font-weight: 700;
  font-style: normal;
  font-size: 13px;
`

const ParentText = styled.div`
  font-size: 13px;
  font-weight: 400;
  color: #adb5bd;
  font-weight: regular;
  margin-bottom: 10px;
  margin-top: 10px;
  display: inline-block;
`

const ParentDate = styled.div`
  margin-left: 10px;
  font-size: 13px;
  font-weight: 600;
  color: #adb5bd;
  font-weight: regular;
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

const AppActions = styled.div``

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
