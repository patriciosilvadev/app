import React, { memo } from 'react'
import moment from 'moment'
import { connect } from 'react-redux'
import UploadService from '../services/upload.service'
import '../helpers/extensions'
import styled from 'styled-components'
import PropTypes from 'prop-types'
import GraphqlService from '../services/graphql.service'
import EventService from '../services/event.service'
import { Button } from '@weekday/elements'
import ChannelModal from '../modals/channel.modal'
import ReactMarkdown from 'react-markdown'
import MessagingService from '../services/messaging.service'
import DatabaseService from '../services/database.service'
import ConfirmModal from '../modals/confirm.modal'
import { initialState as initialChannelState } from '../reducers/channel'
import {
  hydrateTask,
  hydrateMessage,
  openApp,
  closeAppPanel,
  updateLoading,
  updateError,
  deleteChannel,
  updateUserStarred,
  hydrateChannel,
  createChannelMember,
  updateChannel,
  hydrateChannelMessages,
  deleteChannelUnread,
} from '../actions'
import ComposeComponent from '../components/compose.component'
import {
  Popup,
  Menu,
  Avatar,
  Spinner,
  Notification,
  Toggle,
  Error,
} from '@weekday/elements'
import { Subject } from 'rxjs'
import { debounceTime } from 'rxjs/operators'
import MessagesComponent from './messages.component'
import MessageComponent from './message.component'
import { IconComponent } from './icon.component'
import Keg from '@joduplessis/keg'
import {
  sendFocusComposeInputEvent,
  copyToClipboard,
  decimalToMinutes,
  logger,
  sortMessagesByCreatedAt,
} from '../helpers/util'
import AttachmentsComponent from './attachments.component'
import MembersChannelComponent from './members-channel.component'
import { BASE_URL } from '../environment'
import * as chroma from 'chroma-js'
import { AvatarComponent } from '@weekday/elements/lib/avatar'
import MessageModal from '../modals/message.modal'

// We use this so it's not part of React component update cycle
// Otherwise it's just a shitshow of jittery goodess
let MANUAL_SCROLLING = false
let CLIENT_Y = 0

class ChannelComponent extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      manualScrolling: false,
      busy: false,
      page: 0,
      open: true,
      attachmentsPanel: false,
      membersPanel: false,
      channelModal: false,
      message: null,
      reply: false,
      update: false,
      starred: false,
      channelMenu: false,
      lastTypingTime: 0,
      typing: '',
      searchResults: null,
      loading: false,
      error: false,
      isDragging: false,
      hasAdminPermission: false,
      readonly: false,
      muted: false,
      archived: false,
      otherUserIsTeamMember: true,
    }

    this.scrollInterval = null

    this.shortcodeRef = React.createRef()
    this.messagesRef = React.createRef()
    this.scrollRef = React.createRef()
    this.scrollContainerRef = React.createRef()
    this.dropZone = React.createRef()
    this.dropMask = React.createRef()

    this.handleScrollEvent = this.handleScrollEvent.bind(this)
    this.handleWheelEvent = this.handleWheelEvent.bind(this)
    this.handleTouchMoveEvent = this.handleTouchMoveEvent.bind(this)
    this.handleTouchStartEvent = this.handleTouchStartEvent.bind(this)
    this.handleWheelOrDragEvent = this.handleWheelOrDragEvent.bind(this)
    this.updateChannelVisibility = this.updateChannelVisibility.bind(this)
    this.updateUserStarred = this.updateUserStarred.bind(this)
    this.scrollToBottom = this.scrollToBottom.bind(this)
    this.fetchResults = this.fetchResults.bind(this)
    this.setUpdateMessage = this.setUpdateMessage.bind(this)
    this.setReplyMessage = this.setReplyMessage.bind(this)
    this.handleActionClick = this.handleActionClick.bind(this)
    this.updateUserStarred = this.updateUserStarred.bind(this)
    this.updateChannelShortcode = this.updateChannelShortcode.bind(this)
    this.updateChannelReadonly = this.updateChannelReadonly.bind(this)
    this.getAppsForHeaderMenu = this.getAppsForHeaderMenu.bind(this)

    this.onDragOver = this.onDragOver.bind(this)
    this.onDragEnd = this.onDragEnd.bind(this)
    this.onDrop = this.onDrop.bind(this)

    this.onSearch$ = new Subject()
    this.subscription = null

    this.renderHeader = this.renderHeader.bind(this)
    this.renderMessages = this.renderMessages.bind(this)
    this.renderSearchResults = this.renderSearchResults.bind(this)
    this.renderNotification = this.renderNotification.bind(this)
    this.renderTypingNames = this.renderTypingNames.bind(this)
    this.renderDropzone = this.renderDropzone.bind(this)
    this.renderMembersChannel = this.renderMembersChannel.bind(this)
    this.renderAttachments = this.renderAttachments.bind(this)
    this.renderChannelModal = this.renderChannelModal.bind(this)
    this.renderOtherUserTimezone = this.renderOtherUserTimezone.bind(this)
    this.renderNonTeamMemberNotice = this.renderNonTeamMemberNotice.bind(this)
    this.renderCompose = this.renderCompose.bind(this)
    this.renderMessageModal = this.renderMessageModal.bind(this)
    this.deleteChannelUnread = this.deleteChannelUnread.bind(this)
  }

  async updateChannelShortcode(generateNewCode) {
    try {
      const channelId = this.props.channel.id
      const {
        data,
      } = await GraphqlService.getInstance().updateChannelShortcode(
        channelId,
        generateNewCode
      )
      const shortcode = data.updateChannelShortcode

      this.props.updateChannel(channelId, { shortcode })
    } catch (e) {}
  }

  handleActionClick(action) {
    this.props.openApp(action)
  }

  async fetchResults() {
    try {
      // 1 - searchQuery prop will be updated by app.page
      // 2 - it will be fed into this.onSearch$.next (RxJS)
      // 3 - this will call this function 1 second later to search for messages
      // 4 - if searchQuery is empty, then remove the results & display the message feed
      if (this.props.searchQuery == '')
        return this.setState({ searchResults: null })

      const query = this.props.searchQuery
      const channelId = this.props.channel.id
      const { data } = await GraphqlService.getInstance().searchMessages(
        channelId,
        query
      )
      const searchResults = data.searchMessages

      // Update our UI with our results
      this.setState({ searchResults: searchResults ? searchResults : [] })
    } catch (e) {
      // TO DISABLE!!!
      console.log(e)
      logger(e)
    }
  }

  scrollToBottom() {
    // If there is no scroll ref
    if (!this.scrollRef) return

    // Why do we do this?
    // Because the scroll DIV's height we want the same as the container it's in
    // Because the container it's in is a flex box
    // And we want to set this to fit nicely
    // Why not just make scrollRef a flex?
    // Because if you specify anything else other than a PX value
    // The scrollTop value starts becomnig a moving target
    // and the UI becomes jittery - FML
    this.scrollRef.style.height = this.scrollContainerRef.clientHeight + 'px'

    // If the user is scrolling
    if (MANUAL_SCROLLING) return

    // Keep it scroll down
    this.scrollRef.scrollTop = this.scrollRef.scrollHeight
  }

  handleWheelEvent(e) {
    const { deltaY } = e

    this.handleWheelOrDragEvent(deltaY)
  }

  handleTouchStartEvent(e) {
    CLIENT_Y = e.touches[0].clientY
  }

  handleTouchMoveEvent(e) {
    if (CLIENT_Y > e.changedTouches[0].clientY) {
      this.handleWheelOrDragEvent(0)
    } else {
      this.handleWheelOrDragEvent(-1)
    }
  }

  handleWheelOrDragEvent(deltaY) {
    // Scrolling up
    if (deltaY < 0) {
      MANUAL_SCROLLING = true
    } else {
      // Calculate the difference between the bottom & where the user is
      const { offsetHeight, scrollHeight, scrollTop } = this.scrollRef
      const offsetDifference = scrollHeight - scrollTop

      // If they are at the bottom: this.scrollRef.offsetHeight >= offsetHeight
      // Toggle whether the user is scrolling or not
      // If not, then we handle the scrolling
      if (offsetHeight >= offsetDifference) {
        MANUAL_SCROLLING = false
      }
    }
  }

  handleScrollEvent(e) {
    // If the user scvrolls up - then fetch more messages
    // 0 = the top of the container
    if (this.scrollRef.scrollTop == 0) this.fetchChannelMessages()
  }

  async fetchChannel(channelId) {
    // Reset messages first
    // this.props.hydrateChannel(initialChannelState)

    // Nope - auto sscroll first
    MANUAL_SCROLLING = false

    // Scroll down too
    this.scrollToBottom()

    try {
      // Set it as busy to not allow more messages to be fetch
      this.setState({
        busy: true,
        attachmentsPanel: false,
        membersPanel: false,
      })

      // If it's open
      this.props.closeAppPanel()

      const { data } = await GraphqlService.getInstance().channel(channelId)
      let otherUserIsTeamMember = true

      // We do a check call to see if the other user is paert of this team
      // Only do this if the channel is privates
      if (data.channel.private) {
        const userId = data.channel.otherUser.id
        const { teamId } = this.props.match.params
        const isTeamMember = await GraphqlService.getInstance().isTeamMember(
          teamId,
          userId
        )

        otherUserIsTeamMember = isTeamMember.data.isTeamMember
      }

      // Populate our channel - this will fetch page 0 of messages
      this.props.hydrateChannel({
        ...data.channel,
        messages: sortMessagesByCreatedAt(data.channel.messages),
      })

      // Clear all the markers for read/unread
      this.deleteChannelUnread()

      // Set manual scrolling to false & bump page
      this.setState(
        {
          page: this.state.page + 1,
          busy: false,
          manualScrolling: false,
          otherUserIsTeamMember,
        },
        () => this.scrollToBottom()
      )
    } catch (e) {
      logger(e)
    }
  }

  async deleteChannelUnread() {
    const channelId = this.props.channel.id
    const userId = this.props.user.id
    const parentId = null
    const threaded = false

    try {
      // parentId is null (so ignore this)
      // threaded is false
      await GraphqlService.getInstance().deleteChannelUnread(
        userId,
        channelId,
        parentId,
        threaded
      )

      // Add the new messages to the channel
      this.props.deleteChannelUnread(channelId, parentId, threaded)
    } catch (e) {
      console.log(e)
    }
  }

  async fetchChannelMessages() {
    // Don't refetch messages every time it's triggered
    // We need to wait if there's already a fetch in progress
    if (this.state.busy) return

    // Set it as busy to not allow more messages to be fetch
    this.setState({ busy: true })

    // Get new messages - start from page 1
    // populating the channel always fetches from page 0
    const channelId = this.props.channel.id
    const { page } = this.state

    try {
      const { data } = await GraphqlService.getInstance().channelMessages(
        channelId,
        page
      )

      // Add the new messages to the channel
      this.props.hydrateChannelMessages(
        channelId,
        sortMessagesByCreatedAt(data.channelMessages)
      )

      // Increase the next page & open the scroll event for more messages fetches
      this.setState({
        page: this.state.page + 1,
        busy: false,
      })
    } catch (e) {}
  }

  onDragOver(e) {
    e.stopPropagation()
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'

    this.setState({ isDragging: true })
  }

  onDragEnd(e) {
    e.stopPropagation()
    e.preventDefault()

    this.setState({ isDragging: false })
  }

  onDrop(e) {
    e.stopPropagation()
    e.preventDefault()

    this.setState({ isDragging: false })

    const files = e.dataTransfer.files || []

    if (files.length == 0) return

    for (let file of files) {
      Keg.keg('compose').refill('uploads', file)
    }
  }

  async componentDidMount() {
    if (this.state.open) this.fetchChannel(this.props.match.params.channelId)

    // Here we handle the delay for the yser typing in the search field
    this.subscription = this.onSearch$
      .pipe(debounceTime(1000))
      .subscribe(debounced => this.fetchResults())

    // Event listener for the scroll
    this.scrollRef.addEventListener('scroll', this.handleScrollEvent)
    this.scrollRef.addEventListener('wheel', this.handleWheelEvent)
    this.scrollRef.addEventListener('touchstart', this.handleTouchStartEvent)
    this.scrollRef.addEventListener('touchmove', this.handleTouchMoveEvent)

    // Drag event listeners
    this.dropZone.addEventListener('dragover', this.onDragOver)
    this.dropMask.addEventListener('dragleave', this.onDragEnd)
    this.dropMask.addEventListener('dragend', this.onDragEnd)
    this.dropMask.addEventListener('drop', this.onDrop)

    // Copy and paste
    document.addEventListener('paste', event => {
      const items = (event.clipboardData || event.originalEvent.clipboardData)
        .items

      for (var i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') === 0) {
          const file = items[i].getAsFile()

          if (file) Keg.keg('compose').refill('uploads', file)
        }
      }
    })

    // Keep it scrolled down
    this.scrollInterval = setInterval(() => this.scrollToBottom(), 100)
  }

  componentDidUpdate(prevProps) {
    // Scroll to the correct position after fetchChannelMessages
    // if (this.state.scrollHeight != this.scrollRef.scrollHeight) this.scrollRef.scrollTop = this.scrollRef.scrollHeight - this.state.scrollHeight
    // If the channel ID updates - then refetch all the data
    if (this.props.match.params.channelId != prevProps.match.params.channelId) {
      if (this.state.open) this.fetchChannel(this.props.match.params.channelId)
    }

    // Do the search if the field isn't null
    // and only if it's been updated
    if (this.props.searchQuery != prevProps.searchQuery) {
      this.onSearch$.next(this.props.searchQuery)
    }
  }

  componentWillUnmount() {
    this.scrollRef.removeEventListener('scroll', this.handleScrollEvent)
    this.dropZone.removeEventListener('dragover', this.onDragOver)
    this.dropMask.removeEventListener('dragleave', this.onDragEnd)
    this.dropMask.removeEventListener('dragend', this.onDragEnd)
    this.dropMask.removeEventListener('drop', this.onDrop)

    if (this.subscription) this.subscription.unsubscribe()

    clearInterval(this.scrollInterval)
  }

  async updateUserStarred(starred) {
    const userId = this.props.user.id
    const channelId = this.props.channel.id

    try {
      await GraphqlService.getInstance().updateUserStarred(
        userId,
        channelId,
        starred
      )

      this.props.updateUserStarred(channelId, starred)
    } catch (e) {}
  }

  async updateChannelReadonly(readonly) {
    const channelId = this.props.channel.id
    const teamId = this.props.team.id

    try {
      await GraphqlService.getInstance().updateChannel(channelId, { readonly })

      this.setState({ channelMenu: false })
      this.props.updateChannel(channelId, { readonly })
    } catch (e) {}
  }

  async updateChannelVisibility(updatedChannelVisibility) {
    const channelId = this.props.channel.id
    const teamId = this.props.team.id

    // These messages have to be sent to the team
    if (!updatedChannelVisibility.public)
      MessagingService.getInstance().leaveChannelIfNotMember(teamId, channelId)
    if (updatedChannelVisibility.public)
      MessagingService.getInstance().joinPublicChannel(teamId, channelId)

    try {
      await GraphqlService.getInstance().updateChannel(
        channelId,
        updatedChannelVisibility
      )

      this.setState({ channelMenu: false })
      this.props.updateChannel(channelId, updatedChannelVisibility)
    } catch (e) {}
  }

  setUpdateMessage(message) {
    this.setState({ message, update: true, reply: false })
    sendFocusComposeInputEvent()
  }

  setReplyMessage(message) {
    this.setState({ message, update: false, reply: true })
    sendFocusComposeInputEvent()
  }

  static getDerivedStateFromProps(props, state) {
    if (props.channel.id == undefined || props.channel.id == '') return null

    const isMember = props.channel.isMember
    const isPublic = props.channel.public
    const starred = props.user.starred.indexOf(props.channel.id) != -1
    const muted = props.user.muted.indexOf(props.channel.id) != -1
    const archived = props.user.archived.indexOf(props.channel.id) != -1
    const hasAdminPermission =
      props.team.role == 'ADMIN' || props.channel.user.id == props.user.id
    const channelIsPartOfThisTeam = props.team.id == props.channel.team.id
    const open = isMember || (isPublic && channelIsPartOfThisTeam)
    const readonly = props.channel.readonly
      ? props.channel.readonly && !hasAdminPermission
      : false

    return {
      open,
      starred,
      muted,
      archived,
      hasAdminPermission,
      readonly,
    }
  }

  // Render methods for ease of reading
  renderHeader() {
    if (!this.state.open) return null

    const channelColor = this.props.channel.color || '#112640'
    const muted = this.props.user.muted.indexOf(this.props.channel.id) != -1
    const avatarColor = channelColor
    const avatarImage = this.props.channel.private
      ? this.props.channel.otherUser.image
      : null
    const avatarUserId = this.props.channel.private
      ? this.props.channel.otherUser.id
      : null
    const avatarTitle = this.props.channel.private
      ? this.props.channel.otherUser.name
      : this.props.channel.name
    const avatarTextColor = this.props.channel.private
      ? null
      : this.props.channel.color
      ? chroma(this.props.channel.color)
          .saturate(2)
          .brighten(2)
          .toString()
      : '#007af5'

    return (
      <Header className="row">
        <div className="mr-10" style={{ width: 20 }}>
          <IconComponent
            icon={this.state.starred ? 'star-fill' : 'star'}
            size={20}
            color={this.state.starred ? '#edd264' : '#11161c'}
            onClick={() => this.updateUserStarred(!this.state.starred)}
            className="button"
          />
        </div>

        <Avatar
          muted={muted}
          color={avatarColor}
          image={avatarImage}
          title={avatarTitle}
          userId={avatarUserId}
          size="medium-large"
        >
          {this.props.channel.icon ? (
            <IconComponent
              icon={this.props.channel.icon}
              size={16}
              color={avatarTextColor}
            />
          ) : null}
        </Avatar>

        <div className="column ml-10">
          <div className="row">
            {this.props.channel.readonly && (
              <IconComponent
                icon="radio"
                size={15}
                color="#11161c"
                className="mr-5"
              />
            )}
            {!this.props.channel.public && !this.props.channel.private && (
              <IconComponent
                icon="lock"
                color="#11161c"
                size={15}
                className="mr-5"
              />
            )}
            {this.props.channel.private && (
              <HeaderTitle>{this.props.channel.otherUser.name}</HeaderTitle>
            )}
            {!this.props.channel.private && (
              <HeaderTitle>{this.props.channel.name}</HeaderTitle>
            )}
          </div>

          <HeaderDescription>
            <ReactMarkdown
              source={
                this.props.channel.private
                  ? this.props.channel.otherUser.status
                  : this.props.channel.description
              }
            />
          </HeaderDescription>

          {/* Member header subtitle */}
          <div className="row hide">
            <HeaderDescription>
              {this.props.channel.totalMembers.numberShorthand()}{' '}
              {this.props.channel.totalMembers == 1 ? 'member' : 'members'}
            </HeaderDescription>

            {!this.props.channel.private && this.state.hasAdminPermission && (
              <div
                className="ml-10 row button"
                onClick={() =>
                  this.setState({ channelModal: true, channelModalStart: 1 })
                }
              >
                <IconComponent
                  icon="plus"
                  size={15}
                  color="#007af5"
                  className="mr-5"
                />
                <HeaderLink>Add New</HeaderLink>
              </div>
            )}
          </div>
        </div>

        <div className="flexer"></div>

        <HeaderButton
          className="row"
          onClick={() => {
            this.setState({
              attachmentsPanel: true,
              membersPanel: false,
            })
          }}
        >
          <IconComponent icon="attachment" size={18} color="#aeb5bc" />
        </HeaderButton>

        <UserPreviews className="row" style={{ marginLeft: 20 }}>
          {this.props.channel.userPreviews.map((userPreview, index) => {
            return (
              <div key={index} style={{ marginLeft: -10 }}>
                <Avatar
                  image={userPreview.image}
                  title={userPreview.name}
                  style={{ border: '2px solid white' }}
                  size="medium"
                />
              </div>
            )
          })}

          <div
            style={{ marginLeft: -10 }}
            onClick={() =>
              this.setState({ membersPanel: true, attachmentsPanel: false })
            }
          >
            <AvatarComponent
              title={this.props.channel.totalMembers + ''}
              size="medium"
              style={{ border: '2px solid white' }}
            />
          </div>
        </UserPreviews>

        {!this.props.channel.private && (
          <React.Fragment>
            {/* Only display amount for locked channels */}
            {/* !this.props.channel.public && (
              <HeaderButton className="row" onClick={() => this.setState({ membersPanel: true, attachmentsPanel: false })}>
                <TotalMembers>{this.props.channel.totalMembers}</TotalMembers>
                <IconComponent icon="users" size={26} color="#aeb5bc" className="ml-5" />
              </HeaderButton>
            )} */}

            <Popup
              handleDismiss={() => this.setState({ channelMenu: false })}
              visible={this.state.channelMenu}
              width={275}
              direction="right-bottom"
              content={
                <React.Fragment>
                  <div className="w-100 p-20 column align-items-start">
                    <div className="row w-100">
                      <CollapseTitleText>Share with others</CollapseTitleText>
                      <Toggle
                        on={!!this.props.channel.shortcode}
                        onChange={() => {
                          if (!!this.props.channel.shortcode) {
                            this.updateChannelShortcode(false)
                          } else {
                            this.updateChannelShortcode(true)
                          }
                        }}
                      />
                    </div>
                    <Collapsable
                      className={!!this.props.channel.shortcode ? 'open' : ''}
                    >
                      <div className="column w-100 mt-10">
                        <ShortcodeInput
                          placeholder="Shortcode URL"
                          onChange={e => logger('Do nothing')}
                          value={`${BASE_URL}/c/${this.props.channel.shortcode}`}
                          ref={ref => (this.shortcodeRef = ref)}
                          className="p color-l0"
                          onFocus={event => {
                            const target = event.target
                            setTimeout(() => target.select(), 0)
                          }}
                        />
                        <Button
                          size="small"
                          text="Copy link"
                          className="mt-5"
                          onClick={() => {
                            this.shortcodeRef.focus()

                            copyToClipboard(
                              `${BASE_URL}/c/${this.props.channel.shortcode}`
                            )
                          }}
                        />
                      </div>
                    </Collapsable>
                  </div>

                  {this.state.hasAdminPermission && (
                    <div className="w-100 border-top">
                      <Menu
                        items={[
                          {
                            hide: this.props.channel.private,
                            icon: (
                              <IconComponent
                                icon="users"
                                size={20}
                                color="#aeb5bc"
                              />
                            ),
                            text: 'Members',
                            label: 'Manage channel members',
                            onClick: e =>
                              this.setState({
                                channelMenu: false,
                                membersPanel: true,
                                attachmentsPanel: false,
                              }),
                          },
                          {
                            hide: this.props.channel.private,
                            icon: (
                              <IconComponent
                                icon="radio"
                                size={20}
                                color="#aeb5bc"
                              />
                            ),
                            text: this.props.channel.readonly
                              ? 'Disable broadcast'
                              : 'Make broadcast',
                            label: 'Only you can post messages',
                            onClick: e =>
                              this.updateChannelReadonly(
                                !this.props.channel.readonly
                              ),
                          },
                          {
                            hide: this.props.channel.public,
                            icon: (
                              <IconComponent
                                icon="unlock"
                                size={20}
                                color="#aeb5bc"
                              />
                            ),
                            text: 'Make public',
                            label: 'Everyone in your team has access',
                            onClick: e =>
                              this.updateChannelVisibility({
                                private: false,
                                public: true,
                              }),
                          },
                          {
                            hide: !this.props.channel.public,
                            icon: (
                              <IconComponent
                                icon="lock"
                                size={20}
                                color="#aeb5bc"
                              />
                            ),
                            text: 'Make private',
                            label: 'Members of this channel only',
                            onClick: e =>
                              this.updateChannelVisibility({
                                private: false,
                                public: false,
                              }),
                          },
                          {
                            hide: this.props.channel.private,
                            icon: (
                              <IconComponent
                                icon="pen"
                                size={20}
                                color="#aeb5bc"
                              />
                            ),
                            text: 'Edit',
                            label: 'Update or remove this channel',
                            onClick: e =>
                              this.setState({
                                channelModal: true,
                                channelMenu: false,
                              }),
                          },
                          ...this.getAppsForHeaderMenu(),
                        ]}
                      />
                    </div>
                  )}
                </React.Fragment>
              }
            >
              <HeaderButton
                className="row"
                onClick={() => this.setState({ channelMenu: true })}
              >
                <IconComponent
                  icon="more-v"
                  size={18}
                  color="#aeb5bc"
                  className="button"
                />
              </HeaderButton>
            </Popup>
          </React.Fragment>
        )}
      </Header>
    )
  }

  getAppsForHeaderMenu() {
    const menuItems = []

    this.props.channel.apps
      .filter(app => app.active)
      .map((app, index) => {
        if (!app.active) return
        if (!app.app.shortcuts) return
        if (app.app.shortcuts.length == 0) return

        app.app.shortcuts.map((button, i) => {
          menuItems.push({
            hide: false,
            icon: <AppIconImage image={button.icon} />,
            text: button.text,
            label: button.action.name,
            onClick: e =>
              this.handleActionClick({
                ...button.action,
                token: app.token,
              }),
          })
        })
      })

    return menuItems
  }

  renderPinnedMessages() {
    if (!this.state.open || this.state.searchResults) return null
    if (this.props.channel.pinnedMessages.length == 0) return null

    const sortedPinnedMessages = this.props.channel.pinnedMessages
      ? this.props.channel.pinnedMessages.sort((left, right) => {
          return moment.utc(left.createdAt).diff(moment.utc(right.createdAt))
        })
      : []

    return (
      <PinnedMessages>
        {sortedPinnedMessages.map((pinnedMessage, index) => {
          if (!pinnedMessage) return null

          return (
            <MessageComponent
              key={index}
              message={pinnedMessage}
              pinned={true}
              append={null}
              highlight={null}
              setUpdateMessage={null}
              setReplyMessage={null}
            />
          )
        })}
      </PinnedMessages>
    )
  }

  renderMessages() {
    if (!this.state.open || this.state.searchResults) return null

    return (
      <React.Fragment>
        {this.props.channel.private && <PaddingToKeepMessagesDown />}

        {!this.props.channel.private && (
          <Welcome>
            <WelcomeUser className="row">
              <Avatar
                title={this.props.channel.user.name}
                image={this.props.channel.user.image}
                size="small"
                style={{ zIndex: 1 }}
              />

              <WelcomeUserName>
                Started by <strong>{this.props.channel.user.name}</strong> -{' '}
                {moment(this.props.channel.createdAt).fromNow()}
              </WelcomeUserName>
            </WelcomeUser>

            <WelcomeTitle>{this.props.channel.name}</WelcomeTitle>

            {this.props.channel.description && (
              <WelcomeDescription>
                <ReactMarkdown source={this.props.channel.description} />
              </WelcomeDescription>
            )}
          </Welcome>
        )}

        <MessagesInner ref={ref => (this.messagesRef = ref)}>
          <MessagesComponent
            messages={this.props.channel.messages}
            highlight={this.props.searchQuery}
            setUpdateMessage={this.setUpdateMessage}
            setReplyMessage={this.setReplyMessage}
          />
        </MessagesInner>
      </React.Fragment>
    )
  }

  renderSearchResults() {
    if (!this.state.open || !this.state.searchResults) return null

    return (
      <React.Fragment>
        <Welcome>
          <WelcomeDescription>
            <ReactMarkdown
              source={`Your search returned ${
                this.state.searchResults.length
              } ${
                this.state.searchResults.length == 1 ? 'message' : 'messages'
              }`}
            />
          </WelcomeDescription>
        </Welcome>

        <MessagesInner ref={ref => (this.messagesRef = ref)}>
          <MessagesComponent
            messages={this.state.searchResults}
            highlight={this.props.searchQuery}
            setUpdateMessage={this.setUpdateMessage}
            setReplyMessage={this.setReplyMessage}
          />
        </MessagesInner>
      </React.Fragment>
    )
  }

  renderNonTeamMemberNotice() {
    if (!this.state.otherUserIsTeamMember && this.props.channel.private)
      return (
        <Error message="This person is no longer part of your team, you cannot message them" />
      )

    return null
  }

  renderNotification() {
    if (!this.state.open)
      return <Error message="Sorry, you are not allowed to view this" />
    if (this.props.channel.public && !this.props.channel.public)
      return <Notification text="This team channel is public" />

    return null
  }

  renderTypingNames() {
    // Don't include ourselves
    const typingUsers = this.props.channel.typing.filter(
      typingUser => typingUser.userId != this.props.user.id
    )

    if (typingUsers.length == 0) {
      return null
    } else {
      return (
        <Typing>
          {typingUsers.map(typingUser => typingUser.userName).join(', ') +
            ' is typing'}
        </Typing>
      )
    }
  }

  renderDropzone() {
    // We want to keep this visible to the rednerer, because we want the REF
    return (
      <Dropzone
        active={this.state.isDragging}
        ref={ref => (this.dropMask = ref)}
      >
        <svg
          enableBackground="new 0 0 511.999 511.999"
          height={100}
          width={100}
          viewBox="0 0 511.999 511.999"
        >
          <g>
            <path
              d="m422.651 225.765v248.961c0 20.586-16.688 37.273-37.273 37.273h-306.206c-20.586 0-37.273-16.688-37.273-37.273v-390.003c0-20.591 16.692-37.273 37.273-37.273h165.159z"
              fill="#bed8fb"
            />
            <path
              d="m126.622 464.55c-20.586 0-37.273-16.688-37.273-37.273v-390.004c-.001-20.591 16.691-37.273 37.273-37.273h165.158c28.395 0 178.32 149.924 178.32 178.316v248.961c0 20.586-16.688 37.273-37.273 37.273z"
              fill="#ddeafb"
            />
            <path
              d="m470.1 178.319v15.767c0-33.195-26.918-60.113-60.113-60.113h-36.587c-20.581 0-37.273-16.692-37.273-37.273v-36.587c0-33.195-26.918-60.113-60.113-60.113h15.767c28.39 0 55.627 11.28 75.701 31.355l71.264 71.264c20.073 20.074 31.354 47.31 31.354 75.7z"
              fill="#bed8fb"
            />
            <g fill="#80b4fb">
              <path d="m242.615 284.564v108.975c0 4.701 3.811 8.512 8.512 8.512h57.194c4.701 0 8.512-3.811 8.512-8.512v-108.975h24.315c7.583 0 11.381-9.168 6.019-14.53l-54.331-54.331c-7.241-7.241-18.982-7.241-26.223 0l-54.331 54.331c-5.362 5.362-1.564 14.53 6.019 14.53z" />
              <path d="m213.396 185.797h132.656c9.161 0 16.587-7.426 16.587-16.587v-.456c0-9.161-7.426-16.587-16.587-16.587h-132.656c-9.161 0-16.587 7.426-16.587 16.587v.456c0 9.16 7.426 16.587 16.587 16.587z" />
            </g>
          </g>
        </svg>
        <div className="h2 color-d4 mt-30">Drop Files</div>
        <div className="h5 color-d1 mt-30">Drop your files here to upload</div>
      </Dropzone>
    )
  }

  renderMembersChannel() {
    if (!this.state.membersPanel) return null

    const { channelId, teamId } = this.props.match.params

    return (
      <MembersChannelComponent
        channelId={channelId}
        teamId={teamId}
        hasAdminPermission={this.state.hasAdminPermission}
        onMemberAdd={() => this.setState({ membersModal: true })}
        onClose={() => {
          this.setState({ membersPanel: false })
        }}
      />
    )
  }

  renderAttachments() {
    if (!this.state.attachmentsPanel) return null

    const { channelId, teamId } = this.props.match.params

    return (
      <AttachmentsComponent
        channelId={channelId}
        teamId={teamId}
        onClose={() => {
          this.setState({ attachmentsPanel: false })
        }}
      />
    )
  }

  renderChannelModal() {
    if (!this.state.channelModal) return

    const { teamId, channelId } = this.props.match.params

    return (
      <ChannelModal
        hasAdminPermission={this.state.hasAdminPermission}
        channelId={channelId}
        teamId={teamId}
        onClose={() => this.setState({ channelModal: false })}
      />
    )
  }

  renderOtherUserTimezone() {
    if (!this.props.channel.private) return null
    if (!this.props.channel.otherUser.timezone) return null

    let text
    const offsetMinutes =
      moment()
        .tz(this.props.channel.otherUser.timezone)
        .utcOffset() / 60

    if (offsetMinutes < 0)
      text = `This user's time is ${moment()
        .tz(this.props.channel.otherUser.timezone)
        .format('hh:mm A')} - ${
        this.props.channel.otherUser.timezone
      } (-${decimalToMinutes(offsetMinutes * -1)})`
    if (offsetMinutes >= 0)
      text = `This user's time is ${moment()
        .tz(this.props.channel.otherUser.timezone)
        .format('hh:mm A')} - ${
        this.props.channel.otherUser.timezone
      } (+${decimalToMinutes(offsetMinutes)})`

    return <Notification text={text} />
  }

  renderCompose() {
    if (!this.state.open) return null
    if (!this.state.otherUserIsTeamMember && this.props.channel.private)
      return null

    return (
      <ComposeComponent
        disabled={this.state.readonly}
        reply={this.state.reply}
        update={this.state.update}
        message={this.state.message}
        clearMessage={() => {
          this.setState({ message: null, update: false, reply: false })
          sendFocusComposeInputEvent()
        }}
      />
    )
  }

  renderMessageModal() {
    if (!this.props.message.id) return null

    return (
      <MessageModal
        messageId={this.props.message.id}
        onClose={() => this.props.hydrateMessage({ id: null, messages: [] })}
      />
    )
  }

  render() {
    const { teamId, channelId } = this.props.match.params

    return (
      <React.Fragment>
        {this.renderChannelModal()}
        {this.renderMessageModal()}

        <ChannelContainer hide={this.props.hide}>
          {this.renderHeader()}
          {this.renderNonTeamMemberNotice()}

          <ChannelBodyContainer>
            <ChannelBody ref={ref => (this.dropZone = ref)}>
              {this.renderDropzone()}

              <Pinned>
                {this.renderNotification()}
                {this.renderOtherUserTimezone()}
                {this.renderPinnedMessages()}
              </Pinned>

              <MessagesContainer ref={ref => (this.scrollContainerRef = ref)}>
                <MessagesContainerInner ref={ref => (this.scrollRef = ref)}>
                  {this.renderMessages()}
                  {this.renderSearchResults()}
                </MessagesContainerInner>
              </MessagesContainer>

              {this.renderTypingNames()}
              {this.renderCompose()}
            </ChannelBody>

            {this.renderMembersChannel()}
            {this.renderAttachments()}
          </ChannelBodyContainer>
        </ChannelContainer>
      </React.Fragment>
    )
  }
}

ChannelComponent.propTypes = {
  team: PropTypes.any,
  message: PropTypes.any,
  app: PropTypes.any,
  channel: PropTypes.any,
  user: PropTypes.any,
  hydrateChannel: PropTypes.func,
  hydrateChannelMessages: PropTypes.func,
  updateChannel: PropTypes.func,
  updateUserStarred: PropTypes.func,
  openApp: PropTypes.func,
  hydrateTask: PropTypes.func,
  hydrateMessage: PropTypes.func,
  closeAppPanel: PropTypes.func,
  hide: PropTypes.bool,
  deleteChannelUnread: PropTypes.func,
}

const mapDispatchToProps = {
  deleteChannelUnread: (channelId, parentId, threaded) =>
    deleteChannelUnread(channelId, parentId, threaded),
  hydrateChannel: channel => hydrateChannel(channel),
  hydrateTask: task => hydrateTask(task),
  hydrateMessage: message => hydrateMessage(message),
  hydrateChannelMessages: (channelId, messages) =>
    hydrateChannelMessages(channelId, messages),
  updateChannel: (channelId, updatedChannel) =>
    updateChannel(channelId, updatedChannel),
  updateUserStarred: (channelId, starred) =>
    updateUserStarred(channelId, starred),
  openApp: action => openApp(action),
  closeAppPanel: () => closeAppPanel(),
}

const mapStateToProps = state => {
  return {
    team: state.team,
    message: state.message,
    app: state.app,
    user: state.user,
    channel: state.channel,
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ChannelComponent)

const ChannelContainer = styled.div`
  height: 100%;
  flex: 1;
  z-index: 6;
  position: relative;
  overflow: hidden;
  flex-direction: column;
  display: ${props => (props.hide ? 'none' : 'flex')};
  align-items: stretch;
`

const ChannelBodyContainer = styled.div`
  flex: 1;
  width: 100%;
  overflow: hidden;
  position: relative;
  flex-direction: row;
  display: flex;
  align-items: stretch;
`

const ChannelBody = styled.div`
  flex: 1;
  position: relative;
  border-sizing: box-border;
  flex-direction: column;
  align-items: stretch;
  display: flex;
`

const MessagesContainer = styled.div`
  flex: 1;
  position: relative;
  width: 100%;
  height: 100%;
  border-bottom: 1px solid #eaedef;
`

const MessagesContainerInner = styled.div`
  position: absolute;
  overflow: scroll;
  width: 100%;
  height: 100%;
  top: 0px;
  left: 0px;
`

const MessagesInner = styled.div`
  width: 100%;
  padding: 25px;
  height: fit-content; /* Important for the height to be set here */
`

const ShortcodeInput = styled.textarea`
  width: 100%;
  word-wrap: break-word;
  border: none;
  resize: none;
`

const Header = styled.div`
  width: 100%;
  border-bottom: 1px solid #eaedef;
  position: relative;
  z-index: 5;
  padding 0px 25px 0px 25px;
  height: 75px;
  display: flex;
  /*box-shadow: 0px 0px 50px 10px rgba(0, 0, 0, 0.05);*/
`

const CollapseTitleText = styled.div`
  font-size: 14px;
  flex: 1;
  color: #91a0b0;
  font-weight: 700;
`

const HeaderButton = styled.div`
  border: 0px solid #eaedef;
  position: relative;
  z-index: 5;
  height: 35px;
  border-radius: 10px;
  margin-left: 5px;
  padding-left: 10px;
  padding-right: 10px;
  cursor: pointer;
  transition: background 0.25s;
  flex-direction: row;
  align-items: center;
  align-content: center;
  justify-content: center;
  display: flex;

  &:hover {
    background: #f8f9fa;
  }
`

const HeaderTitle = styled.div`
  font-size: 18px;
  font-weight: 400;
  font-style: normal;
  color: #11161c;
  transition: opacity 0.5s;
  display: inline-block;
  width: max-content;
`

const HeaderDescription = styled.div`
  font-size: 14px;
  font-weight: 500;
  font-style: normal;
  color: #aeb5bc;
  transition: opacity 0.5s;
  display: inline-block;
  margin-right: 0px;
  white-space: normal;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 15px;
  text-overflow: ellipsis;
  max-height: 30px;

  p {
    margin: 0px;
  }
`

const HeaderLink = styled.div`
  font-size: 11px;
  font-weight: 500;
  font-style: normal;
  color: #007af5;
  transition: opacity 0.5s;
  display: inline-block;
  margin-right: 0px;
`

const TotalMembers = styled.div`
  font-size: 13px;
  font-weight: 500;
  font-style: normal;
  color: #aeb5bc;
  transition: opacity 0.5s;
  display: inline-block;
`

const UserPreviews = styled.div`
  @media only screen and (max-width: 768px) {
    display: none;
  }
`

const HeaderSearchContainer = styled.div`
  border: 1px solid #eaedef;
  border: 4px solid #f1f3f5;
  border-radius: 10px;
  padding-left: 10px;
  height: 35px;
  padding-right: 10px;
  transition: width 0.5s;
  margin-right: 10px;
  box-shadow: 0px 0px 10px 1px rgba(0, 0, 0, 0.02);
  width: ${props => (props.focus ? '30%' : '25%')};
  box-shadow: ${props =>
    props.focus ? 'inset 0px 0px 0px 3px #cfd4da;' : 'none'};

  @media only screen and (max-width: 768px) {
    display: none;
  }
`

const HeaderSearchInputContainer = styled.div`
  flex: 1;
`

const HeaderSearchInput = styled.input`
  font-size: 14px;
  font-weight: 400;
  width: 100%;
  background: transparent;
  font-style: normal;
  color: #212123;
  border: none;
  outline: none;

  &::placeholder {
    color: #aeb5bc;
  }
`

const Typing = styled.div`
  font-weight: 400;
  font-size: 12px;
  color: #adb5bd;
  border-bottom: 1px solid #eaedef;
  padding: 10px 25px 10px 25px
  width: 100%;
`

const Pinned = styled.div`
  position: absolute;
  width: 100%;
  z-index: 4;
`

const PinnedMessages = styled.div`
  width: 100%;
  padding: 20px;
  border-bottom: 1px solid #f5f5ba;
  background: #f5f5e1;
  position: relative;
`

const Welcome = styled.div`
  padding: 25px;
  padding-bottom: 35px;
  margin-bottom: 10px;
  border-bottom: 1px solid #eaedef;
  padding-top: 1000px;
`

const WelcomeTitle = styled.div`
  font-weight: 300;
  font-size: 60px;
  color: #11161c;
  padding-bottom: 10px;
`

const WelcomeDescriptionUpdate = styled.div`
  font-weight: 400;
  font-size: 18px;
  color: #adb5bd;
  font-style: italic;
`

const WelcomeDescription = styled.div`
  font-weight: 400;
  font-size: 18px;
  color: #adb5bd;

  * {
    font-weight: 400;
    font-size: 18px;
    color: #adb5bd;
    padding: 0px;
    margin: 0px;
  }
`

const WelcomeUser = styled.div`
  margin-bottom: 10px;
`

const WelcomeUserName = styled.div`
  font-weight: 500;
  font-size: 12px;
  color: #adb5bd;
  padding-left: 10px;
`

const PaddingToKeepMessagesDown = styled.div`
  height: 1500px;
`

const AppIconImage = styled.div`
  width: 15px;
  height: 15px;
  overflow: hidden;
  background-size: contain;
  background-position: center center;
  background-color: transparent;
  background-repeat: no-repeat;
  background-image: url(${props => props.image});
`

const Dropzone = styled.div`
  background: rgba(255, 255, 255, 0.9);
  height: 100%;
  width: 100%;
  z-index: 10;
  position: absolute;
  top: 0px;
  left: 0px;
  display: ${props => (props.active ? 'flex' : 'none')};
  flex-direction: column;
  align-items: center;
  align-content: center;
  justify-content: center;
`

const Collapsable = styled.div`
  width: 100%;
  max-height: 0;
  transition: max-height 0.15s ease-out;
  overflow: hidden;

  &.open {
    max-height: 500px;
    overflow: visible;
    transition: max-height 0.25s ease-in;
  }
`
