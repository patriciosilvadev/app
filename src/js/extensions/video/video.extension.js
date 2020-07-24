import React, { useState, useEffect, useRef } from 'react'
import { useSelector, useDispatch, ReactReduxContext } from 'react-redux'
import './video.extension.css'
import { Avatar, Tooltip, Button, Input, Spinner, Error, Notification } from '@weekday/elements'
import { IconComponent } from '../../components/icon.component'
import '../../../assets/downgrade.png'
import { Janus } from './lib/janus'
import { getQueryStringValue, logger } from '../../helpers/util'
import GraphqlService from '../../services/graphql.service'
import { updateChannel } from '../../actions'
import adapter from 'webrtc-adapter'

const Video = ({ stream }) => {
  const videoRef = useRef(null)

  useEffect(() => {
    Janus.attachMediaStream(videoRef.current, stream)
  }, [stream])

  return <video ref={videoRef} width="100%" height="100%" autoPlay />
}

// Variables from the Janus videoroom example
var server = 'http://159.69.150.191:8088/janus'
var janus = null
var sfu = null
var room = 0
var opaqueId = 'videoroomtest-' + Janus.randomString(12)
var myid = null
var mystream = null
var feeds = []
var bitrateTimer = []
var doSimulcast = getQueryStringValue('simulcast') === 'yes' || getQueryStringValue('simulcast') === 'true'
var doSimulcast2 = getQueryStringValue('simulcast2') === 'yes' || getQueryStringValue('simulcast2') === 'true'
var mypvtid = null // We use this other ID just to map our subscriptions to us

/* 

  These are the simulcast functions from the Janus videoroom example
  They still need to be refactored & integrated into the React codebase
  Keeping them here for the meantime

  function addSimulcastButtons(feed, temporal) {
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
      .click(function() {
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
      .click(function() {
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
      .click(function() {
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
      .click(function() {
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
      .click(function() {
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
      .click(function() {
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

  function updateSimulcastButtons(feed, substream, temporal) {
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

class VideoExtension extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      participantFocus: false,
      topic: '',
      participants: [],
      error: null,
      notification: null,
      loading: false,
      view: '',
      muted: false,
      published: false,
      remoteParticipants: [],
    }

    this.localVideoRef = React.createRef()

    this.handleUpdateChannelTopic = this.handleUpdateChannelTopic.bind(this)
    this.stopCall = this.stopCall.bind(this)
    this.startCall = this.startCall.bind(this)
    this.mute = this.mute.bind(this)
    this.publish = this.publish.bind(this)
    this.registerUsername = this.registerUsername.bind(this)
    this.destroyCall = this.destroyCall.bind(this)
    this.publishOwnFeed = this.publishOwnFeed.bind(this)
    this.unpublishOwnFeed = this.unpublishOwnFeed.bind(this)
    this.toggleMute = this.toggleMute.bind(this)
    this.newRemoteFeed = this.newRemoteFeed.bind(this)
    this.initJanusVideoRoom = this.initJanusVideoRoom.bind(this)
    this.renderCall = this.renderCall.bind(this)
    this.renderJoinCall = this.renderJoinCall.bind(this)
    this.renderStartCall = this.renderStartCallv
  }

  handleUpdateChannelTopic = async () => {
    this.setState({ error: null })

    try {
      await GraphqlService.getInstance().updateChannel(channel.id, { topic })

      this.props.updateChannel(channel.id, { topic })
    } catch (e) {
      this.setState({ error: 'Error updating channel topic' })
    }
  }

  stopCall = () => {
    janus.destroy()
  }

  startCall = () => {
    sfu.send({
      message: {
        request: 'create',
        description: topic,
        record: false,
        room: room,
        ptype: 'publisher',
        is_private: false,
        secret: '',
      },
      success: ({ videoroom, room, permanent, error_code, error }) => {
        if (error) return this.setState({ error })

        this.handleUpdateChannelTopic()
        this.registerUsername()
      },
    })
  }

  mute = on => {
    console.log('setting mute to ', on)
    this.setState({ mute: on })
    this.toggleMute()
  }

  publish = on => {
    this.setState({ published: on })

    if (on) {
      this.publishOwnFeed(true)
    } else {
      this.unpublishOwnFeed()
    }
  }

  registerUsername = () => {
    sfu.send({
      message: {
        request: 'join',
        room: room,
        ptype: 'publisher',
        display: user.name,
      },
    })
  }

  destroyCall = () => {
    sfu.send({
      message: {
        request: 'destroy',
        room,
        //"secret" : "<room secret, mandatory if configured>",
        //"permanent" : <true|false, whether the room should be also removed from the config file, default=false>
      },
      success: ({ videoroom, room, permanent, error_code, error }) => {
        console.log(videoroom, room, permanent, error_code, error)
      },
    })
  }

  publishOwnFeed = useAudio => {
    sfu.createOffer({
      // Add data:true here if you want to publish datachannels as well
      media: { audioRecv: false, videoRecv: false, audioSend: useAudio, videoSend: true }, // Publishers are sendonly
      // If you want to test simulcasting (Chrome and Firefox only), then
      // pass a ?simulcast=true when opening this demo page: it will turn
      // the following 'simulcast' property to pass to janus.js to true
      simulcast: doSimulcast,
      simulcast2: doSimulcast2,
      success: function(jsep) {
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
      error: function(error) {
        Janus.error('WebRTC error:', error)

        if (useAudio) {
          this.publishOwnFeed(false)
        } else {
          console.log('WebRTC error... ' + error.message)
          // Reshow this button:
          // this.publishOwnFeed(true)
        }
      },
    })
  }

  unpublishOwnFeed = () => {
    var unpublish = { request: 'unpublish' }
    sfu.send({ message: unpublish })
  }

  toggleMute = () => {
    var muted = sfu.isAudioMuted()
    Janus.log((muted ? 'Unmuting' : 'Muting') + ' local stream...')
    if (muted) sfu.unmuteAudio()
    else sfu.muteAudio()
    muted = sfu.isAudioMuted()
  }

  newRemoteFeed = (id, display, audio, video) => {
    var remoteFeed = null

    janus.attach({
      plugin: 'janus.plugin.videoroom',
      opaqueId: opaqueId,
      success: function(pluginHandle) {
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
      error: function(error) {
        Janus.error('  -- Error attaching plugin...', error)
        console.log('Error attaching plugin... ' + error)
        this.setState({ error: 'Error getting remote feed' })
      },
      onmessage: function(msg, jsep) {
        Janus.debug(' ::: Got a message (subscriber) :::', msg, msg['videoroom'])

        var event = msg['videoroom']

        if (msg['error']) {
          console.log('newRemoteFeed', msg['error'])
        } else if (event) {
          if (event === 'attached') {
            // Subscriber created and attached
            for (var i = 1; i < 6; i++) {
              if (!feeds[i]) {
                feeds[i] = remoteFeed
                remoteFeed.rfindex = i
                break
              }
            }
            remoteFeed.rfid = msg['id']
            remoteFeed.rfdisplay = msg['display']
            // Not sure what the spinner here is?
            if (!remoteFeed.spinner) {
              // Target is the video element ref for the remote feed that we create
              // var target = document.getElementById('videoremote' + remoteFeed.rfindex)
              // remoteFeed.spinner = new Spinner({ top: 100 }).spin(target)
            } else {
              remoteFeed.spinner.spin()
            }
            Janus.log('Successfully attached to feed ' + remoteFeed.rfid + ' (' + remoteFeed.rfdisplay + ') in room ' + msg['room'])
            // remoteFeed.rfdisplay <- is HTML
            // $('#remote' + remoteFeed.rfindex).removeClass('hide').html(remoteFeed.rfdisplay).show()
            console.log('remoteParticipant: ', remoteFeed, remoteParticipants)

            this.setState({ remoteParticipants: [...remoteParticipants, remoteFeed] })
          } else if (event === 'event') {
            // Check if we got an event on a simulcast-related event from this publisher
            var substream = msg['substream']
            var temporal = msg['temporal']
            if ((substream !== null && substream !== undefined) || (temporal !== null && temporal !== undefined)) {
              if (!remoteFeed.simulcastStarted) {
                remoteFeed.simulcastStarted = true
                // Add some new buttons
                addSimulcastButtons(remoteFeed.rfindex, remoteFeed.videoCodec === 'vp8' || remoteFeed.videoCodec === 'h264')
              }
              // We just received notice that there's been a switch, update the buttons
              updateSimulcastButtons(remoteFeed.rfindex, substream, temporal)
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
            success: function(jsep) {
              Janus.debug('Got SDP!', jsep)
              var body = { request: 'start', room: room }
              remoteFeed.send({ message: body, jsep: jsep })
            },
            error: function(error) {
              Janus.error('WebRTC error:', error)
              console.log('WebRTC error... ' + error.message)
            },
          })
        }
      },
      iceState: function(state) {
        Janus.log('ICE state of this WebRTC PeerConnection (feed #' + remoteFeed.rfindex + ') changed to ' + state)
      },
      webrtcState: function(on) {
        Janus.log('Janus says this WebRTC PeerConnection (feed #' + remoteFeed.rfindex + ') is ' + (on ? 'up' : 'down') + ' now')
      },
      onlocalstream: function(stream) {
        // The subscriber stream is recvonly, we don't expect anything here
      },
      onremotestream: function(stream) {
        Janus.log('Remote feed #' + remoteFeed.rfindex + ', stream:', stream, remoteFeed)

        this.setState({
          remoteParticipants: this.state.remoteParticipants.map(remoteParticipant => {
            return remoteParticipant.rfindex == remoteFeed.rfindex ? { ...remoteFeed, stream } : remoteParticipant
          }),
        })

        //  ($('#remotevideo' + remoteFeed.rfindex).get(0), stream)

        // ⚠️ Add users name from "display name" when they joined the call
        /* var addButtons = false

        if ($('#remotevideo' + remoteFeed.rfindex).length === 0) {
          addButtons = true
          // No remote video yet
          $('#videoremote' + remoteFeed.rfindex).append('<video class="rounded centered" id="waitingvideo' + remoteFeed.rfindex + '" width=320 height=240 />')
          $('#videoremote' + remoteFeed.rfindex).append('<video class="rounded centered relative hide" id="remotevideo' + remoteFeed.rfindex + '" width="100%" height="100%" autoplay playsinline/>')
          $('#videoremote' + remoteFeed.rfindex).append(
            '<span class="label label-primary hide" id="curres' +
              remoteFeed.rfindex +
              '" style="position: absolute; bottom: 0px; left: 0px; margin: 15px;"></span>' +
              '<span class="label label-info hide" id="curbitrate' +
              remoteFeed.rfindex +
              '" style="position: absolute; bottom: 0px; right: 0px; margin: 15px;"></span>'
          )

          // Show the video, hide the spinner and show the resolution when we get a playing event
          $('#remotevideo' + remoteFeed.rfindex).bind('playing', function() {
            if (remoteFeed.spinner) remoteFeed.spinner.stop()
            remoteFeed.spinner = null
            $('#waitingvideo' + remoteFeed.rfindex).remove()
            if (this.videoWidth)
              $('#remotevideo' + remoteFeed.rfindex)
                .removeClass('hide')
                .show()
            var width = this.videoWidth
            var height = this.videoHeight
            $('#curres' + remoteFeed.rfindex)
              .removeClass('hide')
              .text(width + 'x' + height)
              .show()

            if (Janus.webRTCAdapter.browserDetails.browser === 'firefox') {
              // Firefox Stable has a bug: width and height are not immediately available after a playing
              setTimeout(function() {
                var width = $('#remotevideo' + remoteFeed.rfindex).get(0).videoWidth
                var height = $('#remotevideo' + remoteFeed.rfindex).get(0).videoHeight
                $('#curres' + remoteFeed.rfindex)
                  .removeClass('hide')
                  .text(width + 'x' + height)
                  .show()
              }, 2000)
            }
          })
        }

        Janus.attachMediaStream($('#remotevideo' + remoteFeed.rfindex).get(0), stream)

        var videoTracks = stream.getVideoTracks()

        if (!videoTracks || videoTracks.length === 0) {
          // No remote video
          $('#remotevideo' + remoteFeed.rfindex).hide()
          if ($('#videoremote' + remoteFeed.rfindex + ' .no-video-container').length === 0) {
            $('#videoremote' + remoteFeed.rfindex).append(
              '<div class="no-video-container">' + '<i class="fa fa-video-camera fa-5 no-video-icon"></i>' + '<span class="no-video-text">No remote video available</span>' + '</div>'
            )
          }
        } else {
          $('#videoremote' + remoteFeed.rfindex + ' .no-video-container').remove()
          $('#remotevideo' + remoteFeed.rfindex)
            .removeClass('hide')
            .show()
        }

        if (!addButtons) return

        if (Janus.webRTCAdapter.browserDetails.browser === 'chrome' || Janus.webRTCAdapter.browserDetails.browser === 'firefox' || Janus.webRTCAdapter.browserDetails.browser === 'safari') {
          $('#curbitrate' + remoteFeed.rfindex)
            .removeClass('hide')
            .show()
          bitrateTimer[remoteFeed.rfindex] = setInterval(function() {
            // Display updated bitrate, if supported
            var bitrate = remoteFeed.getBitrate()
            $('#curbitrate' + remoteFeed.rfindex).text(bitrate)
            // Check if the resolution changed too
            var width = $('#remotevideo' + remoteFeed.rfindex).get(0).videoWidth
            var height = $('#remotevideo' + remoteFeed.rfindex).get(0).videoHeight
            if (width > 0 && height > 0)
              $('#curres' + remoteFeed.rfindex)
                .removeClass('hide')
                .text(width + 'x' + height)
                .show()
          }, 1000)
        } */
      },
      oncleanup: function() {
        Janus.log(' ::: Got a cleanup notification (remote feed ' + id + ') :::')
        /* if (remoteFeed.spinner) remoteFeed.spinner.stop()
        remoteFeed.spinner = null
        $('#remotevideo' + remoteFeed.rfindex).remove()
        $('#waitingvideo' + remoteFeed.rfindex).remove()
        $('#novideo' + remoteFeed.rfindex).remove()
        $('#curbitrate' + remoteFeed.rfindex).remove()
        $('#curres' + remoteFeed.rfindex).remove()
        if (bitrateTimer[remoteFeed.rfindex]) clearInterval(bitrateTimer[remoteFeed.rfindex])
        bitrateTimer[remoteFeed.rfindex] = null
        remoteFeed.simulcastStarted = false
        $('#simulcast' + remoteFeed.rfindex).remove() */
      },
    })
  }

  initJanusVideoRoom = roomId => {
    if (!Janus.isWebrtcSupported()) return alert('No WebRTC support... ')

    // Save our ID
    room = roomId

    // Create session
    janus = new Janus({
      server: server,
      success: function() {
        // Attach to VideoRoom plugin
        janus.attach({
          plugin: 'janus.plugin.videoroom',
          opaqueId: opaqueId,
          success: function(pluginHandle) {
            sfu = pluginHandle

            // Logging
            Janus.log('Plugin attached! (' + sfu.getPlugin() + ', id=' + sfu.getId() + ')')
            Janus.log('This is a publisher/manager')

            sfu.send({
              message: {
                request: 'list',
              },
              success: res => {
                console.log('All rooms: ', res)
              },
            })

            // Check if the room exists
            sfu.send({
              message: {
                request: 'exists',
                room: room,
              },
              success: ({ videoroom, room, exists, error_code, error }) => {
                if (error) return this.setState({ error })
                if (exists) {
                  // Check for participants
                  sfu.send({
                    message: {
                      request: 'listparticipants',
                      room: room,
                    },
                    success: res => {
                      if (res.error) return this.setState({ error })

                      console.log('Participants: ', res.participants)

                      this.setState({
                        participants: res.participants,
                        topic: this.props.channel.topic,
                        view: 'join',
                      })
                    },
                  })
                } else {
                  this.setState({ view: 'start' })
                }
              },
            })
          },
          error: function(error) {
            this.setState({ error })
            Janus.error('  -- Error attaching plugin...', error)
          },
          consentDialog: function(on) {
            Janus.debug('Consent dialog should be ' + (on ? 'on' : 'off') + ' now')
            // Check consent has been given
            // console.log(!!navigator.mozGetUserMedia)
          },
          iceState: function(state) {
            Janus.log('ICE state changed to ' + state)
          },
          mediaState: function(medium, on) {
            Janus.log('Janus ' + (on ? 'started' : 'stopped') + ' receiving our ' + medium)
          },
          webrtcState: function(on) {
            Janus.log('Janus says our WebRTC PeerConnection is ' + (on ? 'up' : 'down') + ' now')

            // Show DIV
            // $('#videolocal') (unhide) <- this is a div
            if (!on) return

            // This controls allows us to override the global room bitrate cap
            // 0 == unlimited
            // var bitrate = 0 / 128 / 256 / 1014 / 1500 / 2000
            sfu.send({ message: { request: 'configure', bitrate: 1014 } })
          },
          onmessage: function(msg, jsep) {
            Janus.debug(' ::: Got a message (publisher) :::', msg, msg['videoroom'])

            var event = msg['videoroom']

            if (event) {
              if (event === 'joined') {
                // Publisher/manager created, negotiate WebRTC and attach to existing feeds, if any
                myid = msg['id']
                mypvtid = msg['private_id']

                Janus.log('Successfully joined room ' + msg['room'] + ' with ID ' + myid)

                this.publishOwnFeed(true)
                this.setState({ view: 'call' })

                // Any new feed to attach to?
                if (msg['publishers']) {
                  var list = msg['publishers']

                  Janus.debug('Got a list of available publishers/feeds:', list)

                  for (var f in list) {
                    var id = list[f]['id']
                    var display = list[f]['display']
                    var audio = list[f]['audio_codec']
                    var video = list[f]['video_codec']

                    Janus.debug('  >> [' + id + '] ' + display + ' (audio: ' + audio + ', video: ' + video + ')')

                    // Create a new remote feed
                    // ⚠️ this fires even for our local feed
                    this.newRemoteFeed(id, display, audio, video)
                  }
                }
              } else if (event === 'destroyed') {
                // The room has been destroyed
                Janus.warn('The room has been destroyed!')
                console.log('The room has been destroyed')
              } else if (event === 'event') {
                // Any new feed to attach to?
                if (msg['publishers']) {
                  var list = msg['publishers']

                  Janus.debug('Got a list of available publishers/feeds:', list)

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
                  var leaving = msg['leaving']
                  Janus.log('Publisher left: ' + leaving)
                  var remoteFeed = null
                  for (var i = 1; i < 6; i++) {
                    if (feeds[i] && feeds[i].rfid == leaving) {
                      remoteFeed = feeds[i]
                      break
                    }
                  }
                  if (remoteFeed != null) {
                    Janus.debug('Feed ' + remoteFeed.rfid + ' (' + remoteFeed.rfdisplay + ') has left the room, detaching')
                    $('#remote' + remoteFeed.rfindex)
                      .empty()
                      .hide()
                    $('#videoremote' + remoteFeed.rfindex).empty()
                    feeds[remoteFeed.rfindex] = null
                    remoteFeed.detach()
                  }
                } else if (msg['unpublished']) {
                  // One of the publishers has unpublished?
                  var unpublished = msg['unpublished']
                  Janus.log('Publisher left: ' + unpublished)
                  if (unpublished === 'ok') {
                    // That's us
                    sfu.hangup()
                    return
                  }
                  var remoteFeed = null
                  for (var i = 1; i < 6; i++) {
                    if (feeds[i] && feeds[i].rfid == unpublished) {
                      remoteFeed = feeds[i]
                      break
                    }
                  }
                  if (remoteFeed != null) {
                    Janus.debug('Feed ' + remoteFeed.rfid + ' (' + remoteFeed.rfdisplay + ') has left the room, detaching')
                    $('#remote' + remoteFeed.rfindex)
                      .empty()
                      .hide()
                    $('#videoremote' + remoteFeed.rfindex).empty()
                    feeds[remoteFeed.rfindex] = null
                    remoteFeed.detach()
                  }
                } else if (msg['error']) {
                  if (msg['error_code'] === 426) {
                    // This is a "no such room" error: give a more meaningful description
                    console.log(
                      '<p>Apparently room <code>' +
                        room +
                        '</code> (the one this demo uses as a test room) ' +
                        'does not exist...</p><p>Do you have an updated <code>janus.plugin.videoroom.jcfg</code> ' +
                        'configuration file? If not, make sure you copy the details of room <code>' +
                        room +
                        '</code> ' +
                        'from that sample in your current configuration file, then restart Janus and try again.'
                    )
                  } else {
                    console.log(msg['error'])
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
          onlocalstream: function(stream) {
            Janus.debug(' ::: Got a local stream :::', stream)

            // Set this global
            mystream = stream

            // Get this element as a native ref
            const videoElement = localVideoRef.current

            // So no echo (because it's us)
            videoElement.muted = 'muted'

            // Atthac the MediaStram to the video
            Janus.attachMediaStream(videoElement, stream)

            if (sfu.webrtcStuff.pc.iceConnectionState !== 'completed' && sfu.webrtcStuff.pc.iceConnectionState !== 'connected') {
              // Show an indicator/notice for the user to say we're publishing
              // Do nothing here for now
              this.setState({ published: true })
            }

            // Get all the video trackcs from this device
            var videoTracks = stream.getVideoTracks()

            // Get our video tracks
            if (!videoTracks || videoTracks.length === 0) {
              // No webcam
              // Show something for the user for this
              this.setState({ error: 'No webcam!' })
            } else {
              // Show the video element above
              // localVideoRef.current - already showing
            }
          },
          onremotestream: function(stream) {
            // The publisher stream is sendonly, we don't expect anything here
          },
          oncleanup: function() {
            Janus.log(' ::: Got a cleanup notification: we are unpublished now :::')
            mystream = null
            // Add a publish button
            // this.publishOwnFeed(true)
          },
        })
      },
      error: function(error) {
        Janus.error(error)
      },
      destroyed: function() {
        console.log('destroyed')
      },
    })
  }

  componentDidMount() {
    console.log('Room ID (should be called only once): ', this.props.channel.roomId, this.props.channel.topic)

    // Once the room Id is set
    // We can start Janus
    Janus.init({
      debug: 'all',
      callback: () => {
        this.initJanusVideoRoom(channel.roomId)
      },
    })
  }

  renderJoinCall = () => {
    if (this.state.view != 'join') return null

    return (
      <React.Fragment>
        <img src="icon-muted.svg" height="200" />
        <div className="pt-20 mb-20 color-d0 h3">{this.props.channel.topic}</div>
        <div className="pb-30 color-d0 h5">
          There is currently a call with <strong>{this.state.participants.length}</strong> {this.state.participants.length == 1 ? 'participant' : 'participants'} going on.
        </div>
        <Button text="Join the call now" size="large" onClick={() => this.registerUsername()} />
      </React.Fragment>
    )
  }

  renderStartCall = () => {
    if (this.state.view != 'start') return null

    return (
      <React.Fragment>
        <img src="icon-muted.svg" height="200" className="mb-20" />
        <div className="pb-30 color-d0 h5">Let others know what the call is about.</div>
        <div className="row w-100 pl-30 pr-30 pt-10 pb-10">
          <Input placeholder="Enter call topic" inputSize="large" value={this.state.topic} onChange={e => this.setState({ topic: e.target.value })} className="mb-20" />
        </div>
        <Button text="Start a call" size="large" theme="muted" onClick={() => this.startCall()} />
      </React.Fragment>
    )
  }

  renderCall = () => {
    if (this.state.view != 'call') return null

    return (
      <React.Fragment>
        <div className="main-screen">
          <div className="main-feed">
            <div className="close-main-screen button" onClick={() => this.setState({ participantFocus: false })}>
              <IconComponent icon="x" color="white" thickness={2} size={20} />
            </div>
          </div>
        </div>

        <div className="participants">
          <div className="scroll-container">
            <div className="inner-content">
              {/* The first one is always us */}
              <div className="participant" onClick={() => this.setState({ participantFocus: true })}>
                <div className="name">
                  <div className="text">{this.prop.user.name}</div>
                </div>
                <video ref={ref => (this.localVideoRef = ref)} width="100%" height="100%" autoPlay muted="muted" />
              </div>

              {/* the rest of them */}
              {this.state.remoteParticipants.map((remoteParticipant, index) => {
                return (
                  <div className="participant" onClick={() => this.setState({ participantFocus: true })} key={index}>
                    <div className="name">
                      <div className="text">{remoteParticipant.rfdisplay}</div>
                    </div>

                    {/* src={URL.createObjectURL(remoteParticipant.stream)} */}
                    {remoteParticipant.stream && <Video stream={remoteParticipant.stream} />}
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
          <Tooltip text="Share to channel" direction="top">
            <div className="control-button">
              <IconComponent icon="share1" color="#343a40" thickness={1.75} size={20} />
            </div>
          </Tooltip>

          {/* share screen */}
          <Tooltip text="Share screen" direction="top">
            <div className="control-button">
              <IconComponent icon="maximize" color="#343a40" thickness={1.75} size={20} />
            </div>
          </Tooltip>
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
            <div className="title">{this.state.topic}</div>
            <div className="flexer"></div>
            <Tooltip text="End call" direction="left">
              <div className="control-button red" onClick={() => this.stopCall()}>
                <IconComponent icon="x" color="white" thickness={1.75} size={20} />
              </div>
            </Tooltip>
          </div>
        )}

        {this.renderJoinCall()}
        {this.renderStartCall()}
        {this.renderCall()}
      </div>
    )
  }
}

VideoExtension.propTypes = {
  user: PropTypes.any,
  channel: PropTypes.any,
}

const mapDispatchToProps = {
  updateChannel: (channelId, channel) => updateChannel(channelId, channel),
}

const mapStateToProps = state => {
  return {
    user: state.user,
    channel: state.channel,
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(VideoExtension)
