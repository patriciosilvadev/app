import React, { useState } from 'react'
import styled from 'styled-components'
import PropTypes from 'prop-types'

const PanelContainer = styled.div`
  flex: 1;
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  align-content: center;
  justify-content: flex-start;
  position: relative;
`

const PanelTitles = styled.div`
  border-bottom: 1px solid #eaeaea;
  box-sizing: border-box;
  width: 100%;
  display: flex;
  flex-direction: row;
  align-items: center;
  align-content: center;
  justify-content: flex-start;
  position: relative;
`

const Panels = styled.div`
  flex: 1;
  position: relative;
  width: 100%;
  height: 100%;
  transform: translateX(${props => props.current * -100}%);
`

const PanelsContainer = styled.div`
  flex: 1;
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
`

const PanelTabButton = styled.div`
  padding: 20px;
  padding-top: 10px;
  color: #dcd8db;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;

  &.active {
    color: #00a8ff;
  }
`

const Panel = styled.div`
  position: absolute;
  background: white;
  top: 0px;
  left: 0px;
  width: 100%;
  height: 100%;
  overflow: hidden;
  display: flex;
  transform: translateX(${props => props.index * 100}%);
`

export default function TabbedComponent({ panels, start }) {
  const [current, setCurrent] = useState(start)

  // prettier-ignore
  return (
    <PanelContainer current={current} className="tabbed-component">
      <PanelTitles className="tab">
        {panels.map((panel, index) => {
          if (!panel.show) return null

          return (
            <PanelTabButton
              key={index}
              className={current == index ? "active" : null}
              onClick={() => setCurrent(index)}>
              {panel.title}
            </PanelTabButton>
          )
        })}
      </PanelTitles>
      <PanelsContainer>
        <Panels current={current}>
          {panels.map((panel, index) => {
            if (!panel.show) return null
            return (
              <Panel key={index} index={index}>
                {panel.content}
              </Panel>
            )
          })}
        </Panels>
      </PanelsContainer>
    </PanelContainer>
  )
}

TabbedComponent.propTypes = {
  start: PropTypes.number,
  panels: PropTypes.any,
}
