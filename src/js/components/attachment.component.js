import React, { useState } from 'react'
import styled from 'styled-components'
import PropTypes from 'prop-types'
import IconComponentClose from '../icons/System/close-line'
import IconComponentDownload from '../icons/System/download-line'
import IconComponentPaperclip from '../icons/Business/attachment-line'

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

// prettier-ignore
const Thumbnail = styled.div`
  width: ${props => {
      if (props.layout == 'compose') return '50px'
      if (props.layout == 'message') return '30px'

      return '20px'
    }
  };
  height: ${props => {
      if (props.layout == 'compose') return '50px'
      if (props.layout == 'message') return '30px'

      return '20px'
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

// prettier-ignore
const Name = styled.div`
  font-weight: 600;
  font-style: normal;
  color: #040b1c;
  display: inline-block;
  font-size: ${props => {
      if (props.layout == 'compose') return '14px'
      if (props.layout == 'message') return '14px'

      return '16px'
    }
  };
  margin-bottom: ${props => {
      if (props.layout == 'compose') return '3px'
      if (props.layout == 'message') return '1px'

      return '3px'
    }
  };
`

// prettier-ignore
const Size = styled.div`
  font-weight: 400;
  color: #adb5bd;
  display: inline-block;
  font-size: ${props => {
      if (props.layout == 'compose') return '13px'
      if (props.layout == 'message') return '12px'

      return '12px'
    }
  };
  margin-bottom: ${props => {
      if (props.layout == 'compose') return '3px'
      if (props.layout == 'message') return '1px'

      return '3px'
    }
  };
`

const Link = styled.div`
  font-weight: 600;
  font-size: 10px;
  color: #007af5;
  margin-right: 10px;
`

export default function AttachmentComponent({ onDeleteClick, onDownloadClick, layout, size, label, uri, mime, name, createdAt }) {
  const [over, setOver] = useState(false)

  // prettier-ignore
  return (
    <div className="row" onMouseEnter={() => setOver(true)} onMouseLeave={() => setOver(false)}>
      <IconComponentPaperclip
        fill="#565456"
        size={layout == "compose" ? 35 : 25}
        className="mr-10"
      />

      {/*
      <Thumbnail
        image={null}
        layout={layout}>
      </Thumbnail>
      */}

      <div className="column">
        <Name layout={layout}>{name}</Name>
        {layout == "compose" && <Size layout={layout}>{size} bytes</Size>}

        <div className="row">
          <Link
            className="button"
            onClick={onDownloadClick}>
            Download
          </Link>

          <Link
            className="button"
            onClick={onDeleteClick}>
            Remove
          </Link>
          {/*
          {onDownloadClick &&
            <DownloadContainer  onClick={onDownloadClick}>
              <IconComponentDownload size={12} fill="white" />
            </DownloadContainer>
          }

          {onDeleteClick &&
            <Delete onClick={onDeleteClick}>
              <IconComponentClose size={12} fill="white" />
            </Delete>
          }
          */}
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
