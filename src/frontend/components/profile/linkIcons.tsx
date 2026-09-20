import type { ReactNode } from 'react'
import {
  Github,
  Linkedin,
  Globe,
  Mail,
  Link as LinkIcon,
  Instagram,
  Youtube,
  Facebook,
  FileSpreadsheet,
  FileText,
  ShoppingBag,
  Phone,
  Image as ImageIcon,
  Video,
  Music,
  Headphones,
  Ban,
} from 'lucide-react'
import { WhatsAppIcon, XIcon } from '../icons/BrandIcons'

// Single source of truth for the link icon picker and renderer. Previously the
// dashboard editor and the public card each kept their own copy, which risked
// drift; both now import from here.
export type LinkIconOption = {
  value: string
  label: string
  icon: React.ComponentType<{ className?: string | undefined }>
}

export const ICON_OPTIONS: LinkIconOption[] = [
  { value: 'link', label: 'Link', icon: LinkIcon },
  { value: 'none', label: 'No icon', icon: Ban },
  { value: 'instagram', label: 'Instagram', icon: Instagram },
  { value: 'whatsapp', label: 'WhatsApp', icon: WhatsAppIcon },
  { value: 'sheet', label: 'Google Sheet', icon: FileSpreadsheet },
  { value: 'globe', label: 'Website', icon: Globe },
  { value: 'youtube', label: 'YouTube', icon: Youtube },
  { value: 'tiktok', label: 'TikTok', icon: Music },
  { value: 'github', label: 'GitHub', icon: Github },
  { value: 'linkedin', label: 'LinkedIn', icon: Linkedin },
  { value: 'twitter', label: 'X', icon: XIcon },
  { value: 'facebook', label: 'Facebook', icon: Facebook },
  { value: 'mail', label: 'Email', icon: Mail },
  { value: 'phone', label: 'Phone', icon: Phone },
  { value: 'call', label: 'Call Center', icon: Headphones },
  { value: 'file', label: 'File', icon: FileText },
  { value: 'shop', label: 'Shop', icon: ShoppingBag },
  { value: 'image', label: 'Image', icon: ImageIcon },
  { value: 'video', label: 'Video', icon: Video },
]

const MAP: Record<string, ReactNode> = {  github: <Github className="h-5 w-5" />,
  linkedin: <Linkedin className="h-5 w-5" />,
  twitter: <XIcon className="h-5 w-5" />,
  call: <Headphones className="h-5 w-5" />,
  globe: <Globe className="h-5 w-5" />,
  mail: <Mail className="h-5 w-5" />,
  instagram: <Instagram className="h-5 w-5" />,
  youtube: <Youtube className="h-5 w-5" />,
  facebook: <Facebook className="h-5 w-5" />,
  whatsapp: <WhatsAppIcon className="h-5 w-5" />,
  sheet: <FileSpreadsheet className="h-5 w-5" />,
  file: <FileText className="h-5 w-5" />,
  shop: <ShoppingBag className="h-5 w-5" />,
  phone: <Phone className="h-5 w-5" />,
  image: <ImageIcon className="h-5 w-5" />,
  video: <Video className="h-5 w-5" />,
  music: <Music className="h-5 w-5" />,
  tiktok: <Music className="h-5 w-5" />,
  none: <Ban className="h-5 w-5" />,
  link: <LinkIcon className="h-5 w-5" />,
  default: <LinkIcon className="h-5 w-5" />,
}

export function renderLinkIcon(name: string | null | undefined): ReactNode {
  return MAP[name || 'default'] ?? MAP.default
}
