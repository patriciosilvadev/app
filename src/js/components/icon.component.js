import React from 'react'
import styled from 'styled-components'
import PropTypes from 'prop-types'

import { Eye } from '../icons/Eye'
import { EyeOff } from '../icons/EyeOff'
import { Info } from '../icons/Info'
import { Send } from '../icons/Send'
import { AtSign } from '../icons/AtSign'
import { Star} from '../icons/Star'
import { Smile } from '../icons/Smile'
import { Paperclip } from '../icons/Paperclip'
//import { Users } from '../icons/Users'
import { Trash2 } from '../icons/Trash2'
import { PlusCircle } from '../icons/PlusCircle'
import { Plus } from '../icons/Plus'
import { X } from '../icons/X'
import { Check } from '../icons/Check'
import { Bell } from '../icons/Bell'
import { BellOff } from '../icons/BellOff'
import { Edit2 } from '../icons/Edit2'
import { Settings } from '../icons/Settings'
import { HelpCircle } from '../icons/HelpCircle'
import { LogOut } from '../icons/LogOut'
import { ChevronDown } from '../icons/ChevronDown'
import { RefreshCcw } from '../icons/RefreshCcw'
import { MoreVertical } from '../icons/MoreVertical'
import { MoreHorizontal } from '../icons/MoreHorizontal'
import { Search } from '../icons/Search'

import { Users } from '../icons-custom/Users'
import { Markdown } from '../icons-custom/Markdown'
import { Reply } from '../icons-custom/Reply'
import { Profile } from '../icons-custom/Profile'

export function IconComponent({ size, color, icon, thickness, className, onClick }) {
  const defaultThickness = 1.25

  const getIcon = () => {
    switch (icon) {
      case 'eye': return <Eye width={size} height={size} color={color} strokeWidth={thickness || defaultThickness} />
      case 'eye-off': return <EyeOff width={size} height={size} color={color} strokeWidth={thickness || defaultThickness} />
      case 'info': return <Info width={size} height={size} color={color} strokeWidth={thickness || defaultThickness} />
      case 'users': return <Users width={size} height={size} color={color} strokeWidth={thickness || defaultThickness} />
      case 'delete': return <Trash2 width={size} height={size} color={color} strokeWidth={thickness || defaultThickness} />
      case 'smile': return <Smile width={size} height={size} color={color} strokeWidth={thickness || defaultThickness} />
      case 'attachment': return <Paperclip width={size} height={size} color={color} strokeWidth={thickness || defaultThickness} />
      case 'send': return <Send width={size} height={size} color={color} strokeWidth={thickness || defaultThickness} />
      case 'at': return <AtSign width={size} height={size} color={color} strokeWidth={thickness || defaultThickness} />
      case 'plus-circle': return <PlusCircle width={size} height={size} color={color} strokeWidth={thickness || defaultThickness} />
      case 'plus': return <Plus width={size} height={size} color={color} strokeWidth={thickness || defaultThickness} />
      case 'check': return <Check width={size} height={size} color={color} strokeWidth={thickness || defaultThickness} />
      case 'x': return <X width={size} height={size} color={color} strokeWidth={thickness || defaultThickness} />
      case 'bell': return <Bell width={size} height={size} color={color} strokeWidth={thickness || defaultThickness} />
      case 'bell-off': return <BellOff width={size} height={size} color={color} strokeWidth={thickness || defaultThickness} />
      case 'pen': return <Edit2 width={size} height={size} color={color} strokeWidth={thickness || defaultThickness} />
      case 'reply': return <Reply width={size} height={size} color={color} strokeWidth={thickness || defaultThickness} />
      case 'chevron-down': return <ChevronDown width={size} height={size} color={color} strokeWidth={thickness || defaultThickness} />
      case 'profile': return <Profile width={size} height={size} color={color} strokeWidth={thickness || defaultThickness} />
      case 'settings': return <Settings width={size} height={size} color={color} strokeWidth={thickness || defaultThickness} />
      case 'question': return <HelpCircle width={size} height={size} color={color} strokeWidth={thickness || defaultThickness} />
      case 'logout': return <LogOut width={size} height={size} color={color} strokeWidth={thickness || defaultThickness} />
      case 'refresh': return <RefreshCcw width={size} height={size} color={color} strokeWidth={thickness || defaultThickness} />
      case 'more-h': return <MoreHorizontal width={size} height={size} color={color} strokeWidth={thickness || defaultThickness} />
      case 'more-v': return <MoreVertical width={size} height={size} color={color} strokeWidth={thickness || defaultThickness} />
      case 'star': return <Star width={size} height={size} color={color} strokeWidth={thickness || defaultThickness} />
      case 'search': return <Search width={size} height={size} color={color} strokeWidth={thickness || defaultThickness} />
      case 'markdown': return <Markdown width={size} height={size} color={color} strokeWidth={thickness || defaultThickness} />
      default: null
    }
  }

  return (
    <span style={{ width: size, height: size, display: 'inline-block' }} className={className} onClick={onClick}>
      {getIcon()}
    </span>
  )
}


IconComponent.propTypes = {}
