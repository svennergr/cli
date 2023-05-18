export default function singleActivatePlugin(): Extensibility.Plugin {
  return {
    name: 'single-activate',

    instanceActivated(instance) {
      const extensionPoints = this.host.findAll({
        target: instance.extensionPoint.target,
      });
      for (const extension of extensionPoints) {
        const inst = extension.activeInstance;
        if (inst && inst !== instance) {
          inst.deactivate();
        }
      }
    },
  };
}
