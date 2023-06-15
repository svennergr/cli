import {List} from '../List.js'
import {capitalize} from '../../../../../public/common/string.js'
import {InlineToken, TokenItem} from '../TokenizedText.js'
import {Box, Text, TextProps} from 'ink'
import React, {FunctionComponent} from 'react'

type Items = TokenItem<InlineToken>[]

export interface InfoTableSection {
  color?: TextProps['color']
  header: string
  helperText?: string
  items: Items
}

export interface InfoTableProps {
  table:
    | {
        [header: string]: Items
      }
    | InfoTableSection[]
}

const InfoTable: FunctionComponent<InfoTableProps> = ({table}) => {
  const sections = Array.isArray(table)
    ? table
    : Object.keys(table).map((header) => ({header, items: table[header]!, color: undefined, helperText: undefined}))

  const headerColumnWidth = Math.max(
    ...sections.map((section) => {
      return Math.max(
        ...section.header.split('\n').map((line) => {
          return line.length
        }),
      )
    }),
  )

  return (
    <Box flexDirection="column" marginTop={1}>
      {sections.map((section, index) => (
        <Box key={index} marginBottom={index === sections.length - 1 ? 0 : 1} flexDirection="row" alignItems="flex-start">
          {section.header.length > 0 && (
            <Box width={headerColumnWidth} flexDirection="row-reverse" alignItems="flex-end">
              <Text color={section.color}>{capitalize(section.header)}</Text>
            </Box>
          )}
          <Box marginLeft={section.header.length > 0 ? 1 : 0} flexGrow={1} flexDirection="column" gap={1}>
            <List margin={false} items={section.items} color={section.color} bullet="├" />
            {section.helperText ? <Text color={section.color}>{section.helperText}</Text> : null}
          </Box>
        </Box>
      ))}
    </Box>
  )
}

export {InfoTable}
