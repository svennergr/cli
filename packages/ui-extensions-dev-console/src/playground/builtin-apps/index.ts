import {type ComponentType} from 'react';

// walk the filesystem for built-in apps
const globbed = import.meta.glob('./*/index.*');
const screens: {[key: string]: () => Promise<{default: ComponentType}>} = {};
for (const path in globbed) {
  if (Object.hasOwn(globbed, path)) {
    const name = path.replace(/^\.\/|(\/index)?\.[jt]sx?$/g, '').toLowerCase();
    screens[name] = globbed[path] as any;
  }
}
export default screens;
