import type {Subscriptions} from './subscriptions';

const FIXED_ORIGIN_FOR_URL_PARSING = 'http://fixed_origin_for_url_parsing.com';

const ABSOLUTE_URL_REGEX = /^([a-z0-9]*:|.{0})\/\/.*$/;

function getCompletePathname(url: string) {
  if (url.match(ABSOLUTE_URL_REGEX)) {
    throw Error(
      `Provided url "${url}" is invalid. Only relative urls are supported`,
    );
  }

  if (url?.startsWith('#')) {
    return `${location.pathname}${location.search || ''}${url}`;
  }

  if (url?.startsWith('?')) {
    return `${location.pathname}${url}${location.hash || ''}`;
  }

  try {
    const parsedUrl = new URL(url, FIXED_ORIGIN_FOR_URL_PARSING);

    if (parsedUrl.origin !== FIXED_ORIGIN_FOR_URL_PARSING) {
      throw Error();
    }

    parsedUrl.search = parsedUrl.search || location.search;
    parsedUrl.hash = parsedUrl.hash || location.hash;

    return parsedUrl.toString().replace(FIXED_ORIGIN_FOR_URL_PARSING, '');
  } catch (error) {
    throw Error(
      `Provided url "${url}" is invalid. Only relative urls are supported`,
    );
  }
}

function normalizePathname(pathname: string) {
  return pathname?.startsWith('/') ? pathname : `/${pathname}`;
}

function normalizeHash(hash: string) {
  return hash?.startsWith('#') ? hash : `#${hash}`;
}

function normalizeSearch(search: string) {
  return search?.startsWith('?') ? search : `?${search}`;
}

export function createHistory(
  navigate: (path: string, options?: {replace?: boolean}) => void,
) {
  const navigateTo = (path: string, options?: {replace?: boolean}) => {
    navigate(path, options);
  };

  return {
    get state() {
      return null;
    },
    pushState(_state: any, _title = '', url?: string) {
      if (url) {
        navigateTo(getCompletePathname(url));
      }
    },
    replaceState(_state: any, _title = '', url?: string) {
      if (url) {
        navigateTo(getCompletePathname(url), {replace: true});
      }
    },
  };
}

export interface To {
  search: string;
  pathname: string;
  hash: string;
}

export function createLocation(
  history: ReturnType<typeof createHistory>,
  location: Subscriptions['location'],
) {
  function pushPathname(pathname: string) {
    history.pushState(null, '', pathname);
  }

  function replacePathname(pathname: string) {
    history.replaceState(null, '', pathname);
  }

  return {
    get() {
      return {
        set pathname(pathname: string) {
          pushPathname(normalizePathname(pathname));
        },
        get pathname() {
          return location.value.pathname;
        },
        set hash(hash: string) {
          pushPathname(normalizeHash(hash));
        },
        get hash() {
          return location.value.hash;
        },
        set search(search: string) {
          pushPathname(normalizeSearch(search));
        },
        get search() {
          return location.value.search;
        },
        assign: pushPathname,
        replace: replacePathname,
      };
    },
    set(location: string) {
      pushPathname(location);
    },
  };
}
