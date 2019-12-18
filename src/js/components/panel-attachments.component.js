import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import styled from 'styled-components'
import ModalPortal from '../portals/modal.portal'
import PropTypes from 'prop-types'
import { Attachment, Popup, Button, Modal } from '@weekday/elements'
import { IconComponent } from './icon.component'
import PreviewComponent from './preview.component'

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

  async fetchChannelAttachments() {
    // Don't refetch messages every time it's triggered
    // We need to wait if there's already a fetch in progress
    if (busy) return

    // Set it as busy to not allow more messages to be fetch
    setBusy(true)
    setLoading(true)

    try {
      const { data } = await GraphqlService.getInstance().channelAttachments(channel.id, page)

      // Add the new messages to the channel
      setMessage([...messages, data.channelAttachments])

      // Increase the next page & open the scroll event for more messages fetches
      setPage(page + 1)
      setBusy(false)
      setLoading(false)
    } catch (e) {
      setError(e)
      setBusy(false)
      setLoading(false)
    }
  }

  useEffect((async () => {
    await fetchChannelAttachments()
  })(), [])

  // prettier-ignore
  return (
    <Container className="column">
      {preview &&
        <PreviewComponent
          onClose={() => setPreview(null)}
          image={preview}
        />
      }

      <Header className="row">
        <HeaderTitle>
          Channel Files
        </HeaderTitle>
        <IconComponent
          icon="x"
          size={25}
          color="#040b1c"
          className="mr-5 button"
          onClick={() => props.navigation.history.push('')}
        />
      </Header>

      {error && <Error message={error} />}
      {loading && <Spinner />}

      <AttachmentsText>
        There {messages.length == 1 ? "is" : "are"} <strong>{messages.length}</strong> {messages.length == 1 ? "message" : "messages"} with attachments
      </AttachmentsText>

      {messages.map((message, index1) => {
        return (
          <Attachments className="column" key={index1}>
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
        )
      })}

      <div className="p-20 pt-0 row justify-content-center w-100">
        <Button
          text="Load more"
          onClick={() => console.log('Load more')}
          size="small"
          theme="blue-border"
        />
      </div>
    </Container>
  )
}

PanelAttachmentsComponent.propTypes = {
  onClose: PropTypes.func,
  action: PropTypes.any,
}

const Attachments = styled.div`
  padding: 20px;
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
