import {DevConsoleFocus} from '../DevConsoleFocus'
import React, {useEffect} from 'react'
import {useExtensionPoints, useInstances} from '@shopify/extensibility-host-react'
import {Card} from '@shopify/polaris'

export function ProductSubscriptionSlot({target}: {target: string}) {
  const extPoint = useExtensionPoints(target)
  const instances = useInstances(target, {status: 'active'})

  // launch extension points (but never twice)
  useEffect(() => {
    extPoint.forEach((extensionPoint) => {
      if (!extensionPoint.activeInstance) {
        extensionPoint.launch()
      }
    })
  }, [extPoint])

  return (
    <>
      {instances.map((instance) => (
        <DevConsoleFocus key={instance.id} instance={instance}>
          <Card sectioned>{instance.runtime.outlet}</Card>
        </DevConsoleFocus>
      ))}
    </>
  )
}
