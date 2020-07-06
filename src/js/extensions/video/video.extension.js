import React from 'react'
import './video.extension.css'
import { Avatar } from '@weekday/elements'

function VideoExtension(props) {
  return (
    <div className="extension-container">
      <div className="participant">
        <Avatar title="part 1" size="xx-large" />
      </div>
      <div className="participant">
        <Avatar title="part 2" size="xx-large" />
      </div>
      <div className="participant">
        <Avatar title="part 3" size="xx-large" />
      </div>
      <div className="participant">
        <Avatar title="part 4" size="xx-large" />
      </div>
      <div className="participant">
        <Avatar title="part 5" size="xx-large" />
      </div>
      <div className="participant">
        <Avatar title="part 6" size="xx-large" />
      </div>
      <div className="participant">
        <Avatar title="part 7" size="xx-large" />
      </div>
    </div>
  )
}

export { VideoExtension }
