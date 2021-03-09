import React, { useEffect, useRef, useState } from 'react';
import RNFetchBlob from 'rn-fetch-blob';

const evalInContext = (js: string, context: object) => {
  return function() { return eval(js); }.call(context);
}

type RemoteComponentProps = {
  url: string;
};
export const RemoteComponent = ({
  url,
}: RemoteComponentProps) => {
  const [loading, setLoading] = useState(true);
  const [Impl, setImpl] = useState(<></>);
  const cache = useRef<Record<string, string>>({});

  useEffect(() => {
    (async () => {
      await loadImageMap();
      await loadComponent();

      setLoading(false);
    })();
  }, []);

  const loadImageMap = async () => {
    const resp = await fetch(`${url}/images.json`);
    const imageMap = await resp.json();

    await Promise.all(
      imageMap.map((x: any) => addCache(x.fileName, x.key)),
    );
  };
  const loadComponent = async () => {
    const resp = await fetch(`${url}/component.js`);
    const js = await resp.text();

    const Component = evalInContext(`
const require = this.require;
const loadImage = this.loadImage;
${js}
  `, {
      loadImage: (x: string) => {
        if (cache.current[x]) {
          return { uri: 'file://' + cache.current[x] };
        }
        return {};
      },
      require: (x: string) => {
        if (x === 'react') return require('react');
        if (x === 'react-native') return require('react-native');
        return null;
      },
    })();

    setImpl(Component);
  };
  const addCache = async (fileName: string, key: string) => {
    const resp = await RNFetchBlob
      .config({
        fileCache : true,
      })
      .fetch('GET', `${url}/${key}`, {});
    cache.current[fileName] = resp.path();
  };

  if (loading)
    return <></>;
  return Impl;
};
