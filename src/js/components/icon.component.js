import React from 'react'
import PropTypes from 'prop-types'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import styled from 'styled-components'
import {
  faPlusSquare,
  faPlusCircle,
  faSlidersHSquare,
  faStar,
  faLifeRing,
  faSignOut,
  faUserCircle,
  faSearch,
  faUserFriends,
  faEye,
  faEyeSlash,
  faTrash,
  faSmile,
  faAt,
  faPaperPlane,
  faPaperclip,
  faReply,
  faCheck,
  faPen,
} from '@fortawesome/pro-light-svg-icons'
import {
  faLock,
  faDownload,
  faTimes,
  faFile,
} from '@fortawesome/pro-regular-svg-icons'

const IconContainer = styled.div`
  padding: 0px;
`

const IconStyles = {
  margin: 0,
  padding: 0,
  position: 'relative',
  height: 'auto',
  display: 'block'
}

const Icons = {
  DOCK_STARRED: props => <FontAwesomeIcon icon={faStar} color={props.color} size={props.size} style={IconStyles} />,
  DOCK_ADD_TEAM: props => <FontAwesomeIcon icon={faPlusSquare} color={props.color} size={props.size} style={IconStyles} />,
  DOCK_UPDATE_TEAM: props => <FontAwesomeIcon icon={faSlidersHSquare} color={props.color} size={props.size} style={IconStyles} />,
  DOCK_HELP: props => <FontAwesomeIcon icon={faLifeRing} color={props.color} size={props.size} style={IconStyles} />,
  DOCK_SIGNOUT: props => <FontAwesomeIcon icon={faSignOut} color={props.color} size={props.size} style={IconStyles} />,
  DOCK_ACCOUNT: props => <FontAwesomeIcon icon={faUserCircle} color={props.color} size={props.size} style={IconStyles} />,

  ROOMS_SEARCH: props => <FontAwesomeIcon icon={faSearch} color={props.color} size={props.size} style={IconStyles} />,
  ROOMS_ADD_ROOM: props => <FontAwesomeIcon icon={faPlusCircle} color={props.color} size={props.size} style={IconStyles} />,

  ROOM_LOCK: props => <FontAwesomeIcon icon={faLock} color={props.color} size={props.size} style={IconStyles} />,

  TOOLBAR_MEMBERS: props => <FontAwesomeIcon icon={faUserFriends} color={props.color} size={props.size} style={IconStyles} />,
  TOOLBAR_EYE_OFF: props => <FontAwesomeIcon icon={faEyeSlash} color={props.color} size={props.size} style={IconStyles} />,
  TOOLBAR_EYE: props => <FontAwesomeIcon icon={faEye} color={props.color} size={props.size} style={IconStyles} />,
  TOOLBAR_STARRED: props => <FontAwesomeIcon icon={faStar} color={props.color} size={props.size} style={IconStyles} />,
  TOOLBAR_TRASH: props => <FontAwesomeIcon icon={faTrash} color={props.color} size={props.size} style={IconStyles} />,

  MESSAGE_REPLY: props => <FontAwesomeIcon icon={faReply} color={props.color} size={props.size} style={IconStyles} />,
  MESSAGE_EMOTICON: props => <FontAwesomeIcon icon={faSmile} color={props.color} size={props.size} style={IconStyles} />,

  COMPOSE_EMOTICON: props => <FontAwesomeIcon icon={faSmile} color={props.color} size={props.size} style={IconStyles} />,
  COMPOSE_ATTACHMENT: props => <FontAwesomeIcon icon={faPaperclip} color={props.color} size={props.size} style={IconStyles} />,
  COMPOSE_AT: props => <FontAwesomeIcon icon={faAt} color={props.color} size={props.size} style={IconStyles} />,
  COMPOSE_SEND: props => <FontAwesomeIcon icon={faPaperPlane} color={props.color} size={props.size} style={IconStyles} />,

  TEAM_DELETE: props => <FontAwesomeIcon icon={faTrash} color={props.color} size={props.size} style={IconStyles} />,
  TEAM_CHECK: props => <FontAwesomeIcon icon={faCheck} color={props.color} size={props.size} style={IconStyles} />,

  MODAL_CLOSE: props => <FontAwesomeIcon icon={faTimes} color={props.color} size={props.size} style={IconStyles} />,

  AVATAR_DELETE: props => <FontAwesomeIcon icon={faTimes} color={props.color} size={props.size} style={IconStyles} />,
  AVATAR_EDIT: props => <FontAwesomeIcon icon={faPen} color={props.color} size={props.size} style={IconStyles} />,

  ATTACHMENT_DELETE: props => <FontAwesomeIcon icon={faTimes} color={props.color} size={props.size} style={IconStyles} />,
  ATTACHMENT_FILE: props => <FontAwesomeIcon icon={faFile} color={props.color} size={props.size} style={IconStyles} />,
  ATTACHMENT_DOWNLOAD: props => <FontAwesomeIcon icon={faDownload} color={props.color} size={props.size} style={IconStyles} />,
}

export default function IconComponent(props) {
  return <IconContainer {...props}>{Icons[props.icon](props)}</IconContainer>
}

IconComponent.propTypes = {
  className: PropTypes.string,
  onClick: PropTypes.func,
}
