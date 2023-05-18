export default function demoManifestsPlugin(): Extensibility.Plugin {
  return {
    name: 'manifests',
    async hostCreated(host) {
      const res = await fetch(
        new URL('../../extensions.json', import.meta.url),
      );
      const manifests =
        (await res.json()) as typeof import('../../extensions.json');
      manifests.forEach((extension) => host.addExtension(extension));
    },
  };
}
