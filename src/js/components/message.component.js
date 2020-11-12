import React, { useState, useEffect, memo, useRef } from 'react'
import ReactDOM from 'react-dom'
import moment from 'moment'
import styled from 'styled-components'
import { Picker, Emoji } from 'emoji-mart'
import { browserHistory } from '../services/browser-history.service'
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
  updateChannelMessage,
  updateChannelMessageReadCount,
  updateChannelMessageInitialReadCount,
  updateChannelCreateMessagePin,
  updateChannelDeleteMessagePin,
  updateChannelMessageTaskAttachment,
  hydrateTask,
} from '../actions'
import { Attachment, Popup, Avatar, Menu, Tooltip, Button } from '@weekday/elements'
import { getMentions, urlParser, youtubeUrlParser, vimeoUrlParser, imageUrlParser, logger, decimalToMinutes, parseMessageMarkdown, getPresenceText } from '../helpers/util'
import GraphqlService from '../services/graphql.service'
import MessagingService from '../services/messaging.service'
import OpengraphService from '../services/opengraph.service'
import * as ReadService from '../services/read.service'
import { IconComponent } from './icon.component'
import EventService from '../services/event.service'
import uuidv1 from 'uuid/v1'
import PreviewComponent from './preview.component'
import { MIME_TYPES } from '../constants'
import { CheckboxComponent } from '../extensions/tasks/components/checkbox/checkbox.component'

export default memo(props => {
  const [body, setBody] = useState(false)
  const [preview, setPreview] = useState(null)
  const [over, setOver] = useState(false)
  const [forwardMenu, setForwardMenu] = useState(false)
  const [confirmDeleteModal, setConfirmDeleteModal] = useState(false)
  const [emoticonMenu, setEmoticonMenu] = useState(false)
  const dispatch = useDispatch()
  const channel = useSelector(state => state.channel)
  const team = useSelector(state => state.team)
  const channels = useSelector(state => state.channels)
  const presences = useSelector(state => state.presences)
  const user = useSelector(state => state.user)
  const [youtubeVideos, setYoutubeVideos] = useState([])
  const [vimeoVideos, setVimeoVideos] = useState([])
  const [images, setImages] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [senderName, setSenderName] = useState(null)
  const [senderImage, setSenderImage] = useState(null)
  const [senderPresence, setSenderPresence] = useState(null)
  const [senderTimezone, setSenderTimezone] = useState('')
  const [senderTimezoneOffset, setSenderTimezoneOffset] = useState(null)
  const [appButtons, setAppButtons] = useState([])
  const [appUrl, setAppUrl] = useState(null)
  const [appHeight, setAppHeight] = useState(0)
  const [appWidth, setAppWidth] = useState(200)
  const [resizeId, setResizeId] = useState(uuidv1())
  const [ogTitle, setOgTitle] = useState(null)
  const [ogDescription, setOgDescription] = useState(null)
  const [ogImage, setOgImage] = useState(null)
  const [ogUrl, setOgUrl] = useState(null)
  const [priority, setPriority] = useState(null)
  const iframeRef = useRef(null)

  const getMessagePriorityLevel = messageBody => {
    if (!messageBody) return null
    if (messageBody.substring(0, 3) == '!!!') return 3
    if (messageBody.substring(0, 2) == '!!') return 2
    if (messageBody.substring(0, 1) == '!') return 1
    return null
  }

  const stripPriorityLevelFromText = (messageBody, priorityLevel) => {
    if (priorityLevel) return messageBody.substring(priorityLevel)

    return messageBody
  }

  const fetchTaskExtensionMetaData = async taskId => {
    try {
      const { data } = await GraphqlService.getInstance().channelTask(taskId)
      let task = data.channelTask

      // Probably deleted
      if (!task) task = { id: taskId, done: false, title: '', deleted: true }

      // Calling
      dispatch(updateChannelMessageTaskAttachment(channel.id, taskId, task))
    } catch (e) {
      console.log(e)
    }
  }

  const handleMessagePin = async () => {
    try {
      const messageId = props.message.id
      const channelId = channel.id
      const pinned = !(props.message.pinned || props.pinned)

      // Create our base message object
      let channelMessage = { ...props.message, pinned }

      // We don't want a parent
      // delete channelMessage.parent

      // Make the GQL call
      await GraphqlService.getInstance().updateChannelMessage(messageId, { pinned })

      // Update the pinned list with our message
      // This also syncs across clients
      if (pinned) dispatch(updateChannelCreateMessagePin(channelId, channelMessage))
      if (!pinned) dispatch(updateChannelDeleteMessagePin(channelId, messageId))

      // Also update this message in the channel messages list
      // NOTE First channelId tell it to SYNC
      // Second one makes sure this message only gets asent ot this channel
      dispatch(updateChannelMessage(channelId, { channelId, messageId, message: { pinned } }))
    } catch (e) {
      logger(e)
    }
  }

  const handleForwardMessage = async channelId => {
    setForwardMenu(false)

    const userName = user.name
    const userId = user.id
    const excerpt = userName.toString().split(' ')[0] + ': ' + props.message.body || props.message.body
    const teamId = team.id
    const forwardedMessageContents = props.message.body
    const forwardingOriginalTime = props.message.createdAt
    const forwardedMessageUser = props.message.user.id
    const forwardedMessageAttachments = props.message.attachments
    const mentions = getMentions(forwardedMessageContents)

    try {
      const { data } = await GraphqlService.getInstance().createChannelMessage({
        channel: channelId,
        user: forwardedMessageUser,
        forwardingUser: userId,
        forwardingOriginalTime,
        team: teamId,
        body: forwardedMessageContents,
        attachments: forwardedMessageAttachments,
        mentions,
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
    } catch (e) {
      logger(e)
    }
  }

  const handleActionClick = async action => {
    dispatch(openApp(action))
  }

  const handleDeleteChannelMessage = async () => {
    try {
      const messageId = props.message.id
      const channelId = channel.id

      await GraphqlService.getInstance().deleteChannelMessage(messageId)

      dispatch(updateChannelDeleteMessagePin(channelId, messageId))
      dispatch(deleteChannelMessage(channelId, messageId))
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
    }
  }

  // General app & send info setup
  useEffect(() => {
    const parseUrls = urlParser(props.message.body)
    const firstUrl = parseUrls ? parseUrls[0] : null

    // Just fetch the first URL
    // Process othe rpopular media type that are not supported in OG necessarily
    if (firstUrl) fetchOpengraphData(firstUrl)

    // Display all images
    setImages(
      props.message.body
        .split(' ')
        .filter(p => imageUrlParser(p))
        .map(p => imageUrlParser(p))
    )

    // All Youtube videos
    setYoutubeVideos(
      props.message.body
        .split(' ')
        .filter(p => youtubeUrlParser(p))
        .map(p => youtubeUrlParser(p))
    )

    // All vimeo videos
    setVimeoVideos(
      props.message.body
        .split(' ')
        .filter(p => vimeoUrlParser(p))
        .map(p => vimeoUrlParser(p))
    )

    // Set sender details - and accommodate SYSTEM messages & APP messages
    setSenderImage(props.message.system ? '' : props.message.app ? props.message.app.app.image : props.message.user.image)
    setSenderName(props.message.system ? '' : props.message.user ? props.message.user.name : 'Autobot')
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
        if (url) {
          if (url != '') {
            if (url.indexOf('?') == -1) {
              setAppUrl(`${url}?token=${channelAppToken}&userId=${user.id}&resourceId=${appResourceId}&resizeId=${resizeId}`)
            } else {
              setAppUrl(`${url}&token=${channelAppToken}&userId=${user.id}&resourceId=${appResourceId}&resizeId=${resizeId}`)
            }
          }
        }
      }
    }
  }, [props.message])

  // See if there are any extension attachments
  // We also use this set up the extensions based on the
  // attachments' detail
  // URI -> usually extension resource ID
  useEffect(() => {
    const dummyFunctionForHooks = () => null

    // Because useEffect requires a return being a function
    if (!props.message) return dummyFunctionForHooks
    if (!props.message.attachments) return dummyFunctionForHooks
    if (!props.message.attachments.length) return dummyFunctionForHooks
    if (props.message.attachments.length == 0) return dummyFunctionForHooks

    // Only valid attachments please
    props.message.attachments.map(attachment => {
      if (attachment) {
        if (attachment.mime == MIME_TYPES.TASKS) {
          fetchTaskExtensionMetaData(attachment.uri)
        }
      }
    })
  }, [])

  // Handling presence updates
  useEffect(() => {
    // Only do this for human senders
    // Add the presence to the avatar
    // Only update if changes
    if (!props.message.app && !props.message.system) {
      if (senderPresence != getPresenceText(presences[props.message.user.id])) {
        setSenderPresence(getPresenceText(presences[props.message.user.id]))
      }
    }
  }, [presences])

  // Specifically watch our resizeId
  useEffect(() => {
    EventService.getInstance().on('SYNC_MESSAGE_HEIGHT', data => {
      logger('SYNC_MESSAGE_HEIGHT → ', data)

      // AUTO_ADJUST_MESSAGE_HEIGHT will be received by ALL MESSAGE COMPONENTS
      // resizeId is auto generated to identify THIS SPECIFIC MESSAGE COMPONENT
      // Only adjust this specific height when received
      if (data.resizeId == resizeId) {
        if (data.resizeHeight) {
          setAppHeight(data.resizeHeight)
        }
      }
    })
  }, [props.message, resizeId])

  // Here we start processing the markdown & text highighting
  useEffect(() => {
    let messageBody = props.message.body || ''
    const priorityLevel = getMessagePriorityLevel(messageBody)

    if (priorityLevel) messageBody = stripPriorityLevelFromText(messageBody, priorityLevel)

    setPriority(priorityLevel)
    setBody(parseMessageMarkdown(messageBody, props.highlight))
  }, [props.highlight, props.message])

  // Message reads - runs once
  /*
  Basic synopsis:

  once a user loads a message:
  - display 2 ticks of message is READ, if not:
    - resolver loads total read count from CASSANDRA
    - user calls API and adds another read
      - send a SYNC message to other users that they've read it (bumps read count)
      - if read count == channel members:
        - mark message as read / 2 ticks
        - make API call to mark MONGO message as read
  */
  useEffect(() => {
    // We set this on a timeout so all other variables have time to propagate
    setTimeout(() => {
      const { read } = props.message
      const { totalMembers } = channel
      const channelId = channel.id
      const teamId = team.id
      const userId = user.id
      const messageId = props.message.id

      // Only do this is the message is not all read
      if (!read) {
        GraphqlService.getInstance()
          .channelMessageReadCount(messageId, teamId, channelId)
          .then(result => {
            const { channelMessageReadCount } = result.data

            // Set the initial count first
            dispatch(updateChannelMessageInitialReadCount(channelId, messageId, channelMessageReadCount))

            // Now add our read to the mix - sync this with other people
            dispatch(updateChannelMessageReadCount(channelId, messageId))

            // If the total members are the same as all the reads then mark it as read
            // We're accounting here for the fact that we've read it
            if (totalMembers <= channelMessageReadCount + 1) {
              // We don't bother with syncing the READ property
              // here because users will already be checking for the read count
              ReadService.updateMessageAsRead(messageId)
            } else {
              // If not and not everyone has read this yet, then add our read
              ReadService.addMessageRead(messageId, userId, channelId, teamId)
            }
          })
          .catch(error => {
            logger(error)
          })
      }
    }, 500)
  }, [])

  const renderDeviceIcons = () => {
    switch (props.message.device) {
      case 'WEB':
        return <IconComponent icon="monitor" thickness={2} size={13} color="#aeb5bc" className="ml-5" />
      case 'DESKTOP':
        return <IconComponent icon="monitor" thickness={2} size={13} color="#aeb5bc" className="ml-5" />
      case 'MOBILE':
        return <IconComponent icon="smartphone" thickness={2} size={13} color="#aeb5bc" className="ml-5" />
      default:
        return null
    }
  }

  // Render functions for the message component
  // To make thigs easier to understand
  const renderName = () => {
    if (props.append) return null

    return (
      <div className="row">
        {!props.message.system && <User priority={priority}>{senderName}</User>}
        {props.message.app && <App>{props.message.app.app.name}</App>}
        <Date>
          {props.message.system && <span>{props.message.body} - </span>}

          {moment(props.message.forwardingOriginalTime ? props.message.forwardingOriginalTime : props.message.createdAt)
            .tz(user.timezone)
            .fromNow()}
        </Date>

        <div className="row">
          {!props.message.system && <IconComponent icon="check" thickness={2} size={15} color="#aeb5bc" />}
          {!props.message.system && (channel.totalMembers <= props.message.reads || props.message.read) && (
            <IconComponent icon="check" size={15} color="#aeb5bc" thickness={2} style={{ marginLeft: -11 }} />
          )}

          {renderDeviceIcons()}
        </div>
      </div>
    )
  }

  const renderAvatar = () => {
    if (!props.append && !props.message.system) {
      return (
        <Tooltip text={`${senderTimezone.replace('_', ' ')}${senderTimezoneOffset ? senderTimezoneOffset : ''}`} direction="right">
          <Avatar image={senderImage} title={senderName} presence={senderPresence} size="medium" />
        </Tooltip>
      )
    }

    if (props.append || props.message.system) return <AvatarBlank />

    return null
  }

  const renderTools = () => {
    if (props.message.system) return null

    return (
      <Tools hover={over}>
        {!props.pinned && (
          <Popup
            handleDismiss={() => setEmoticonMenu(false)}
            visible={emoticonMenu}
            width={350}
            direction="right-top"
            content={<Picker style={{ width: 350 }} set="emojione" title="" emoji="" showPreview={false} showSkinTones={false} onSelect={emoji => handleCreateChannelMessageReaction(emoji.colons)} />}
          >
            <Tool onClick={() => setEmoticonMenu(true)} first={true}>
              <IconComponent icon="smile" size={15} color="#aeb5bc" />
            </Tool>
          </Popup>
        )}

        {!props.pinned && (
          <Tool onClick={() => handleChannelLikeOrUnlike()}>
            <IconComponent icon="thumbs-up" size={15} color="#aeb5bc" />
          </Tool>
        )}

        {/* Temporarily disabling this: !props.message.app */}
        {/* Check here that there is a user! */}
        {/* And then only for this user - otherwise ALWAYS */}
        {(props.message.user ? props.message.user.id == user.id : true) && !props.pinned && (
          <Tool onClick={() => setConfirmDeleteModal(true)}>
            <IconComponent icon="delete" size={15} color="#aeb5bc" />
          </Tool>
        )}

        {/* only for this user */}
        {!props.message.app && props.message.user.id == user.id && !props.pinned && (
          <Tool onClick={() => props.setUpdateMessage(props.message)}>
            <IconComponent icon="pen" size={15} color="#aeb5bc" />
          </Tool>
        )}

        {!props.pinned && (
          <Tool onClick={() => props.setReplyMessage(props.message)}>
            <IconComponent icon="reply" size={15} color="#aeb5bc" />
          </Tool>
        )}

        <Tool onClick={() => handleMessagePin()}>{props.message.pinned || props.pinned ? 'Unpin' : 'Pin to top'}</Tool>

        {!props.pinned && (
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
                    const channelName = c.otherUser ? (c.otherUser.name ? c.otherUser.name : c.name) : c.name
                    return {
                      text: `${channelName} ${c.id == channel.id ? '(this channel)' : ''}`,
                      onClick: e => handleForwardMessage(c.id),
                    }
                  })}
                />
              </React.Fragment>
            }
          >
            <Tool onClick={() => setForwardMenu(true)} last={true}>
              Forward
            </Tool>
          </Popup>
        )}
      </Tools>
    )
  }

  const renderParent = () => {
    if (props.message.parent) {
      if (props.message.parent.channel) {
        return (
          <ParentPadding className="column align-items-stretch flexer">
            <ParentText>{`Replying to:`}</ParentText>
            <ParentContainer className="row justify-content-center">
              <div className="column flexer">
                <div className="row">
                  <ParentName>{props.message.parent.app ? props.message.parent.app.name : props.message.parent.user.name}</ParentName>
                  <ParentDate>{moment(props.message.parent.createdAt).fromNow()}</ParentDate>
                </div>
                <ParentMessage>
                  <ReactMarkdown source={props.message.parent.body} />
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
          if (attachment == null || attachment == undefined) return null

          const { mime, name, uri, meta } = attachment

          switch (mime) {
            case MIME_TYPES.CALLS:
              // We don't really need the URI here because we're just navigating to the list
              // Bu tthe URI here will be the room ID if we ever need better integration
              return (
                <Button
                  key={index}
                  text="Join the call"
                  className="mt-10 mb-5"
                  onClick={() => browserHistory.push(`/app/team/${team.id}/channel/${channel.id}/video`)}
                  icon={<IconComponent icon="video" size={14} thickness={2} color="white" />}
                />
              )

            case MIME_TYPES.TASKS:
              // This is the actual task details
              // ⚠️ Meta does no exist in the DB schema
              // Gets created with a hook above
              if (!meta) return null
              if (!meta.id) return null
              if (meta.deleted) return null

              // Return a nice looking display
              return (
                <div key={index} className="row mb-10">
                  {!meta.deleted && (
                    <div className="row align-items-start mb-10 mt-10">
                      <div className="mr-10">
                        <CheckboxComponent done={meta.done} />
                      </div>
                      <div className="column">
                        <div className="h5 color-d3 bold">{meta.title}</div>
                        <div className="small color-d2 button bold mt-5" onClick={() => dispatch(hydrateTask({ id: meta.id }))}>
                          Open task
                        </div>
                      </div>
                    </div>
                  )}

                  {meta.deleted && <div className="h5 color-d0 small bold">This task was deleted</div>}
                </div>
              )

            default:
              // Default here is simply the normal attacchments
              return (
                <Attachment
                  key={index}
                  size={attachment.size}
                  mime={attachment.mime}
                  preview={attachment.preview}
                  uri={attachment.uri}
                  name={attachment.name}
                  createdAt={attachment.createdAt}
                  onPreviewClick={mime.split('/')[0] == 'image' ? () => setPreview(attachment.uri) : null}
                />
              )
          }
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

          return <Attachment key={index} size={null} mime={mime} preview={image} uri={image} name={name} createdAt={props.message.createdAt} onPreviewClick={() => setPreview(image)} />
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
    if (appUrl == '') return null

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

    return <Text priority={priority} dangerouslySetInnerHTML={{ __html: body }} />
  }

  const renderForwardingUser = () => {
    if (!props.message) return null
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
            <HeaderRow>
              {renderName()}
              {renderTools()}
            </HeaderRow>

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

const HeaderRow = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-content: center;
  align-items: center;
  width: 100%;
  position: relative;
`

const Tools = styled.div`
  position: absolute;
  right: 0px;
  top: 0px;
  flex-direction: row;
  justify-content: flex-start;
  align-content: center;
  align-items: center;
  display: ${props => (props.hover ? 'flex' : 'none')};

  @media only screen and (max-width: 768px) {
    display: none;
  }
`

const Tool = styled.div`
  background: white;
  border-left: 1px solid #e9edef;
  border-top: 1px solid #e9edef;
  border-bottom: 1px solid #e9edef;
  border-right: ${props => (props.last ? '1' : '0')}px solid #e9edef;
  border-top-left-radius: ${props => (props.first ? '5' : '0')}px;
  border-bottom-left-radius: ${props => (props.first ? '5' : '0')}px;
  border-top-right-radius: ${props => (props.last ? '5' : '0')}px;
  border-bottom-right-radius: ${props => (props.last ? '5' : '0')}px;
  padding: 5px 7px 5px 7px;
  color: #aeb5bc;
  margin: 0px;
  height: 25px;
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-content: center;
  align-items: center;
  cursor: pointer;
  font-size: 10px;

  &:hover {
    background: #f2f3f5;
  }
`

const Date = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: #adb5bd;
  margin-right: 10px;
  margin-left: 5px;
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
  color: ${props => {
    switch (props.priority) {
      case 1:
        return 'blue'
      case 2:
        return 'orange'
      case 3:
        return 'red'
      default:
        return '#333a40'
    }
  }};
  font-weight: 600;
  font-style: normal;
  font-size: 14px;
  margin-right: 5px;
`

const Text = styled.div`
  font-size: 14px;
  color: ${props => {
    switch (props.priority) {
      case 1:
        return 'blue'
      case 2:
        return 'orange'
      case 3:
        return 'red'
      default:
        return '#333a40'
    }
  }};
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
    color: #495057;
    font-weight: 600;
    font-family: monospace !important;
  }

  pre {
    background: white;
    border: 1px solid #eaeaea;
    border-left: 5px solid #007af5;
    color: #495057;
    border-radius: 2px;
    page-break-inside: avoid;
    font-family: monospace !important;
    font-size: 12px;
    margin-top: 0px;
    line-height: 1.6;
    max-width: 100%;
    overflow: auto;
    padding: 1em 1.5em;
    display: inline-block;
    word-wrap: break-word;
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
