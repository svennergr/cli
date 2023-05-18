import {getProductById} from '../products/products-data'
import React from 'react'
import {useComputed, useExtensibilityHost, useLaunchInstances} from '@shopify/extensibility-host-react'
import {Page, Card, PageProps, Layout, ContextualSaveBar, ButtonGroup, Button, Stack} from '@shopify/polaris'
import {useParams} from 'react-router'
import {useSearchParams} from 'react-router-dom'

export default function ProductDetails() {
  const id = useParams()['*']!
  const product = getProductById(id)

  const savebar = useSearchParams()[0].get('savebar') || 'global'
  const globalSavebar = savebar === 'global' || savebar === 'both'
  const inlineSavebar = savebar === 'inline' || savebar === 'both'

  // Launch the Extension Points with our data and return Instances:
  const data = {productId: id, customer: product}
  const instances = useLaunchInstances('Admin::ProductDetails::Card', () => ({
    data,
  }))

  return (
    <Page {...makePageProps(product?.id || '', ['Fulfilled'])}>
      {globalSavebar && <GlobalContextualSaveBar />}
      <Layout>
        <Layout.Section>
          <Card title="Product details" sectioned />
        </Layout.Section>
        <Layout.AnnotatedSection
          title="Inline Extensions"
          description="Extensions with a `target` of `Admin::ProductDetails::Card`"
        >
          {instances.map((instance) => {
            // console.log(instance.extension.name, instance.outlet)
            return (
              <Card title={instance.extension.name} key={instance.id}>
                <Card.Section>{instance.outlet}</Card.Section>
                {inlineSavebar && <InstanceSaveBar instance={instance} />}
              </Card>
            )
          })}
        </Layout.AnnotatedSection>
      </Layout>
    </Page>
  )
}

const makePageProps: (id: string, badges?: string[]) => PageProps = (id) => {
  const pageProps: PageProps = {
    breadcrumbs: [{content: 'Products', url: '/products'}],
    title: `Product ${id}`,
    subtitle: 'Last updated 3 days ago',
    compactTitle: true,
    // titleMetadata: badges?.map((badge) => <Badge status="info">{badge}</Badge>),
    primaryAction: {content: 'Save', disabled: true},
    secondaryActions: [
      {
        content: 'Edit',
        accessibilityLabel: 'Secondary action label',
        onAction: () => false,
      },
    ],
    actionGroups: [
      {
        title: 'More Actions',
        actions: [
          {
            content: 'Sick App Here',
            accessibilityLabel: 'An app that has a fever',
            onAction: () => console.log(`app with ${id}`),
          },
          {
            content: 'Cool App Here',
            accessibilityLabel: 'An app with a low temperature',
            onAction: () => console.log(`app with ${id}`),
          },
        ],
      },
    ],
  }
  return pageProps
}

/** Example: global Save Bar that reacts to the state of all Instances */
function GlobalContextualSaveBar() {
  const pluginApi = useExtensibilityHost().pluginApi.saveBar
  const isDirty = useComputed(() => pluginApi.isDirty())
  const isSaving = useComputed(() => pluginApi.isSaving())
  // for demo purposes, show the number of dirty instances in the save button:
  const saveDetails = useComputed(() => {
    const dirty = pluginApi.getDirtyInstances().length
    return dirty ? ` (${dirty} instance${dirty === 1 ? '' : 's'})` : ''
  })

  return isDirty.value ? (
    <ContextualSaveBar
      discardAction={{
        content: 'Dismiss',
        onAction: () => pluginApi.reset(),
      }}
      saveAction={{
        content: `Save${saveDetails}`,
        onAction: () => pluginApi.save(),
        loading: isSaving.value,
      }}
    />
  ) : null
}

/** Example: a dedicated inline Save Bar shown below each Instance */
function InstanceSaveBar({instance}: {instance: Extensibility.Instance}) {
  const pluginApi = instance.pluginApi.saveBar
  const isDirty = useComputed(() => pluginApi.isDirty())
  const isSaving = useComputed(() => pluginApi.isSaving())

  return isDirty.value ? (
    <Card.Section subdued>
      <Stack vertical alignment="trailing">
        <ButtonGroup>
          <Button onClick={() => pluginApi.reset()}>Cancel</Button>
          <Button primary onClick={() => pluginApi.save()} loading={isSaving.value}>
            Save
          </Button>
        </ButtonGroup>
      </Stack>
    </Card.Section>
  ) : null
}
