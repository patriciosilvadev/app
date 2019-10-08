import React, { useState } from 'react'
import styled from 'styled-components'
import PropTypes from 'prop-types'
import { AttachFileOutlined, GetAppOutlined, CloseOutlined } from '@material-ui/icons'
import { InsertDriveFileOutlined, AudiotrackOutlined, VideocamOutlined, SubjectOutlined, ImageOutlined, FontDownloadOutlined } from '@material-ui/icons'

const Container = styled.div`
  border: 1px solid #cbd4db;
  padding: 15px;
  border-radius: 10px;
  margin-bottom: 5px;
  margin-right: 5px;
`

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

const Icon = styled.div`
  margin-right: 15px;
  background-color: ${props => props.color};
  border-radius: 10px;
  width: 40px;
  height: 40px;
`

// prettier-ignore
const Name = styled.div`
  font-weight: 500;
  font-style: normal;
  color: #151b26;
  display: inline-block;
  font-size: ${props => {
      switch(props.layout) {
        case 'compose':
          return '14px'
        case 'message':
          return '14px'
        default:
          return '16px'
      }
    }
  };
  margin-bottom: ${props => {
      switch(props.layout) {
        case 'compose':
          return '5px'
        case 'message':
          return '5px'
        default:
          return '5px'
      }
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

const Extension = styled.div`
  font-weight: 500;
  font-size: 10px;
  color: #6f7782;
  margin-right: 10px;
`

const Link = styled.div`
  font-weight: 500;
  font-size: 10px;
  color: #007af5;
  margin-right: 10px;
`

export default function AttachmentComponent({ onDeleteClick, onDownloadClick, layout, size, label, uri, mime, name, createdAt }) {
  const [over, setOver] = useState(false)

  const getMimeTypeColor = (type) => {
    switch (type.split('/')[0]) {
      case 'audio': return '#007af5'
      case 'application': return '#36C5AB'
      case 'video': return '#EA4E9D'
      case 'text': return '#8DA2A5'
      case 'image': return '#7A6FF0'
      case 'font': return '#E8384F'
      default: return '#007af5'
    }
  }

  const getMimeTypeIcon = (type) => {
    switch (type.split('/')[0]) {
      case 'audio': return <AudiotrackOutlined htmlColor="white" fontSize={layout == "compose" ? "large" : "default"} />
      case 'application': return <InsertDriveFileOutlined htmlColor="white" fontSize={layout == "compose" ? "large" : "default"} />
      case 'video': return <VideocamOutlined htmlColor="white" fontSize={layout == "compose" ? "large" : "default"} />
      case 'text': return <SubjectOutlined htmlColor="white" fontSize={layout == "compose" ? "large" : "default"} />
      case 'image': return <ImageOutlined htmlColor="white" fontSize={layout == "compose" ? "large" : "default"} />
      case 'font': return <FontDownloadOutlined htmlColor="white" fontSize={layout == "compose" ? "large" : "default"} />
      default: return <InsertDriveFileOutlined htmlColor="white" fontSize={layout == "compose" ? "large" : "default"} />
    }
  }

  const getMimeTypeDescription = (type) => {
    switch (type) {
      case 'audio/aac': return 'AAC audio'
      case 'application/x-abiword': return 'AbiWorddocument'
      case 'application/x-freearc': return 'Archive document (multiple files embedded)'
      case 'video/x-msvideo': return 'AVI: Audio Video Interleave'
      case 'application/vnd.amazon.ebook': return 'Amazon Kindle eBook format'
      case 'application/octet-stream': return 'Any kind of binary data'
      case 'image/bmp': return 'Windows OS/2 Bitmap Graphics'
      case 'application/x-bzip': return 'BZip archive'
      case 'application/x-bzip2': return 'BZip2 archive'
      case 'application/x-csh': return 'C-Shell script'
      case 'text/css': return 'Cascading Style Sheets (CSS)'
      case 'text/csv': return 'Comma-separated values (CSV)'
      case 'application/msword': return 'Microsoft Word'
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': return 'Microsoft Word (OpenXML)'
      case 'application/vnd.ms-fontobject': return 'MS Embedded OpenType fonts'
      case 'application/epub+zip': return 'Electronic publication (EPUB)'
      case 'application/gzip': return 'GZip Compressed Archive'
      case 'image/gif': return 'Graphics Interchange Format (GIF)'
      case 'text/html': return 'HyperText Markup Language (HTML)'
      case 'image/vnd.microsoft.icon': return 'Icon format'
      case 'text/calendar': return 'iCalendar format'
      case 'application/java-archive': return 'Java Archive (JAR)'
      case 'image/jpeg': return 'JPEG images'
      case 'text/javascript': return 'JavaScript'
      case 'application/json': return 'JSON format'
      case 'application/ld+json': return 'JSON-LD format'
      case 'audio/midiaudio/x-midi': return 'Musical Instrument Digital Interface (MIDI)'
      case 'text/javascript': return 'JavaScript module'
      case 'audio/mpeg': return 'MP3 audio'
      case 'video/mpeg': return 'MPEG Video'
      case 'application/vnd.apple.installer+xml': return 'Apple Installer Package'
      case 'application/vnd.oasis.opendocument.presentation': return 'OpenDocument presentation document'
      case 'application/vnd.oasis.opendocument.spreadsheet': return 'OpenDocument spreadsheet document'
      case 'application/vnd.oasis.opendocument.text': return 'OpenDocument text document'
      case 'audio/ogg': return 'OGG audio'
      case 'video/ogg': return 'OGG video'
      case 'application/ogg': return 'OGG'
      case 'audio/opus': return 'Opus audio'
      case 'font/otf': return 'OpenType font'
      case 'image/png': return 'Portable Network Graphics'
      case 'application/pdf': return 'AdobePortable Document Format(PDF)'
      case 'appliction/php': return 'Hypertext Preprocessor (Personal Home Page)'
      case 'application/vnd.ms-powerpoint': return 'Microsoft PowerPoint'
      case 'application/vnd.openxmlformats-officedocument.presentationml.presentation': return 'Microsoft PowerPoint (OpenXML)'
      case 'application/x-rar-compressed': return 'RAR archive'
      case 'application/rtf': return 'Rich Text Format (RTF)'
      case 'application/x-sh': return 'Bourne shell script'
      case 'image/svg+xml': return 'Scalable Vector Graphics (SVG)'
      case 'application/x-shockwave-flash': return 'Small web format(SWF) or Adobe Flash document'
      case 'application/x-tar': return 'Tape Archive (TAR)'
      case 'image/tiff': return 'Tagged Image File Format (TIFF)'
      case 'video/mp2t': return 'MPEG transport stream'
      case 'font/ttf': return 'TrueType Font'
      case 'text/plain': return 'Text'
      case 'application/vnd.visio': return 'Microsoft Visio'
      case 'audio/wav': return 'Waveform Audio Format'
      case 'audio/webm': return 'WEBM audio'
      case 'video/webm': return 'WEBM video'
      case 'video/mp4': return 'Video File'
      case 'image/webp': return 'WEBP image'
      case 'font/woff': return 'Web Open Font Format (WOFF)'
      case 'font/woff2': return 'Web Open Font Format (WOFF)'
      case 'application/xhtml+xml': return 'XHTML'
      case 'application/vnd.ms-excel': return 'Microsoft Excel'
      case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': return 'Microsoft Excel (OpenXML)'
      case 'application/xmlifnotreadable from casual users (RFC 3023': return ' section 3)'
      case 'text/xmlif readable from casual users': return 'XML'
      case 'application/vnd.mozilla.xul+xml': return 'XUL'
      case 'application/zip': return 'ZIP archive'
      case 'audio/3gppif it doesn\'t contain video': return '3GPPaudio/video container'
      case 'audio/3gpp2if it doesn\'t contain video': return '3GPP2audio/video container'
      case 'application/x-7z-compressed': return '7-ziparchive'
      default: return 'Document'
    }
  }

  // prettier-ignore
  return (
    <Container
      className="row"
      onMouseEnter={() => setOver(true)}
      onMouseLeave={() => setOver(false)}>
      <Icon
        color={getMimeTypeColor(mime)}
        className="row justify-content-center">
        {getMimeTypeIcon(mime)}
      </Icon>

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
          <Extension>
            {getMimeTypeDescription(mime)}
          </Extension>
          <Link
            className="button"
            onClick={onDownloadClick}>
            Download
          </Link>

          {layout == "compose" &&
            <Link
              className="button"
              onClick={onDeleteClick}>
              Remove
            </Link>
          }
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
    </Container>
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
