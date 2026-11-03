import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '../node_modules/@antv/x6');
const hash = (value) => createHash('sha256').update(value).digest('hex');
const norm = (value) => value.replaceAll('\\', '/');

function once(source, before, after, name) {
  const at = source.indexOf(before);
  if (at < 0 || source.indexOf(before, at + before.length) >= 0)
    throw new Error(`CA060 X6 ${name} source pattern mismatch`);
  return source.replace(before, after);
}

const modules = [
  {
    file: 'es/graph/css.js',
    sha: '642cf42d5b09595f316869f7cab8787ad2a2a7f950cca69b5b2b3b26374dc05d',
    update(source) {
      return once(
        source,
        `    init() {
        if (Config.autoInsertCSS) {
            CssLoader.ensure('core', content);
        }
    }
    dispose() {
        CssLoader.clean('core');
    }`,
        `    init() {
        if (!this.coreCSSOwned && Config.autoInsertCSS) {
            this.coreCSSOwned = CssLoader.ensure('core', content);
        }
    }
    dispose() {
        if (this.coreCSSOwned) {
            this.coreCSSOwned = false;
            CssLoader.clean('core');
        }
    }`,
        'manager ownership',
      );
    },
  },
  {
    file: 'es/common/css-loader/index.js',
    sha: '4734baf3bcdff3170e122b5eeb6a1a89ac3d4e4af5c5b0eb48ce3ef872ea7d0e',
    update(source) {
      const acquired = once(
        source,
        `        if (cssModule.loadTimes > 1) {
            return;
        }`,
        `        if (cssModule.loadTimes > 1) {
            return true;
        }`,
        'existing reference',
      );
      return once(
        acquired,
        `        cssModules.push({
            name,
            loadTimes: 1,
            styleElement,
        });
    }
}
export function clean`,
        `        cssModules.push({
            name,
            loadTimes: 1,
            styleElement,
        });
        return true;
    }
    return false;
}
export function clean`,
        'HMR acquisition',
      );
    },
  },
];

// Same verified correction in both production builds and real-X6 test bundle.
export function x6CSSLifecyclePlugin() {
  const version = JSON.parse(
    readFileSync(resolve(root, 'package.json'), 'utf8'),
  ).version;
  if (version !== '3.1.8')
    throw new Error(`CA060 unreviewed X6 version ${version}`);
  const expected = new Map(
    modules.map((spec) => {
      const file = resolve(root, spec.file);
      if (hash(readFileSync(file)) !== spec.sha)
        throw new Error(`CA060 unreviewed X6 source ${spec.file}`);
      return [norm(file), spec];
    }),
  );
  const seen = new Set();
  return {
    name: 'ca060-x6-core-css-lifecycle',
    enforce: 'pre',
    transform(source, id) {
      const spec = expected.get(norm(id.split('?')[0]));
      if (!spec) return;
      if (seen.has(spec.file) || hash(source) !== spec.sha)
        throw new Error(`CA060 changed/duplicate X6 transform ${spec.file}`);
      seen.add(spec.file);
      return { code: spec.update(source), map: null };
    },
    generateBundle() {
      for (const { file } of modules)
        if (!seen.has(file))
          throw new Error(`CA060 missing X6 module transform ${file}`);
    },
  };
}
