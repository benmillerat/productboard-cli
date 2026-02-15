#!/usr/bin/env -S node --loader ts-node/esm --disable-warning=ExperimentalWarning

import { execute } from '@oclif/core'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const currentDir = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(currentDir, '..')

await execute({ development: true, dir: projectRoot })
