import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import './video.extension.css'
import { Avatar, Tooltip, Button, Input } from '@weekday/elements'
import { IconComponent } from '../../components/icon.component'
import '../../../assets/downgrade.png'
import { Janus } from './util/janus'
import './util/videoroom'
import { getQueryStringValue } from '../../helpers/util'

function VideoExtension(props) {
  const [participantFocus, setParticipantFocus] = useState(true)
  const channel = useSelector(state => state.channel)
  const dispatch = useDispatch()
  const [topic, setTopic] = useState('')

  var server = 'http://http://94.130.230.216/:8088/janus'
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

  useEffect(() => {
    console.log(Janus.randomString(12))
  }, [])

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
