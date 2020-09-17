import React from 'react'
import { connect } from 'react-redux'
import { Router, Route, Link, withRouter, Switch } from 'react-router-dom'
import { browserHistory } from '../services/browser-history.service'
import AuthService from '../services/auth.service'
import styled from 'styled-components'
import PropTypes from 'prop-types'
import { initialize, fetchUser, closeAppModal, closeAppPanel } from '../actions'
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
import { showLocalPushNotification, urlBase64ToUint8Array, logger, isExtensionOpen } from '../helpers/util'
import EventService from '../services/event.service'
import * as PnService from '../services/pn.service'
import * as chroma from 'chroma-js'
import TasksExtension from '../extensions/tasks/tasks.extension'
import VideoExtension from '../extensions/video/video.extension'
import { LAYOUTS, IS_CORDOVA, IS_MOBILE } from '../constants'
import { API_HOST, PUBLIC_VAPID_KEY, PN, ONESIGNAL_KEY } from '../environment'

class AppPage extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      teams: [],
      userId: null,
      pushNotificationsNotification: false,
      extensionLayout: LAYOUTS.SIDE,
      drawer: true,
    }

    this.onAppMessageReceived = this.onAppMessageReceived.bind(this)
    this.dismissPushNotifications = this.dismissPushNotifications.bind(this)
    this.handlePushNotificationsSetup = this.handlePushNotificationsSetup.bind(this)
    this.checkPushNotificationsAreEnabled = this.checkPushNotificationsAreEnabled.bind(this)
    this.renderBar = this.renderBar.bind(this)
    this.renderWelcome = this.renderWelcome.bind(this)
    this.renderDisabledUI = this.renderDisabledUI.bind(this)
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
            console.log('notificationOpenedCallback: ' + JSON.stringify(jsonData))
          }
          // Set your iOS Settings
          var iosSettings = {}
          iosSettings['kOSSettingsKeyAutoPrompt'] = false
          iosSettings['kOSSettingsKeyInAppLaunchURL'] = false

          window.plugins.OneSignal.startInit(ONESIGNAL_KEY)
            .handleNotificationOpened(notificationOpenedCallback)
            .iOSSettings(iosSettings)
            .inFocusDisplaying(window.plugins.OneSignal.OSInFocusDisplayOption.Notification)
            .endInit()

          // The promptForPushNotificationsWithUserResponse function will show the iOS push notification prompt.
          // We recommend removing the following code and instead using an In-App Message to prompt for notification permission (See step 6)
          window.plugins.OneSignal.promptForPushNotificationsWithUserResponse(function(accepted) {
            console.log('User accepted notifications: ' + accepted)
          })

          // Tag this user with his own id
          window.plugins.OneSignal.sendTags({ userId })
          window.plugins.OneSignal.getPermissionSubscriptionState(function(status) {
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
        const register = await navigator.serviceWorker.register('/sw.js', { scope: '/' })
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

    const { state } = await navigator.permissions.query({ name: 'notifications' })
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
    const backgroundColor = this.props.channel ? (this.props.channel.color ? this.props.channel.color : '#112640') : '#112640'
    const pillBackgroundColor = this.props.channel
      ? this.props.channel.private
        ? '#0a1a2e'
        : this.props.channel.color
        ? chroma(this.props.channel.color)
            .darken(0.25)
            .toString()
        : '#0a1a2e'
      : '#0a1a2e'
    const textColor = this.props.channel
      ? this.props.channel.private
        ? '#007af5'
        : this.props.channel.color
        ? chroma(this.props.channel.color)
            .desaturate(2)
            .brighten(2.25)
            .toString()
        : '#007af5'
      : '#007af5'

    return (
      <Bar className="row" backgroundColor={backgroundColor}>
        <BarInfo>
          <DrawerIcon>
            <IconComponent icon="menu" size={20} thickness={2} color={textColor} onClick={() => this.setState({ drawer: !this.state.drawer })} className="mr-10 button" />
          </DrawerIcon>

          <Team backgroundColor={pillBackgroundColor} textColor={textColor}>
            {this.props.team.name}
          </Team>

          <Role textColor={textColor}>{this.props.team.position}</Role>
          <Timezone textColor={textColor}>{this.props.user.timezone}</Timezone>
        </BarInfo>

        {this.props.channel.id && (
          <BarExtensions>
            <LayoutIcons>
              <LayoutIconButton>
                <IconComponent
                  icon="square"
                  color={this.state.extensionLayout == LAYOUTS.FULL ? textColor : 'rgba(255,255,255,0.25)'}
                  size={18}
                  thickness={2}
                  onClick={() => this.setState({ extensionLayout: LAYOUTS.FULL })}
                />
              </LayoutIconButton>
              <LayoutIconButton>
                <IconComponent
                  icon="sidebar"
                  color={this.state.extensionLayout == LAYOUTS.MAIN ? textColor : 'rgba(255,255,255,0.25)'}
                  size={18}
                  thickness={2}
                  onClick={() => this.setState({ extensionLayout: LAYOUTS.MAIN })}
                />
              </LayoutIconButton>
              <LayoutIconButton>
                <IconComponent
                  icon="sidebar"
                  color={this.state.extensionLayout == LAYOUTS.SIDE ? textColor : 'rgba(255,255,255,0.25)'}
                  size={18}
                  thickness={2}
                  onClick={() => this.setState({ extensionLayout: LAYOUTS.SIDE })}
                  style={{ transform: 'rotate(180deg)' }}
                />
              </LayoutIconButton>
            </LayoutIcons>

            <ExtensionLinks>
              {!IS_CORDOVA && (
                <Link to={lastUrlPart == 'video' ? `/app/team/${this.props.team.id}/channel/${this.props.channel.id}` : `/app/team/${this.props.team.id}/channel/${this.props.channel.id}/video`}>
                  <Pill backgroundColor={pillBackgroundColor} textColor={textColor} active={lastUrlPart == 'video'}>
                    <IconComponent icon="video" color={lastUrlPart == 'video' ? pillBackgroundColor : textColor} size={14} thickness={2.5} className="mr-5" />
                    <PillText>Meet</PillText>
                  </Pill>
                </Link>
              )}
              <Link to={lastUrlPart == 'tasks' ? `/app/team/${this.props.team.id}/channel/${this.props.channel.id}` : `/app/team/${this.props.team.id}/channel/${this.props.channel.id}/tasks`}>
                <Pill backgroundColor={pillBackgroundColor} textColor={textColor} active={lastUrlPart == 'tasks'}>
                  <IconComponent icon="check" color={lastUrlPart == 'tasks' ? pillBackgroundColor : textColor} size={14} thickness={2.5} className="mr-5" />
                  <PillText>Tasks</PillText>
                </Pill>
              </Link>
            </ExtensionLinks>
          </BarExtensions>
        )}
      </Bar>
    )
  }

  renderWelcome() {
    return (
      <div onClick={() => this.setState({ drawer: !this.state.drawer })} className="flexer column justify-content-center align-content-center align-items-center">
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
                <Avatar size="x-large" image={t.image} title={t.name} className="button" />
              </Link>
            )
          })}
        </div>
      </DisabledUI>
    )
  }

  render() {
    if (!this.props.user) return <Loading show={true} />
    if (!this.props.user.id) return <Loading show={true} />

    // See if we need to hide the channel components
    // - channel
    // - toolbar
    // - app
    const hideChannel = (this.state.extensionLayout == LAYOUTS.MAIN || this.state.extensionLayout == LAYOUTS.FULL) && isExtensionOpen()

    return (
      <AppContainer className="column">
        <Loading show={this.props.common.loading} />
        <Error message={this.props.common.error} theme="solid" />

        {!this.props.common.connected && <Notification theme="solid" text="Connecting..." />}

        {/* When apps open a modal */}
        {this.props.app.modal && <AppModal action={this.props.app.modal} onClose={this.props.closeAppModal} />}

        {/* Blue PN bar to ask the user for permission */}
        {this.state.pushNotificationsNotification && (
          <Notification text="Push notifications are disabled" actionText="Enable" onActionClick={this.handlePushNotificationsSetup} onDismissIconClick={this.dismissPushNotifications} theme="solid" />
        )}

        {/* Color channel bar at the top */}
        {this.renderBar()}

        <App className="row">
          <Router history={browserHistory}>
            {this.state.drawer && <DrawerOverlay onClick={() => this.setState({ drawer: false })} />}

            <Drawer open={this.state.drawer}>
              <Route path="/app" component={DockComponent} />
              <Route
                path="/app/team/:teamId"
                render={props => {
                  return <ChannelsComponent {...props} toggleDrawer={() => this.setState({ drawer: !this.state.drawer })} />
                }}
              />
            </Drawer>

            {/* Specifically for people getting deleted from a team */}
            {/* This disables everything */}
            <Route path="/app/team/:teamId" render={this.renderDisabledUI} />

            {/* If there is nothing selected - welcome image */}
            <Route exact path="/app" render={props => this.renderWelcome()} />
            <Route exact path="/app/team/:teamId" render={props => this.renderWelcome()} />

            {/* Main channel screen with messaging */}
            {/* Only hide this if the layout is MAIN (we want to keep the sidebar) */}
            <Route
              path="/app/team/:teamId/channel/:channelId"
              render={props => {
                return <ChannelComponent {...props} hide={hideChannel} />
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
              path="/app/team/:teamId/channel/:channelId/video"
              render={props => {
                return (
                  <ExtensionLayout layout={this.state.extensionLayout}>
                    <VideoExtension {...props} />
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
          </Router>
        </App>
      </AppContainer>
    )
  }
}

AppPage.propTypes = {
  common: PropTypes.any,
  user: PropTypes.any,
  team: PropTypes.any,
  teams: PropTypes.any,
  channel: PropTypes.any,
  app: PropTypes.any,
  initialize: PropTypes.func,
  fetchUser: PropTypes.func,
  closeAppModal: PropTypes.func,
  closeAppPanel: PropTypes.func,
}

const mapDispatchToProps = {
  initialize: userId => initialize(userId),
  fetchUser: userId => fetchUser(userId),
  closeAppModal: () => closeAppModal(),
  closeAppPanel: () => closeAppPanel(),
}

const mapStateToProps = state => {
  return {
    common: state.common,
    user: state.user,
    app: state.app,
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
  width: 350px;
  height: 100%;
  display: flex;
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
  position: ${props => (props.layout == LAYOUTS.SIDE || props.layout == LAYOUTS.MAIN ? 'relative' : 'absolute')};
  display: ${props => (props.layout == LAYOUTS.MAIN ? 'flex' : 'block')};
  border-left: 1px solid #eaedef;
  flex: 1;
  height: 100%;
  background: white;
  left: 0px;
  z-index: 1000;

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
  background: ${props => (props.backgroundColor ? props.backgroundColor : '#F0F3F5')};
  width: 100%;
  padding: 0 10px 0 10px;
  height: 50px;

  @media only screen and (max-width: 768px) {
    height: fit-content;
    padding: 10px;
    padding-top: ${props => (IS_CORDOVA ? 'env(safe-area-inset-top)' : '10px')};
  }
`

const BarInfo = styled.div`
  display: flex;
  flex-direction: row;
  align-content: center;
  align-items: center;
  justify-content: center;
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
  color: ${props => (props.active ? props.backgroundColor : props.textColor)};
  padding: 7px 15px 7px 15px;
  border-radius: 20px;
  background-color: ${props => (props.active ? props.textColor : props.backgroundColor)};
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
  color: ${props => props.textColor};
  font-weight: 800;
  margin-right: 5px;
  background-color: ${props => props.backgroundColor};
  padding: 5px;
  border-radius: 3px;
  margin-right: 10px;
`

const Role = styled.div`
  color: ${props => props.textColor};
  margin-right: 5px;
  font-weight: 500;

  @media only screen and (max-width: 768px) {
    display: none;
  }
`

const Timezone = styled.div`
  color: ${props => props.textColor};
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
