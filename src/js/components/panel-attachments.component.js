import React, { useState, useEffect, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { connect } from 'react-redux'
import styled from 'styled-components'
import moment from 'moment'
import ModalPortal from '../portals/modal.portal'
import PropTypes from 'prop-types'
import { Attachment, Popup, Button, Modal, Error, Spinner } from '@tryyack/elements'
import { IconComponent } from './icon.component'
import PreviewComponent from './preview.component'
import { parseMessageMarkdown } from '../helpers/util'
import GraphqlService from '../services/graphql.service'
import { useParams, useHistory } from 'react-router-dom'
import PanelComponent from './panel.component'

class PanelAttachmentsComponent extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      loading: false,
      error: null,
      preview: null,
      busy: false,
      page: 0,
      messages: [],
    }

    this.scrollRef = React.createRef()

    this.fetchChannelAttachments = this.fetchChannelAttachments.bind(this)
    this.handleScrollEvent = this.handleScrollEvent.bind(this)
  }

  componentDidMount() {
    this.fetchChannelAttachments()

    this.scrollRef.addEventListener('scroll', this.handleScrollEvent)
  }

  componentWillUnmount() {
    this.scrollRef.removeEventListener('scroll', this.handleScrollEvent)
  }

  async handleScrollEvent(e) {
    // If the user scvrolls up - then fetch more messages
    // 0 = the top of the container
    if (this.scrollRef.scrollTop + this.scrollRef.clientHeight >= this.scrollRef.scrollHeight) this.fetchChannelAttachments()
  }

  async fetchChannelAttachments() {
    // Don't refetch messages every time it's triggered
    // We need to wait if there's already a fetch in progress
    if (this.state.busy) return

    // Set it as busy to not allow more messages to be fetch
    this.setState({
      busy: true,
      loading: true,
    })

    try {
      const nextPage = this.state.page + 1
      const teamId = this.props.team.id
      const channelId = this.props.channel.id
      const { data } = await GraphqlService.getInstance().channelAttachments(channelId, this.state.page)

      // Add the new messages to the channel
      // Increase the next page & open the scroll event for more messages fetches
      this.setState({
        messages: data.channelAttachments ? [...this.state.messages, ...data.channelAttachments] : [],
        page: nextPage,
        busy: false,
        loading: false,
      })
    } catch (e) {
      this.setState({
        error: e.message,
        busy: false,
        loading: false,
      })
    }
  }

  render() {
    return (
      <PanelComponent title="Channel Files" onClose={this.props.onClose}>
        {this.state.preview && <PreviewComponent onClose={() => this.setState({ preview: null })} image={this.state.preview} />}
        {this.state.error && <Error message={this.state.error} />}
        {this.state.loading && <Spinner />}

        <AttachmentsText>
          There {this.state.messages.length == 1 ? 'is' : 'are'} <strong>{this.state.messages.length}</strong> {this.state.messages.length == 1 ? 'message' : 'messages'} with attachments
        </AttachmentsText>

        <Attachments>
          <AttachmentsScrollContainer ref={ref => (this.scrollRef = ref)}>
            <div className="p-20">
              {this.state.messages.map((message, index1) => {
                return (
                  <React.Fragment key={index1}>
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
                          onPreviewClick={isImage ? () => this.setState({ preview: attachment.uri }) : null}
                        />
                      )
                    })}

                    <div className="row pt-0">
                      <span className="color-d2 p regular">{message.user.name} -&nbsp;</span>
                      <span className="color-d2 p bold">
                        {moment(message.createdAt)
                          .tz(this.props.user.timezone)
                          .fromNow()}
                      </span>
                    </div>

                    <Text dangerouslySetInnerHTML={{ __html: parseMessageMarkdown(message.message, null) }} />
                  </React.Fragment>
                )
              })}
            </div>
          </AttachmentsScrollContainer>
        </Attachments>
      </PanelComponent>
    )
  }
}

const mapDispatchToProps = {}

const mapStateToProps = state => {
  return {
    user: state.user,
    team: state.team,
    channel: state.channel,
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(PanelAttachmentsComponent)

PanelAttachmentsComponent.propTypes = {
  onClose: PropTypes.func,
  user: PropTypes.any,
  team: PropTypes.any,
  channel: PropTypes.any,
  channelId: PropTypes.string,
  teamId: PropTypes.string,
}

const Text = styled.div`
  font-size: 14px;
  color: #acb5bd;
  font-weight: 400;

  line-height: 1.2;
  padding: 0px 0px 20px 0px;
  margin-top: 5px;
  margin-bottom: 5px;
  display: -webkit-box;
  -webkit-line-clamp: 3;
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
  width: 100%;
  position: relative;
`

const AttachmentsText = styled.div`
  font-size: 14px;
  font-weight: 400;
  color: #adb5bd;
  font-weight: regular;
  margin: 20px;
  margin-bottom: 0px;
`

const AttachmentsScrollContainer = styled.div`
  position: absolute;
  left: 0px;
  top: 0px;
  width: 100%;
  height: 100%;
  overflow: scroll;
`
