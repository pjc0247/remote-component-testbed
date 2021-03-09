const glob = require('glob');
const fs = require('fs');
const path = require('path');
const uuidv4 = require('uuid').v4;
const babel = require('@babel/core');
const tsc = require('typescript');

const isImage = (path) => {
  return [
    '.png',
    '.jpg',
    '.jpeg',
  ].some(x => path.endsWith(x));
};

const FindDeps = (modules, images) => () => {
  return {
    visitor: {
      CallExpression(x) {
        const name = x.node.callee.name;
        const arg0 = x.node.arguments[0];

        if (name === 'require') {
          if (isImage(arg0.value)) {
            x.node.callee.name = 'loadImage';
            images.push(arg0.value);
          } else {
            modules.push(arg0.value);
          }
        }
      }
    }
  };
};

const bundle = (pattern) => {
  const buildId = uuidv4();
  const bundlePath = `bundle_${buildId}`;
  fs.mkdirSync(bundlePath);

  glob(pattern, {}, (er, files) => {
    for (f of files) {
      const name = path.basename(f);

      const ts = tsc.transpile(
        fs.readFileSync(f).toString(),
        {
          jsx: tsc.JsxEmit.React,
          esModuleInterop: true,
        },
      );

      const modules = [];
      const images = [];
      const code = babel.transformSync(
        ts, {
          filename: f,
          presets: ['@babel/preset-env', '@babel/preset-react'],
          plugins: [FindDeps(modules, images)],
        }
      ).code;

      console.log(code);
      console.log(images);

      const imageMap = images.map(x => {
        const key = uuidv4();
        fs.copyFileSync(
          path.resolve(path.dirname(f), x),
          path.join(`${bundlePath}`, key),
        );

        return {
          key,
          fileName: x,
        };
      });

      fs.writeFileSync(
        path.join(`${bundlePath}`, 'component.js'),
        code,
      );
      fs.writeFileSync(
        path.join(`${bundlePath}`, 'images.json'),
        JSON.stringify(imageMap),
      );

      console.log(imageMap);
      
      //fs.writeFileSync(`lib/${prefix}/${name.replace('.tsx', '.js')}`, ts);
    }
  });
};

bundle('src/**/*.tsx');