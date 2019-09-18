import React, { useState } from 'react'
import styled from 'styled-components'
import PropTypes from 'prop-types'
import IconComponentClose from '../icons/System/close-line'
import IconComponentDownload from '../icons/System/download-line'

const Delete = styled.div`
  top: -5px;
  right: 5px;
  width: 25px;
  height: 25px;
  border-radius: 50%;
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
  margin: 0px;
  transition: background-color 0.25s;

  & svg {
    padding: 0px;
    margin: 0px;
  }

  &:hover {
    background-color: #ce3354;
    transition: background-color 0.25s;
  }
`

const DownloadContainer = styled.div`
  top: -5px;
  right: 5px;
  width: 25px;
  height: 25px;
  border-radius: 50%;
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
  padding: 0px;
  transition: background-color 0.25s;

  &:hover {
    background-color: #03b1fe;
    transition: background-color 0.25s;
  }
`

const Thumbnail = styled.div`
  width: ${props => {
      if (props.layout == 'compose') return '75px'
      if (props.layout == 'message') return '50px'

      return '25px'
    }
  };
  height: ${props => {
      if (props.layout == 'compose') return '75px'
      if (props.layout == 'message') return '50px'

      return '25px'
    }
  };
  border-radius: ${props => {
      if (props.layout == 'compose') return '10px'
      if (props.layout == 'message') return '5px'

      return '3px'
    }
  };
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
`

const Name = styled.div``
const Size = styled.div``

export default function AttachmentComponent({ onDeleteClick, onDownloadClick, layout, size, uri, mime, name, createdAt }) {
  const [over, setOver] = useState(false)

  // prettier-ignore
  return (
    <div className="row" onMouseEnter={() => setOver(true)} onMouseLeave={() => setOver(false)}>
      <Thumbnail
        image={null}
        layout={layout}>
      </Thumbnail>

      <div className="column">
        <Name>{name}</Name>
        <Size>{size} bytes</Size>
        <div className="row">
          {onDownloadClick &&
            <DownloadContainer onClick={onDownloadClick}>
              <IconComponentDownload size={12} fill="white" />
            </DownloadContainer>
          }

          {onDeleteClick &&
            <Delete onClick={onDeleteClick}>
              <IconComponentClose size={12} fill="white" />
            </Delete>
          }
        </div>
      </div>
    </div>
  )
}

AttachmentComponent.propTypes = {
  layout: PropTypes.string,
  size: PropTypes.number,
  uri: PropTypes.string,
  name: PropTypes.string,
  mime: PropTypes.string,
  onDeleteClick: PropTypes.func,
  onDownloadClick: PropTypes.func,
}
