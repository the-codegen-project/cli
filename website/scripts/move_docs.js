const path = require('path');
const { cp } = require('fs/promises');
const DOCS_ROOT_PATH = path.join(__dirname, '../../docs');
const DOCS_DOCU_PATH = path.join(__dirname, '../docs');

const ASSETS_ROOT_PATH = path.join(__dirname, '../../assets');
const ASSETS_DOCU_PATH = path.join(__dirname, '../static/assets');

cp(DOCS_ROOT_PATH, DOCS_DOCU_PATH, {recursive: true});
cp(ASSETS_ROOT_PATH, ASSETS_DOCU_PATH, {recursive: true});