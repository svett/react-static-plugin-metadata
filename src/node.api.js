const { promisify } = require('util');
const { relative, resolve, extname } = require('path');
const mime = require('mime-types');
const fs = require('fs');
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

async function getFiles(dir) {
  const subdirs = await readdir(dir);
  const files = await Promise.all(subdirs.map(async (subdir) => {
    const res = resolve(dir, subdir);
    return (await stat(res)).isDirectory() ? getFiles(res) : res;
  }));
  return files.reduce((a, f) => a.concat(f), []);
}

export default pluginOptions => ({
  afterExport: async state => {
    const { config: { paths: { DIST } } } = state;
    const metadata = {};

    await getFiles(DIST).then(files => {
       files.forEach((item, index) => {
         const key = relative(DIST, item);
         const mimeType = mime.contentType(extname(item));
         metadata[key] = mimeType;
       });
    });

    const data = JSON.stringify(metadata)
    fs.writeFileSync(DIST + '/metadata.json', data);

    return state
  },
})
