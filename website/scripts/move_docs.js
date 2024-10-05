const path = require('path');
const { cp } = require('fs/promises');
const DOCS_ROOT_PATH = path.join(__dirname, '../../docs');
const DOCS_DOCU_PATH = path.join(__dirname, '../docs');

cp(DOCS_ROOT_PATH, DOCS_DOCU_PATH, {recursive: true});