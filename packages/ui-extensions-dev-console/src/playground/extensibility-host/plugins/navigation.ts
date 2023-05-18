export default function navigationPlugin(): Extensibility.Plugin {
  return {
    name: 'navigation',
    instanceCreated(instance) {
      instance.api.expose({
        navigation: {
          onNavigate: () => {},
          navigate: (url: string) => {
            this.host.invoke(url);
          },
        },
      });
    },
  };
}
