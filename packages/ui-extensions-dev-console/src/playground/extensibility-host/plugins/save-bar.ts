import {computed, signal, type Signal} from '@preact/signals-core';

interface SaveCallback {
  (event: SaveEvent): Promise<boolean> | boolean;
}

interface ResetCallback {
  (): void;
}

class SaveEvent {
  createProgress() {
    throw Error('Not implemented');
  }
}

export default function saveBarPlugin(): Extensibility.Plugin {
  const saveApis = signal<ReadonlyArray<SaveApi>>([]);

  return {
    name: 'saveBar',
    expose(host, instance) {
      // Not yet used - see note below
      if (instance) {
        return saveApis.value.find((api) => api.instance === instance)!;
      }
      return new GlobalSaveApi(saveApis);
    },
    instanceCreated(instance) {
      const saveApi = new SaveApi(instance);
      saveApis.value = saveApis.value.concat(saveApi);

      // note: we don't currently call `expose()` on instances for extensions
      // for now, I'm emulating what would happen if we applied expose() to both instance and host.
      instance.pluginApi.saveBar = saveApi;

      // Define the Save Bar API
      instance.api.expose({
        setDirtyState(dirty = true) {
          saveApi.setDirtyState(dirty);
        },
        onReset(resetCallback: ResetCallback) {
          saveApi.addResetCallback(resetCallback);
        },
        onSave(saveCallback: SaveCallback) {
          saveApi.addSaveCallback(saveCallback);
        },
      });
    },
    instanceTerminated(instance) {
      saveApis.value = saveApis.value.filter(
        (api) => api.instance !== instance,
      );
    },
  };
}

/**
 * The host-side Save Bar API on a single Instance.
 * Exposed as `instance.pluginApis.saveBar`.
 */
class SaveApi {
  protected dirty = signal(false);
  protected saving = signal(false);
  private resetCallbacks: ResetCallback[] = [];
  private saveCallbacks: SaveCallback[] = [];

  constructor(public instance?: Extensibility.Instance) {}

  isDirty() {
    return this.dirty.value;
  }

  isSaving() {
    return this.saving.value;
  }

  async reset() {
    await Promise.all(this.resetCallbacks.map((fn) => fn()));
  }

  async save() {
    if (!this.isDirty()) return true;
    this.saving.value = true;
    const results = await Promise.all(
      this.saveCallbacks.map((fn) => fn(new SaveEvent())),
    );
    this.dirty.value = false;
    this.saving.value = false;
    return results.every(Boolean);
  }

  addSaveCallback(saveCallback: SaveCallback) {
    this.saveCallbacks.push(saveCallback);
  }

  addResetCallback(resetCallback: ResetCallback) {
    this.resetCallbacks.push(resetCallback);
  }

  setDirtyState(dirty = true) {
    this.dirty.value = dirty === true;
  }
}

/**
 * The host-side _global_ Save Bar API.
 * Exposed as `host.pluginApis.saveBar`.
 */
class GlobalSaveApi extends SaveApi {
  protected saving = computed(() =>
    this.saveApis.value.some((api) => api.isSaving()),
  );

  protected dirty = computed(() =>
    this.saveApis.value.some((api) => api.isDirty()),
  );

  constructor(private saveApis: Signal<ReadonlyArray<SaveApi>>) {
    super();
  }

  async reset() {
    await Promise.all(this.saveApis.value.map((api) => api.reset()));
  }

  async save() {
    const results = await Promise.all(
      this.saveApis.value.map(async (api) => {
        try {
          return {instance: api.instance, result: await api.save()};
        } catch (error) {
          return {instance: api.instance, error};
        }
      }),
    );
    const errors = results.filter(({error}) => error);
    if (errors.length > 0) {
      const error = Error('Error saving');
      Object.defineProperty(error, 'errors', {value: errors});
      throw error;
    }
    return results.every(({result}) => result);
  }

  getDirtyInstances() {
    return this.saveApis.value
      .filter((api) => api.isDirty())
      .map((api) => api.instance);
  }
}
