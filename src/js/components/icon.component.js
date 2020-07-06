import React from 'react'
import styled from 'styled-components'
import PropTypes from 'prop-types'
import {
  Eye,
  EyeOff,
  Info,
  Send,
  AtSign,
  Star,
  Smile,
  Paperclip,
  Trash2,
  PlusCircle,
  Plus,
  X,
  Check,
  Bell,
  BellOff,
  Edit2,
  Settings,
  HelpCircle,
  LogOut,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  ChevronLeft,
  RefreshCcw,
  MoreVertical,
  MoreHorizontal,
  Search,
  List,
  MessageCircle,
  UserMinus,
  Shield,
  ThumbsUp,
  Flag,
  Lock,
  Unlock,
  Share2,
  Share,
  Radio,
  Box,
  Package,
  Compass,
  Hash,
  Monitor,
  Smartphone,
  Video,
  Mic,
  Sidebar,
  Square,
  Camera,
  MicOff,
  VideoOff,
  Maximize,
} from 'react-feather'
import { Users } from '../icons/Users'
import { Markdown } from '../icons/Markdown'
import { Reply } from '../icons/Reply'
import { Forward } from '../icons/Forward'
import { Profile } from '../icons/Profile'

export function IconComponent({ size, color, icon, thickness, className, onClick, style }) {
  const defaultThickness = 1.25

  const getIcon = () => {
    switch (icon) {
      case 'maximize':
        return <Maximize width={size} height={size} color={color} strokeWidth={thickness || defaultThickness} />
      case 'square':
        return <Square width={size} height={size} color={color} strokeWidth={thickness || defaultThickness} />
      case 'camera':
        return <Camera width={size} height={size} color={color} strokeWidth={thickness || defaultThickness} />
      case 'camera-off':
        return <CameraOff width={size} height={size} color={color} strokeWidth={thickness || defaultThickness} />
      case 'sidebar':
        return <Sidebar width={size} height={size} color={color} strokeWidth={thickness || defaultThickness} />
      case 'video-off':
        return <VideoOff width={size} height={size} color={color} strokeWidth={thickness || defaultThickness} />
      case 'video':
        return <Video width={size} height={size} color={color} strokeWidth={thickness || defaultThickness} />
      case 'mic-off':
        return <MicOff width={size} height={size} color={color} strokeWidth={thickness || defaultThickness} />
      case 'mic':
        return <Mic width={size} height={size} color={color} strokeWidth={thickness || defaultThickness} />
      case 'monitor':
        return <Monitor width={size} height={size} color={color} strokeWidth={thickness || defaultThickness} />
      case 'smartphone':
        return <Smartphone width={size} height={size} color={color} strokeWidth={thickness || defaultThickness} />
      case 'hash':
        return <Hash width={size} height={size} color={color} strokeWidth={thickness || defaultThickness} />
      case 'compass':
        return <Compass width={size} height={size} color={color} strokeWidth={thickness || defaultThickness} />
      case 'package':
        return <Package width={size} height={size} color={color} strokeWidth={thickness || defaultThickness} />
      case 'box':
        return <Box width={size} height={size} color={color} strokeWidth={thickness || defaultThickness} />
      case 'radio':
        return <Radio width={size} height={size} color={color} strokeWidth={thickness || defaultThickness} />
      case 'share1':
        return <Share width={size} height={size} color={color} strokeWidth={thickness || defaultThickness} />
      case 'share':
        return <Share2 width={size} height={size} color={color} strokeWidth={thickness || defaultThickness} />
      case 'lock':
        return <Lock width={size} height={size} color={color} strokeWidth={thickness || defaultThickness} />
      case 'unlock':
        return <Unlock width={size} height={size} color={color} strokeWidth={thickness || defaultThickness} />
      case 'shield':
        return <Shield width={size} height={size} color={color} strokeWidth={thickness || defaultThickness} />
      case 'user-minus':
        return <UserMinus width={size} height={size} color={color} strokeWidth={thickness || defaultThickness} />
      case 'message-circle':
        return <MessageCircle width={size} height={size} color={color} strokeWidth={thickness || defaultThickness} />
      case 'list':
        return <List width={size} height={size} color={color} strokeWidth={thickness || defaultThickness} />
      case 'eye':
        return <Eye width={size} height={size} color={color} strokeWidth={thickness || defaultThickness} />
      case 'eye-off':
        return <EyeOff width={size} height={size} color={color} strokeWidth={thickness || defaultThickness} />
      case 'info':
        return <Info width={size} height={size} color={color} strokeWidth={thickness || defaultThickness} />
      case 'users':
        return <Users width={size} height={size} color={color} strokeWidth={thickness || defaultThickness} />
      case 'delete':
        return <Trash2 width={size} height={size} color={color} strokeWidth={thickness || defaultThickness} />
      case 'smile':
        return <Smile width={size} height={size} color={color} strokeWidth={thickness || defaultThickness} />
      case 'attachment':
        return <Paperclip width={size} height={size} color={color} strokeWidth={thickness || defaultThickness} />
      case 'send':
        return <Send width={size} height={size} color={color} strokeWidth={thickness || defaultThickness} />
      case 'at':
        return <AtSign width={size} height={size} color={color} strokeWidth={thickness || defaultThickness} />
      case 'plus-circle':
        return <PlusCircle width={size} height={size} color={color} strokeWidth={thickness || defaultThickness} />
      case 'plus':
        return <Plus width={size} height={size} color={color} strokeWidth={thickness || defaultThickness} />
      case 'check':
        return <Check width={size} height={size} color={color} strokeWidth={thickness || defaultThickness} />
      case 'x':
        return <X width={size} height={size} color={color} strokeWidth={thickness || defaultThickness} />
      case 'bell':
        return <Bell width={size} height={size} color={color} strokeWidth={thickness || defaultThickness} />
      case 'bell-off':
        return <BellOff width={size} height={size} color={color} strokeWidth={thickness || defaultThickness} />
      case 'pen':
        return <Edit2 width={size} height={size} color={color} strokeWidth={thickness || defaultThickness} />
      case 'reply':
        return <Reply width={size} height={size} color={color} strokeWidth={thickness || defaultThickness} />
      case 'forward':
        return <Forward width={size} height={size} color={color} strokeWidth={thickness || defaultThickness} />
      case 'chevron-down':
        return <ChevronDown width={size} height={size} color={color} strokeWidth={thickness || defaultThickness} />
      case 'chevron-up':
        return <ChevronUp width={size} height={size} color={color} strokeWidth={thickness || defaultThickness} />
      case 'chevron-right':
        return <ChevronRight width={size} height={size} color={color} strokeWidth={thickness || defaultThickness} />
      case 'chevron-left':
        return <ChevronLeft width={size} height={size} color={color} strokeWidth={thickness || defaultThickness} />
      case 'profile':
        return <Profile width={size} height={size} color={color} strokeWidth={thickness || defaultThickness} />
      case 'settings':
        return <Settings width={size} height={size} color={color} strokeWidth={thickness || defaultThickness} />
      case 'question':
        return <HelpCircle width={size} height={size} color={color} strokeWidth={thickness || defaultThickness} />
      case 'logout':
        return <LogOut width={size} height={size} color={color} strokeWidth={thickness || defaultThickness} />
      case 'refresh':
        return <RefreshCcw width={size} height={size} color={color} strokeWidth={thickness || defaultThickness} />
      case 'more-h':
        return <MoreHorizontal width={size} height={size} color={color} strokeWidth={thickness || defaultThickness} />
      case 'more-v':
        return <MoreVertical width={size} height={size} color={color} strokeWidth={thickness || defaultThickness} />
      case 'star':
        return <Star width={size} height={size} color={color} strokeWidth={thickness || defaultThickness} />
      case 'search':
        return <Search width={size} height={size} color={color} strokeWidth={thickness || defaultThickness} />
      case 'markdown':
        return <Markdown width={size} height={size} color={color} strokeWidth={thickness || defaultThickness} />
      case 'thumbs-up':
        return <ThumbsUp width={size} height={size} color={color} strokeWidth={thickness || defaultThickness} />
      case 'flag':
        return <Flag width={size} height={size} color={color} strokeWidth={thickness || defaultThickness} />
      default:
        null
    }
  }

  return (
    <span style={{ width: size, height: size, display: 'inline-block', ...style }} className={className} onClick={onClick}>
      {getIcon()}
    </span>
  )
}

IconComponent.propTypes = {}
