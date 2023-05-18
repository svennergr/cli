import React from 'react';
import {useCallback, useMemo, useState} from 'react';
import {ActionList, Button, Icon, Popover, Stack} from '@shopify/polaris';
import {AppsMajor, AppExtensionMinor, LinkMinor} from '@shopify/polaris-icons';

export interface ResourceData {
  id: string;
  type: 'Product' | 'Order' | 'Customer';
}

export interface AppsButtonProps {
  extensions: {
    links: Extensibility.ExtensionPoint<Record<string, any>>[];
    actions: Extensibility.ExtensionPoint<Record<string, any>>[];
  };
  resource?: ResourceData;
}

export default function AppsButton({extensions, resource}: AppsButtonProps) {
  const [active, setActive] = useState(false);
  const clickHandler = useCallback(() => {
    setActive((active) => !active);
  }, [active]);

  const activator = (
    <Button
      icon={AppsMajor}
      outline
      disclosure={active ? 'up' : 'down'}
      onClick={clickHandler}
    >
      Apps
    </Button>
  );

  const links = useMemo(() => {
    return extensions.links.map((extensionPoint) => {
      const {app} = extensionPoint.extension;
      return {
        prefix: <img width="15px" height="15px" src={app.manifest.icon} />,
        content: extensionPoint.manifest.label,
        onAction: () => {
          setActive(false);
          extensionPoint.launch({data: resource});
          // window.open(constructedUrl.toString(), '_blank');
        },
        suffix: <Icon source={LinkMinor} />,
      };
    });
  }, []);

  const actions = useMemo(() => {
    return extensions.actions.map((extensionPoint) => {
      const {app} = extensionPoint.extension;
      return {
        prefix: <img width="15px" height="15px" src={app.manifest.icon} />,
        content: extensionPoint.manifest.label,
        onAction: () => {
          setActive(false);
          extensionPoint.launch({data: resource});
        },
        suffix: <Icon source={AppExtensionMinor} />,
      };
    });
  }, []);

  return (
    <div>
      <Popover active={active} activator={activator} onClose={clickHandler}>
        <ActionList items={[...actions, ...links]} />
      </Popover>
    </div>
  );
}
