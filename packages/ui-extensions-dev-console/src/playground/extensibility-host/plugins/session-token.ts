const KEY = 'playground-sessiontoken';

export default function sessionTokenPlugin(): Extensibility.Plugin {
  return {
    name: 'sessionToken',
    hostCreated(host) {
      sessionStorage.setItem(
        KEY,
        sessionStorage.getItem(KEY) ?? crypto.randomUUID(),
      );
    },
    instanceCreated(instance) {
      instance.api.expose({
        sessionToken: {
          get() {
            return sessionStorage.getItem(KEY);
          },
        },
      });
    },
  };
}
