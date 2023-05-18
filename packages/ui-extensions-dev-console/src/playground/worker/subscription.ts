import type {RemoteSubscribable} from '@remote-ui/async-subscription';

export type LocationSubscribableProps = Pick<
  Location,
  'pathname' | 'hash' | 'search'
>;

export interface Subscription<Value> {
  get value(): Value;
  set value(newValue: Value);
  subscriber: (newValue: Value) => void;
}

export interface Subscriptions {
  location: Subscription<LocationSubscribableProps>;
}

export interface Subscribables {
  location: RemoteSubscribable<LocationSubscribableProps>;
}

/**
 * @param intialValue
 * @param onUpdate optional handler to be called when the value is updated
 * @returns an object initialized with the provided initial value and a subscriber method
 * that can be called to update the object's value
 */
export function createSubscription<Value>(
  intialValue: Value,
  onUpdate?: (value: Value) => void,
) {
  let value = intialValue;

  const subscription: Subscription<Value> = {
    subscriber(newValue: any) {
      subscription.value = newValue;
      onUpdate?.(newValue);
    },

    get value() {
      return value;
    },

    set value(newValue) {
      value = newValue;
    },
  };

  return subscription;
}

/**
 * Connect each subscription's subscriber function to each subscribable.subscribe method
 */
export function connectSubscribables(
  subscriptions: Subscriptions,
  subscribables: Subscribables,
) {
  Object.keys(subscribables).forEach((key) => {
    const castedKey = key as keyof typeof subscriptions;
    subscriptions[castedKey].value = subscribables[castedKey].initial;

    subscribables[castedKey].subscribe(subscriptions[castedKey].subscriber);
  });
}
