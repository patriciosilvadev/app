import React, { useState, useEffect, memo } from 'react'
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
import { createRoomMessageReaction, deleteRoomMessageReaction, deleteRoomMessage } from '../actions'
import { Attachment, Popup, Avatar } from '@weekday/elements'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { youtubeUrlParser, vimeoUrlParser, imageUrlParser } from '../helpers/util'

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
  font-size: 12px;
  font-weight: 600;
  color: #adb5bd;
  font-weight: regular;
`

const User = styled.div`
  color: #343A40;
  font-weight: 600;
  font-style: normal;
  font-size: 12px;
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
  font-weight: 400;
  font-size: 14px;
  font-style: normal;
  color: #151b26;
  display: inline-block;
`

const ParentName = styled.div`
  font-weight: 500;
  font-style: normal;
  font-size: 12px;
  color: #151b26;
  display: inline-block;
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
  font-weight: 500;
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

export default memo(props => {
  const [message, setMessage] = useState(false)
  const [preview, setPreview] = useState(null)
  const [over, setOver] = useState(false)
  const [confirmDeleteModal, setConfirmDeleteModal] = useState(false)
  const [emoticons, setEmoticons] = useState(false)
  const dispatch = useDispatch()
  const room = useSelector(state => state.room)
  const common = useSelector(state => state.common)
  const [youtubeVideos, setYoutubeVideos] = useState([])
  const [vimeoVideos, setVimeoVideos] = useState([])
  const [images, setImages] = useState([])

  const handleDeleteRoomMessage = () => {
    dispatch(deleteRoomMessage(props.message.id))
    setConfirmDeleteModal(false)
  }

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

  const highlightMessage = (message, query) => {
    var reg = new RegExp(query, 'gi')
    return message.replace(reg, str => { return `<strong>${str}<strong>` })
  }

  // prettier-ignore
  useEffect(() => {
    setImages(props.message.message.split(' ').filter(p => imageUrlParser(p)).map(p => imageUrlParser(p)))
    setYoutubeVideos(props.message.message.split(' ').filter(p => youtubeUrlParser(p)).map(p => youtubeUrlParser(p)))
    setVimeoVideos(props.message.message.split(' ').filter(p => vimeoUrlParser(p)).map(p => vimeoUrlParser(p)))

    // Here we start processing the markdown
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

    setMessage(partsOfTheMessageText.join(''))
  }, [props.highlight])

  // prettier-ignore
  return (
    <Message
      className="column"
      onMouseEnter={() => setOver(true)}
      onMouseLeave={() => setOver(false)}>
      {confirmDeleteModal &&
        <ConfirmModal
          onOkay={handleDeleteRoomMessage}
          onCancel={() => setConfirmDeleteModal(false)}
          text="Are you sure you want to delete this?"
          title="Are you sure?"
        />
      }

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
                  <Popup
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

                    <FontAwesomeIcon
                      icon={["fal", "smile"]}
                      color="#CFD4D9"
                      size="sm"
                      className="button mr-10"
                      onClick={() => setEmoticons(true)}
                    />
                  </Popup>

                  <FontAwesomeIcon
                    icon={["fal", "trash-alt"]}
                    color="#CFD4D9"
                    size="sm"
                    className="button mr-10"
                    onClick={() => setConfirmDeleteModal(true)}
                  />

                  <FontAwesomeIcon
                    icon={["fal", "pen"]}
                    color="#CFD4D9"
                    size="sm"
                    className="button mr-10"
                    onClick={props.setUpdateMessage}
                  />

                  <FontAwesomeIcon
                    icon={["fal", "reply"]}
                    color="#CFD4D9"
                    size="sm"
                    className="button mr-10"
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
                    <FontAwesomeIcon
                      icon={["fal", "times"]}
                      color="#8DA2A5"
                      size="2x"
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
