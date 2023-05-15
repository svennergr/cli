import {Box, Text} from 'ink'
import React, {FunctionComponent} from 'react'

export type ButtonRole = 'primary' | 'secondary' | 'cancel' | 'warning'

export interface ButtonProps {
  text: string
  role: ButtonRole
  active?: boolean
}

function roleToColors(type: ButtonProps['role']) {
  return {
    primary: {
      foreground: 'white',
      background: 'green',
    },
    secondary: {
      foreground: 'white',
      background: 'blue',
    },
    cancel: {
      foreground: 'white',
      background: 'gray',
    },
    warning: {
      foreground: 'white',
      background: 'red',
    }
  }[type]
}

const Button: FunctionComponent<ButtonProps> = ({text, role, active}) => {
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
          {`${''.padStart(text.length + 4)}\n`}
          {` ${active ? '⏵' : ' '}${text}${active ? '⏴' : ' '} \n`}
          {`${''.padStart(text.length + 4)}`}
        </Text>
      </Box>
    </Box>
  )
}

export {Button}
