import React, { useState } from 'react'
import { Avatar } from '@weekday/elements'
import styled from 'styled-components'
import '../helpers/extensions'
import PropTypes from 'prop-types'
import IconComponent from './icon.component'

const List = styled.div`
  background: transparent;
  padding-top: 4px;
  padding-bottom: 4px;
  padding-left: 25px;
  padding-right: 25px;
  display: flex;
  width: 100%;

  &.active {
    background: #0c1828;
  }
`

const Badge = styled.div`
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background-color: #007af5;
  margin-left: auto;
`

const Icon = styled.div`
  padding-left: 0px;
  padding-right: 0px;
`

const Title = styled.div`
  overflow: hidden;
  cursor: pointer;
  font-size: 15px;
  font-weight: 500;
  color: #475669;
  white-space: nowrap;
  width: max-content;
  padding-left: 10px;

  &.active {
    color: #ffffff;
    font-weight: 600;
  }
`

const Excerpt = styled.div`
  font-size: 13px;
  color: #475669;
  white-space: nowrap;
  overflow: hidden;
  font-weight: 400;
  text-overflow: ellipsis;
  padding-left: 5px;
  opacity: 0.8;
  flex: 1;

  &.active {
    color: #475669;
    font-weight: 500;
  }
`



export default function RoomComponent(props) {
  const [over, setOver] = useState(false)

  // prettier-ignore
  return (
    <List
      onMouseEnter={() => setOver(true)}
      onMouseLeave={() => setOver(false)}
      onClick={props.onClick ? props.onClick : null}
      className={props.active ? "row active" : "row"}>
        <Avatar
          dark={props.dark}
          size="small-medium"
          image={props.image}
          title={props.title}
        />

        <Title className={props.active || props.unread ? "active" : null}>
          {props.title}
        </Title>

        {!props.public && !props.private &&
          <IconComponent
            color={props.active || props.unread ? "white" : "#475669"}
            icon="ROOM_LOCK"
            className="ml-5"
            size="xs"
          />
        }

        <Excerpt className={props.active || props.unread ? "active" : null}>
          {props.excerpt}
        </Excerpt>

        {props.unread && <Badge />}
    </List>
  )
}

RoomComponent.propTypes = {
  dark: PropTypes.bool,
  active: PropTypes.bool,
  unread: PropTypes.bool,
  title: PropTypes.string,
  image: PropTypes.string,
  icon: PropTypes.string,
  label: PropTypes.string,
  excerpt: PropTypes.string,
  public: PropTypes.bool,
  private: PropTypes.bool,
}
