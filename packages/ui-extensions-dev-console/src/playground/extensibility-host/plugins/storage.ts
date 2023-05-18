import {get, set} from 'idb-keyval';

export default function storagePlugin(): Extensibility.Plugin {
  return {
    name: 'storage',
    hostCreated(host) {},
    instanceCreated(instance) {
      function createKey(id: string) {
        return `${instance.extensionPoint.id}:${id}`;
      }

      instance.api.expose({
        storage: {
          async get(key: string) {
            const str = await get(createKey(key));
            if (!str) return null;
            return JSON.parse(str);
          },
          async set<T extends object>(key: string, value: T) {
            await set(createKey(key), JSON.stringify(value));
          },
        },
      });
    },
  };
}
