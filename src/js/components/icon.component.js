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
  faTimes,
  faPen,
  faDownload,
  faFile,
} from '@fortawesome/pro-light-svg-icons'
import { faLock } from '@fortawesome/pro-regular-svg-icons'

const IconContainer = styled.div``
const Icons = {
  DOCK_STARRED: props => <FontAwesomeIcon icon={faStar} color={props.color} size={props.size} />,
  DOCK_ADD_TEAM: props => <FontAwesomeIcon icon={faPlusSquare} color={props.color} size={props.size} />,
  DOCK_UPDATE_TEAM: props => <FontAwesomeIcon icon={faSlidersHSquare} color={props.color} size={props.size} />,
  DOCK_HELP: props => <FontAwesomeIcon icon={faLifeRing} color={props.color} size={props.size} />,
  DOCK_SIGNOUT: props => <FontAwesomeIcon icon={faSignOut} color={props.color} size={props.size} />,
  DOCK_ACCOUNT: props => <FontAwesomeIcon icon={faUserCircle} color={props.color} size={props.size} />,

  ROOMS_SEARCH: props => <FontAwesomeIcon icon={faSearch} color={props.color} size={props.size} />,
  ROOMS_ADD_ROOM: props => <FontAwesomeIcon icon={faPlusCircle} color={props.color} size={props.size} />,

  ROOM_LOCK: props => <FontAwesomeIcon icon={faLock} color={props.color} size={props.size} />,

  TOOLBAR_MEMBERS: props => <FontAwesomeIcon icon={faUserFriends} color={props.color} size={props.size} />,
  TOOLBAR_EYE_OFF: props => <FontAwesomeIcon icon={faEyeSlash} color={props.color} size={props.size} />,
  TOOLBAR_EYE: props => <FontAwesomeIcon icon={faEye} color={props.color} size={props.size} />,
  TOOLBAR_STARRED: props => <FontAwesomeIcon icon={faStar} color={props.color} size={props.size} />,
  TOOLBAR_TRASH: props => <FontAwesomeIcon icon={faTrash} color={props.color} size={props.size} />,

  MESSAGE_REPLY: props => <FontAwesomeIcon icon={faReply} color={props.color} size={props.size} />,
  MESSAGE_EMOTICON: props => <FontAwesomeIcon icon={faSmile} color={props.color} size={props.size} />,

  COMPOSE_EMOTICON: props => <FontAwesomeIcon icon={faSmile} color={props.color} size={props.size} />,
  COMPOSE_ATTACHMENT: props => <FontAwesomeIcon icon={faPaperclip} color={props.color} size={props.size} />,
  COMPOSE_AT: props => <FontAwesomeIcon icon={faAt} color={props.color} size={props.size} />,
  COMPOSE_SEND: props => <FontAwesomeIcon icon={faPaperPlane} color={props.color} size={props.size} />,

  TEAM_DELETE: props => <FontAwesomeIcon icon={faTrash} color={props.color} size={props.size} />,
  TEAM_CHECK: props => <FontAwesomeIcon icon={faCheck} color={props.color} size={props.size} />,

  MODAL_CLOSE: props => <FontAwesomeIcon icon={faTimes} color={props.color} size={props.size} />,

  AVATAR_DELETE: props => <FontAwesomeIcon icon={faTimes} color={props.color} size={props.size} />,
  AVATAR_EDIT: props => <FontAwesomeIcon icon={faPen} color={props.color} size={props.size} />,

  ATTACHMENT_DELETE: props => <FontAwesomeIcon icon={faTimes} color={props.color} size={props.size} />,
  ATTACHMENT_FILE: props => <FontAwesomeIcon icon={faFile} color={props.color} size={props.size} />,
  ATTACHMENT_DOWNLOAD: props => <FontAwesomeIcon icon={faDownload} color={props.color} size={props.size} />,
}

export default function IconComponent(props) {
  return <IconContainer {...props}>{Icons[props.icon](props)}</IconContainer>
}

IconComponent.propTypes = {
  className: PropTypes.string,
  onClick: PropTypes.func,
}
