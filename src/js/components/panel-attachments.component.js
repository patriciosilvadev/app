import React, { useState, useEffect, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import styled from 'styled-components'
import moment from 'moment'
import ModalPortal from '../portals/modal.portal'
import PropTypes from 'prop-types'
import { Attachment, Popup, Button, Modal, Error, Spinner } from '@weekday/elements'
import { IconComponent } from './icon.component'
import PreviewComponent from './preview.component'
import { parseMessageMarkdown } from '../helpers/util'
import GraphqlService from '../services/graphql.service'
import { useParams, useHistory } from 'react-router-dom'

export default function PanelAttachmentsComponent(props) {
  const user = useSelector(state => state.user)
  const channel = useSelector(state => state.channel)
  const dispatch = useDispatch()
  const [loading, setLoading] = useState(null)
  const [error, setError] = useState(null)
  const [preview, setPreview] = useState(null)
  const [busy, setBusy] = useState(false)
  const [page, setPage] = useState(0)
  const [messages, setMessages] = useState([])
  const scrollRef = useRef(null)
  const { channelId, teamId } = useParams()
  const history = useHistory()

  const handleScrollEvent = e => {
    // If the user scvrolls up - then fetch more messages
    // 0 = the top of the container
    if (scrollRef.current.scrollTop == 0) this.fetchChannelAttachments()
  }

  const fetchChannelAttachments = async () => {
    // Don't refetch messages every time it's triggered
    // We need to wait if there's already a fetch in progress
    if (busy) return

    // Set it as busy to not allow more messages to be fetch
    setBusy(true)
    setLoading(true)

    try {
      const { data } = await GraphqlService.getInstance().channelAttachments(channelId, page)

      // Add the new messages to the channel
      setMessages([...messages, ...data.channelAttachments])

      // Increase the next page & open the scroll event for more messages fetches
      setPage(page + 1)
      setBusy(false)
      setLoading(false)
    } catch (e) {
      setError(e.message)
      setBusy(false)
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchChannelAttachments()
  }, [])

  return (
    <Container className="column">
      {preview && <PreviewComponent onClose={() => setPreview(null)} image={preview} />}

      <Header className="row">
        <HeaderTitle>Channel Files</HeaderTitle>
        <IconComponent icon="x" size={25} color="#040b1c" className="mr-5 button" onClick={() => history.push(`app/team/${teamId}/channel/${channelId}`)} />
      </Header>

      {error && <Error message={error} />}
      {loading && <Spinner />}

      <AttachmentsText>
        There {messages.length == 1 ? 'is' : 'are'} <strong>{messages.length}</strong> {messages.length == 1 ? 'message' : 'messages'} with attachments
      </AttachmentsText>

      {messages.map((message, index1) => {
        return (
          <React.Fragment key={index1}>
            <div className="row p-20 pb-0">
              <span className="color-d2 p regular">{message.user.name} -&nbsp;</span>
              <span className="color-d2 p bold">
                {moment(message.createdAt)
                  .tz(user.timezone)
                  .fromNow()}
              </span>
            </div>

            <Text dangerouslySetInnerHTML={{ __html: parseMessageMarkdown(message.message, null) }} />

            <Attachments ref={scrollRef} className="column">
              {message.attachments.map((attachment, index2) => {
                const isImage = attachment.mime.split('/')[0]

                return (
                  <Attachment
                    key={index2}
                    layout="panel"
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
          </React.Fragment>
        )
      })}
    </Container>
  )
}

PanelAttachmentsComponent.propTypes = {
  onClose: PropTypes.func,
  action: PropTypes.any,
}

const Text = styled.div`
  font-size: 14px;
  color: #acb5bd;
  font-weight: 400;
  line-height: 1.4;
  padding: 0px 20px 0px 20px;
  margin-top: 5px;
  margin-bottom: 5px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  width: 100%;

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

const Attachments = styled.div`
  padding: 20px;
  padding-top: 10px;
  padding-bottom: 0px;
  flex: 1;
  overflow: scroll;
  width: 100%;
`

const AttachmentsText = styled.div`
  font-size: 14px;
  font-weight: 400;
  color: #adb5bd;
  font-weight: regular;
  margin: 20px;
  margin-bottom: 0px;
`

const Container = styled.div`
  display: flex;
  width: 300px;
  height: 100%;
  border-left: 1px solid #f1f3f5;
`

const Header = styled.div`
  width: 100%;
  background: transparent;
  border-bottom: 1px solid #f1f3f5;
  background: white;
  padding 15px 25px 15px 25px;
  display: flex;
`

const HeaderTitle = styled.div`
  font-size: 20px;
  font-weight: 600;
  font-style: normal;
  color: #040b1c;
  transition: opacity 0.5s;
  display: inline-block;
  margin-bottom: 2px;
  width: max-content;
  flex: 1;
`
