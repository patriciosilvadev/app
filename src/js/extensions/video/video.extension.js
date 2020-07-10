import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import './video.extension.css'
import { Avatar, Tooltip, Button, Input } from '@weekday/elements'
import { IconComponent } from '../../components/icon.component'
import '../../../assets/downgrade.png'
import { Janus } from './util/janus'
//import './util/videoroom'
import { getQueryStringValue } from '../../helpers/util'

function VideoExtension(props) {
  const [participantFocus, setParticipantFocus] = useState(true)
  const channel = useSelector(state => state.channel)
  const dispatch = useDispatch()
  const [topic, setTopic] = useState('')

  var server = 'http://94.130.230.216:8088/janus'
  var janus = null
  var sfutest = null
  var opaqueId = 'videoroomtest-' + Janus.randomString(12)
  var myroom = 1234
  var myusername = null
  var myid = null
  var mystream = null
  var feeds = []
  var bitrateTimer = []
  var doSimulcast = getQueryStringValue('simulcast') === 'yes' || getQueryStringValue('simulcast') === 'true'
  var doSimulcast2 = getQueryStringValue('simulcast2') === 'yes' || getQueryStringValue('simulcast2') === 'true'

  // We use this other ID just to map our subscriptions to us
  var mypvtid = null

  const initJanusVideoRoom = () => {
    if (!Janus.isWebrtcSupported()) return alert('No WebRTC support... ')

    // Create session
    janus = new Janus({
      server: server,
      success: function() {
        // Attach to VideoRoom plugin
        janus.attach({
          plugin: 'janus.plugin.videoroom',
          opaqueId: opaqueId,
          success: function(pluginHandle) {
            sfutest = pluginHandle
            Janus.log('Plugin attached! (' + sfutest.getPlugin() + ', id=' + sfutest.getId() + ')')
            Janus.log('  -- This is a publisher/manager')
            // We can call this to kill the process
            // janus.destroy()
          },
          error: function(error) {
            Janus.error('  -- Error attaching plugin...', error)
            console.log('Error attaching plugin... ' + error)
          },
          consentDialog: function(on) {
            Janus.debug('Consent dialog should be ' + (on ? 'on' : 'off') + ' now')
            // navigator.mozGetUserMedia
            // Check for consent
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
            // sfutest.send({ message: { request: 'configure', bitrate: bitrate } })
            return false
          },
          onmessage: function(msg, jsep) {
            Janus.debug(' ::: Got a message (publisher) :::', msg)
            var event = msg['videoroom']
            Janus.debug('Event: ' + event)
            if (event) {
              if (event === 'joined') {
                // Publisher/manager created, negotiate WebRTC and attach to existing feeds, if any
                myid = msg['id']
                mypvtid = msg['private_id']
                Janus.log('Successfully joined room ' + msg['room'] + ' with ID ' + myid)
                publishOwnFeed(true)
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
                    newRemoteFeed(id, display, audio, video)
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
                    newRemoteFeed(id, display, audio, video)
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
                    sfutest.hangup()
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
                        myroom +
                        '</code> (the one this demo uses as a test room) ' +
                        'does not exist...</p><p>Do you have an updated <code>janus.plugin.videoroom.jcfg</code> ' +
                        'configuration file? If not, make sure you copy the details of room <code>' +
                        myroom +
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
              sfutest.handleRemoteJsep({ jsep: jsep })
              // Check if any of the media we wanted to publish has
              // been rejected (e.g., wrong or unsupported codec)
              var audio = msg['audio_codec']
              if (mystream && mystream.getAudioTracks() && mystream.getAudioTracks().length > 0 && !audio) {
                // Audio has been rejected
                console.warning("Our audio stream has been rejected, viewers won't hear us")
              }
              var video = msg['video_codec']
              if (mystream && mystream.getVideoTracks() && mystream.getVideoTracks().length > 0 && !video) {
                // Video has been rejected
                console.warning("Our video stream has been rejected, viewers won't see us")
                // Hide the webcam video element REF - see below where it attached
                // $('#myvideo').hide()
                // Show the user something for this
              }
            }
          },
          onlocalstream: function(stream) {
            Janus.debug(' ::: Got a local stream :::', stream)

            // Set this global
            mystream = stream

            // Show all other videos
            // <video class="rounded centered" id="myvideo" width="100%" height="100%" autoplay playsinline muted="muted"/>
            // Get this element as a native ref
            // Janus.attachMediaStream($('#myvideo').get(0), stream)
            // $('#myvideo').get(0).muted = 'muted'
            if (sfutest.webrtcStuff.pc.iceConnectionState !== 'completed' && sfutest.webrtcStuff.pc.iceConnectionState !== 'connected') {
              // Show an indicator for the user to say we're publishing
            }

            // Get all the video trackcs from this device
            var videoTracks = stream.getVideoTracks()

            // Get our video tracks
            if (!videoTracks || videoTracks.length === 0) {
              // No webcam
              // Show something for the user for this
            } else {
              // Show the video element above
            }
          },
          onremotestream: function(stream) {
            // The publisher stream is sendonly, we don't expect anything here
          },
          oncleanup: function() {
            Janus.log(' ::: Got a cleanup notification: we are unpublished now :::')
            mystream = null
            // Add a publish button
            // publishOwnFeed(true)
          },
        })
      },
      error: function(error) {
        Janus.error(error)
        console.log('error', error)
      },
      destroyed: function() {
        console.log('destroyed')
      },
    })
  }

  useEffect(() => {
    Janus.init({
      debug: 'all',
      callback: () => {
        initJanusVideoRoom()
      },
    })
  }, [])

  // This gets called when a user submits his username
  function registerUsername() {
    const username = 'jo'
    if (/[^a-zA-Z0-9]/.test(username)) return null

    var register = {
      request: 'join',
      room: myroom,
      ptype: 'publisher',
      display: username,
    }
    myusername = username
    sfutest.send({ message: register })
  }

  function publishOwnFeed(useAudio) {
    sfutest.createOffer({
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
        sfutest.send({ message: publish, jsep: jsep })
      },
      error: function(error) {
        Janus.error('WebRTC error:', error)
        if (useAudio) {
          publishOwnFeed(false)
        } else {
          console.log('WebRTC error... ' + error.message)
          // Reshow this button:
          // publishOwnFeed(true)
        }
      },
    })
  }

  function toggleMute() {
    var muted = sfutest.isAudioMuted()
    Janus.log((muted ? 'Unmuting' : 'Muting') + ' local stream...')
    if (muted) sfutest.unmuteAudio()
    else sfutest.muteAudio()
    muted = sfutest.isAudioMuted()
  }

  function unpublishOwnFeed() {
    var unpublish = { request: 'unpublish' }
    sfutest.send({ message: unpublish })
  }

  function newRemoteFeed(id, display, audio, video) {
    // A new feed has been published, create a new plugin handle and attach to it as a subscriber
    var remoteFeed = null
    console.log(display, audio, video, id)
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
          room: myroom,
          ptype: 'subscriber',
          feed: id,
          private_id: mypvtid,
        }
        // In case you don't want to receive audio, video or data, even if the
        // publisher is sending them, set the 'offer_audio', 'offer_video' or
        // 'offer_data' properties to false (they're true by default), e.g.:
        // 		subscribe["offer_video"] = false;
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
      },
      onmessage: function(msg, jsep) {
        Janus.debug(' ::: Got a message (subscriber) :::', msg)
        var event = msg['videoroom']
        Janus.debug('Event: ' + event)
        if (msg['error']) {
          console.log(msg['error'])
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
            console.log(remoteFeed.rfdisplay)
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
              var body = { request: 'start', room: myroom }
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
        Janus.debug('Remote feed #' + remoteFeed.rfindex + ', stream:', stream)
        var addButtons = false
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
        }
      },
      oncleanup: function() {
        Janus.log(' ::: Got a cleanup notification (remote feed ' + id + ') :::')
        if (remoteFeed.spinner) remoteFeed.spinner.stop()
        remoteFeed.spinner = null
        $('#remotevideo' + remoteFeed.rfindex).remove()
        $('#waitingvideo' + remoteFeed.rfindex).remove()
        $('#novideo' + remoteFeed.rfindex).remove()
        $('#curbitrate' + remoteFeed.rfindex).remove()
        $('#curres' + remoteFeed.rfindex).remove()
        if (bitrateTimer[remoteFeed.rfindex]) clearInterval(bitrateTimer[remoteFeed.rfindex])
        bitrateTimer[remoteFeed.rfindex] = null
        remoteFeed.simulcastStarted = false
        $('#simulcast' + remoteFeed.rfindex).remove()
      },
    })
  }

  // Helper to parse query string

  // Helpers to create Simulcast-related UI, if enabled
  function addSimulcastButtons(feed, temporal) {
    /* var index = feed
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
      }) */
  }

  function updateSimulcastButtons(feed, substream, temporal) {
    // Check the substream
    /* var index = feed
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
    } */
  }

  const renderJoinCall = () => {
    return null
    return (
      <React.Fragment>
        <img src="icon-muted.svg" height="200" />
        <div className="pt-20 mb-20 color-d0 h3">Daily standup</div>
        <div className="pb-30 color-d0 h5">
          There is currently a call with <strong>3</strong> participants going on.
        </div>
        <Button text="Join the call now" size="large" />
      </React.Fragment>
    )
  }

  const renderStartCall = () => {
    return (
      <React.Fragment>
        <img src="icon-muted.svg" height="200" className="mb-20" />
        <div className="pb-30 color-d0 h5">Let others know what the call is about.</div>
        <div className="row w-100 pl-30 pr-30 pt-10 pb-10">
          <Input placeholder="Enter call topic" inputSize="large" value={topic} onChange={e => setTopic(e.target.value)} className="mb-20" />
        </div>
        <Button text="Start a call" size="large" theme="muted" />
      </React.Fragment>
    )
  }

  const renderCall = () => {
    return null
    return (
      <React.Fragment>
        <div className="main-screen">
          <div className="main-feed">
            <div className="close-main-screen button" onClick={() => setParticipantFocus(false)}>
              <IconComponent icon="x" color="white" thickness={2} size={20} />
            </div>
          </div>
        </div>

        <div className="participants">
          <div className="scroll-container">
            <div className="inner-content">
              <div className="participant" onClick={() => setParticipantFocus(true)}>
                <Avatar title="part 1" size="x-large" />
              </div>
              <div className="participant" onClick={() => setParticipantFocus(true)}>
                <Avatar title="part 2" size="x-large" />
              </div>
              <div className="participant" onClick={() => setParticipantFocus(true)}>
                <Avatar title="part 3" size="x-large" />
              </div>
              <div className="participant" onClick={() => setParticipantFocus(true)}>
                <Avatar title="part 4" size="x-large" />
              </div>
              <div className="participant" onClick={() => setParticipantFocus(true)}>
                <Avatar title="part 5" size="x-large" />
              </div>
              <div className="participant" onClick={() => setParticipantFocus(true)}>
                <Avatar title="part 6" size="x-large" />
              </div>
              <div className="participant" onClick={() => setParticipantFocus(true)}>
                <Avatar title="part 7" size="x-large" />
              </div>
              <div className="participant" onClick={() => setParticipantFocus(true)}>
                <Avatar title="part 8" size="x-large" />
              </div>
              <div className="participant" onClick={() => setParticipantFocus(true)}>
                <Avatar title="part 9" size="x-large" />
              </div>
            </div>
          </div>
        </div>

        <div className="controls">
          <div className="control-button">
            <IconComponent icon="video" color="#343a40" thickness={1.75} size={20} />
          </div>
          <div className="control-button">
            <IconComponent icon="mic" color="#343a40" thickness={1.75} size={20} />
          </div>
          <div className="control-button">
            <IconComponent icon="share1" color="#343a40" thickness={1.75} size={20} />
          </div>

          <Tooltip text="Share screen" direction="right">
            <div className="control-button">
              <IconComponent icon="maximize" color="#343a40" thickness={1.75} size={20} />
            </div>
          </Tooltip>

          <div className="flexer"></div>

          <Tooltip text="End call" direction="left">
            <div className="control-button red">
              <IconComponent icon="x" color="white" thickness={1.75} size={20} />
            </div>
          </Tooltip>
        </div>
      </React.Fragment>
    )
  }

  return (
    <div className={`video-extension ${participantFocus ? '' : 'all'}`}>
      {renderJoinCall()}
      {renderStartCall()}
      {renderCall()}
    </div>
  )
}

export { VideoExtension }
