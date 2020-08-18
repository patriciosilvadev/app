import React, { useState, useEffect, useRef } from 'react'
import { connect } from 'react-redux'
import { useSelector, useDispatch, ReactReduxContext } from 'react-redux'
import './video.extension.css'
import { Avatar, Tooltip, Button, Input, Spinner, Error, Notification } from '@weekday/elements'
import { IconComponent } from '../../components/icon.component'
import '../../../assets/downgrade.png'
import { Janus } from './lib/janus'
import { getQueryStringValue, logger, getMentions } from '../../helpers/util'
import GraphqlService from '../../services/graphql.service'
import { updateChannel, createChannelMessage } from '../../actions'
import adapter from 'webrtc-adapter'
import PropTypes from 'prop-types'
import moment from 'moment'
import { DEVICE } from '../../environment'
import { MIME_TYPES } from '../../constants'

// Variables from the Janus videoroom example
var server = 'http://159.69.150.191:8088/janus'
var janus = null
var sfu = null
var room = 0
var opaqueId = 'videoroomtest-' + Janus.randomString(12)
var myid = null
var mystream = null
var screenstream = null
var feeds = []
var bitrateTimer = []
var doSimulcast = getQueryStringValue('simulcast') === 'yes' || getQueryStringValue('simulcast') === 'true'
var doSimulcast2 = getQueryStringValue('simulcast2') === 'yes' || getQueryStringValue('simulcast2') === 'true'
var mypvtid = null // We use this other ID just to map our subscriptions to us

const Video = ({ stream, poster, viewable }) => {
  const videoRef = useRef(null)

  useEffect(() => {
    console.log('REMOTE VIDEO COMPONENT --> UPDATING STREAM: ', stream)
    Janus.attachMediaStream(videoRef.current, stream)
  }, [stream])

  return (
    <React.Fragment>
      {!viewable && (
        <div className="not-viewable">
          <IconComponent icon="video-off" color="#11161c" thickness={2} size={20} />
        </div>
      )}
      <video ref={videoRef} width="100%" height="100%" autoPlay poster={poster} />
    </React.Fragment>
  )
}

class VideoExtension extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      participantFocus: false,
      participantToFocus: -1, // Always us
      topic: '',
      participants: [],
      error: null,
      notification: null,
      loading: false,
      view: '',
      muted: false,
      published: false,
      roomId: null,
      screenSharing: false,
      viewable: true,
    }

    this.localVideoRef = React.createRef()
    this.focusVideoRef = React.createRef()

    this.stopCall = this.stopCall.bind(this)
    this.mute = this.mute.bind(this)
    this.publish = this.publish.bind(this)
    this.registerUsername = this.registerUsername.bind(this)
    this.publishOwnFeed = this.publishOwnFeed.bind(this)
    this.unpublishOwnFeed = this.unpublishOwnFeed.bind(this)
    this.toggleMute = this.toggleMute.bind(this)
    this.toggleVideo = this.toggleVideo.bind(this)
    this.newRemoteFeed = this.newRemoteFeed.bind(this)
    this.initJanusVideoRoom = this.initJanusVideoRoom.bind(this)
    this.renderCall = this.renderCall.bind(this)
    this.renderStartCall = this.renderStartCall.bind(this)
    this.renderCallList = this.renderCallList.bind(this)
    this.handleChannelDeleteCall = this.handleChannelDeleteCall.bind(this)
    this.handleChannelCreateCall = this.handleChannelCreateCall.bind(this)
    this.startCapture = this.startCapture.bind(this)
    this.stopCapture = this.stopCapture.bind(this)
    this.toggleScreenSharing = this.toggleScreenSharing.bind(this)
    this.shareToChannel = this.shareToChannel.bind(this)
    this.getRoomParticipants = this.getRoomParticipants.bind(this)
    this.exitCall = this.exitCall.bind(this)
  }

  async shareToChannel() {
    const { roomId, topic } = this.state
    const body = `> ${topic}`
    const userName = this.props.user.name
    const userId = this.props.user.id
    const excerpt = userName.toString().split(' ')[0] + ': ' + body || body
    const teamId = this.props.team.id
    const channelId = this.props.channel.id
    const device = DEVICE
    const parentId = null
    const mentions = getMentions(body)
    const attachments = [
      {
        name: topic,
        uri: roomId,
        preview: '',
        mime: MIME_TYPES.CALLS,
        size: 0,
      },
    ]

    try {
      const { data } = await GraphqlService.getInstance().createChannelMessage({
        device,
        mentions,
        channel: channelId,
        user: userId,
        team: teamId,
        parent: parentId,
        body,
        excerpt,
        attachments,
      })

      // Catch it
      if (!data.createChannelMessage) return logger('data.createChannelMessage is null')

      // The extra values are used for processing other info
      const channelMessage = {
        message: data.createChannelMessage,
        channelId,
        teamId,
      }

      // Create the message
      this.props.createChannelMessage(channelId, channelMessage)
      this.props.updateChannel(channelId, { excerpt })
    } catch (e) {
      console.log(e)
    }
  }

  stopCall() {
    janus.destroy()
  }

  exitCall(roomId) {
    // Stops the video camera
    sfu.hangup()

    // Remove ourselves as a publisher
    this.unpublishOwnFeed()

    // Showing the user a list
    this.setState({ view: '', participants: [] })

    // Now leaving the room
    sfu.send({
      message: {
        request: 'leave',
        room: roomId,
      },
    })
  }

  destroyRoom(roomId) {
    sfu.send({
      message: {
        request: 'destroy',
        room: roomId,
        secret: '',
        permanent: true,
      },
      success: ({ videoroom, room, permanent, error_code, error }) => {
        console.log('Deleted: ', videoroom, room, permanent, error_code, error)
      },
    })
  }

  mute(muted) {
    console.log('setting mute to ', muted)
    this.setState({ muted })
    this.toggleMute()
  }

  publish(published) {
    console.log('setting video to ', published)
    this.setState({ published })
    this.toggleVideo()

    /* this.setState({ published })

    if (published) {
      this.publishOwnFeed(true, true)
    } else {
      this.attachLocalStreamToVideoEl(null)
      this.unpublishOwnFeed()
      this.publishOwnFeed(true, false)
    } */
  }

  registerUsername(roomId) {
    // Get some fo the user details we'll use
    // | This is not allowed in URLs
    const { image, name } = this.props.user
    const display = btoa(`${name}|${image}`)

    // there is no sucecss callback here
    // Base 64 encode
    sfu.send({
      message: {
        request: 'join',
        room: roomId,
        ptype: 'publisher',
        display: display,
        //close_pc: false,
      },
    })
  }

  publishOwnFeed(useAudio, useVideo) {
    // Publishers are sendonly
    // Add data:true here if you want to publish datachannels as well
    let media = {
      audioRecv: false,
      videoRecv: false,
      audioSend: useAudio,
      videoSend: useVideo,
    }

    if (this.state.screenSharing) media.video = 'screen'

    // Create the offer for Janus
    sfu.createOffer({
      media,
      // If you want to test simulcasting (Chrome and Firefox only), then
      // pass a ?simulcast=true when opening this demo page: it will turn
      // the following 'simulcast' property to pass to janus.js to true
      simulcast: doSimulcast,
      simulcast2: doSimulcast2,
      success: jsep => {
        Janus.debug('Got publisher SDP!', jsep)

        var publish = { request: 'configure', audio: useAudio, video: true }
        // You can force a specific codec to use when publishing by using the
        // audiocodec and videocodec properties, for instance:
        // 		publish["audiocodec"] = "opus"
        // to force Opus as the audio codec to use, or:
        // 		publish["videocodec"] = "vp9"
        // to force VP9 as the videocodec to use. In both case, though, forcing
        // a codec will only work if: (1) the codec is actually in the SDP (and
        // so the browser supports it), and (2) the codec is in the list of
        // allowed codecs in a room. With respect to the point (2) above,
        // refer to the text in janus.plugin.videoroom.jcfg for more details
        sfu.send({ message: publish, jsep: jsep })
      },
      error: error => {
        Janus.error('WebRTC error:', error)

        // The user not allowed their feed
        if (this.state.screenSharing) {
          this.setState(
            {
              screenSharing: false,
              error: 'Media was not allowed - please allow screen sharing',
            },
            () => {
              // First unpublish & then publish
              // sfu.hangup()
              // publishOwnFeed will now use our feed
              // this.publishOwnFeed(true)
            }
          )
        } else {
          // As normal
          if (useAudio) {
            this.publishOwnFeed(false, true)
          } else {
            console.log('WebRTC error... ' + error.message)
            // Reshow this button:
            // this.publishOwnFeed(true)
            this.setState({ error: error.message })
          }
        }
      },
    })
  }

  unpublishOwnFeed() {
    sfu.send({
      message: {
        request: 'unpublish',
      },
    })
  }

  toggleMute() {
    var muted = sfu.isAudioMuted()
    Janus.log('Audio: ' + (muted ? 'Unmuting' : 'Muting') + ' local stream...')
    if (muted) sfu.unmuteAudio()
    else sfu.muteAudio()
    muted = sfu.isAudioMuted()
  }

  toggleVideo() {
    var muted = sfu.isVideoMuted()
    Janus.log('Video: ' + (muted ? 'Unmuting' : 'Muting') + ' local stream...')
    if (muted) sfu.unmuteVideo()
    else sfu.muteVideo()
    muted = sfu.isVideoMuted()
    this.setState({ viewable: !muted })
  }

  newRemoteFeed(id, display, audio, video) {
    var remoteFeed = null

    janus.attach({
      plugin: 'janus.plugin.videoroom',
      opaqueId: opaqueId,
      success: pluginHandle => {
        remoteFeed = pluginHandle
        remoteFeed.simulcastStarted = false

        Janus.log('Plugin attached! (' + remoteFeed.getPlugin() + ', id=' + remoteFeed.getId() + ')')
        Janus.log('  -- This is a subscriber')

        // We wait for the plugin to send us an offer
        var subscribe = {
          request: 'join',
          room: room,
          ptype: 'subscriber',
          feed: id,
          private_id: mypvtid,
        }

        // For example, if the publisher is VP8 and this is Safari, let's avoid video
        if (Janus.webRTCAdapter.browserDetails.browser === 'safari' && (video === 'vp9' || (video === 'vp8' && !Janus.safariVp8))) {
          if (video) video = video.toUpperCase()

          console.warning('Publisher is using ' + video + ", but Safari doesn't support it: disabling video")
          subscribe['offer_video'] = false
        }

        remoteFeed.videoCodec = video
        remoteFeed.send({ message: subscribe })
      },
      error: error => {
        Janus.error('  -- Error attaching plugin...', error)
        console.log('Error attaching plugin... ' + error)
        this.setState({ error: 'Error getting remote feed' })
      },
      onmessage: (msg, jsep) => {
        Janus.debug(' ::: Got a message (subscriber) :::', msg, msg['videoroom'])

        var event = msg['videoroom']

        if (msg['error']) {
          console.log('newRemoteFeed error: ', msg['error'])
        } else if (event) {
          if (event === 'attached') {
            // Subscriber created and attached
            remoteFeed.rfid = msg['id']
            remoteFeed.rfdisplay = msg['display']

            // Not sure what the spinner here is?
            // I think loading event hitching a ride on remoteFeed ⚠️
            // TODO: Implement loading mechanism
            if (!remoteFeed.spinner) {
              // Target is the video element ref for the remote feed that we create
              // var target = document.getElementById('videoremote' + remoteFeed.id)
              // remoteFeed.spinner = new Spinner({ top: 100 }).spin(target)
            } else {
              remoteFeed.spinner.spin()
            }

            console.log('Successfully attached to feed ' + remoteFeed.rfid + ' (' + remoteFeed.rfdisplay + ') in room ' + msg['room'])
            console.log('remoteParticipant: ', remoteFeed, this.state.participants)

            // Update our state with the new remote feed
            this.setState({ participants: [...this.state.participants, remoteFeed] })
          } else if (event === 'event') {
            // Check if we got an event on a simulcast-related event from this publisher
            var substream = msg['substream']
            var temporal = msg['temporal']

            if ((substream !== null && substream !== undefined) || (temporal !== null && temporal !== undefined)) {
              if (!remoteFeed.simulcastStarted) {
                // remoteFeed.simulcastStarted = true
                // Add some new buttons
                // Unsupported FOR NOW ⚠️
                // addSimulcastButtons(remoteFeed.id, remoteFeed.videoCodec === 'vp8' || remoteFeed.videoCodec === 'h264')
              }
              // We just received notice that there's been a switch, update the buttons
              // Unsupported FOR NOW ⚠️
              // updateSimulcastButtons(remoteFeed.id, substream, temporal)
            }
          } else {
            // What has just happened?
          }
        }

        if (jsep) {
          Janus.debug('Handling SDP as well...', jsep)

          // Answer and attach
          remoteFeed.createAnswer({
            jsep: jsep,
            // Add data:true here if you want to subscribe to datachannels as well
            // (obviously only works if the publisher offered them in the first place)
            media: { audioSend: false, videoSend: false }, // We want recvonly audio/video
            success: jsep => {
              Janus.debug('Got SDP!', jsep)
              var body = { request: 'start', room: room }
              remoteFeed.send({ message: body, jsep: jsep })
            },
            error: error => {
              Janus.error('WebRTC error:', error)
              console.log('WebRTC error... ' + error.message)
            },
          })
        }
      },
      iceState: state => {
        Janus.log('ICE state of this WebRTC PeerConnection (feed #' + remoteFeed.id + ') changed to ' + state)
      },
      webrtcState: on => {
        Janus.log('Janus says this WebRTC PeerConnection (feed #' + remoteFeed.id + ') is ' + (on ? 'up' : 'down') + ' now')
      },
      onlocalstream: stream => {
        // The subscriber stream is recvonly, we don't expect anything here
      },
      onremotestream: stream => {
        Janus.log('Remote feed #' + remoteFeed.id + ', stream:', stream, remoteFeed)
        console.log('Current remote particicpants: ', this.state.participants)

        // Look for existing remoteParticipants
        const remoteParticipant = this.state.participants.filter(remoteParticipant => remoteParticipant.id == remoteFeed.id)

        if (remoteParticipant.length === 0) {
          // Firefox Stable has a bug: width and height are not immediately available after a playing
          if (Janus.webRTCAdapter.browserDetails.browser === 'firefox') {
            setTimeout(() => {
              // Adjust width & height here --> we do this with CSS
            }, 2000)
          }
        }

        // Janus.attachMediaStream($('#remotevideo' + remoteFeed.id).get(0), stream)
        // Now we update the state and add the stream
        this.setState(
          {
            participants: this.state.participants.map(remoteParticipant => {
              return remoteParticipant.id == remoteFeed.id ? { ...remoteFeed, stream, viewable: true } : remoteParticipant
            }),
          },
          () => {
            // AFTER our state update
            // Handle bitrate / streams
            let bitrates = {}
            const videoTracks = stream.getVideoTracks()
            const makeRemoteParticipantViewable = viewable => {
              this.setState({
                participants: this.state.participants.map(remoteParticipant => {
                  return remoteParticipant.id == remoteFeed.id ? { ...remoteParticipant, viewable } : remoteParticipant
                }),
              })
            }

            // Handle whether or not there are video tracks
            if (!videoTracks || videoTracks.length === 0) {
              // No remote video
              // Hide the remote video feed
              console.log('HIDE THE REMOTE VIDEO')
              makeRemoteParticipantViewable(false)
            } else {
              // Show the remote video
              console.log('SHOW THE REMOTE VIDEO')
              makeRemoteParticipantViewable(true)
            }

            // Handle bitrate display
            if (Janus.webRTCAdapter.browserDetails.browser === 'chrome' || Janus.webRTCAdapter.browserDetails.browser === 'firefox' || Janus.webRTCAdapter.browserDetails.browser === 'safari') {
              bitrateTimer[remoteFeed.id] = setInterval(() => {
                // Strip the stirng off
                const bitrate = remoteFeed.getBitrate().split(' ')[0]

                // If the bitrate drop below 10
                // Then don't show anything
                // But only do this once (so it doesn't stress the browsaer out)
                if (bitrate < 10) {
                  if (bitrates[remoteFeed.id]) {
                    bitrates[remoteFeed.id] = false
                    makeRemoteParticipantViewable(false)
                  }
                }

                // If the bitrate exceeds 10
                // Then show the video feed
                // But only do this once (so it doesn't stress the browsaer out
                if (bitrate > 10) {
                  if (!bitrates[remoteFeed.id]) {
                    bitrates[remoteFeed.id] = true
                    makeRemoteParticipantViewable(true)
                  }
                }

                console.log(remoteFeed.id, bitrate, bitrates[remoteFeed.id])
              }, 1000)
            }
          }
        )
      },
      oncleanup: () => {
        Janus.log(' ::: Got a cleanup notification (remote feed ' + id + ') :::', remoteFeed.id)

        // Not sure what spinner is - think jQuery object
        // ⚠️ TODO: invesigate and remove
        if (remoteFeed.spinner) remoteFeed.spinner.stop()
        remoteFeed.spinner = null

        // Remove the video
        this.setState({
          participants: this.state.participants.filter(remoteParticipant => remoteParticipant.id != remoteFeed.id),
        })

        if (bitrateTimer[remoteFeed.id]) clearInterval(bitrateTimer[remoteFeed.id])
        bitrateTimer[remoteFeed.id] = null
        remoteFeed.simulcastStarted = false
        // We don't handle simulcast yet
        // $('#simulcast' + remoteFeed.id).remove()
      },
    })
  }

  getRoomParticipants(roomId, callback) {
    sfu.send({
      message: {
        request: 'listparticipants',
        room: roomId,
      },
      success: res => {
        if (res.error) callback(null, res.error)
        if (!res.error) callback(res.participants, null)
      },
    })
  }

  getServerRoomList() {
    sfu.send({
      message: {
        request: 'list',
      },
      success: res => {
        console.log('All rooms: ', res)
      },
    })
  }

  initJanusVideoRoom(roomId) {
    if (!Janus.isWebrtcSupported()) return alert('No WebRTC support... ')

    // global
    room = roomId

    // Start loading
    this.setState({ loading: true })

    // Create session
    janus = new Janus({
      server: server,
      success: () => {
        // Attach to VideoRoom plugin
        janus.attach({
          plugin: 'janus.plugin.videoroom',
          opaqueId: opaqueId,
          success: pluginHandle => {
            sfu = pluginHandle

            // Logging
            Janus.log('Plugin attached! (' + sfu.getPlugin() + ', id=' + sfu.getId() + ')')
            Janus.log('This is a publisher/manager')

            // Mkae things active
            this.setState({ loading: false })

            // Join the room
            this.registerUsername(roomId)
          },
          error: error => {
            this.setState({ error })
            Janus.error('  -- Error attaching plugin...', error)
          },
          consentDialog: on => {
            Janus.debug('Consent dialog should be ' + (on ? 'on' : 'off') + ' now')
            // Check consent has been given
            console.log(!!navigator.mozGetUserMedia)
          },
          iceState: state => {
            Janus.log('ICE state changed to ' + state)
          },
          mediaState: (medium, on) => {
            Janus.log('Janus ' + (on ? 'started' : 'stopped') + ' receiving our ' + medium)
          },
          webrtcState: on => {
            Janus.log('Janus says our WebRTC PeerConnection is ' + (on ? 'up' : 'down') + ' now')

            // Show DIV
            // $('#videolocal') (unhide) <- this is a div
            if (!on) return

            // This controls allows us to override the global room bitrate cap
            // 0 == unlimited
            // var bitrate = 0 / 128 / 256 / 1014 / 1500 / 2000
            sfu.send({
              message: {
                request: 'configure',
                bitrate: 1014,
              },
            })
          },
          onmessage: (msg, jsep) => {
            Janus.debug(' ::: Got a message (publisher) :::', msg, msg['videoroom'])

            var event = msg['videoroom']

            if (event) {
              if (event === 'joined') {
                // Publisher/manager created, negotiate WebRTC and attach to existing publihers, if any
                myid = msg['id']
                mypvtid = msg['private_id']

                Janus.log('Successfully joined room ' + msg['room'] + ' with ID ' + myid)

                // We have the feed
                this.publishOwnFeed(true, true)

                // Set the call to active
                this.setState({ view: 'call' })

                // Any new feed to attach to?
                // These attach all the exisitng pushers that are there when the room starts
                if (msg['publishers']) {
                  var list = msg['publishers']

                  Janus.debug('Got a list of available publishers:', list)

                  for (var f in list) {
                    var id = list[f]['id']
                    var display = list[f]['display']
                    var audio = list[f]['audio_codec']
                    var video = list[f]['video_codec']

                    Janus.debug('  >> [' + id + '] ' + display + ' (audio: ' + audio + ', video: ' + video + ')')

                    // Create a new remote feed
                    this.newRemoteFeed(id, display, audio, video)
                  }
                }
              } else if (event === 'destroyed') {
                // The room has been destroyed
                console.log('The room has been destroyed')

                // Reset the UI
                this.setState({ participants: [], view: '' })
              } else if (event === 'event') {
                // Attach any new feeds that join
                if (msg['publishers']) {
                  var list = msg['publishers']

                  Janus.debug('Got a list of available publishers:', list)

                  for (var f in list) {
                    var id = list[f]['id']
                    var display = list[f]['display']
                    var audio = list[f]['audio_codec']
                    var video = list[f]['video_codec']

                    Janus.debug('  >> [' + id + '] ' + display + ' (audio: ' + audio + ', video: ' + video + ')')

                    this.newRemoteFeed(id, display, audio, video)
                  }
                } else if (msg['leaving']) {
                  // One of the publishers has gone away?
                  // Closed the browser maybe
                  var leaving = msg['leaving']
                  var remoteFeed = this.state.participants.filter(participant => participant.rfid == leaving)[0]

                  // Only if they exist & they're not us
                  // msg['leaving'] == "ok" if it's us leaving
                  if (remoteFeed) {
                    Janus.debug('Feed found - ' + remoteFeed.rfid + ' (' + remoteFeed.rfdisplay + ') has left the room, detaching')

                    // Update our state & remove the participant / remoteFeed
                    this.setState({
                      participants: this.state.participants.filter(participant => participant.rfid != remoteFeed.rfid),
                    })

                    // Remove the participant
                    remoteFeed.detach()
                  }
                } else if (msg['unpublished']) {
                  // One of the publishers has unpublished?
                  var unpublished = msg['unpublished']
                  var remoteFeed = this.state.participants.filter(participant => participant.rfid == unpublished)[0]

                  console.log('>>>>>>>>', msg['unpublished'], this.state.participants)

                  // Only if they exist - this might also be us
                  if (remoteFeed) {
                    Janus.debug('Feed ' + remoteFeed.rfid + ' (' + remoteFeed.rfdisplay + ') has left the room, detaching')

                    // Update our state & remove the participant / remoteFeed
                    this.setState({
                      participants: this.state.participants.filter(participant => participant.rfid != remoteFeed.rfid),
                    })

                    // Remove the participant
                    remoteFeed.detach()
                  }

                  // If we are unpublished
                  if (unpublished === 'ok') {
                    // Simply hang up our camera
                    // sfu.hangup()
                    // And change the view to the listing
                    // this.setState({ view: '' })
                    // and
                    return
                  }
                } else if (msg['error']) {
                  console.error(msg)

                  switch (msg['error_code']) {
                    // If the room doesn't exist, then direct them to the list
                    case 426:
                      this.setState({
                        error: 'This room does not exist',
                        view: '',
                      })
                      break

                    // User already a publisher here
                    // The room ID would have been updated from the "Join" button
                    case 425:
                      this.setState({ view: 'call' })
                      this.publishOwnFeed(true, true)
                      break
                  }
                }
              }
            }

            if (jsep) {
              Janus.debug('Handling SDP as well...', jsep)
              sfu.handleRemoteJsep({ jsep: jsep })

              // Check if any of the media we wanted to publish has
              // been rejected (e.g., wrong or unsupported codec)
              var audio = msg['audio_codec']
              var video = msg['video_codec']

              // Audio has been rejected
              if (mystream && mystream.getAudioTracks() && mystream.getAudioTracks().length > 0 && !audio) {
                this.setState({ error: "Our audio stream has been rejected, viewers won't hear us" })
              }

              // Video has been rejected
              // Hide the webcam video element REF - see below where it attached
              if (mystream && mystream.getVideoTracks() && mystream.getVideoTracks().length > 0 && !video) {
                this.setState({ error: "Our video stream has been rejected, viewers won't see us" })
              }
            }
          },
          onlocalstream: stream => {
            Janus.debug(' ::: Got a local stream :::', stream)

            // Update our local stream
            this.attachLocalStreamToVideoEl(stream)

            // Handle the ice connection - making sure we're published here for the user
            if (sfu.webrtcStuff.pc.iceConnectionState !== 'completed' && sfu.webrtcStuff.pc.iceConnectionState !== 'connected') {
              // Show an indicator/notice for the user to say we're publishing
              // Do nothing here for now
              // Will be handled by the loading indicator
              this.setState({ published: true })
            }

            // Get all the video trackcs from this device
            var videoTracks = stream.getVideoTracks()

            // Get our video tracks
            if (!videoTracks || videoTracks.length === 0) {
              this.setState({ error: 'Webcam feed is off, or not present.' })
            }
          },
          onremotestream: stream => {
            // The publisher stream is sendonly, we don't expect anything here
          },
          oncleanup: () => {
            Janus.log(' ::: Got a cleanup notification: we are unpublished now :::')
            mystream = null
            // Add a publish button to trigger --> this.publishOwnFeed(true)
          },
        })
      },
      error: error => {
        Janus.error(error)
      },
      destroyed: () => {
        console.log('destroyed')
      },
    })
  }

  attachLocalStreamToVideoEl(stream) {
    // Set this globallly so that any messages can access it
    mystream = stream

    // Get this element as a native ref
    const videoElement = this.localVideoRef

    // So no echo (because it's us)
    videoElement.muted = 'muted'

    // Atthac the MediaStram to the video
    Janus.attachMediaStream(videoElement, stream)
  }

  componentWillUnmount() {
    janus = null
  }

  componentDidMount() {
    Janus.init({
      debug: 'all',
      callback: () => console.log('All good'),
    })
  }

  toggleScreenSharing() {
    if (this.state.screenSharing) {
      this.stopCapture()
    } else {
      this.startCapture()
    }
  }

  stopCapture() {
    // screenstream = nulls
    // Cleanup
    // let tracks = this.videoElement.srcObject.getTracks()
    //tracks.forEach(track => track.stop())

    // Reconnect
    // Tell janus we're sharing
    this.setState({ screenSharing: false }, () => {
      // First unpublish & then publish
      sfu.hangup()

      // publishOwnFeed will now use our feed
      this.publishOwnFeed(true, true)
    })
  }

  async startCapture() {
    try {
      // Set up our screen
      // Save this globally
      /* screenstream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      }) */

      // Tell janus we're sharing
      this.setState({ screenSharing: true }, () => {
        // First unpublish & then publish
        sfu.hangup()

        // publishOwnFeed will now use our feed
        this.publishOwnFeed(true, true)
      })
    } catch (err) {
      this.setState({
        error: 'Error starting screensharing',
        screenSharing: false,
      })
    }
  }

  // Placeholder - we do nohting with this so far
  checkIfRoomExistsFirst(roomId) {
    sfu.send({
      message: {
        request: 'exists',
        room: roomId,
      },
      success: ({ videoroom, room, exists, error_code, error }) => {
        if (error) return this.setState({ error })
        if (exists) {
        } else {
        }
      },
    })
  }

  async handleChannelJoinCall(topic, room) {
    // Do nothing
  }

  async handleChannelCreateCall(topic) {
    this.setState({
      error: null,
      notification: null,
    })

    try {
      const { data } = await GraphqlService.getInstance().createChannelCall(this.props.channel.id, topic)
      const call = data.createChannelCall
      const calls = [...this.props.channel.calls, call]
      const { roomId } = call

      console.log(call)

      // Update this channel's call list so is accessible
      this.props.updateChannel(this.props.channel.id, { calls })

      // 1. Update our state with the call's details
      // 2. And create the room on Janus
      // ------------------------------------------
      // 1.
      this.setState(
        {
          topic,
          roomId,
        },
        () => {
          // 2.
          sfu.send({
            message: {
              request: 'create',
              description: topic,
              record: false,
              room: roomId,
              ptype: 'publisher',
              is_private: false,
              secret: '',
              permanent: true,
            },
            success: ({ videoroom, room, permanent, error_code, error }) => {
              // console.log(videoroom, room, permanent, error_code, error)
              if (error) return this.setState({ error })

              this.setState({ view: '' })
            },
          })
        }
      )
    } catch (e) {
      this.setState({ error: 'Error creating call from API' })
    }
  }

  async handleChannelDeleteCall(roomId) {
    this.setState({
      error: null,
      notification: null,
    })

    try {
      const { data } = await GraphqlService.getInstance().deleteChannelCall(this.props.channel.id, roomId)
      const call = data.deleteChannelCall

      if (!call) return this.setState({ error: 'Error deleting call from API' })

      // Remove this call from the call array
      const calls = this.props.channel.calls.filter(call => call.roomId != roomId)

      // Remove this call from the channel
      this.props.updateChannel(this.props.channel.id, { calls })

      // Reset the UI
      this.setState(
        {
          view: '',
          topic: '',
        },
        () => {
          // Destroy the Janus room
          sfu.send({
            message: {
              request: 'destroy',
              room: roomId,
              permanent: true,
              secret: '',
            },
            success: ({ videoroom, room, permanent, error_code, error }) => {
              // console.log(videoroom, room, permanent, error_code, error)
              if (error) return this.setState({ error })

              this.setState({ notification: 'Successfully deleted' })
            },
          })
        }
      )
    } catch (e) {
      console.log('>>', e)
      this.setState({ error: 'Error deleting call from API' })
    }
  }

  renderCallList() {
    if (this.state.view != '') return null

    return (
      <React.Fragment>
        <div className="header">
          <div className="title">Rooms</div>
          <div className="flexer"></div>
          <Button text="Create" theme="muted" className="mr-25" onClick={() => this.setState({ view: 'start' })} />
        </div>

        {this.props.channel.calls.map((call, index) => {
          return (
            <div className="call" key={index}>
              <div className="column flexer">
                <div className="topic">{call.topic}</div>
                <div className="date">
                  Started {moment(call.createdAt).fromNow()} - #{call.roomId}
                </div>
              </div>
              <Button
                theme="muted"
                text="Join"
                className="mr-10"
                size="small"
                onClick={() => {
                  this.setState(
                    {
                      topic: call.topic,
                      roomId: call.roomId,
                      error: null,
                      notification: null,
                    },
                    () => {
                      this.initJanusVideoRoom(call.roomId)
                    }
                  )
                }}
              />
              <Button theme="red" text="Remove" size="small" onClick={() => this.handleChannelDeleteCall(call.roomId)} />
            </div>
          )
        })}

        {this.props.channel.calls.length == 0 && (
          <div className="list">
            <img src="icon-muted.svg" height="200" className="mb-20" />
            <div className="pb-30 color-d0 h5">There are no calls</div>
            <Button text="Start one now" size="large" theme="muted" onClick={() => this.setState({ view: 'start' })} />
          </div>
        )}
      </React.Fragment>
    )
  }

  renderStartCall() {
    if (this.state.view != 'start') return null

    return (
      <React.Fragment>
        <div className="header">
          <Button text="Go back" theme="muted" className="ml-25" onClick={() => this.setState({ view: '' })} icon={<IconComponent icon="chevron-left" color="#617691" thickness={2} size={16} />} />
          <div className="flexer"></div>
        </div>

        <div className="join-start">
          <img src="icon-muted.svg" height="200" className="mb-20" />
          <div className="pb-30 color-d0 h5">Create a new call</div>
          <div className="row w-100 pl-30 pr-30 pt-10 pb-10">
            <Input placeholder="Enter call topic" inputSize="large" value={this.state.topic} onChange={e => this.setState({ topic: e.target.value })} className="mb-20" />
          </div>
          <Button text="Create now" size="large" theme="muted" onClick={() => this.handleChannelCreateCall(this.state.topic)} />
        </div>
      </React.Fragment>
    )
  }

  renderCall() {
    if (this.state.view != 'call') return null

    return (
      <React.Fragment>
        {this.state.participantFocus && <div className="flexer" />}

        <div className="participants">
          <div className="scroll-container">
            <div className="inner-content">
              {/* The first one is always us */}
              <div
                className={this.state.participantFocus && this.state.participantToFocus == -1 ? 'participant focus' : 'participant'}
                onClick={() => this.setState({ participantFocus: !this.state.participantFocus, participantToFocus: -1 })}
              >
                <div className="name">
                  <div className="text">{this.props.user.name}</div>
                </div>

                {this.state.participantFocus && this.state.participantToFocus == -1 && (
                  <div className="close-main-screen button" onClick={() => this.setState({ participantFocus: false })}>
                    <IconComponent icon="x" color="white" thickness={2} size={20} />
                  </div>
                )}

                {!this.state.viewable && (
                  <div className="not-viewable">
                    <IconComponent icon="video-off" color="#11161c" thickness={2} size={20} />
                  </div>
                )}

                {/* local video stream */}
                <video
                  ref={ref => (this.localVideoRef = ref)}
                  width="100%"
                  height="100%"
                  autoPlay
                  muted="muted"
                  poster={this.props.user.image}
                  onChange={e => {
                    console.log(e)
                  }}
                />
              </div>

              {/* the rest of them - iterate over them */}
              {this.state.participants.map((remoteParticipant, index) => {
                let userFullName = 'NA'
                let userAvatar = null

                // These get passed everytime they join
                // We decode the base64 values
                if (remoteParticipant.rfdisplay) {
                  const normalString = atob(remoteParticipant.rfdisplay)
                  const displayNameParts = normalString.split('|')

                  userFullName = displayNameParts[0]
                  userAvatar = displayNameParts[1]
                }

                return (
                  <div
                    className={this.state.participantFocus && this.state.participantToFocus == index ? 'participant focus' : 'participant'}
                    onClick={() => this.setState({ participantFocus: !this.state.participantFocus, participantToFocus: index })}
                    key={index}
                  >
                    <div className="name">
                      <div className="text">{userFullName}</div>
                    </div>

                    {this.state.participantFocus && this.state.participantToFocus == index && (
                      <div className="close-main-screen button" onClick={() => this.setState({ participantFocus: false })}>
                        <IconComponent icon="x" color="white" thickness={2} size={20} />
                      </div>
                    )}

                    {/* remote participant video stream */}
                    {remoteParticipant.stream && <Video stream={remoteParticipant.stream} viewable={remoteParticipant.viewable} poster={userAvatar} />}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div className="controls">
          {/* toggle video media publishing */}
          <Tooltip text="Toggle video feed" direction="top">
            <div className="control-button" onClick={() => this.publish(!this.state.published)}>
              <IconComponent icon={this.state.published ? 'video' : 'video-off'} color="#343a40" thickness={1.75} size={20} />
            </div>
          </Tooltip>

          {/* toggle audio media publishing */}
          <Tooltip text="Toggle muting" direction="top">
            <div className="control-button" onClick={() => this.mute(!this.state.muted)}>
              <IconComponent icon={this.state.muted ? 'mic-off' : 'mic'} color="#343a40" thickness={1.75} size={20} />
            </div>
          </Tooltip>

          {/* share to channel */}
          <div className="control-button" onClick={() => this.toggleScreenSharing()}>
            {this.state.screenSharing ? 'Stop sharing' : 'Share screen'}
          </div>

          {/* share screen */}
          <div className="control-button" onClick={() => this.shareToChannel()}>
            Share to channel
          </div>
        </div>
      </React.Fragment>
    )
  }

  render() {
    return (
      <div className={`video-extension ${this.state.participantFocus ? '' : 'all'}`}>
        {this.state.error && <Error message={this.state.error} onDismiss={() => this.setState({ error: null })} />}
        {this.state.loading && <Spinner />}
        {this.state.notification && <Notification text={this.state.notification} onDismiss={() => this.setState({ notification: null })} />}
        {this.state.view == 'call' && (
          <div className="header">
            <div className="subtitle">Call</div>
            <div className="title">{this.state.topic}</div>
            <div className="flexer"></div>
            <Tooltip text="End call" direction="left">
              <div className="control-button red" onClick={() => this.exitCall()}>
                <IconComponent icon="x" color="white" thickness={1.75} size={20} />
              </div>
            </Tooltip>
          </div>
        )}

        {this.renderCallList()}
        {this.renderStartCall()}
        <div className="flexer column w-100">{this.renderCall()}</div>
      </div>
    )
  }
}

VideoExtension.propTypes = {
  user: PropTypes.any,
  team: PropTypes.any,
  channel: PropTypes.any,
  createChannelMessage: PropTypes.func,
  updateChannel: PropTypes.func,
}

const mapDispatchToProps = {
  updateChannel: (channelId, channel) => updateChannel(channelId, channel),
  createChannelMessage: (channelId, channelMessage) => createChannelMessage(channelId, channelMessage),
}

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
)(VideoExtension)

/* 

  These are the simulcast s from the Janus videoroom example
  They still need to be refactored & integrated into the React codebase
  Keeping them here for the meantime

   addSimulcastButtons(feed, temporal) {
    var index = feed
    $('#remote' + index)
      .parent()
      .append(  
        '<div id="simulcast' +
          index +
          '" class="btn-group-vertical btn-group-vertical-xs pull-right">' +
          '	<div class"row">' +
          '		<div class="btn-group btn-group-xs" style="width: 100%">' +
          '			<button id="sl' +
          index +
          '-2" type="button" class="btn btn-primary" data-toggle="tooltip" title="Switch to higher quality" style="width: 33%">SL 2</button>' +
          '			<button id="sl' +
          index +
          '-1" type="button" class="btn btn-primary" data-toggle="tooltip" title="Switch to normal quality" style="width: 33%">SL 1</button>' +
          '			<button id="sl' +
          index +
          '-0" type="button" class="btn btn-primary" data-toggle="tooltip" title="Switch to lower quality" style="width: 34%">SL 0</button>' +
          '		</div>' +
          '	</div>' +
          '	<div class"row">' +
          '		<div class="btn-group btn-group-xs hide" style="width: 100%">' +
          '			<button id="tl' +
          index +
          '-2" type="button" class="btn btn-primary" data-toggle="tooltip" title="Cap to temporal layer 2" style="width: 34%">TL 2</button>' +
          '			<button id="tl' +
          index +
          '-1" type="button" class="btn btn-primary" data-toggle="tooltip" title="Cap to temporal layer 1" style="width: 33%">TL 1</button>' +
          '			<button id="tl' +
          index +
          '-0" type="button" class="btn btn-primary" data-toggle="tooltip" title="Cap to temporal layer 0" style="width: 33%">TL 0</button>' +
          '		</div>' +
          '	</div>' +
          '</div>'
      )
    // Enable the simulcast selection buttons
    $('#sl' + index + '-0')
      .removeClass('btn-primary btn-success')
      .addClass('btn-primary')
      .unbind('click')
      .click(() {
        console.info('Switching simulcast substream, wait for it... (lower quality)', null, { timeOut: 2000 })
        if (!$('#sl' + index + '-2').hasClass('btn-success'))
          $('#sl' + index + '-2')
            .removeClass('btn-primary btn-info')
            .addClass('btn-primary')
        if (!$('#sl' + index + '-1').hasClass('btn-success'))
          $('#sl' + index + '-1')
            .removeClass('btn-primary btn-info')
            .addClass('btn-primary')
        $('#sl' + index + '-0')
          .removeClass('btn-primary btn-info btn-success')
          .addClass('btn-info')
        feeds[index].send({ message: { request: 'configure', substream: 0 } })
      })
    $('#sl' + index + '-1')
      .removeClass('btn-primary btn-success')
      .addClass('btn-primary')
      .unbind('click')
      .click(() {
        console.info('Switching simulcast substream, wait for it... (normal quality)', null, { timeOut: 2000 })
        if (!$('#sl' + index + '-2').hasClass('btn-success'))
          $('#sl' + index + '-2')
            .removeClass('btn-primary btn-info')
            .addClass('btn-primary')
        $('#sl' + index + '-1')
          .removeClass('btn-primary btn-info btn-success')
          .addClass('btn-info')
        if (!$('#sl' + index + '-0').hasClass('btn-success'))
          $('#sl' + index + '-0')
            .removeClass('btn-primary btn-info')
            .addClass('btn-primary')
        feeds[index].send({ message: { request: 'configure', substream: 1 } })
      })
    $('#sl' + index + '-2')
      .removeClass('btn-primary btn-success')
      .addClass('btn-primary')
      .unbind('click')
      .click(() {
        console.info('Switching simulcast substream, wait for it... (higher quality)', null, { timeOut: 2000 })
        $('#sl' + index + '-2')
          .removeClass('btn-primary btn-info btn-success')
          .addClass('btn-info')
        if (!$('#sl' + index + '-1').hasClass('btn-success'))
          $('#sl' + index + '-1')
            .removeClass('btn-primary btn-info')
            .addClass('btn-primary')
        if (!$('#sl' + index + '-0').hasClass('btn-success'))
          $('#sl' + index + '-0')
            .removeClass('btn-primary btn-info')
            .addClass('btn-primary')
        feeds[index].send({ message: { request: 'configure', substream: 2 } })
      })
    if (!temporal)
      // No temporal layer support
      return
    $('#tl' + index + '-0')
      .parent()
      .removeClass('hide')
    $('#tl' + index + '-0')
      .removeClass('btn-primary btn-success')
      .addClass('btn-primary')
      .unbind('click')
      .click(() {
        console.info('Capping simulcast temporal layer, wait for it... (lowest FPS)', null, { timeOut: 2000 })
        if (!$('#tl' + index + '-2').hasClass('btn-success'))
          $('#tl' + index + '-2')
            .removeClass('btn-primary btn-info')
            .addClass('btn-primary')
        if (!$('#tl' + index + '-1').hasClass('btn-success'))
          $('#tl' + index + '-1')
            .removeClass('btn-primary btn-info')
            .addClass('btn-primary')
        $('#tl' + index + '-0')
          .removeClass('btn-primary btn-info btn-success')
          .addClass('btn-info')
        feeds[index].send({ message: { request: 'configure', temporal: 0 } })
      })
    $('#tl' + index + '-1')
      .removeClass('btn-primary btn-success')
      .addClass('btn-primary')
      .unbind('click')
      .click(() {
        console.info('Capping simulcast temporal layer, wait for it... (medium FPS)', null, { timeOut: 2000 })
        if (!$('#tl' + index + '-2').hasClass('btn-success'))
          $('#tl' + index + '-2')
            .removeClass('btn-primary btn-info')
            .addClass('btn-primary')
        $('#tl' + index + '-1')
          .removeClass('btn-primary btn-info')
          .addClass('btn-info')
        if (!$('#tl' + index + '-0').hasClass('btn-success'))
          $('#tl' + index + '-0')
            .removeClass('btn-primary btn-info')
            .addClass('btn-primary')
        feeds[index].send({ message: { request: 'configure', temporal: 1 } })
      })
    $('#tl' + index + '-2')
      .removeClass('btn-primary btn-success')
      .addClass('btn-primary')
      .unbind('click')
      .click(() {
        console.info('Capping simulcast temporal layer, wait for it... (highest FPS)', null, { timeOut: 2000 })
        $('#tl' + index + '-2')
          .removeClass('btn-primary btn-info btn-success')
          .addClass('btn-info')
        if (!$('#tl' + index + '-1').hasClass('btn-success'))
          $('#tl' + index + '-1')
            .removeClass('btn-primary btn-info')
            .addClass('btn-primary')
        if (!$('#tl' + index + '-0').hasClass('btn-success'))
          $('#tl' + index + '-0')
            .removeClass('btn-primary btn-info')
            .addClass('btn-primary')
        feeds[index].send({ message: { request: 'configure', temporal: 2 } })
      })
  }

   updateSimulcastButtons(feed, substream, temporal) {
    // Check the substream
    var index = feed
    if (substream === 0) {
      console.success('Switched simulcast substream! (lower quality)', null, { timeOut: 2000 })
      $('#sl' + index + '-2')
        .removeClass('btn-primary btn-success')
        .addClass('btn-primary')
      $('#sl' + index + '-1')
        .removeClass('btn-primary btn-success')
        .addClass('btn-primary')
      $('#sl' + index + '-0')
        .removeClass('btn-primary btn-info btn-success')
        .addClass('btn-success')
    } else if (substream === 1) {
      console.success('Switched simulcast substream! (normal quality)', null, { timeOut: 2000 })
      $('#sl' + index + '-2')
        .removeClass('btn-primary btn-success')
        .addClass('btn-primary')
      $('#sl' + index + '-1')
        .removeClass('btn-primary btn-info btn-success')
        .addClass('btn-success')
      $('#sl' + index + '-0')
        .removeClass('btn-primary btn-success')
        .addClass('btn-primary')
    } else if (substream === 2) {
      console.success('Switched simulcast substream! (higher quality)', null, { timeOut: 2000 })
      $('#sl' + index + '-2')
        .removeClass('btn-primary btn-info btn-success')
        .addClass('btn-success')
      $('#sl' + index + '-1')
        .removeClass('btn-primary btn-success')
        .addClass('btn-primary')
      $('#sl' + index + '-0')
        .removeClass('btn-primary btn-success')
        .addClass('btn-primary')
    }
    // Check the temporal layer
    if (temporal === 0) {
      console.success('Capped simulcast temporal layer! (lowest FPS)', null, { timeOut: 2000 })
      $('#tl' + index + '-2')
        .removeClass('btn-primary btn-success')
        .addClass('btn-primary')
      $('#tl' + index + '-1')
        .removeClass('btn-primary btn-success')
        .addClass('btn-primary')
      $('#tl' + index + '-0')
        .removeClass('btn-primary btn-info btn-success')
        .addClass('btn-success')
    } else if (temporal === 1) {
      console.success('Capped simulcast temporal layer! (medium FPS)', null, { timeOut: 2000 })
      $('#tl' + index + '-2')
        .removeClass('btn-primary btn-success')
        .addClass('btn-primary')
      $('#tl' + index + '-1')
        .removeClass('btn-primary btn-info btn-success')
        .addClass('btn-success')
      $('#tl' + index + '-0')
        .removeClass('btn-primary btn-success')
        .addClass('btn-primary')
    } else if (temporal === 2) {
      console.success('Capped simulcast temporal layer! (highest FPS)', null, { timeOut: 2000 })
      $('#tl' + index + '-2')
        .removeClass('btn-primary btn-info btn-success')
        .addClass('btn-success')
      $('#tl' + index + '-1')
        .removeClass('btn-primary btn-success')
        .addClass('btn-primary')
      $('#tl' + index + '-0')
        .removeClass('btn-primary btn-success')
        .addClass('btn-primary')
    }
  }
 */
