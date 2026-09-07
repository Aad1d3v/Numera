import type { ComponentType, SVGProps } from 'react'
import {
  IconCalc,
  IconCamera,
  IconChart,
  IconCode,
  IconSigma,
  IconSwap,
} from '../components/Icons'

export type ModeId = 'basic' | 'scientific' | 'graphing' | 'programmer' | 'converter' | 'photo'

export interface ModeDef {
  id: ModeId
  label: string
  tagline: string
  color: string
  Icon: ComponentType<SVGProps<SVGSVGElement> & { size?: number | string }>
}

export const MODES: ModeDef[] = [
  {
    id: 'basic',
    label: 'Basic',
    tagline: 'Everyday arithmetic, with history and memory',
    color: '#0a84ff',
    Icon: IconCalc,
  },
  {
    id: 'scientific',
    label: 'Scientific',
    tagline: 'Trig, logs, powers and factorials — degrees or radians',
    color: '#bf5af2',
    Icon: IconSigma,
  },
  {
    id: 'graphing',
    label: 'Graphing',
    tagline: 'Plot functions, pan, zoom and trace values',
    color: '#30d158',
    Icon: IconChart,
  },
  {
    id: 'programmer',
    label: 'Programmer',
    tagline: 'Binary, hex, octal and bitwise operations',
    color: '#ff9f0a',
    Icon: IconCode,
  },
  {
    id: 'converter',
    label: 'Converter',
    tagline: 'Length, mass, temperature, data, speed and more',
    color: '#64d2ff',
    Icon: IconSwap,
  },
  {
    id: 'photo',
    label: 'Photo AI',
    tagline: 'Snap a problem and get step-by-step help',
    color: '#ff375f',
    Icon: IconCamera,
  },
]

export function modeById(id: string): ModeDef {
  return MODES.find((m) => m.id === id) ?? MODES[0]
}
