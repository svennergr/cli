import React from 'react'

interface AppIconProps extends React.SVGProps<SVGSVGElement> {
  icon: string
  rounded?: boolean
  padding?: boolean
}

export function AppIcon({icon, rounded, padding, ...props}: AppIconProps) {
  if (rounded) props.style = {borderRadius: '10px'}
  return (
    <svg viewBox={padding === false ? '2 2 20 20' : '0 0 24 24'} {...props}>
      <image x="2" y="2" width="20" height="20" href={icon} />
    </svg>
  )
}
