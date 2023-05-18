import reviews from './reviews-data'
import React, {useEffect, useState} from 'react'
import {Box, DataTable, Link, List, Stack, Text, TextField} from '@shopify/polaris'

interface Api {
  data: {productId: string}
  setDirtyState(dirty: boolean): void
  onReset(fn: () => void): void
  onSave(fn: () => Promise<boolean>): void
}

export default function ReviewsByProduct(api: Api) {
  const productId = api.data.productId

  const [value, setValue] = useState('')
  const [submittedData, submit] = useState<{value: any}>()

  useEffect(() => {
    const isDirty = value.trim() !== (submittedData?.value ?? '')
    api.setDirtyState(isDirty)
  }, [value])

  useEffect(() => {
    api.onReset(() => {
      submit((data) => {
        setValue(data?.value ?? '')
        return data
      })
    })

    api.onSave(() => {
      return new Promise((resolve) => {
        setTimeout(() => {
          // a fake form submission
          setValue((value) => {
            submit({value})
            return value
          })
          resolve(true)
        }, 1000)
      })
    })
  }, [])

  const rows = reviews
    .filter((review) => review.productId === productId)
    .map((review) => {
      return [review.id, review.productId, review.notes]
    })

  return (
    <Stack vertical spacing="tight">
      <DataTable columnContentTypes={['text', 'text']} headings={['Review ID', 'Product ID', 'Notes']} rows={rows} />
      <Box position="relative">
        <Text as="h5" variant="bodyLg">
          Form Example
        </Text>
        <Text as="p" variant="bodySm" color="subdued">
          Try editing the field below. To see the different extension Save Bar options:
        </Text>
        <List spacing="extraTight">
          <List.Item>
            <Link url="?savebar=global">global Contextual Save Bar</Link> shared by extensions & 1P
          </List.Item>
          <List.Item>
            <Link url="?savebar=inline">inline Save Bar</Link> for each extension
          </List.Item>
          <List.Item>
            <Link url="?savebar=both">both</Link> (because we can!)
          </List.Item>
        </List>
      </Box>
      <Stack alignment="leading" spacing="extraLoose">
        <TextField value={value} onChange={setValue} label="Value:" autoComplete="seldom" />
        {submittedData && (
          <Stack vertical spacing="none">
            <Text as="p" variant="bodyMd">
              Submitted Data:
            </Text>
            <Text as="p" variant="bodyMd" color="subdued">
              {JSON.stringify(submittedData, null, 2)}
            </Text>
          </Stack>
        )}
      </Stack>
    </Stack>
  )
}
