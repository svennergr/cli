export default function disambiguationUiPlugin(): Extensibility.Plugin {
  return {
    name: 'disambiguate-ui',

    // Note: could also use expose() to decouple UI impl from plugin
    // function Dialog() {
    //   const host = useExtensibilityHost();
    //   const api = host.pluginApi['disambiguation-ui'];
    //   const list = api.launchables.value
    //   return list ? <disambiguationUi list={list} onDone={api.done} /> : null;
    // }
    // expose() {
    //   return {
    //     launchables: signal<Launchables[] | undefined>(),
    //     done(launchable: Launchable|void): void
    //   }
    // },

    async resolveLaunchable(launchables, {url}) {
      // try to grab a user-readable "type" from the URL
      const type = new URL(String(url).replace(/^intent:/, '')).pathname

      // const ext = this.find({id: 'disambiguation-ui'});
      const ext = this.find({appHandle: 'disambiguation-ui'})
      if (!ext) return

      // there are 2 or more resolutions - show disambiguation modal to pick one:
      return new Promise((resolve, reject) => {
        const inst = ext.launch({
          data: {
            type,
            list: launchables,
            async onChoose(launchable?: Extensibility.Launchable) {
              // (await inst)?.terminate();
              // just background the modal, no need to actually destroy it
              // (await inst).state.value = 'inactive';
              ;(await inst).deactivate()
              resolve(launchable)
            },
          },
        })
      })
    },
  }
}
