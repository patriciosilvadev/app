import React, { useState } from 'react'
import AvatarComponent from './avatar.component'
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

  &.active {
    background: #0c1828;
  }
`

const Icon = styled.div`
  padding-left: 0px;
  padding-right: 0px;
`

const Name = styled.div`
  overflow: hidden;
  cursor: pointer;
  font-size: 14px;
  font-weight: 400;
  color: #475669;
  white-space: nowrap;

  &.active {
    color: #ffffff;
    font-weight: 600;
  }
`

const Excerpt = styled.div`
  font-size: 10px;
  font-weight: 600;
  color: #475669;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 50%;

  &.active {
    color: #ffffff;
    font-weight: 500;
  }
`

const Label = styled.div`
  font-size: 7px;
  text-transform: uppercase;
  font-weight: 600;
  color: #007af5;
  padding: 3px 5px 3px 5px;
  border-radius: 3px;
  background: #0c1828;
  margin-left: 5px;
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
        <div className="row flexer" style={{ overflow: 'hidden' }}>
          {!props.icon &&
            <AvatarComponent
              dark={props.dark}
              size="small-medium"
              image={props.image}
              title={props.title}
              badge={props.unread}
            /> 
          }

          <div className="column flexer pl-10">
            <div className="row flexer">
              {props.title &&
                <Name className={props.active || props.unread ? "active" : null}>
                  {props.title}
                </Name>
              }

              {!props.public && !props.private &&
                <IconComponent
                  color={props.active || props.unread ? "white" : "#475669"}
                  icon="ROOMS_LOCK"
                  className="ml-5"
                />
              }

              {props.label &&
                <Label className={props.active || props.unread ? "active" : null}>
                  {props.label}
                </Label>
              }
            </div>

            {props.excerpt &&
              <Excerpt className={props.active || props.unread ? "active" : null}>
                {props.excerpt}
              </Excerpt>
            }
          </div>
        </div>
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
