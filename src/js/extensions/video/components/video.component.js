import React, { useState, useEffect, useRef } from 'react'
import './video.component.css'
import { Janus } from '../lib/janus'

export default ({ stream, poster }) => {
  const videoRef = useRef(null)

  useEffect(() => {
    Janus.attachMediaStream(videoRef.current, stream)
  }, [stream])

  return <video ref={videoRef} width="100%" height="100%" autoPlay poster={poster} />
}
