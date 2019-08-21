import React, { useState } from 'react'
import styled from 'styled-components'
import PropTypes from 'prop-types'

const Tooltip = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  align-content: center;
  justify-content: center;
`

const TooltipChildren = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  align-content: center;
  justify-content: center;
`

const TooltipContent = styled.div`
  position: absolute;
  visibility: hidden;
  opacity: 0;
  transition: visibility 0s, opacity 0.25s linear;
  z-index: 1000;
  padding: 10px;
  background: white;
  border-radius: 5px;
  background: #212832;
  padding: 10px;
  width: 100px;
  box-shadow: 0px 0px 50px -25px rgba(0,0,0,1);
  display: none;
  visibility: visible;
  opacity: 0;
  transition: visibility 0s, opacity 0.1s linear;

  &.show {
    display: flex;
    visibility: visible;
    opacity: 1;
    transition: visibility 0s, opacity 0.1s linear;
  }

  &.top { bottom: 0px; right: 50%; transform: translateY(-50%); translateX(50%); }
  &.right { top: 0px; left: 0px; transform: translateX(50%); }
  &.left { top: 0px; right: 0px; transform: translateX(-50%); }
  &.left-top { top: 0px; right: 0px; transform: translateX(100%); }
  &.right-top { top: 0px; left: 0px; transform: translateX(100%); }
  &.left-bottom { bottom: 0px; right: 0px; transform: translateY(100%); }
  &.right-bottom { bottom: 0px; left: 0px; transform: translateY(100%); }

  &.top:after {
  	top: 100%;
  	right: 50%;
  	border: solid transparent;
  	content: ' ';
  	height: 0;
  	width: 0;
  	position: absolute;
  	pointer-events: none;
  	border-color: transparent;
  	border-top-color: #212832;
  	border-width: 5px;
  	margin-top: 0px;
    transform: translateX(50%) rotate(0deg);
  }

  &.left:after {
  	top: 50%;
  	right: 0%;
  	border: solid transparent;
  	content: ' ';
  	height: 0;
  	width: 0;
  	position: absolute;
  	pointer-events: none;
  	border-color: transparent;
  	border-top-color: #212832;
  	border-width: 5px;
  	margin-right: -10px;
    transform: translateY(-50%) rotate(-90deg);
  }

  &.right:after {
  	top: 50%;
  	left: 0%;
  	border: solid transparent;
  	content: ' ';
  	height: 0;
  	width: 0;
  	position: absolute;
  	pointer-events: none;
  	border-color: transparent;
  	border-top-color: #212832;
  	border-width: 5px;
  	margin-left: -10px;
    transform: translateY(-50%) rotate(90deg);
  }
`

const TooltipText = styled.div`
  color: white;
  font-size: 14px;
  text-align: center;
  width: 100%;
`

export default function TooltipComponent({ direction, containerClassName, delay, children, text }) {
  const [show, setShow] = useState(false)

  // NB: Actual bug in React that I don't have time to investigate
  // If you handle the over as useState if doesn't update in the onMouseEnter
  // Feels like it doesn't bind properly or update properly in the onMouseEnter
  // because it updates fine in onMouseLeave - so this is a workaround
  let over = false

  // prettier-ignore
  return (
    <Tooltip className={containerClassName}>
      <TooltipChildren
        onClick={() => over = false}
        onMouseEnter={() => {
          over = true

          // If the person is still over the el
          setTimeout(() => {
            if (over) setShow(true)
          }, delay || 0)
        }}
        onMouseLeave={() => {
          over = false
          setShow(false)
        }}>

        {children}
      </TooltipChildren>

      <TooltipContent className={show ? "show "+ direction : direction}>
        <TooltipText>{text}</TooltipText>
      </TooltipContent>
    </Tooltip>
  )
}

TooltipComponent.propTypes = {
  direction: PropTypes.string,
  containerClassName: PropTypes.string,
  delay: PropTypes.number,
  children: PropTypes.any,
  text: PropTypes.string,
}
