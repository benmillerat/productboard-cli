#!/usr/bin/env node

import { execute } from '@oclif/core'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const currentDir = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(currentDir, '..')

await execute({ dir: projectRoot })
