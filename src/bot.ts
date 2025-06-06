import { Bot, Context, Schema, HTTP, Dict } from 'koishi'
import { WsClient } from './ws'
import { MilkyMessageEncoder } from './message'
import { decodeGuild, decodeGuildMember, decodeLoginUser, decodeUser } from './utils'
import { Internal } from './internal'

export class MilkyBot<C extends Context = Context> extends Bot<C, MilkyBot.Config> {
  static inject = {
    required: ['http']
  }
  static MessageEncoder = MilkyMessageEncoder
  http: HTTP
  internal: Internal

  constructor(ctx: C, config: MilkyBot.Config) {
    super(ctx, config, 'milky')
    let headers: Dict
    if (config.token !== undefined && config.token !== '') {
      headers = {
        Authorization: `Bearer ${config.token}`,
        ...config.headers
      }
    } else {
      headers = config.headers
    }
    this.http = ctx.http.extend({
      ...config,
      headers
    })
    this.internal = new Internal(this.http)
    ctx.plugin(WsClient, this)
  }

  async getLogin() {
    const data = await this.internal.getLoginInfo()
    this.user = decodeLoginUser(data)
    return this.toJSON()
  }

  async getGuild(guildId: string) {
    const data = await this.internal.getGroupInfo(+guildId)
    return decodeGuild(data.group)
  }

  async getGuildList(next?: string) {
    const data = await this.internal.getGroupList()
    return { data: data.groups.map(decodeGuild) }
  }

  async getGuildMember(guildId: string, userId: string) {
    const data = await this.internal.getGroupMemberInfo(+guildId, +userId)
    return decodeGuildMember(data.member)
  }

  async getGuildMemberList(guildId: string, next?: string) {
    const data = await this.internal.getGroupMemberList(+guildId)
    return { data: data.members.map(decodeGuildMember) }
  }

  async getFriendList(next?: string) {
    const data = await this.internal.getFriendList()
    return { data: data.friends.map(decodeUser) }
  }
}

export namespace MilkyBot {
  export interface Config extends HTTP.Config, WsClient.Options {
    token?: string
  }

  export const Config: Schema<Config> = Schema.intersect([
    Schema.object({
      token: Schema.string().description('API 访问令牌。').role('secret')
    }),
    HTTP.createConfig('http://127.0.0.1:3000/'),
    WsClient.Options
  ])
}
