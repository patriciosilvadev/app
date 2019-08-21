import React, { useState } from 'react'
import styled from 'styled-components'
import PropTypes from 'prop-types'
import IconComponent from './icon.component'

const Delete = styled.div`
  top: -5px;
  right: 5px;
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

const DownloadContainer = styled.div`
  top: -5px;
  right: 5px;
  width: 20px;
  height: 20px;
  border-radius: 10px;
  position: absolute;
  background-color: #100d17;
  cursor: pointer;
  display: flex;
  flex-direction: row;
  align-items: center;
  align-content: center;
  justify-content: center;
  border: 1px solid white;
  z-index: 10;
  transition: background-color 0.25s;

  &:hover {
    background-color: #03b1fe;
    transition: background-color 0.25s;
  }
`

const Thumbnail = styled.div`
  width: 100px;
  height: 100px;
  border-radius: 10px;
  margin-right: 10px;
  position: relative;
  background-image: url(${props => props.image});
  background-color: #efefef;
  background-size: cover;
  background-position: no-repeat center center;
  display: flex;
  flex-direction: row;
  align-items: center;
  align-content: center;
  justify-content: center;

  &.large {
    width: 100px;
    height: 100px;
    border-radius: 10px;
  }

  &.medium {
    width: 50px;
    height: 50px;
    border-radius: 5px;
  }

  &.small {
    width: 25px;
    height: 25px;
    border-radius: 3px;
  }
`

export default function AttachmentComponent({ onDeleteClick, onDownloadClick, size, thumbnail }) {
  const [over, setOver] = useState(false)

  // prettier-ignore
  return (
    <div className="relative" onMouseEnter={() => setOver(true)} onMouseLeave={() => setOver(false)}>
      {over && onDownloadClick &&
        <DownloadContainer onClick={onDownloadClick}>
          <IconComponent
            icon="ATTACHMENT_DOWNLOAD"
            color="white"
          />
        </DownloadContainer>
      }

      {over && onDeleteClick &&
        <Delete onClick={onDeleteClick}>
          <IconComponent
            icon="ATTACHMENT_DELETE"
            color="white"
          />
        </Delete>
      }

      <Thumbnail image={thumbnail} className={`${size}`}>
        {!thumbnail &&
          <IconComponent
            icon="ATTACHMENT_FILE"
            color="#565456"
          />
        }
      </Thumbnail>
    </div>
  )
}

AttachmentComponent.propTypes = {
  size: PropTypes.string,
  thumbnail: PropTypes.string,
  onDeleteClick: PropTypes.func,
  onDownloadClick: PropTypes.func,
}
