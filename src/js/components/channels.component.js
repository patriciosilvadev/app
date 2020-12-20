import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { connect } from 'react-redux'
import GraphqlService from '../services/graphql.service'
import MessagingService from '../services/messaging.service'
import '../helpers/extensions'
import styled from 'styled-components'
import { BrowserRouter as Router, Link } from 'react-router-dom'
import ChannelModal from '../modals/channel.modal'
import AccountModal from '../modals/account.modal'
import { Subject } from 'rxjs'
import { debounceTime } from 'rxjs/operators'
import { IconComponent } from './icon.component'
import QuickUserComponent from './quick-user.component'
import PropTypes from 'prop-types'
import EventService from '../services/event.service'
import { SortableContainer, SortableElement } from 'react-sortable-hoc'
import StorageService from '../services/storage.service'
import arrayMove from 'array-move'
import NotificationsComponent from '../components/notifications.component'
import {
  createChannel,
  hydrateChannels,
  hydrateTeam,
  updateUserDnd,
  updateChannelUserStatus,
  updateUserPresence,
  updateUserStatus,
  updateUserMuted,
  updateUserArchived,
  updateTeamMemberPosition,
  updateChannel,
  hydrateChannel,
  hydrateMessage,
  hydrateThreads,
  hydrateChannelUnreads,
  createChannelNotification,
  updateChannelNotification,
  deleteChannelNotification,
} from '../actions'
import TeamModal from '../modals/team.modal'
import {
  Toggle,
  Popup,
  Menu,
  Avatar,
  Tooltip,
  Input,
  Button,
  Select,
} from '@weekday/elements'
import QuickInputComponent from '../components/quick-input.component'
import AuthService from '../services/auth.service'
import { version } from '../../../package.json'
import {
  logger,
  shortenMarkdownText,
  isExtensionOpen,
  generateInitials,
  getUnreadCountForChannelId,
  doNotDisturbUser,
} from '../helpers/util'
import moment from 'moment'
import { browserHistory } from '../services/browser-history.service'
import * as chroma from 'chroma-js'
import { v4 as uuidv4 } from 'uuid'
import {
  IS_MOBILE,
  CHANNELS_ORDER,
  CHANNEL_ORDER_INDEX,
  TOGGLE_CHANNELS_DRAWER,
  NAVIGATE,
  TEXT_VERY_FADED_WHITE,
  TEXT_OFF_WHITE,
  BACKGROUND_FADED_BLACK,
  CHANNEL_NOTIFICATIONS,
} from '../constants'

const Channel = props => {
  const [over, setOver] = useState(false)
  const [menu, setMenu] = useState(false)
  const [notification, setNotification] = useState(false)
  const [showAllThreads, setShowAllThreads] = useState(false)
  const [collapsedThreads, setCollapsedThreads] = useState(false)
  const [avatarIconColor, setAvatarIconColor] = useState(null)
  const [avatarBackgroundColor, setAvatarBackgroundColor] = useState(null)
  const [channelNotificationEvery, setChannelNotificationEvery] = useState(null)
  const dispatch = useDispatch()
  const [iconCollapsable, setIconCollapsable] = useState(false)
  const threads = useSelector(state => state.threads)
  const channelNotifications = useSelector(state => state.channelNotifications)
  const channelUnreads = useSelector(state => state.channelUnreads)
  const user = useSelector(state => state.user)
  const common = useSelector(state => state.common)
  const maxThreads = 3
  const icons = [
    'bell',
    'pen',
    'star',
    'flag',
    'smile',
    'shield',
    'monitor',
    'smartphone',
    'hash',
    'compass',
    'package',
    'radio',
    'box',
    'lock',
    'attachment',
    'at',
    'check',
    null,
  ]
  const colors = [
    '#050f2c',
    '#003666',
    '#00aeff',
    '#3369e7',
    '#8e43e7',
    '#b84592',
    '#ff4f81',
    '#ff6c5f',
    '#ffc168',
    '#2dde98',
    '#1cc7d0',
    '#00a98f',
  ]
  const doNotDisturb = doNotDisturbUser(user)

  const fetchThreads = async () => {
    const {
      data: { threads },
    } = await GraphqlService.getInstance().threads(props.id)
    if (!threads) return

    // Convert all of the dates to unix timestamps
    // And then sort them by the timestamp
    // ANY other sorting will happen on the reducer
    dispatch(
      hydrateThreads(
        threads.map(thread => {
          return {
            ...thread,
            updatedAt: moment(thread.updatedAt)
              .toDate()
              .getTime(),
          }
        })
      )
    )
  }

  useEffect(() => {
    if (props.active) fetchThreads()
  }, [props.active])

  useEffect(() => {
    setAvatarBackgroundColor(
      props.private
        ? null
        : props.color
        ? chroma(props.color)
            .saturate(3)
            .alpha(0.95)
            .toString()
        : '#007af5'
    )
    // chroma(props.color).saturate(3).brighten(2).toString()
    // chroma(props.color).saturate(3).alpha(0.25).toString()
    setAvatarIconColor(
      props.private
        ? null
        : props.color
        ? chroma(props.color)
            .saturate(3)
            .brighten(2)
            .toString()
        : '#007af5'
    )
  }, [props.private, props.color])

  const handleUpdateIcon = async icon => {
    try {
      await GraphqlService.getInstance().updateChannel(props.id, { icon })

      dispatch(updateChannel(props.id, { icon }))
    } catch (e) {
      logger(e)
    }
  }

  const handleUpdateColor = async color => {
    try {
      await GraphqlService.getInstance().updateChannel(props.id, { color })

      dispatch(updateChannel(props.id, { color }))
    } catch (e) {
      logger(e)
    }
  }

  const handleMessageModalOpen = async messageId => {
    const {
      data: { message },
    } = await GraphqlService.getInstance().message(messageId)
    if (!message) return
    dispatch(hydrateMessage(message))
  }

  const handleMenuIconClick = e => {
    e.stopPropagation()

    const channelId = props.id
    const channelNotification = channelNotifications.filter(
      channelNotification => channelNotification.channelId == channelId
    )[0]
    const every = channelNotification ? channelNotification.every : null

    // This might be null - which is correct
    setChannelNotificationEvery(every)
    setMenu(true)
  }

  const handleUpdateUserArchived = async () => {
    try {
      const userId = user.id
      const channelId = props.id
      const archived = !props.archived

      await GraphqlService.getInstance().updateUserArchived(
        userId,
        channelId,
        archived
      )

      setMenu(false)
      dispatch(updateUserArchived(userId, channelId, archived))
    } catch (e) {
      logger(e)
    }
  }

  const handleUpdateUserMuted = async () => {
    try {
      const userId = user.id
      const channelId = props.id
      const muted = !props.muted

      await GraphqlService.getInstance().updateUserMuted(
        userId,
        channelId,
        muted
      )

      setMenu(false)
      dispatch(updateUserMuted(userId, channelId, muted))
    } catch (e) {
      logger(e)
    }
  }

  const handleChannelNotification = every => {
    const channelId = props.id
    const channelNotification = channelNotifications.filter(
      channelNotification => channelNotification.channelId == channelId
    )[0]

    // If it doesn't exist, then create it
    if (!channelNotification) {
      handleChannelNotificationAdd(every)
    } else {
      // It exists, but the EVERY part is different, then update it
      // ELSE - if it's the same, then we delete the notification
      if (channelNotification.every != every) {
        handleChannelNotificationUpdate(channelNotification.id, every)
      } else {
        handleChannelNotificationDelete(channelNotification.id)
      }
    }
  }

  const handleChannelNotificationAdd = async every => {
    try {
      const userId = user.id
      const channelId = props.id
      const channelNotification = await GraphqlService.getInstance().createChannelNotification(
        userId,
        channelId,
        every
      )

      setMenu(false)
      dispatch(createChannelNotification(channelNotification))
    } catch (e) {
      logger(e)
    }
  }

  const handleChannelNotificationUpdate = async (
    channelNotificationId,
    every
  ) => {
    try {
      await GraphqlService.getInstance().updateChannelNotification(
        channelNotificationId,
        every
      )

      setMenu(false)
      dispatch(updateChannelNotification(channelNotificationId, every))
    } catch (e) {
      logger(e)
    }
  }

  const handleChannelNotificationDelete = async channelNotificationId => {
    try {
      await GraphqlService.getInstance().deleteChannelNotification(
        channelNotificationId
      )

      setMenu(false)
      dispatch(deleteChannelNotification(channelNotificationId))
    } catch (e) {
      logger(e)
    }
  }

  const renderUnreadBadge = () => {
    if (!props.unread) return null
    if (props.unread == 0) return null
    if (props.muted) return null
    if (doNotDisturb) return null

    // Otherwise show this
    return <ChannelBadge color={props.color}>{props.unread}</ChannelBadge>
  }

  return (
    <div className="w-100">
      <ChannelContainer
        onClick={e => {
          e.preventDefault()

          if (!IS_MOBILE) props.onNavigate()
        }}
        onTouchEnd={e => {
          e.preventDefault()

          if (IS_MOBILE) props.onNavigate()
        }}
        onMouseEnter={() => setOver(true)}
        onMouseLeave={() => {
          setOver(false)
          setMenu(false)
        }}
        unread={props.unread}
        active={props.active}
      >
        <ChannelContainerPadding>
          <div style={{ top: 3, position: 'relative' }}>
            <Avatar
              dark
              muted={props.muted}
              color={props.color}
              userId={props.otherUserId}
              size={IS_MOBILE ? 'medium-small' : 'x-small'}
              image={props.private ? props.image : null}
              title={props.name}
            >
              <div></div>
              {/* {props.icon && (
                <ChannelIcon>
                  <IconComponent icon={props.icon} size={12} color={avatarIconColor} />
                </ChannelIcon>
              )}
              {(!props.icon && !props.private) && (
                <ChannelInitials color={avatarIconColor}>
                  {generateInitials(props.name)}
                </ChannelInitials>
              )} */}
            </Avatar>
          </div>

          <ChannelContents>
            <ChannelInnerContents>
              <ChannelTitleRow>
                <ChannelTitleRowIcon>
                  {!props.public && !props.private && (
                    <IconComponent
                      icon="lock"
                      color={props.active ? '#202933' : '#91A0B0'}
                      size={13}
                      className="mr-5"
                    />
                  )}
                  {props.readonly && (
                    <IconComponent
                      icon="radio"
                      color={props.active ? '#202933' : '#91A0B0'}
                      size={13}
                      className="mr-5"
                    />
                  )}
                </ChannelTitleRowIcon>

                <ChannelTitle active={props.active || props.unread != 0}>
                  {props.name}
                </ChannelTitle>
              </ChannelTitleRow>

              {props.excerpt && (
                <ChannelExcerpt>
                  &nbsp;
                  {props.excerpt && (
                    <ChannelExcerptTextContainer>
                      <ChannelExcerptText
                        active={props.active || props.unread != 0}
                      >
                        {shortenMarkdownText(props.excerpt)}
                      </ChannelExcerptText>
                    </ChannelExcerptTextContainer>
                  )}
                </ChannelExcerpt>
              )}
            </ChannelInnerContents>
          </ChannelContents>
        </ChannelContainerPadding>

        {/* Popup menu */}
        {over && props.onMutedClick && props.onArchivedClick && (
          <Popup
            handleDismiss={() => setMenu(false)}
            visible={menu}
            width={200}
            direction="right-bottom"
            content={
              <React.Fragment>
                <Menu
                  items={[
                    {
                      text:
                        'Mentions' +
                        (channelNotificationEvery ==
                        CHANNEL_NOTIFICATIONS.MENTIONS
                          ? ' (current)'
                          : ''),
                      label: 'Notify me of mentions only',
                      icon: (
                        <IconComponent icon="at" size={20} color="#aeb5bc" />
                      ),
                      onClick: e =>
                        handleChannelNotification(
                          CHANNEL_NOTIFICATIONS.MENTIONS
                        ),
                    },
                    {
                      text:
                        'Messages' +
                        (channelNotificationEvery ==
                        CHANNEL_NOTIFICATIONS.MESSAGES
                          ? ' (current)'
                          : ''),
                      label: 'Notify me of all messages',
                      icon: (
                        <IconComponent
                          icon="message-circle"
                          size={20}
                          color="#aeb5bc"
                        />
                      ),
                      onClick: e =>
                        handleChannelNotification(
                          CHANNEL_NOTIFICATIONS.MESSAGES
                        ),
                    },
                    {
                      text:
                        'None' +
                        (channelNotificationEvery == CHANNEL_NOTIFICATIONS.NONE
                          ? ' (current)'
                          : ''),
                      label: 'Do not notify me at all',
                      icon: (
                        <IconComponent
                          icon="message-minus"
                          size={20}
                          color="#aeb5bc"
                        />
                      ),
                      onClick: e =>
                        handleChannelNotification(CHANNEL_NOTIFICATIONS.NONE),
                    },
                  ]}
                />
                <div className="w-100 border-top">
                  <Menu
                    items={[
                      {
                        text: props.archived ? 'Unarchive' : 'Archive',
                        onClick: e => handleUpdateUserMuted(),
                      },
                      {
                        text: props.muted ? 'Unmute' : 'Mute',
                        onClick: e => handleUpdateUserArchived(),
                      },
                    ]}
                  />
                </div>

                {!props.private && (
                  <React.Fragment>
                    <div className="w-100 p-20 column align-items-start border-top">
                      <div className="row w-100">
                        <CollapseTitleText>Theme</CollapseTitleText>
                        <IconComponent
                          icon={iconCollapsable ? 'chevron-up' : 'chevron-down'}
                          size={16}
                          color="#acb5bd"
                          className="button"
                          onClick={e => {
                            e.preventDefault()
                            e.stopPropagation()
                            setIconCollapsable(!iconCollapsable)
                          }}
                        />
                      </div>
                      <Collapsable className={iconCollapsable ? 'open' : ''}>
                        <div className="row wrap pt-20">
                          {colors.map((color, index) => (
                            <ColorCircle
                              color={color}
                              current={color == props.color}
                              key={index}
                              onClick={e => {
                                e.stopPropagation()
                                setMenu(false)
                                handleUpdateColor(color)
                              }}
                            />
                          ))}
                        </div>
                        <div className="row wrap w-100 mt-10">
                          {icons.map((icon, index) => {
                            return (
                              <IconCircle
                                current={icon == props.icon}
                                key={index}
                              >
                                <IconComponent
                                  icon={icon}
                                  size={16}
                                  color="#ACB5BD"
                                  onClick={e => {
                                    e.stopPropagation()
                                    setMenu(false)
                                    handleUpdateIcon(icon)
                                  }}
                                />
                              </IconCircle>
                            )
                          })}
                        </div>
                      </Collapsable>
                    </div>
                  </React.Fragment>
                )}
              </React.Fragment>
            }
          >
            <ChannelMoreIcon onClick={handleMenuIconClick}>
              <IconComponent icon="more-h" color="#202933" size={15} />
            </ChannelMoreIcon>
          </Popup>
        )}

        {/* Unread count */}
        {renderUnreadBadge()}

        {/* Only if there are threads */}
        {threads.length != 0 && props.active && (
          <CollapseThreadsIcon
            onClick={() => setCollapsedThreads(!collapsedThreads)}
          >
            <IconComponent
              icon={collapsedThreads ? 'chevron-right' : 'chevron-down'}
              color="#91A0B0"
              size={14}
              className="button"
            />
          </CollapseThreadsIcon>
        )}
      </ChannelContainer>

      {/* Only if there are threads & panel is collapsed */}
      {!collapsedThreads && threads.length != 0 && props.active && (
        <Threads>
          {threads.map((thread, index) => {
            if (!showAllThreads && index >= maxThreads) return

            // If this channel has unread messages
            // See if any of those are related to this thread
            // thread = message || thread.id == parent.id
            // threaded is implicit (true) here if it matches
            const unread =
              props.unread && !doNotDisturb
                ? !!channelUnreads
                    .filter(
                      channelUnread =>
                        channelUnread.parentId == thread.id &&
                        channelUnread.threaded
                    )
                    .flatten()
                : false

            return (
              <Thread
                key={index}
                onClick={() => handleMessageModalOpen(thread.id)}
              >
                <ThreadLine color={props.color} />
                <ThreadText unread={unread}>{thread.body}</ThreadText>
              </Thread>
            )
          })}

          {threads.length > maxThreads && (
            <Thread onClick={() => setShowAllThreads(!showAllThreads)}>
              <ThreadLine color={props.color} />
              <ThreadText bold>
                {showAllThreads ? 'Show less' : 'Show more'}
              </ThreadText>
            </Thread>
          )}
        </Threads>
      )}
    </div>
  )
}

Channel.propTypes = {
  dark: PropTypes.bool,
  active: PropTypes.bool,
  muted: PropTypes.bool,
  archived: PropTypes.bool,
  unread: PropTypes.number,
  id: PropTypes.string,
  color: PropTypes.string,
  name: PropTypes.string,
  image: PropTypes.string,
  icon: PropTypes.string,
  label: PropTypes.string,
  excerpt: PropTypes.string,
  public: PropTypes.bool,
  private: PropTypes.bool,
  readonly: PropTypes.bool,
  otherUserId: PropTypes.string,
  onNavigate: PropTypes.any,
  onMutedClick: PropTypes.any,
  onArchivedClick: PropTypes.any,
}

const Threads = styled.div`
  position: relative;
`

const ThreadLine = styled.div`
  background: ${props => (props.color ? props.color : '#858E96')};
  width: 2px;
  height: 130%;
  position: absolute;
  left: 32px;
  bottom: 0px;
`

const CollapseTitleText = styled.div`
  font-size: 14px;
  flex: 1;
  color: #91a0b0;
  font-weight: 700;
`

const CollapseThreadsIcon = styled.div`
  position: absolute;
  top: 4px;
  left: 4px;
  width: 17px;
  height: 15px;
  display: flex;
  flex-direction: row;
  align-items: center;
  align-content: center;
  justify-content: center;
  z-index: 10;
  border-radius: 3px;

  :hover {
    background-color: #f0f3f5;
  }
`

const Thread = styled.div`
  padding-left: 52px;
  padding-right: 70px;
  padding-bottom: 5px;
  cursor: pointer;
  position: relative;

  :hover {
    opacity: 0.75;
  }
`

const ThreadText = styled.div`
  padding-bottom: 2px;
  padding-top: 2px;
  font-size: 11px;
  font-weight: 800;
  color: ${props => (props.unread ? '#202933' : '#91A0B0')};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding-left: 17px;
`

const IconCircle = styled.div`
  background: ${props => (props.selected ? '#F0F3F5' : 'white')};
  border-radius: 50%;
  width: 25px;
  height: 25px;
  display: flex;
  flex-direction: row;
  align-items: center;
  align-content: center;
  justify-content: center;

  &:hover {
    background: #f0f3f5;
  }
`

const ColorCircle = styled.div`
  background: ${props => props.color};
  width: 20px;
  height: 20px;
  border-radius: 50%;
  margin-right: 3px;
  margin-bottom: 3px;
  border: 1px solid ${props => (props.selected ? '#F0F3F5' : 'white')}
  transition: .2s border;

  &:hover {
    border: 3px solid #F0F3F5;
  }
`

const ChannelIcon = styled.div`
  position: relative;
  top: 0px;
`

const ChannelInitials = styled.div`
  font-weight: 600;
  font-size: 11px;
  color: ${props => props.color};
`

const UserName = styled.div`
  font-size: 18px;
  font-weight: 700;
  text-align: center;
  color: #202933;
  margin-top: 15px;
`

const UserRole = styled.div`
  font-size: 14px;
  text-align: center;
  color: #91a0b0;
  margin-top: 5px;
  font-weight: 500;
`

const ChannelContainer = styled.li`
  display: flex;
  flex-direction: row;
  background-color: ${props => (props.active ? '#F8F9FA' : 'transparent')};
  align-items: center;
  align-content: center;
  justify-content: center;
  position: relative;
  cursor: pointer;
  margin-bottom: 0px;
  padding-right: 20px;
  transition: 0.2s background-color;
  width: 100%;

  &:hover {
    /* NOTHING YET */
  }
`

const ChannelContainerPadding = styled.div`
  flex: 1;
  padding: 3px 0px 3px 25px;
  display: flex;
  flex-direction: row;
  align-items: stretch;
  align-content: center;
  justify-content: center;
  position: relative;

  @media only screen and (max-width: 768px) {
    padding: 5px 0px 5px 20px;
  }
`

const ChannelBadge = styled.div`
  padding: 3px 7px 3px 7px;
  border-radius: 10px;
  background-color: ${props => props.color || '#122640'};
  font-size: 11px;
  color: white;
  font-weight: 600;
  margin-left: 5px;
`

const ChannelTitle = styled.div`
  cursor: pointer;
  font-size: 15px;
  font-weight: ${props => (props.active ? '700' : '500')};
  color: ${props => (props.active ? '#202933' : '#91A0B0')};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 120px;
  /*letter-spacing: -0.5px;*/
  margin-right: 5px;
`

const ChannelTitleRow = styled.div`
  display: flex;
  flex-direction: row;
  align-items: stretch;
  align-content: center;
  justify-content: center;
`

const ChannelTitleRowIcon = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  align-content: center;
  justify-content: center;
  padding: 0px;
  margin: 0px;
`

const ChannelExcerpt = styled.div`
  flex: 1;
  overflow: hidden;
  position: relative;

  @media only screen and (max-width: 768px) {
    width: 100%;
  }
`

const ChannelExcerptTextContainer = styled.div`
  overflow: hidden;
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0px;
  left: 0px;
  display: flex;
  flex-direction: row;
  align-items: center;
  align-content: center;
  justify-content: flex-start;
`

const ChannelExcerptText = styled.span`
  font-size: 13px;
  color: #91a0b0;
  font-weight: 400;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  align: left;
  flex: 1;
  opacity: 0.75;
`

const ChannelContents = styled.div`
  display: flex;
  flex-direction: column;
  align-items: stretch;
  align-content: flex-start;
  justify-content: flex-start;
  position: relative;
  flex: 1;
  padding-left: 10px;
`

const ChannelInnerContents = styled.div`
  flex: 1;
  display: flex;
  flex-direction: row;
  align-items: center;
  align-content: center;
  justify-content: flex-start;
  position: relative;

  @media only screen and (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    justify-content: center;
  }
`

const ChannelMoreIcon = styled.span`
  cursor: pointer;
  opacity: 1;
  transition: opacity 0.5s;
  display: inline-block;
  z-index: 5;
  right: 0px;
  top: 0px;
  display: flex;
  margin-left: 5px;
  margin-right: 4px;
  flex-direction: row;
  align-items: center;
  align-content: center;
  justify-content: center;

  &:hover {
    opacity: 0.75;
  }
`

const SortableItem = SortableElement(
  ({
    pathname,
    channel,
    active,
    onNavigate,
    onArchivedClick,
    onMutedClick,
  }) => {
    const type = 'public'

    return (
      <Channel
        id={channel.id}
        color={channel.color}
        icon={channel.icon}
        active={active.channelId == channel.id && active.type == type}
        unread={channel.unread}
        name={channel.name}
        image={channel.image}
        excerpt={channel.excerpt}
        public={channel.public}
        private={channel.private}
        readonly={channel.readonly}
        muted={channel.muted}
        archived={channel.archived}
        onNavigate={() => onNavigate(channel.id)}
      />
    )
  }
)

const SortableList = SortableContainer(
  ({
    channels,
    active,
    pathname,
    onNavigate,
    onArchivedClick,
    onMutedClick,
  }) => {
    return (
      <Ul>
        {channels.map((channel, index) => {
          return (
            <SortableItem
              key={channel.id}
              active={active}
              index={index}
              channel={channel}
              pathname={pathname}
              onNavigate={onNavigate}
              onArchivedClick={onArchivedClick}
              onMutedClick={onMutedClick}
            />
          )
        })}
      </Ul>
    )
  }
)

const Ul = styled.ul`
  margin: 0px;
  padding: 0px;
  list-style-type: none;
`

class ChannelsComponent extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      filter: '',
      results: [],
      teamModal: false,
      teamModalStart: 0,
      channelPublicPopup: false,
      channelPrivatePopup: false,
      accountModal: false,
      accountMenu: false,
      archivedVisible: false,
      starred: [],
      muted: [],
      archived: [],
      public: [],
      private: [],
      loading: false,
      error: false,
      positionCollapsableOpen: false,
      positionCollapsableInput: '',
      statusCollapsableOpen: false,
      presenceCollapsableOpen: false,
      statusCollapsableInput: '',
      dndCollapsableOpen: false,
      dndIndex: 0,
      hideChannels: false,
      hash: null,
      active: { channelId: null, type: null },
    }

    this.createChannel = this.createChannel.bind(this)
    this.createPrivateChannel = this.createPrivateChannel.bind(this)
    this.createPublicChannel = this.createPublicChannel.bind(this)
    this.updateUserStatus = this.updateUserStatus.bind(this)
    this.updateUserPresence = this.updateUserPresence.bind(this)
    this.updateUserDnd = this.updateUserDnd.bind(this)
    this.getCurrentDndIndex = this.getCurrentDndIndex.bind(this)
    this.handleTeamMemberPositionChange = this.handleTeamMemberPositionChange.bind(
      this
    )

    this.renderAccountModal = this.renderAccountModal.bind(this)
    this.renderTeamModal = this.renderTeamModal.bind(this)
    this.renderHeader = this.renderHeader.bind(this)
    this.renderStarred = this.renderStarred.bind(this)
    this.renderPublic = this.renderPublic.bind(this)
    this.renderPrivate = this.renderPrivate.bind(this)
    this.renderArchived = this.renderArchived.bind(this)
    this.renderDnd = this.renderDnd.bind(this)
    this.navigate = this.navigate.bind(this)

    this.openAccountSettings = this.openAccountSettings.bind(this)
    this.openTeamSubscription = this.openTeamSubscription.bind(this)
    this.openTeamSettings = this.openTeamSettings.bind(this)
    this.openTeamDirectory = this.openTeamDirectory.bind(this)
    this.signout = this.signout.bind(this)
    this.openUserMenu = this.openUserMenu.bind(this)
    this.closeUserMenu = this.closeUserMenu.bind(this)

    this.dndOptions = [
      { option: 'Never', value: 0 },
      { option: '1 hour', value: 1 },
      { option: '8 hours', value: 8 },
      { option: '12 hours', value: 12 },
      { option: '24 hours', value: 24 },
    ]
  }

  navigate(channelId, type) {
    let suffix = ''

    // If it's a different channl clear this quick
    if (this.props.channel.id != channelId) this.props.hydrateThreads([])

    // Store this for reloads
    StorageService.setStorage(NAVIGATE, JSON.stringify({ channelId, type }))

    // Update our active state
    this.setState({ active: { channelId, type } })

    // If there is an extension open,
    // then add it when browsing
    // extensions always have the slug at the end
    if (isExtensionOpen()) {
      const urlParts = window.location.href.split('/')
      const extension = urlParts[urlParts.length - 1]

      suffix = `/${extension}`
    }

    // Consutrct the url we need to go to
    const to = `/app/team/${this.props.team.id}/channel/${channelId}${suffix}`

    // first close the drawer (mobile!!!)
    this.props.toggleDrawer()
    this.props.hydrateChannel({
      ...this.props.channel,
      messages:
        this.props.channel.id == channelId ? this.props.channel.messages : [],
    })

    // AND GO!
    this.props.history.push(to)
  }

  async handleTeamMemberPositionChange(position) {
    try {
      const teamId = this.props.team.id
      const userId = this.props.user.id

      await GraphqlService.getInstance().updateTeamMemberPosition(
        teamId,
        userId,
        position
      )

      this.props.updateTeamMemberPosition(position)
    } catch (e) {
      logger(e)
    }
  }

  getCurrentDndIndex() {
    return this.dndOptions.reduce((acc, dnd, index) => {
      return dnd.value == this.props.user.dnd ? acc + index : acc + 0
    }, 0)
  }

  async updateUserDnd(dnd) {
    try {
      const userId = this.props.user.id
      const teamId = this.props.team.id
      const dndUntil = moment()
        .add(dnd, 'hours')
        .toISOString()

      await GraphqlService.getInstance().updateUser(userId, { dnd, dndUntil })

      this.props.updateUserDnd(dnd, dndUntil)
    } catch (e) {
      logger(e)
    }
  }

  async updateUserPresence(presence) {
    this.setState({ presenceMenu: false })

    try {
      const userId = this.props.user.id
      await GraphqlService.getInstance().updateUser(userId, { presence })
      this.props.updateUserPresence(presence)
    } catch (e) {
      logger(e)
    }
  }

  async updateUserStatus(userId, teamId, status) {
    try {
      await GraphqlService.getInstance().updateUser(userId, { status })

      this.props.updateUserStatus(status)
      this.props.updateChannelUserStatus(userId, teamId, status)
    } catch (e) {
      logger(e)
    }
  }

  static getDerivedStateFromProps(props, state) {
    const unserializedOrder = StorageService.getStorage(CHANNELS_ORDER)
    let serializedOrder = unserializedOrder ? JSON.parse(unserializedOrder) : {}

    const starredChannels = props.channels
      .filter((channel, index) => props.user.starred.indexOf(channel.id) != -1)
      .filter(channel => {
        if (channel.otherUser.name) {
          return channel.otherUser.name
            .toLowerCase()
            .match(new RegExp(state.filter.toLowerCase() + '.*'))
        } else {
          return channel.name
            .toLowerCase()
            .match(new RegExp(state.filter.toLowerCase() + '.*'))
        }
      })
    const archivedChannels = props.channels
      .filter((channel, index) => props.user.archived.indexOf(channel.id) != -1)
      .filter(channel => {
        if (channel.otherUser.name) {
          return channel.otherUser.name
            .toLowerCase()
            .match(new RegExp(state.filter.toLowerCase() + '.*'))
        } else {
          return channel.name
            .toLowerCase()
            .match(new RegExp(state.filter.toLowerCase() + '.*'))
        }
      })

    const privateChannels = props.channels
      .filter(
        (channel, index) =>
          channel.private && props.user.archived.indexOf(channel.id) == -1
      )
      .filter(channel =>
        channel.otherUser.name
          .toLowerCase()
          .match(new RegExp(state.filter.toLowerCase() + '.*'))
      )

    const publicChannels = props.channels
      .filter(
        (channel, index) =>
          !channel.private && props.user.archived.indexOf(channel.id) == -1
      )
      .filter(channel =>
        channel.name
          .toLowerCase()
          .match(new RegExp(state.filter.toLowerCase() + '.*'))
      )
      .map((channel, index) => {
        let mutableChannel = channel
        const channelId = channel.id
        const channelOrder = serializedOrder[channelId]

        // If there is a channelOrder value, then assign the property CHANNEL_ORDER_INDEX to it
        // If there isn't one, then we set the index to the length of the  index
        // We save add the lenth so we don't interfere with current orderings (so it should be added to the bottom)
        mutableChannel[CHANNEL_ORDER_INDEX] =
          channelOrder != null && channelOrder != undefined
            ? channelOrder
            : props.channels.length + index

        // Return this (for sorting)
        return mutableChannel
      })
      .sort((a, b) => {
        return (
          parseFloat(a[CHANNEL_ORDER_INDEX]) -
          parseFloat(b[CHANNEL_ORDER_INDEX])
        )
      })

    return {
      starred: starredChannels,
      archived: archivedChannels,
      private: privateChannels,
      public: publicChannels,
    }
  }

  createPrivateChannel(user) {
    const name = null
    const description = null
    const image = null
    const teamId = this.props.team.id

    this.createChannel(name, description, image, teamId, user)
    this.setState({ filter: '', showFilter: false, results: [] })
  }

  createPublicChannel(name) {
    const description = null
    const image = null
    const teamId = this.props.team.id

    this.createChannel(name, description, image, teamId, null)
    this.setState({ filter: '', showFilter: false, results: [] })
  }

  async createChannel(name, description, image, teamId, otherUser) {
    try {
      // 1. Find channels where there are private
      // 2. Filter channels that have this private user as the otherUser (so it exists)
      const isPrivate = otherUser ? true : false
      const channel = isPrivate
        ? this.props.channels
            .filter(channel => channel.private)
            .filter(channel => channel.otherUser.id == otherUser.id)
            .flatten()
        : null

      // 3. If it's found - then go there first (don't create a new one)
      if (channel)
        return this.props.history.push(
          `/app/team/${teamId}/channel/${channel.id}`
        )

      // Otherwise create the new channel
      // 1) Create the channel object based on an open channel or private
      // 2) Seperate the members object for the API call
      const { user } = this.props
      const thisUser = { id: user.id, name: user.name, username: user.username }
      const { data } = await GraphqlService.getInstance().createChannel({
        thisUser,
        otherUser,
        channel: {
          name,
          description,
          image,
          team: teamId,
          user: user.id,
          messages: [],
          public: false,
          private: isPrivate,
        },
      })

      // Debug
      logger({ otherUser, thisUser })

      const channelData = data.createChannel
      const channelId = channelData.id
      const newChannel = await GraphqlService.getInstance().channel(channelId)

      // Update our redux store
      this.props.createChannel(newChannel.data.channel)

      // Join this channel ourselves
      MessagingService.getInstance().join(channelId)

      // Navigate there
      browserHistory.push(`/app/team/${teamId}/channel/${channelId}`)
    } catch (e) {
      logger(e)
    }
  }

  componentDidMount() {
    const { teamId } = this.props.match.params
    const userId = this.props.user.id

    // Fetch the team & channels
    this.fetchData(teamId, userId)

    // Toggle channels drawer (from Dock)
    EventService.getInstance().on(TOGGLE_CHANNELS_DRAWER, data => {
      this.setState({
        hideChannels: !this.state.hideChannels,
      })
    })
  }

  componentDidUpdate(prevProps) {
    const { teamId } = this.props.match.params
    const userId = this.props.user.id

    if (teamId != prevProps.match.params.teamId) this.fetchData(teamId, userId)
  }

  async fetchData(teamId, userId) {
    this.setState({ loading: true, error: null })

    try {
      // await GraphqlService.getInstance().channels(teamId, userId)
      // Not sure why I was using the above to seperate the calls
      const { data } = await GraphqlService.getInstance().channelUnreads(
        teamId,
        userId
      )
      const channelUnreads = data.channelUnreads
      const team = await GraphqlService.getInstance().teamChannelsComponent(
        teamId,
        userId
      )
      const channels = team.data.team.channels
      const channelIds = channels.map(channel => channel.id)

      // Kill the loading
      this.setState({ loading: false, error: null })

      // Join the channels
      MessagingService.getInstance().joins(channelIds)

      // Populate our stores
      this.props.hydrateTeam(team.data.team)
      this.props.hydrateChannels(channels)
      this.props.hydrateChannelUnreads(channelUnreads)

      // Cacheed nav info
      const navigation = StorageService.getStorage(NAVIGATE)

      // If thre is a reload - reidrect them
      if (navigation) {
        const { type, channelId } = JSON.parse(navigation)
        if (type && channelId) {
          this.navigate(channelId, type)
        }
      }
    } catch (e) {
      this.setState({ loading: false, error: e })
    }
  }

  // Child render functions that compose the
  // parts of the channels sidebar
  renderDnd() {
    const { dnd, dndUntil, timezone } = this.props.user
    const currentDate = moment()
    const dndUntilDate = moment(dndUntil).tz(timezone)
    const currentDateIsAfterDndDate = currentDate.isAfter(dndUntilDate)
    const dndIsSet = !!dnd

    return (
      <div className="w-100 p-20 column align-items-start border-bottom">
        <div className="row w-100">
          <CollapseTitleText>Do not disturb</CollapseTitleText>
          <Toggle
            on={dndIsSet && !currentDateIsAfterDndDate}
            onChange={() => {
              if (!dndIsSet || currentDateIsAfterDndDate) {
                this.updateUserDnd(1)
              } else {
                this.updateUserDnd(0)
              }
            }}
          />
        </div>
        <Collapsable
          className={dndIsSet && !currentDateIsAfterDndDate ? 'open' : ''}
        >
          <div className="column w-100 mt-10">
            <div className="small bold color-d2 flexer mb-10">
              Turn off notifications for:
            </div>
            <Select
              selected={this.getCurrentDndIndex()}
              options={this.dndOptions}
              onSelect={index =>
                this.updateUserDnd(this.dndOptions[index].value)
              }
            />
          </div>
        </Collapsable>
      </div>
    )
  }

  renderHeader() {
    const blankChannel = {
      ...this.props.channel,
      messages: [],
      id: null,
      color: null,
    }
    const location = window.location.href
    const locationParts = location.split('/')
    const tasksActive =
      locationParts[locationParts.length - 1] == 'tasks' &&
      !this.props.channel.id
    const calendarActive =
      locationParts[locationParts.length - 1] == 'calendar' &&
      !this.props.channel.id

    return (
      <HeaderContainer>
        <Header>
          <Avatar
            size="medium"
            presence={this.props.user.presence || 'online'}
            image={this.props.user.image}
            title={this.props.user.name}
            userId={this.props.user.id}
          />

          <div className="flexer" />

          <div
            className="mr-10"
            id="yack"
            data-inbox="weekday"
            style={{ width: 18, height: 18 }}
          >
            <IconComponent
              icon="channels-help"
              size={20}
              color="#91A0B0"
              className="button"
            />
          </div>

          <NotificationsComponent style={{ width: 18, height: 18 }}>
            <IconComponent
              icon="channels-notifications"
              size={20}
              color="#91A0B0"
              className="button"
            />
          </NotificationsComponent>

          <IconComponent
            icon="calendar-empty"
            size={20}
            color={calendarActive ? '#202933' : '#91A0B0'}
            className="button mr-10 ml-10"
            onClick={() => {
              this.props.hydrateChannel(blankChannel)
              this.props.history.push(
                `/app/team/${this.props.team.id}/calendar`
              )
            }}
          />

          <IconComponent
            icon="check-circle"
            size={20}
            color={tasksActive ? '#202933' : '#91A0B0'}
            className="button mr-10"
            onClick={() => {
              this.props.hydrateChannel(blankChannel)
              this.props.history.push(`/app/team/${this.props.team.id}/tasks`)
            }}
          />

          <Popup
            handleDismiss={this.closeUserMenu}
            visible={this.state.accountMenu}
            width={300}
            direction="left-bottom"
            content={
              <div className="w-100">
                <PopupHeader className="w-100 p-20 border-bottom column align-items-center">
                  <Avatar
                    size="x-large"
                    image={this.props.user.image}
                    presence={this.props.user.presence || 'online'}
                    title={this.props.user.name}
                  />
                  <UserName>{this.props.user.name}</UserName>
                  <UserRole>{this.props.team.position}</UserRole>
                </PopupHeader>

                <div className="w-100 p-20 column align-items-start border-bottom">
                  <div className="row w-100">
                    <CollapseTitleText>Presence</CollapseTitleText>
                    <IconComponent
                      icon={
                        this.state.presenceCollapsableOpen
                          ? 'chevron-up'
                          : 'chevron-down'
                      }
                      size={16}
                      color="#acb5bd"
                      className="button"
                      onClick={() => {
                        this.setState({
                          presenceCollapsableOpen: !this.state
                            .presenceCollapsableOpen,
                        })
                      }}
                    />
                  </div>
                  <Collapsable
                    className={this.state.presenceCollapsableOpen ? 'open' : ''}
                  >
                    <div className="row w-100 mt-10">
                      <Menu
                        items={[
                          {
                            icon: (
                              <span style={{ fontSize: 14, color: '#36C5AB' }}>
                                &#9679;
                              </span>
                            ),
                            text: 'Online (default)',
                            onClick: () => this.updateUserPresence(null),
                          },
                          {
                            icon: (
                              <span style={{ fontSize: 14, color: '#FD9A00' }}>
                                &#9679;
                              </span>
                            ),
                            text: 'Away',
                            onClick: () => this.updateUserPresence('away'),
                          },
                          {
                            icon: (
                              <span style={{ fontSize: 14, color: '#FC1449' }}>
                                &#9679;
                              </span>
                            ),
                            text: 'Busy',
                            onClick: () => this.updateUserPresence('busy'),
                          },
                          {
                            icon: (
                              <span style={{ fontSize: 14, color: '#EAEDEF' }}>
                                &#9679;
                              </span>
                            ),
                            text: 'Invisible',
                            onClick: () => this.updateUserPresence('invisible'),
                          },
                        ]}
                      />
                    </div>
                  </Collapsable>
                </div>

                <div className="w-100 p-20 column align-items-start border-bottom">
                  <div className="row w-100">
                    <CollapseTitleText>Status</CollapseTitleText>
                    <IconComponent
                      icon={
                        this.state.statusCollapsableOpen
                          ? 'chevron-up'
                          : 'chevron-down'
                      }
                      size={16}
                      color="#acb5bd"
                      className="button"
                      onClick={() => {
                        this.setState({
                          statusCollapsableOpen: !this.state
                            .statusCollapsableOpen,
                          statusCollapsableInput: this.props.user.status,
                        })
                      }}
                    />
                  </div>
                  <Collapsable
                    className={this.state.statusCollapsableOpen ? 'open' : ''}
                  >
                    <div className="row w-100 mt-10">
                      <Input
                        placeholder="Update your status"
                        value={this.state.statusCollapsableInput}
                        onChange={e =>
                          this.setState({
                            statusCollapsableInput: e.target.value,
                          })
                        }
                      />
                      <Button
                        size="small"
                        className="ml-10"
                        text="Ok"
                        theme="muted"
                        onClick={() => {
                          this.updateUserStatus(
                            this.props.user.id,
                            this.props.team.id,
                            this.state.statusCollapsableInput
                          )
                          this.setState({ statusCollapsableOpen: false })
                        }}
                      />
                    </div>
                  </Collapsable>
                </div>

                <div className="w-100 p-20 column align-items-start border-bottom">
                  <div className="row w-100">
                    <CollapseTitleText>Team role</CollapseTitleText>
                    <IconComponent
                      icon={
                        this.state.positionCollapsableOpen
                          ? 'chevron-up'
                          : 'chevron-down'
                      }
                      size={16}
                      color="#acb5bd"
                      className="button"
                      onClick={() => {
                        this.setState({
                          positionCollapsableOpen: !this.state
                            .positionCollapsableOpen,
                          positionCollapsableInput: this.props.team.position,
                        })
                      }}
                    />
                  </div>
                  <Collapsable
                    className={this.state.positionCollapsableOpen ? 'open' : ''}
                  >
                    <div className="row w-100 mt-10">
                      <Input
                        placeholder="Update your role"
                        value={this.state.positionCollapsableInput}
                        onChange={e =>
                          this.setState({
                            positionCollapsableInput: e.target.value,
                          })
                        }
                      />
                      <Button
                        size="small"
                        className="ml-10"
                        text="Ok"
                        theme="muted"
                        onClick={() => {
                          this.handleTeamMemberPositionChange(
                            this.state.positionCollapsableInput
                          )
                          this.setState({ positionCollapsableOpen: false })
                        }}
                      />
                    </div>
                  </Collapsable>
                </div>

                {this.renderDnd()}

                <Menu
                  items={[
                    {
                      icon: (
                        <IconComponent
                          icon="profile"
                          size={20}
                          color="#acb5bd"
                        />
                      ),
                      text: 'Account settings',
                      onClick: this.openAccountSettings,
                    },
                    {
                      icon: (
                        <IconComponent
                          icon="settings"
                          size={20}
                          color="#acb5bd"
                        />
                      ),
                      text: 'Team settings',
                      onClick: this.openTeamSettings,
                    },
                    {
                      icon: (
                        <IconComponent icon="users" size={20} color="#acb5bd" />
                      ),
                      text: 'Team directory',
                      onClick: this.openTeamDirectory,
                    },
                    {
                      hide: true,
                      icon: (
                        <IconComponent icon="flag" size={20} color="#acb5bd" />
                      ),
                      text: 'Team subscription',
                      onClick: this.openTeamSubscription,
                    },
                    {
                      icon: (
                        <IconComponent
                          icon="logout"
                          size={20}
                          color="#acb5bd"
                        />
                      ),
                      text: 'Signout',
                      onClick: this.signout,
                    },
                  ]}
                />

                <div className="small regular color-d0 p-20 border-top">
                  Build {version}
                </div>
              </div>
            }
          >
            <IconComponent
              icon="channels-settings"
              size={20}
              color="#91A0B0"
              className="button"
              onClick={this.openUserMenu}
            />
          </Popup>
        </Header>
      </HeaderContainer>
    )
  }

  renderStarred() {
    if (this.state.starred.length == 0) return null

    const { pathname } = this.props.history.location

    return (
      <React.Fragment>
        <HeadingRow>
          <Heading>Favourites</Heading>
        </HeadingRow>

        {this.state.starred.map((channel, index) => {
          const unreadCount = getUnreadCountForChannelId(
            this.props.channelUnreads,
            channel.id
          )
          const muted = this.props.user.muted.indexOf(channel.id) != -1
          const archived = this.props.user.archived.indexOf(channel.id) != -1
          const type = 'favourites'
          const active =
            this.state.active.channelId == channel.id &&
            this.state.active.type == type

          return (
            <Channel
              key={index}
              id={channel.id}
              color={channel.color}
              icon={channel.icon}
              active={active}
              unread={muted ? 0 : unreadCount}
              name={channel.private ? channel.otherUser.name : channel.name}
              image={channel.private ? channel.otherUser.image : channel.image}
              excerpt={
                channel.private ? channel.otherUser.excerpt : channel.excerpt
              }
              public={channel.public}
              private={channel.private}
              readonly={channel.readonly}
              muted={muted}
              archived={archived}
              onNavigate={() => this.navigate(channel.id, type)}
            />
          )
        })}
      </React.Fragment>
    )
  }

  renderPublic() {
    // Not this one - we want to always show this one
    // if (this.state.public.length == 0) return null
    const { pathname } = this.props.history.location
    const userId = this.props.user.id
    const teamId = this.props.team.id
    const unserializedOrder = StorageService.getStorage(CHANNELS_ORDER)
    let serializedOrder = unserializedOrder ? JSON.parse(unserializedOrder) : {}
    const type = 'public'
    const channels = this.state.public.map((channel, index) => {
      const unread = getUnreadCountForChannelId(
        this.props.channelUnreads,
        channel.id
      )
      const muted = this.props.user.muted.indexOf(channel.id) != -1
      const archived = this.props.user.archived.indexOf(channel.id) != -1

      return {
        ...channel,
        unread,
        muted,
        archived,
      }
    })

    return (
      <React.Fragment>
        <HeadingRow>
          <Heading>Channels</Heading>

          {this.props.team.role != 'GUEST' && (
            <QuickInputComponent
              visible={this.state.channelPublicPopup}
              width={200}
              direction="right-bottom"
              handleDismiss={() => this.setState({ channelPublicPopup: false })}
              handleAccept={name =>
                this.setState({ channelPublicPopup: false }, () =>
                  this.createPublicChannel(name)
                )
              }
              placeholder="New channel name"
            >
              <IconComponent
                icon="plus-circle"
                size={15}
                color="#91A0B0"
                className="button"
                onClick={() => this.setState({ channelPublicPopup: true })}
              />
            </QuickInputComponent>
          )}
        </HeadingRow>

        <SortableList
          helperClass="sortableHelper"
          pressDelay={200}
          pathname={pathname}
          active={this.state.active}
          channels={channels}
          onSortEnd={({ oldIndex, newIndex }) => {
            arrayMove(channels, oldIndex, newIndex).map((channel, index) => {
              serializedOrder[channel.id] = index
            })

            // Save our new order
            StorageService.setStorage(
              CHANNELS_ORDER,
              JSON.stringify(serializedOrder)
            )

            // Force update state
            this.setState({ hash: uuidv4() })
          }}
          onNavigate={channelId => this.navigate(channelId, type)}
        />

        {/*

        ⚠️ 
        --------------------------------------------------------------------------------------
        I'm keeping this here for reference in case something happens and we need to roll back
        --------------------------------------------------------------------------------------

        const { pathname } = this.props.history.location
        const userId = this.props.user.id
        const teamId = this.props.team.id

        {this.state.public.map((channel, index) => {
          const unread = this.props.common.unread.filter(row => channel.id == row.doc.channel).flatten()
          const unreadCount = unread ? unread.doc.count : 0
          const muted = this.props.user.muted.indexOf(channel.id) != -1
          const archived = this.props.user.archived.indexOf(channel.id) != -1

          return (
            <Channel
              key={index}
              id={channel.id}
              color={channel.color}
              icon={channel.icon}
              active={pathname.indexOf(channel.id) != -1}
              unread={muted ? 0 : unreadCount}
              name={channel.name}
              image={channel.image}
              excerpt={channel.excerpt}
              public={channel.public}
              private={channel.private}
              readonly={channel.readonly}
              muted={muted}
              archived={archived}
              onNavigate={() => this.navigate(channel.id)}
            />
          )
        })}

        */}
      </React.Fragment>
    )
  }

  renderPrivate() {
    const { pathname } = this.props.history.location

    return (
      <React.Fragment>
        <HeadingRow>
          <Heading>Private Conversations</Heading>

          <QuickUserComponent
            teamId={this.props.team.id}
            userId={this.props.user.id}
            visible={this.state.channelPrivatePopup}
            width={200}
            direction="right-bottom"
            handleDismiss={() => this.setState({ channelPrivatePopup: false })}
            handleAccept={({ user }) => {
              // Check to see if there are already people
              // Don't re-add people
              if (user.id == this.props.user.id) return

              // Otherwise all good - add them
              this.createPrivateChannel(user)
              this.setState({ channelPrivatePopup: false })
            }}
          >
            <IconComponent
              icon="plus-circle"
              size={15}
              color="#91A0B0"
              className="button"
              onClick={() => this.setState({ channelPrivatePopup: true })}
            />
          </QuickUserComponent>
        </HeadingRow>

        {this.state.private.map((channel, index) => {
          if (this.props.user.starred.indexOf(channel.id) != -1) return

          const unreadCount = getUnreadCountForChannelId(
            this.props.channelUnreads,
            channel.id
          )
          const muted = this.props.user.muted.indexOf(channel.id) != -1
          const archived = this.props.user.archived.indexOf(channel.id) != -1
          const otherUserId = channel.otherUser.id
          const type = 'private'
          const active =
            this.state.active.channelId == channel.id &&
            this.state.active.type == type

          return (
            <Channel
              key={index}
              id={channel.id}
              color={channel.color}
              icon={channel.icon}
              otherUserId={otherUserId}
              active={active}
              unread={muted ? 0 : unreadCount}
              name={channel.otherUser.name}
              image={channel.otherUser.image}
              excerpt={channel.otherUser.status}
              public={channel.public}
              private={channel.private}
              readonly={channel.readonly}
              muted={muted}
              archived={archived}
              onNavigate={() => this.navigate(channel.id, type)}
            />
          )
        })}
      </React.Fragment>
    )
  }

  renderArchived() {
    if (this.state.archived.length == 0) return null

    const { pathname } = this.props.history.location

    return (
      <React.Fragment>
        <HeadingRow>
          <Heading
            className="button"
            onClick={() =>
              this.setState({ archivedVisible: !this.state.archivedVisible })
            }
          >
            {this.state.archivedVisible ? 'Hide archived' : 'See archived'}
          </Heading>
        </HeadingRow>

        {this.state.archivedVisible && (
          <React.Fragment>
            {this.state.archived.map((channel, index) => {
              const unreadCount = getUnreadCountForChannelId(
                this.props.channelUnreads,
                channel.id
              )
              const to = `/app/team/${this.props.team.id}/channel/${channel.id}`
              const muted = this.props.user.muted.indexOf(channel.id) != -1
              const archived =
                this.props.user.archived.indexOf(channel.id) != -1
              const type = 'archived'
              const active =
                this.state.active.channelId == channel.id &&
                this.state.active.type == type

              return (
                <Channel
                  key={index}
                  id={channel.id}
                  color={channel.color}
                  icon={channel.icon}
                  active={active}
                  unread={muted ? 0 : unreadCount}
                  name={channel.private ? channel.otherUser.name : channel.name}
                  image={
                    channel.private ? channel.otherUser.image : channel.image
                  }
                  excerpt={
                    channel.private ? channel.otherUser.status : channel.excerpt
                  }
                  public={channel.public}
                  private={channel.private}
                  readonly={channel.readonly}
                  muted={muted}
                  archived={archived}
                  onNavigate={() => this.navigate(channel.id, type)}
                />
              )
            })}
          </React.Fragment>
        )}
      </React.Fragment>
    )
  }

  renderAccountModal() {
    if (!this.state.accountModal) return null

    return (
      <AccountModal
        id={this.props.user.id}
        onClose={() => this.setState({ accountModal: false })}
      />
    )
  }

  renderTeamModal() {
    if (!this.state.teamModal) return null

    return (
      <TeamModal
        id={this.props.team.id}
        start={this.state.teamModalStart}
        createPrivateChannel={this.createPrivateChannel}
        onClose={() => this.setState({ teamModal: false })}
      />
    )
  }

  // These unbounded functions
  // So we haven't bound these to THIS
  // Just is easier/quicker for now
  openAccountSettings() {
    this.setState({ accountMenu: false, accountModal: true })
  }

  openTeamSubscription() {
    this.setState({ accountMenu: false, teamModal: true, teamModalStart: 4 })
  }

  openTeamSettings() {
    this.setState({ accountMenu: false, teamModal: true, teamModalStart: 0 })
  }

  openTeamDirectory() {
    this.setState({ accountMenu: false, teamModal: true, teamModalStart: 1 })
  }

  signout() {
    this.setState({ accountMenu: false }, async () => {
      await AuthService.signout()
      await GraphqlService.signout()

      this.props.history.push('/auth')
    })
  }

  openUserMenu() {
    this.setState({ accountMenu: true })
  }

  closeUserMenu() {
    this.setState({ accountMenu: false })
  }

  render() {
    return (
      <Channels
        hideChannels={this.state.hideChannels}
        color={this.props.channel.color}
      >
        {this.renderAccountModal()}
        {this.renderTeamModal()}
        {this.renderHeader()}

        <ChannelsContainer>
          {this.renderStarred()}
          {this.renderPublic()}
          {this.renderPrivate()}
          {this.renderArchived()}
        </ChannelsContainer>
      </Channels>
    )
  }
}

ChannelsComponent.propTypes = {
  starred: PropTypes.bool,
  team: PropTypes.any,
  channel: PropTypes.any,
  channels: PropTypes.array,
  common: PropTypes.any,
  user: PropTypes.any,
  teams: PropTypes.array,
  createChannel: PropTypes.func,
  hydrateChannels: PropTypes.func,
  hydrateThreads: PropTypes.func,
  hydrateTeam: PropTypes.func,
  updateUserStatus: PropTypes.func,
  toggleDrawer: PropTypes.func,
  hydrateChannelUnreads: PropTypes.func,
}

const mapDispatchToProps = {
  updateTeamMemberPosition: position => updateTeamMemberPosition(position),
  updateUserDnd: dnd => updateUserDnd(dnd),
  updateUserStatus: status => updateUserStatus(status),
  updateUserPresence: presence => updateUserPresence(presence),
  updateChannelUserStatus: (userId, teamId, status) =>
    updateChannelUserStatus(userId, teamId, status),
  createChannel: channel => createChannel(channel),
  hydrateChannels: channels => hydrateChannels(channels),
  hydrateChannel: channel => hydrateChannel(channel),
  hydrateTeam: team => hydrateTeam(team),
  hydrateThreads: threads => hydrateThreads(threads),
  hydrateChannelUnreads: channelUnreads =>
    hydrateChannelUnreads(channelUnreads),
}

const mapStateToProps = state => {
  return {
    common: state.common,
    user: state.user,
    team: state.team,
    channels: state.channels,
    channel: state.channel,
    channelUnreads: state.channelUnreads,
    teams: state.teams,
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ChannelsComponent)

const Channels = styled.div`
  display: flex;
  flex-direction: column;
  align-content: center;
  align-items: center;
  width: 250px;
  height: 100%;
  position: relative;
  z-index: 6;
  background: #18181d;
  background: #f8f9fa;
  border-right: 1px solid #1f2d3d;
  border-right: 1px solid #eaedef;
  background: ${props => props.color};
  background: #0b1729;
  background: white;
  display: ${props => (props.hideChannels ? 'none' : 'flex')};

  @media only screen and (max-width: 768px) {
    width: 70vw;
  }
`

const ChannelsContainer = styled.div`
  flex: 1;
  overflow: scroll;
  width: 100%;
`

const HeaderContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-content: center;
  align-items: flex-start;
  width: 100%;
  padding: 0px;
  margin: 0px;
`

const Header = styled.div`
  background-color: transparent;
  width: 100%;
  padding 10px 25px 10px 25px;
  transition: background-color 0.5s;
  display: flex;
  flex-direction: row;
  align-content: stretch;
  align-items: center;
  justify-content: center;
  margin-top: 10px;

  @media only screen and (max-width: 768px) {
    padding 20px;
    margin: 0px;
  }
`

const PopupHeader = styled.div`
  @media only screen and (max-width: 768px) {
    display: none;
  }
`

const Heading = styled.div`
  padding: 10px 25px 10px 25px;
  font-size: 14px;
  font-weight: 700;
  color: #404c5a;
  /*letter-spacing: 1px;*/
  flex: 1;

  @media only screen and (max-width: 768px) {
    padding-left: 20px;
  }
`

const HeadingRow = styled.div`
  padding-right: 25px;
  display: flex;
  margin-top: 10px;
  flex-direction: row;
  align-content: center;
  align-items: center;
  justify-content: center;

  @media only screen and (max-width: 768px) {
    padding-right: 20px;
  }
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
