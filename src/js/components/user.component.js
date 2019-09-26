import { Avatar } from '@weekday/elements'
import React, { useState } from 'react'
import styled from 'styled-components'
import PropTypes from 'prop-types'

const Name = styled.div`
  color: #483545;
  font-size: 14px;
  font-weight: 500;
`

const Label = styled.div`
  color: #858e96;
  font-size: 12px;
  font-weight: 500;
`

const User = styled.div`
  width: 100%;
  height: 60px;
  padding-left: 20px;
  padding-right: 20px;
  background: ${props => (props.active ? '#f8f9fa' : 'transparent')};
`

export default function UserComponent({ image, name, label, className, children, onClick, active }) {
  const [hover, setHover] = useState(false)

  // prettier-ignore
  return (
    <User
      active={active}
      className={`row  border-bottom ${className}`}
      onClick={onClick}
      onMouseOver={() => setHover(true)}
      onMouseLeave={() => setHover(false)}>
      <Avatar
        className="small"
        image={image}
        title={name}
      />

      <div className="pl-10 column">
        <Name>{name}</Name>
        <Label>{label}</Label>
      </div>

      <div className="flexer"></div>

      {hover &&
        <React.Fragment>
          {children}
        </React.Fragment>
      }
    </User>
  )
}

UserComponent.propTypes = {
  image: PropTypes.string,
  name: PropTypes.string,
  label: PropTypes.string,
  className: PropTypes.string,
  children: PropTypes.any,
  onClick: PropTypes.func,
  active: PropTypes.bool,
}
