import React, { useState } from 'react'
import { Avatar } from '@weekday/elements'
import styled from 'styled-components'
import '../helpers/extensions'
import PropTypes from 'prop-types'
import { LockOutlined } from '@material-ui/icons';

const List = styled.div`
  background: transparent;
  padding-top: 4px;
  padding-bottom: 4px;
  padding-left: 25px;
  padding-right: 25px;
  display: flex;
  width: 100%;

  &.active {

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
  font-size: 16px;
  font-weight: 400;
  color: #acb5bd;
  white-space: nowrap;
  width: max-content;
  padding-left: 10px;

  &.active {
    color: #495057;
    font-weight: 600;
  }
`

const Excerpt = styled.div`
  font-size: 13px;
  color: #acb5bd;
  white-space: nowrap;
  overflow: hidden;
  font-weight: 500;
  text-overflow: ellipsis;
  padding-left: 5px;
  opacity: 0.8;
  flex: 1;

  &.active {
    color: #495057;
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
          size="small-medium"
          image={props.image}
          title={props.title}
        />

        <Title className={props.active || props.unread ? "active" : null}>
          {props.title}
        </Title>

        {!props.public && !props.private &&
          <LockOutlined
            htmlColor={props.active || props.unread ? "#495057" : "#acb5bd"}
            fontSize="small"
            className="ml-5"
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
