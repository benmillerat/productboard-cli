import { Args, Flags } from '@oclif/core'

import { commonFlags } from '../../../core/base-command.js'
import { outputResult } from '../../../core/output.js'
import {
  extractResource,
  parseJsonObject,
  resourceQuietId,
} from '../../../core/resource-helpers.js'
import type { ResourceRecord, ResourceResponse } from '../../../core/resource-helpers.js'
import { V2BaseCommand } from '../../../core/v2-base-command.js'

export default class V2NotesUpdate extends V2BaseCommand {
  public static override description = 'Update a Productboard v2 beta note'

  public static override args = {
    id: Args.string({ description: 'Note ID', required: true }),
  }

  public static override flags = {
    ...commonFlags,
    data: Flags.string({
      description: 'Patch payload as JSON object',
      required: true,
    }),
  }

  public override async run(): Promise<void> {
    const { args, flags } = await this.parse(V2NotesUpdate)
    const runtime = await this.initRuntime(flags)

    const body = parseJsonObject(flags.data, '--data')
    const endpoint = `/v2/notes/${encodeURIComponent(args.id)}`

    const response = await runtime.client.patch<ResourceResponse<ResourceRecord>>(endpoint, body)
    const resource = extractResource(response)

    outputResult(this.log, resource, {
      format: runtime.output,
      quiet: runtime.quiet,
      quietValue: resourceQuietId(resource, args.id),
    })
  }
}
