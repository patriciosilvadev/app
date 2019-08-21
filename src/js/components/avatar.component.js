import styled from 'styled-components'
import React, { useState } from 'react'
import '../helpers/extensions'
import chroma from 'chroma-js'
import PropTypes from 'prop-types'
import IconComponent from './icon.component'

const Avatar = styled.div`
  width: ${props => props.width}px;
  height: ${props => props.height}px;
  border-radius: ${props => props.borderRadius}px;
  display: inline-block;
  display: flex;
  flex-direction: column;
  align-items: center;
  align-content: center;
  justify-content: center;
  background-size: cover;
  background-position: center center;
  background-image: ${props => props.image};
  background-color: ${props => props.background};

  &.overlap-right {
    margin-right: -7px;
  }

  &.outline {
    border: 1.5px solid ${props => props.outlineBackground};
    box-shadow: 0px 0px 0px 1.5px ${props => props.outline};
  }
`

const Text = styled.div`
  font-weight: 500;
  color: ${props => props.color || 'white'};
  position: relative;
  top: 0px;
  margin: 0px;
  padding: 0px;
  outline: none;
  text-decoration: none;
  font-size: ${props => {
    if (props.size == 'very-small') return '6'
    if (props.size == 'small') return '8'
    if (props.size == 'small-medium') return '10'
    if (props.size == 'medium') return '12'
    if (props.size == 'medium-large') return '14'
    if (props.size == 'large') return '16'
    if (props.size == 'x-large') return '24'
    if (props.size == 'xx-large') return '32'
    if (props.size == 'xxx-large') return '40'
  }}px;
`

const Delete = styled.div`
  top: -2px;
  right: -2px;
  width: 20px;
  height: 20px;
  border-radius: 10px;
  position: absolute;
  background-color: #e23f62;
  cursor: pointer;
  display: flex;
  flex-direction: row;
  align-items: center;
  align-content: center;
  justify-content: center;
  border: 1px solid white;
  z-index: 1;
  transition: background-color 0.25s;

  &:hover {
    background-color: #ce3354;
    transition: background-color 0.25s;
  }
`

const Edit = styled.div`
  position: absolute;
  left: 0px;
  top: 0px;
  width: 100%;
  height: 100%;
  z-index: 1000;
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  align-content: center;
  cursor: pointer;
`

const Badge = styled.span`
  position: absolute;
  right: -3px;
  bottom: -3px;
  width: 11px;
  height: 11px;
  border-radius: 10px;
  background-color: #007af5;
  box-sizing: border-box;
  border: 2px solid ${props => (props.dark ? '#08111d' : '#ffffff')};
`

export default function AvatarComponent(props) {
  const [over, setOver] = useState(false)
  const outlineClass = props.outline ? 'outline' : ''
  const classes = props.className ? `row ${props.className} ${outlineClass}` : `row ${outlineClass}`
  let width = 35
  let height = 35
  let borderRadius = 35
  let image = props.image ? 'url(' + props.image + ')' : null
  let background = props.dark
    ? '#0c1828'
    : props.color
    ? chroma(props.color)
        .desaturate(2)
        .brighten(2.25)
    : '#f1f3f5'
  let color = props.color ? props.color : '#007af5'

  switch (props.size) {
    case 'very-small':
      width = 15
      height = 15
      borderRadius = props.circle ? 100 : 2
      break
    case 'small':
      width = 20
      height = 20
      borderRadius = props.circle ? 100 : 3
      break
    case 'small-medium':
      width = 25
      height = 25
      borderRadius = props.circle ? 100 : 4
      break
    case 'medium':
      width = 30
      height = 30
      borderRadius = props.circle ? 100 : 5
      break
    case 'medium-large':
      width = 35
      height = 35
      borderRadius = props.circle ? 100 : 6
      break
    case 'large':
      width = 40
      height = 40
      borderRadius = props.circle ? 100 : 7
      break
    case 'x-large':
      width = 80
      height = 80
      borderRadius = props.circle ? 100 : 10
      break
    case 'xx-large':
      width = 120
      height = 120
      borderRadius = props.circle ? 100 : 12
      break
    case 'xxx-large':
      width = 180
      height = 180
      borderRadius = props.circle ? 100 : 16
      break
  }

  // prettier-ignore
  return (
    <div className="relative" onMouseEnter={() => setOver(true)} onMouseLeave={() => setOver(false)}>
      {over && props.edit &&
        <Edit onClick={props.onClick}>
          <IconComponent
            icon="AVATAR_EDIT"
            color={props.textColor ? props.textColor : "white"}
          />
        </Edit>
      }

      {over && props.onDeleteClick &&
        <Delete onClick={props.onDeleteClick}>
          <IconComponent
            icon="AVATAR_DELETE"
            color="white"
          />
        </Delete>
      }

      <Avatar
        onClick={props.onClick}
        width={width}
        height={height}
        borderRadius={borderRadius}
        className={classes}
        image={image}
        background={background}
        outline={props.outline ? props.outline : "transparent"}
        outlineBackground={props.outlineBackground ? props.outlineBackground: "transparent"}
        style={props.style}>

        {props.children}
        {props.badge && <Badge dark={props.dark}/>}

        {(
          (!props.children && !props.image && props.title && !props.edit) ||
          (!props.children && !props.image && props.title && props.edit && !over) ) &&
          <Text color={color} size={props.size}>
            {props.title.toString().generateInitials()}
          </Text>
        }
      </Avatar>
    </div>
  )
}

AvatarComponent.propTypes = {
  className: PropTypes.string,
  image: PropTypes.string,
  dark: PropTypes.bool,
  color: PropTypes.string,
  size: PropTypes.string,
  edit: PropTypes.bool,
  onClick: PropTypes.func,
  onDeleteClick: PropTypes.func,
  textColor: PropTypes.string,
  outline: PropTypes.string,
  outlineBackground: PropTypes.string,
  style: PropTypes.object,
  children: PropTypes.any,
  badge: PropTypes.bool,
  title: PropTypes.string,
}
