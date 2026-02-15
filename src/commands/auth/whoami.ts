import { BaseCommand, commonFlags } from '../../core/base-command.js'
import { outputResult } from '../../core/output.js'

interface WhoAmIIdentity {
  id?: string
  email?: string
  name?: string
  [key: string]: unknown
}

interface WhoAmIResponse extends WhoAmIIdentity {
  data?: WhoAmIIdentity
}

export default class AuthWhoAmI extends BaseCommand {
  public static override description = 'Call Productboard /user/me and display current identity'

  public static override flags = {
    ...commonFlags,
  }

  public override async run(): Promise<void> {
    const { flags } = await this.parse(AuthWhoAmI)
    const runtime = await this.initRuntime(flags)

    const response = await runtime.client.get<WhoAmIResponse>('/user/me')
    const identity: WhoAmIIdentity = response.data ?? response

    outputResult(this.log, identity, {
      format: runtime.output,
      quiet: runtime.quiet,
      quietValue: identity.email ?? identity.id,
    })
  }
}
