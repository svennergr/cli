import {Box, Text} from 'ink'
import React, {FunctionComponent} from 'react'

export type ButtonRole = 'primary' | 'secondary' | 'cancel' | 'warning'

export interface ButtonProps {
  label: string
  role: ButtonRole
  active?: boolean
}

function roleToColors(type: ButtonProps['role']) {
  return {
    primary: {
      foreground: 'whiteBright',
      background: 'green',
    },
    secondary: {
      foreground: 'whiteBright',
      background: 'blue',
    },
    cancel: {
      foreground: 'whiteBright',
      background: 'gray',
    },
    warning: {
      foreground: 'whiteBright',
      background: 'red',
    }
  }[type]
}

const Button: FunctionComponent<ButtonProps> = ({label, role, active}) => {
  const {foreground, background} = roleToColors(role)
  return (
    <Box
      paddingX={2}
      paddingY={1}
      flexDirection="row"
    >
      <Box
        marginBottom={1}
        flexShrink={1}
      >
        <Text
          bold={active}
          color={foreground}
          backgroundColor={background}
        >
          {`${''.padStart(label.length + 4)}\n`}
          {` ${active ? '⏵' : ' '}${label}${active ? '⏴' : ' '} \n`}
          {`${''.padStart(label.length + 4)}`}
        </Text>
      </Box>
    </Box>
  )
}

export {Button}
