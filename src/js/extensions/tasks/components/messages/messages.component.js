import React, { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { IconComponent } from '../../../../components/icon.component'
import { classNames, logger, getMentions } from '../../../../helpers/util'
import { Popup, Input, Textarea, Modal, Tabbed, Notification, Spinner, Error, User, Menu, Avatar, Button, Range } from '@weekday/elements'
import marked from 'marked'
import { TextareaComponent } from '../../../../components/textarea.component'
import { connect } from 'react-redux'
import PropTypes from 'prop-types'
import './messages.component.css'
import * as moment from 'moment'
import dayjs from 'dayjs'
import Keg from '@joduplessis/keg'
import UploadService from '../../../../services/upload.service'

class MessagesComponent extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      error: null,
      loading: false,
      notification: null,
      compose: '',
      files: [],
      manualScrolling: false,
    }

    this.scrollInterval = null

    this.fileRef = React.createRef()
    this.scrollRef = React.createRef()

    this.scrollToBottom = this.scrollToBottom.bind(this)
    this.handleScrollEvent = this.handleScrollEvent.bind(this)
    this.handleFileChange = this.handleFileChange.bind(this)
    this.handleKeyDownCompose = this.handleKeyDownCompose.bind(this)
    this.handleDeleteFile = this.handleDeleteFile.bind(this)
    this.setupFileQeueu = this.setupFileQeueu.bind(this)
  }

  scrollToBottom() {
    // If there is no scroll ref
    if (!this.scrollRef) return

    // If the user is scrolling
    if (this.state.manualScrolling) return

    // Move it right down
    this.scrollRef.scrollTop = this.scrollRef.scrollHeight
  }

  handleScrollEvent(e) {
    // If there is no scroll ref
    if (!this.scrollRef) return

    // If the user scvrolls up - then fetch more messages
    // 0 = the top of the container
    // if (this.messages.nativeElement.scrollTop == 0) this.fetchCourseMessages()

    // Calculate the difference between the bottom & where the user is
    const offsetHeight = this.scrollRef.scrollHeight - this.scrollRef.scrollTop

    // If they are at the bottom: this.scrollRef.offsetHeight >= offsetHeight
    // Toggle whether the user is scrolling or not
    // If not, then we handle the scrolling
    if (this.scrollRef.offsetHeight >= offsetHeight) {
      this.setState({ manualScrolling: false })
    } else {
      this.setState({ manualScrolling: true })
    }

    // If the user scvrolls up - then fetch more messages
    // 0 = the top of the container
    if (this.scrollRef.scrollTop == 0) this.props.andleFetchMoreMessages()
  }

  componentDidUpdate(prevProps) {
    this.scrollToBottom()
  }

  async handleFileChange(e) {
    const files = e.target.files || []

    if (files.length == 0) return

    for (let file of files) {
      Keg.keg('task').refill('files', file)
    }
  }

  handleKeyDownCompose(e) {
    // On enter
    if (e.keyCode == 13) {
      const { files, compose } = this.state
      e.preventDefault()
      this.props.handleCreateMessage(files, compose)
      this.setState({ compose: '', files: [] })
    }
  }

  async handleDeleteFile(url) {
    const files = this.state.files.filter(file => file.url != url)
    this.setState({ files })
  }

  async setupFileQeueu() {
    // Listen for file changes in attachments
    Keg.keg('task').tap(
      'files',
      (file, pour) => {
        this.setState({ error: null, loading: true })

        const { name, type, size } = file
        const secured = false

        UploadService.getUploadUrl(name, type, secured)
          .then(raw => raw.json())
          .then(res => {
            const { url } = res

            UploadService.uploadFile(url, file, type)
              .then(upload => {
                const mime = type
                const urlParts = upload.url.split('?')
                const rawUri = urlParts[0]
                let uriParts = rawUri.replace('https://', '').split('/')

                // Remove the first index value (AWS URL)
                uriParts.shift()

                // Combine the KEY for aws
                const uri = uriParts.join('/')

                // Get the signed URL for this key
                UploadService.getSignedGetUrl(uri)
                  .then(raw => raw.json())
                  .then(res1 => {
                    const file = { url: res1.url, filename: name }

                    // Update the files
                    this.setState({ files: [...this.state.files, file] })

                    // Go to the next
                    pour()
                  })
                  .catch(err => {
                    this.setState({ error: 'Error getting URL', loading: false })
                  })
              })
              .catch(err => {
                this.setState({ error: 'Error getting URL', loading: false })
              })
          })
          .catch(err => {
            this.setState({ error: 'Error getting URL', loading: false })
          })
      },
      () => {
        // This is the empty() callback
        // Stop loading when all is done
        this.setState({ loading: false })
      }
    )
  }

  componentWillUnmount() {
    clearInterval(this.scrollInterval)
  }

  componentDidMount() {
    this.setupFileQeueu()

    // Event listener for the scroll
    this.scrollRef.addEventListener('scroll', this.handleScrollEvent)

    // Just need to wait for the DOM to be there
    this.scrollInterval = setInterval(() => this.scrollToBottom(), 100)
  }

  render() {
    return (
      <div className="messages-container">
        {this.state.error && <Error message={this.state.error} onDismiss={() => this.setState({ error: null })} />}
        {this.state.loading && <Spinner />}
        {this.state.notification && <Notification text={this.state.notification} onDismiss={() => this.setState({ notification: null })} />}

        <div className="messages">
          <div className="scrolling">
            <div className="inner" ref={ref => (this.scrollRef = ref)}>
              <div style={{ height: '100%' }}></div>

              {this.props.messages.map((message, index) => {
                return <Message key={index} files={message.files} user={message.user} body={message.body} createdAt={message.createdAt} />
              })}
            </div>
          </div>
        </div>

        <input type="file" onChange={this.handleFileChange} ref={ref => (this.fileRef = ref)} style={{ display: 'none' }} />

        <div className="files">
          {this.state.files.map((file, index) => {
            return <File key={index} filename={file.filename} url={file.url} onDelete={url => this.handleDeleteFile(url)} />
          })}
        </div>

        <div className="compose">
          <TextareaComponent onKeyDown={this.handleKeyDownCompose} placeholder="Use *markdown* and press enter" value={this.state.compose} onChange={e => this.setState({ compose: e.target.value })} />
          <div className="button" onClick={() => this.fileRef.click()}>
            <IconComponent icon="attachment" color="#524150" size="18" thickness="1.5" />
          </div>
        </div>
      </div>
    )
  }
}

const Message = ({ user, body, files, createdAt }) => {
  const hasFiles = !!files ? files.length > 0 : false

  return (
    <div className="message">
      <Avatar size="small-medium" image={user.image} title={user.name} className="mb-5 mr-5" />
      <div className="column">
        <div className="row">
          <div className="user">{user.name}</div>
          <div className="date">{moment(createdAt).fromNow()}</div>
        </div>
        <div className="text" dangerouslySetInnerHTML={{ __html: marked(body) }}></div>
        {hasFiles && (
          <div className="message-files">
            <div className="files">
              {files.map((file, index) => {
                return <File borderless key={index} filename={file.filename} url={file.url} />
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const File = ({ filename, url, onDelete, borderless }) => {
  const [over, setOver] = useState(false)
  const classes = classNames({
    file: true,
    borderless: borderless,
  })

  return (
    <div onMouseEnter={() => setOver(true)} onMouseLeave={() => setOver(false)} className={classes}>
      <IconComponent icon="attachment" color="#adb5bd" size="12" thickness="2" />
      <a href={url} className="filename" target="_blank">
        {filename}
      </a>
      {over && !!onDelete && <IconComponent icon="x" color="#ec224b" size="12" thickness="3" className="button" onClick={() => onDelete(url)} />}
    </div>
  )
}

MessagesComponent.propTypes = {
  messages: PropTypes.array,
  handleCreateMessage: PropTypes.func,
  handleFetchMoreMessages: PropTypes.func,
}

const mapDispatchToProps = {}

const mapStateToProps = state => {
  return {}
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(MessagesComponent)
