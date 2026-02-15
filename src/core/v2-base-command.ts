import { BaseCommand } from './base-command.js'
import { PRODUCTBOARD_API_VERSION_V2 } from './http.js'
import type { RuntimeContext } from './base-command.js'

export abstract class V2BaseCommand extends BaseCommand {
  protected override async initRuntime(flags: {
    token?: string
    profile?: string
    output?: string
    quiet?: boolean
    'api-url'?: string
  }): Promise<RuntimeContext> {
    return super.initRuntime(flags, { apiVersion: PRODUCTBOARD_API_VERSION_V2 })
  }
}
