import React from 'react'
import { connect } from 'react-redux'
import { Router, Route, Link, withRouter, Switch } from 'react-router-dom'
import { browserHistory } from '../services/browser-history.service'
import AuthService from '../services/auth.service'
import styled from 'styled-components'
import PropTypes from 'prop-types'
import {
  initialize,
  fetchUser,
  closeAppModal,
  closeAppPanel,
  hydrateTask,
} from '../actions'
import GraphqlService from '../services/graphql.service'
import * as PresenceService from '../services/presence.service'
import CookieService from '../services/storage.service'
import { Avatar, Loading, Error, Notification } from '@weekday/elements'
import ChannelsComponent from '../components/channels.component'
import ChannelComponent from '../components/channel.component'
import { IconComponent } from '../components/icon.component'
import AppComponent from '../components/app.component'
import AppModal from '../modals/app.modal'
import DockComponent from '../components/dock.component'
import ToolbarComponent from '../components/toolbar.component'
import {
  showLocalPushNotification,
  urlBase64ToUint8Array,
  logger,
  isExtensionOpen,
} from '../helpers/util'
import EventService from '../services/event.service'
import * as PnService from '../services/pn.service'
import * as chroma from 'chroma-js'
import TasksExtension from '../extensions/tasks/tasks.extension'
import MeetExtension from '../extensions/meet/meet.extension'
import CalendarExtension from '../extensions/calendar/calendar.extension'
import BoardsExtension from '../extensions/boards/boards.extension'
import {
  LAYOUTS,
  IS_CORDOVA,
  IS_MOBILE,
  DEVICE,
  TEXT_VERY_FADED_WHITE,
  TEXT_OFF_WHITE,
  BACKGROUND_FADED_BLACK,
} from '../constants'
import { API_HOST, PUBLIC_VAPID_KEY, PN, ONESIGNAL_KEY } from '../environment'
import { default as TaskModalComponent } from '../extensions/tasks/components/modal/modal.component'

import ToastComponent from '../components/toast.component'

class AppPage extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      teams: [],
      userId: null,
      pushNotificationsNotification: false,
      extensionLayout: LAYOUTS.SIDE,
      drawer: true,
      searchQuery: '',
    }

    this.onAppMessageReceived = this.onAppMessageReceived.bind(this)
    this.dismissPushNotifications = this.dismissPushNotifications.bind(this)
    this.handlePushNotificationsSetup = this.handlePushNotificationsSetup.bind(
      this
    )
    this.checkPushNotificationsAreEnabled = this.checkPushNotificationsAreEnabled.bind(
      this
    )
    this.renderBar = this.renderBar.bind(this)
    this.renderWelcome = this.renderWelcome.bind(this)
    this.renderDisabledUI = this.renderDisabledUI.bind(this)
    this.renderTaskModal = this.renderTaskModal.bind(this)
  }

  async componentDidUpdate(prevProps) {
    if (!this.props.user.id) return null
    if (!prevProps.user.id) return null

    const current = this.props.user.id
    const prev = prevProps.user.id

    if (!current || !prev) return
    if (current != prev) this.fetchData(current)
  }

  async componentDidMount() {
    try {
      const { token } = await AuthService.currentAuthenticatedUser()
      const { userId } = AuthService.parseJwt(token)

      this.setState({ userId })
      this.fetchData(userId)

      // This is sent from the app iframes in panels/modals
      window.addEventListener('message', this.onAppMessageReceived, false)
    } catch (e) {
      this.props.history.push('/auth')
    }
  }

  componentWillUnmount() {
    window.removeEventListener('message', this.onAppMessageReceived, false)
  }

  onAppMessageReceived(event) {
    if (!event.data) return
    if (!event.data.type) return
    if (!event.data.content) return

    // AUTO_ADJUST_MESSAGE_HEIGHT -> message.component
    // APP_PANEL -> common (action)
    // APP_MODAL -> common (action)
    EventService.getInstance().emit(event.data.type, event.data.content)
  }

  async fetchData(userId) {
    this.props.fetchUser(userId)
    this.props.initialize(userId)

    this.setupServiceWorker(userId)
    this.setupCordovaPushNotifications(userId)

    // Touch this users last seen date
    await PresenceService.updateUserPresence(userId)
  }

  async setupCordovaPushNotifications(userId) {
    // Only for Cordova devices
    if (IS_CORDOVA) {
      // When things are ready
      document.addEventListener(
        'deviceready',
        () => {
          window.plugins.OneSignal.setLogLevel({ logLevel: 6, visualLevel: 0 })

          var notificationOpenedCallback = function(jsonData) {
            console.log(
              'notificationOpenedCallback: ' + JSON.stringify(jsonData)
            )
          }
          // Set your iOS Settings
          var iosSettings = {}
          iosSettings['kOSSettingsKeyAutoPrompt'] = false
          iosSettings['kOSSettingsKeyInAppLaunchURL'] = false

          window.plugins.OneSignal.startInit(ONESIGNAL_KEY)
            .handleNotificationOpened(notificationOpenedCallback)
            .iOSSettings(iosSettings)
            .inFocusDisplaying(
              window.plugins.OneSignal.OSInFocusDisplayOption.Notification
            )
            .endInit()

          // The promptForPushNotificationsWithUserResponse function will show the iOS push notification prompt.
          // We recommend removing the following code and instead using an In-App Message to prompt for notification permission (See step 6)
          window.plugins.OneSignal.promptForPushNotificationsWithUserResponse(
            function(accepted) {
              console.log('User accepted notifications: ' + accepted)
            }
          )

          // Tag this user with his own id
          window.plugins.OneSignal.sendTags({ userId })
          window.plugins.OneSignal.getPermissionSubscriptionState(function(
            status
          ) {
            // Player ID = status.subscriptionStatus.userId
            // Push token = status.subscriptionStatus.pushToken
            // alert('Player ID: ' + status.subscriptionStatus.userId + '\npushToken = ' + status.subscriptionStatus.pushToken)
            // Update their mobile push
            PnService.subscribeUserMobile(status.subscriptionStatus.userId)
          })
        },
        false
      )
    }
  }

  async setupServiceWorker(userId) {
    if ('serviceWorker' in navigator) {
      try {
        const register = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        })
        let serviceWorker

        if (register.installing) {
          serviceWorker = register.installing
        } else if (register.waiting) {
          // Service worker goes into waiting
          // TODO: Maybe in future show button that sends message to sw
          serviceWorker = register.waiting

          // For now - force it
          serviceWorker.postMessage('SKIP_WAITING')
        } else if (register.active) {
          serviceWorker = register.active
        }

        if (serviceWorker) {
          if (serviceWorker.state == 'activated') {
            this.checkPushNotificationsAreEnabled()
          }
        }

        // Triggered by the skipWaiting()
        serviceWorker.addEventListener('statechange', async e => {
          try {
            if (e.target.state == 'activated') {
              this.checkPushNotificationsAreEnabled()
            }
          } catch (e) {
            logger(e)
          }
        })
      } catch (e) {
        logger(e)
      }
    } else {
      logger('Service workers are not supported in this browser')
    }
  }

  async checkPushNotificationsAreEnabled() {
    // For Safari on iOS (because they don't support PN)
    if (!navigator.permissions) return

    const { state } = await navigator.permissions.query({
      name: 'notifications',
    })
    const cookie = CookieService.getStorage('PN')

    if (state == 'granted') {
      CookieService.setStorage('PN', 'YES')
      this.setState({ pushNotificationsNotification: false })

      // Now get their device ID
      PnService.subscribeUser()
    } else if (state == 'denied') {
      CookieService.setStorage('PN', 'NO')
      this.setState({ pushNotificationsNotification: false })
    } else {
      CookieService.deleteStorage('PN')
      this.setState({ pushNotificationsNotification: true })
    }
  }

  async handlePushNotificationsSetup() {
    if ('PushManager' in window) {
      const permission = await PnService.askPushNotificationPermission()
      const cookie = CookieService.getStorage('PN')

      // If they have granted us permission
      if (permission == 'granted') {
        CookieService.setStorage('PN', 'YES')
        this.setState({ pushNotificationsNotification: false })

        // Now get their device ID
        PnService.subscribeUser()
      } else {
        CookieService.setStorage('PN', 'NO')
        this.setState({ pushNotificationsNotification: false })
      }
    }
  }

  async dismissPushNotifications() {
    CookieService.setStorage('PN', 'NO')
    this.setState({ pushNotificationsNotification: false })
  }

  renderBar() {
    if (!this.props.team) return null
    if (!this.props.team.name) return null
    if (!this.props.team.role) return null

    const { pathname } = this.props.history.location
    const urlParts = pathname.split('/')
    const lastUrlPart = urlParts[urlParts.length - 1].split('?')[0]
    const backgroundColor = this.props.channel
      ? this.props.channel.color
        ? this.props.channel.color
        : '#112640'
      : '#112640'

    return (
      <Bar backgroundColor={backgroundColor}>
        <BarInner>
          <BarPadding />
          <BarInfo>
            <DrawerIcon>
              <IconComponent
                icon="menu"
                size={20}
                color={TEXT_OFF_WHITE}
                onClick={() => this.setState({ drawer: !this.state.drawer })}
                className="mr-10 button"
              />
            </DrawerIcon>

            <Team>{this.props.team.name}</Team>
            <Role>{this.props.user.name}</Role>
            <Timezone>{this.props.team.position}</Timezone>
          </BarInfo>

          {this.props.channel.id && (
            <React.Fragment>
              <SearchBar>
                <IconComponent icon="search" size={15} color={'#45618c'} />
                <SearchBarInput>
                  <input
                    type="text"
                    placeholder="Search messages..."
                    value={this.state.searchQuery}
                    onChange={e =>
                      this.setState({ searchQuery: e.target.value })
                    }
                  />
                </SearchBarInput>
                {!!this.state.searchQuery && (
                  <IconComponent
                    icon="x"
                    size={15}
                    color={'#45618c'}
                    className="button"
                    onClick={() => this.setState({ searchQuery: '' })}
                  />
                )}
              </SearchBar>
              <BarExtensions>
                <LayoutIcons>
                  <LayoutIconButton>
                    <IconComponent
                      icon="square"
                      color={
                        this.state.extensionLayout == LAYOUTS.FULL
                          ? '#4084ed'
                          : '#45618c'
                      }
                      size={18}
                      onClick={() =>
                        this.setState({ extensionLayout: LAYOUTS.FULL })
                      }
                    />
                  </LayoutIconButton>
                  <LayoutIconButton>
                    <IconComponent
                      icon="sidebar-left"
                      color={
                        this.state.extensionLayout == LAYOUTS.MAIN
                          ? '#4084ed'
                          : '#45618c'
                      }
                      size={18}
                      onClick={() =>
                        this.setState({ extensionLayout: LAYOUTS.MAIN })
                      }
                    />
                  </LayoutIconButton>
                  <LayoutIconButton>
                    <IconComponent
                      icon="sidebar-right"
                      color={
                        this.state.extensionLayout == LAYOUTS.SIDE
                          ? '#4084ed'
                          : '#45618c'
                      }
                      size={18}
                      onClick={() =>
                        this.setState({ extensionLayout: LAYOUTS.SIDE })
                      }
                    />
                  </LayoutIconButton>
                </LayoutIcons>

                <ExtensionLinks>
                  {!IS_CORDOVA && (
                    <Link
                      to={
                        lastUrlPart == 'meet'
                          ? `/app/team/${this.props.team.id}/channel/${this.props.channel.id}`
                          : `/app/team/${this.props.team.id}/channel/${this.props.channel.id}/meet`
                      }
                    >
                      <Pill active={lastUrlPart == 'meet'}>
                        <IconComponent
                          icon="video"
                          color={lastUrlPart == 'meet' ? '#0b1729' : '#45618c'}
                          size={14}
                          className="mr-5"
                        />
                        <PillText>Meet</PillText>
                      </Pill>
                    </Link>
                  )}

                  {!IS_CORDOVA && (
                    <Link
                      to={
                        lastUrlPart == 'calendar'
                          ? `/app/team/${this.props.team.id}/channel/${this.props.channel.id}`
                          : `/app/team/${this.props.team.id}/channel/${this.props.channel.id}/calendar`
                      }
                    >
                      <Pill active={lastUrlPart == 'calendar'}>
                        <IconComponent
                          icon="calendar"
                          color={
                            lastUrlPart == 'calendar' ? '#0b1729' : '#45618c'
                          }
                          size={14}
                          className="mr-5"
                        />
                        <PillText>Calendar</PillText>
                      </Pill>
                    </Link>
                  )}

                  {!IS_CORDOVA && (
                    <Link
                      to={
                        lastUrlPart == 'boards'
                          ? `/app/team/${this.props.team.id}/channel/${this.props.channel.id}`
                          : `/app/team/${this.props.team.id}/channel/${this.props.channel.id}/boards`
                      }
                    >
                      <Pill active={lastUrlPart == 'boards'}>
                        <IconComponent
                          icon="boards"
                          color={
                            lastUrlPart == 'boards' ? '#0b1729' : '#45618c'
                          }
                          size={14}
                          className="mr-5"
                        />
                        <PillText>Boards</PillText>
                      </Pill>
                    </Link>
                  )}

                  <Link
                    to={
                      lastUrlPart == 'tasks'
                        ? `/app/team/${this.props.team.id}/channel/${this.props.channel.id}`
                        : `/app/team/${this.props.team.id}/channel/${this.props.channel.id}/tasks`
                    }
                  >
                    <Pill active={lastUrlPart == 'tasks'}>
                      <IconComponent
                        icon="double-check"
                        color={lastUrlPart == 'tasks' ? '#0b1729' : '#45618c'}
                        size={14}
                        className="mr-5"
                      />
                      <PillText>Tasks</PillText>
                    </Pill>
                  </Link>
                </ExtensionLinks>
              </BarExtensions>
            </React.Fragment>
          )}
        </BarInner>
      </Bar>
    )
  }

  renderWelcome() {
    return (
      <div
        onClick={() => this.setState({ drawer: !this.state.drawer })}
        className="flexer column justify-content-center align-content-center align-items-center"
      >
        <img src="icon-muted.svg" width="100" />
      </div>
    )
  }

  renderDisabledUI(props) {
    if (!this.props.user.id) return null
    if (!this.props.team.id) return null
    if (this.props.team.role) return null

    return (
      <DisabledUI>
        <DisabledUIText>You don't have access to this team.</DisabledUIText>
        <div className="row">
          {this.props.teams.map((t, index) => {
            return (
              <Link className="m-10" key={index} to={`/app/team/${t.id}`}>
                <Avatar
                  size="x-large"
                  image={t.image}
                  title={t.name}
                  className="button"
                />
              </Link>
            )
          })}
        </div>
      </DisabledUI>
    )
  }

  renderTaskModal() {
    if (!this.props.task.id) return null

    return (
      <TaskModalComponent
        taskId={this.props.task.id}
        onClose={() => this.props.hydrateTask({ id: null })}
      />
    )
  }

  render() {
    if (!this.props.user) return <Loading show={true} />
    if (!this.props.user.id) return <Loading show={true} />

    // See if we need to hide the channel components
    // - channel
    // - toolbar
    // - app
    const hideChannel =
      (this.state.extensionLayout == LAYOUTS.MAIN ||
        this.state.extensionLayout == LAYOUTS.FULL) &&
      isExtensionOpen()
    const hideDrawer =
      this.state.extensionLayout == LAYOUTS.FULL && isExtensionOpen()

    return (
      <AppContainer className="column">
        <Loading show={this.props.common.loading} />
        <Error message={this.props.common.error} theme="solid" />

        {!!this.props.common.toast && (
          <ToastComponent message={this.props.common.toast} />
        )}

        {!this.props.common.connected && (
          <Notification theme="solid" text="Connecting..." />
        )}

        {/* When apps open a modal */}
        {this.props.app.modal && (
          <AppModal
            action={this.props.app.modal}
            onClose={this.props.closeAppModal}
          />
        )}

        {/* Blue PN bar to ask the user for permission */}
        {this.state.pushNotificationsNotification && (
          <Notification
            text="Push notifications are disabled"
            actionText="Enable"
            onActionClick={this.handlePushNotificationsSetup}
            onDismissIconClick={this.dismissPushNotifications}
            theme="solid"
          />
        )}

        {/* Color channel bar at the top */}
        {this.renderBar()}

        {/* Task modal */}
        {this.renderTaskModal()}

        <App className="row">
          <Router history={browserHistory}>
            {this.state.drawer && (
              <DrawerOverlay onClick={() => this.setState({ drawer: false })} />
            )}

            <Drawer open={this.state.drawer} hide={hideDrawer}>
              <Route path="/app" component={DockComponent} />
              <Route
                path="/app/team/:teamId"
                render={props => {
                  return (
                    <ChannelsComponent
                      {...props}
                      toggleDrawer={() =>
                        this.setState({ drawer: !this.state.drawer })
                      }
                    />
                  )
                }}
              />
            </Drawer>

            {/* Specifically for people getting deleted from a team */}
            {/* This disables everything */}
            <Route path="/app/team/:teamId" render={this.renderDisabledUI} />

            {/* If there is nothing selected - welcome image */}
            <Route exact path="/app" render={props => this.renderWelcome()} />
            <Route
              exact
              path="/app/team/:teamId"
              render={props => this.renderWelcome()}
            />

            {/* Main channel screen with messaging */}
            {/* Only hide this if the layout is MAIN (we want to keep the sidebar) */}
            <Route
              path="/app/team/:teamId/channel/:channelId"
              render={props => {
                return (
                  <ChannelComponent
                    {...props}
                    hide={hideChannel}
                    searchQuery={this.state.searchQuery}
                  />
                )
              }}
            />

            {/* Main channel screen with messaging */}
            {/* Only hide this if the layout is MAIN (we want to keep the sidebar) */}
            <Route
              path="/app/team/:teamId/channel/:channelId"
              render={props => {
                return <AppComponent hide={hideChannel} {...props} />
              }}
            />

            {/* Toolbar for apps */}
            {/* Only hide this if the layout is MAIN (we want to keep the sidebar) */}
            <Route
              path="/app/team/:teamId/channel/:channelId"
              render={props => {
                return <ToolbarComponent hide={hideChannel} {...props} />
              }}
            />

            {/* Video extension */}
            <Route
              path="/app/team/:teamId/channel/:channelId/meet"
              render={props => {
                return (
                  <ExtensionLayout layout={this.state.extensionLayout}>
                    <MeetExtension {...props} />
                  </ExtensionLayout>
                )
              }}
            />

            {/* Calendar page */}
            <Route
              path="/app/team/:teamId/calendar"
              render={props => {
                return (
                  <ExtensionLayout layout={this.state.extensionLayout}>
                    <CalendarExtension {...props} />
                  </ExtensionLayout>
                )
              }}
            />

            {/* Calendar extension */}
            <Route
              path="/app/team/:teamId/channel/:channelId/calendar"
              render={props => {
                return (
                  <ExtensionLayout layout={this.state.extensionLayout}>
                    <CalendarExtension {...props} />
                  </ExtensionLayout>
                )
              }}
            />

            {/* Tasks page */}
            <Route
              path="/app/team/:teamId/tasks"
              render={props => {
                return (
                  <ExtensionLayout layout={this.state.extensionLayout}>
                    <TasksExtension {...props} />
                  </ExtensionLayout>
                )
              }}
            />

            {/* Tasks extension */}
            <Route
              path="/app/team/:teamId/channel/:channelId/tasks"
              render={props => {
                return (
                  <ExtensionLayout layout={this.state.extensionLayout}>
                    <TasksExtension {...props} />
                  </ExtensionLayout>
                )
              }}
            />

            {/* Boards extension */}
            <Route
              path="/app/team/:teamId/channel/:channelId/boards"
              render={props => {
                return (
                  <ExtensionLayout layout={this.state.extensionLayout}>
                    <BoardsExtension {...props} />
                  </ExtensionLayout>
                )
              }}
            />
          </Router>
        </App>
      </AppContainer>
    )
  }
}

AppPage.propTypes = {
  common: PropTypes.any,
  user: PropTypes.any,
  meet: PropTypes.any,
  team: PropTypes.any,
  task: PropTypes.any,
  teams: PropTypes.any,
  channel: PropTypes.any,
  app: PropTypes.any,
  initialize: PropTypes.func,
  hydrateTask: PropTypes.func,
  fetchUser: PropTypes.func,
  closeAppModal: PropTypes.func,
  closeAppPanel: PropTypes.func,
}

const mapDispatchToProps = {
  initialize: userId => initialize(userId),
  fetchUser: userId => fetchUser(userId),
  closeAppModal: () => closeAppModal(),
  closeAppPanel: () => closeAppPanel(),
  hydrateTask: task => hydrateTask(task),
}

const mapStateToProps = state => {
  return {
    common: state.common,
    user: state.user,
    app: state.app,
    task: state.task,
    meet: state.meet,
    channel: state.channel,
    team: state.team,
    teams: state.teams,
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(AppPage)

const Drawer = styled.div`
  transition: transform 0.25s;
  transform: translateX(0%);
  width: fit-content;
  height: 100%;
  display: ${props => (props.hide ? 'none' : 'flex')};
  flex-direction: row;
  align-content: center;
  align-items: center;
  justify-content: flex-start;
  z-index: 7;

  @media only screen and (max-width: 768px) {
    transform: translateX(${props => (props.open ? '0%' : '-100%')});
    position: absolute;
    top: 0px;
    left: 0px;
    z-index: 100;
    min-width: 20vw;
    width: fit-content;
    background: #f8f9fa;
    z-index: 2000;
    /*
    -webkit-box-shadow: 0px 0px 100px 0px rgba(0, 0, 0, 0.75);
    -moz-box-shadow: 0px 0px 100px 0px rgba(0, 0, 0, 0.75);
    box-shadow: 0px 0px 100px 0px rgba(0, 0, 0, 0.75);
    */
  }
`

const DrawerIcon = styled.div`
  display: none;

  @media only screen and (max-width: 768px) {
    display: block;
  }
`

const DrawerOverlay = styled.div`
  position: fixed;
  top: 0px;
  left: 0px;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.1);
  display: none;
  z-index: 6;

  @media only screen and (max-width: 768px) {
    display: block;
    z-index: 1500;
  }
`

const DisabledUI = styled.div`
  position: absolute;
  top: 0px;
  left: 0px;
  width: 100%;
  height: 100%;
  z-index: 100;
  background: rgba(255, 255, 255, 0.85);
  display: flex;
  flex-direction: column;
  align-content: center;
  align-items: center;
  justify-content: center;
`

const DisabledUIText = styled.div`
  color: #202027;
  font-weight: 500;
  margin-bottom: 20px;
  font-size: 25px;
`

const ExtensionLayout = styled.div`
  width: ${props => (props.layout == LAYOUTS.SIDE ? '35%' : '100%')};
  position: ${props =>
    props.layout == LAYOUTS.SIDE || props.layout == LAYOUTS.MAIN
      ? 'relative'
      : 'absolute'};
  display: ${props => (props.layout == LAYOUTS.MAIN ? 'flex' : 'block')};
  border-left: 1px solid #eaedef;
  flex: 1;
  height: 100%;
  background: white;
  left: 0px;
  z-index: 6; /* was 8, was also 1000 */

  @media only screen and (max-width: 768px) {
    width: 100%;
    position: absolute;
    display: block;
    z-index: 1000;
  }
`

const LayoutIconButton = styled.div`
  padding: 5px;
  opacity: 1;
  border-radius: 10px;
  display: flex;
  flex-direction: row;
  align-content: center;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: opacity 0.25s;

  &:hover {
    opacity: 0.75;
  }
`

const AppContainer = styled.div`
  background-color: #202027;
  background-color: white;
  background-size: contain;
  width: 100%;
  height: 100%;
  overflow: hidden;
  align-content: stretch;
`

const App = styled.div`
  flex: 1;
  overflow: hidden;
  width: 100%;
`

const Bar = styled.div`
  background: ${props => props.backgroundColor};
  background: #0b1729;
  width: 100%;
  display: flex;
  flex-direction: row;
  align-content: center;
  align-items: center;
  justify-content: center;

  @media only screen and (max-width: 768px) {
    height: fit-content;
    padding: 10px;
    padding-top: ${props => (IS_CORDOVA ? 'env(safe-area-inset-top)' : '0px')};
  }
`

const BarPadding = styled.div`
  height: 10px;
`

const BarInner = styled.div`
  display: flex;
  flex-direction: row;
  align-content: center;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 0 10px 0 10px;
  height: 50px;
`

const SearchBar = styled.div`
  padding: 10px;
  flex: 1;
  background-color: #070f1c;
  margin-left: 100px;
  margin-right: 100px;
  display: flex;
  flex-direction: row;
  align-content: center;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
`

const SearchBarInput = styled.div`
  flex: 1;
  margin-left: 10px;

  input {
    width: 100%;
    height: 100%;
    background: none;
    border: none;
    font-weight: 500;
    font-size: 13px;
    color: white;
  }

  input::placeholder {
    color: ${'#45618c'};
  }
`

const BarInfo = styled.div`
  display: flex;
  flex-direction: row;
  align-content: center;
  align-items: center;
  justify-content: flex-start;
  margin-right: auto;
`

const BarExtensions = styled.div`
  display: flex;
  flex-direction: row;
  align-content: center;
  align-items: center;
  justify-content: center;
`

const LayoutIcons = styled.div`
  margin-right: 10px;
  display: flex;
  flex-direction: row;
  align-content: center;
  align-items: center;
  justify-content: center;

  @media only screen and (max-width: 768px) {
    display: none;
  }
`

const ExtensionLinks = styled.div`
  display: flex;
  flex-direction: row;
  align-content: center;
  align-items: center;
  justify-content: center;
`

const Pill = styled.div`
  color: ${props => (props.active ? '#0b1729' : '#45618c')};
  padding: 7px 15px 7px 15px;
  border-radius: 20px;
  background-color: ${props => (props.active ? '#4084ed' : '#070f1c')};
  margin-left: 5px;
  font-weight: 600;
  display: flex;
  flex-direction: row;
  align-content: center;
  align-items: center;
  justify-content: center;

  @media only screen and (max-width: 768px) {
    padding: 7px 5px 7px 10px;
  }
`

const PillText = styled.span`
  @media only screen and (max-width: 768px) {
    display: none;
  }
`

const Team = styled.div`
  color: #4084ed;
  font-weight: 900;
  font-size: 8px;
  text-transform: uppercase;
  margin-right: 5px;
  background-color: #070f1c;
  padding: 10px;
  border-radius: 5px;
  margin-right: 10px;
  font-family: Menlo, monospace;
`

const Role = styled.div`
  color: #45618c;
  margin-right: 5px;
  font-weight: 500;

  @media only screen and (max-width: 768px) {
    display: none;
  }
`

const Timezone = styled.div`
  color: #45618c;
  margin-right: 5px;
  opacity: 0.75;
`

const Loader = () => (
  <div className="react-fragment-loader">
    <div className="react-fragment-spinner">
      <div />
      <div />
      <div />
      <div />
    </div>
  </div>
)
