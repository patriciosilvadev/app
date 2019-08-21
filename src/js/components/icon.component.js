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
  ROOMS_SEARCH: props => <FontAwesomeIcon icon={faSearch} color={props.color} size="1x" />,
  ROOMS_STARRED: props => <FontAwesomeIcon icon={faStar} color={props.color} size="lg" />,
  ROOMS_ADD_ROOM: props => <FontAwesomeIcon icon={faPlusCircle} color={props.color} size="1x" />,
  ROOMS_ADD_TEAM: props => <FontAwesomeIcon icon={faPlusSquare} color={props.color} size="lg" />,
  ROOMS_UPDATE_TEAM: props => <FontAwesomeIcon icon={faSlidersHSquare} color={props.color} size="lg" />,
  ROOMS_HELP: props => <FontAwesomeIcon icon={faLifeRing} color={props.color} size="lg" />,
  ROOMS_SIGNOUT: props => <FontAwesomeIcon icon={faSignOut} color={props.color} size="lg" />,
  ROOMS_ACCOUNT: props => <FontAwesomeIcon icon={faUserCircle} color={props.color} size="lg" />,
  ROOMS_LOCK: props => <FontAwesomeIcon icon={faLock} color={props.color} size="xs" />,
  TOOLBAR_MEMBERS: props => <FontAwesomeIcon icon={faUserFriends} color={props.color} size="1x" />,
  TOOLBAR_EYE_OFF: props => <FontAwesomeIcon icon={faEyeSlash} color={props.color} size="1x" />,
  TOOLBAR_EYE: props => <FontAwesomeIcon icon={faEye} color={props.color} size="1x" />,
  TOOLBAR_STARRED: props => <FontAwesomeIcon icon={faStar} color={props.color} size="1x" />,
  TOOLBAR_TRASH: props => <FontAwesomeIcon icon={faTrash} color={props.color} size="1x" />,
  MESSAGE_REPLY: props => <FontAwesomeIcon icon={faReply} color={props.color} size="1x" />,
  MESSAGE_EMOTICON: props => <FontAwesomeIcon icon={faSmile} color={props.color} size="1x" />,
  COMPOSE_EMOTICON: props => <FontAwesomeIcon icon={faSmile} color={props.color} size="1x" />,
  COMPOSE_ATTACHMENT: props => <FontAwesomeIcon icon={faPaperclip} color={props.color} size="1x" />,
  COMPOSE_AT: props => <FontAwesomeIcon icon={faAt} color={props.color} size="1x" />,
  COMPOSE_SEND: props => <FontAwesomeIcon icon={faPaperPlane} color={props.color} size="1x" />,
  TEAM_DELETE: props => <FontAwesomeIcon icon={faTrash} color={props.color} size="1x" />,
  TEAM_CHECK: props => <FontAwesomeIcon icon={faCheck} color={props.color} size="1x" />,
  MODAL_CLOSE: props => <FontAwesomeIcon icon={faTimes} color={props.color} size="lg" />,
  AVATAR_DELETE: props => <FontAwesomeIcon icon={faTimes} color={props.color} size="xs" />,
  AVATAR_EDIT: props => <FontAwesomeIcon icon={faPen} color={props.color} size="xs" />,
  ATTACHMENT_DELETE: props => <FontAwesomeIcon icon={faTimes} color={props.color} size="xs" />,
  ATTACHMENT_FILE: props => <FontAwesomeIcon icon={faFile} color={props.color} size="xs" />,
  ATTACHMENT_DOWNLOAD: props => <FontAwesomeIcon icon={faDownload} color={props.color} size="xs" />,
}

export default function IconComponent(props) {
  return <IconContainer {...props}>{Icons[props.icon](props)}</IconContainer>
}

IconComponent.propTypes = {
  className: PropTypes.string,
  onClick: PropTypes.func,
}
