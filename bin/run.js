#!/usr/bin/env -S node --loader ts-node/esm --no-warnings=ExperimentalWarning

import {execute} from '@oclif/core';
await execute({dir: import.meta.url});
