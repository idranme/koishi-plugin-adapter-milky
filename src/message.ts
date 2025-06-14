import { Context, Dict, h, MessageEncoder } from 'koishi'
import { MilkyBot } from './bot'
import { Segment } from './types'

export const PRIVATE_PFX = 'private:'

export class MilkyMessageEncoder<C extends Context = Context> extends MessageEncoder<C, MilkyBot<C>> {
  private segments: Segment[] = []

  async flush() {
    let resp: { message_seq: number, time: number, client_seq?: number }
    if (this.channelId.startsWith(PRIVATE_PFX)) {
      let userId = this.channelId.slice(PRIVATE_PFX.length)
      if (userId.startsWith('temp_')) {
        userId = this.channelId.slice('temp_'.length)
      }
      resp = await this.bot.internal.sendPrivateMessage(+userId, this.segments)
    } else {
      resp = await this.bot.internal.sendGroupMessage(+this.channelId, this.segments)
    }
    const session = this.bot.session()
    session.messageId = resp.message_seq.toString()
    session.timestamp = resp.time * 1000
    session.userId = this.session.selfId
    session.channelId = this.session.channelId
    session.guildId = this.session.guildId
    session.app.emit(session, 'send', session)
    this.results.push(session.event.message)
    this.segments = []
  }

  async visit(element: h) {
    const { type, attrs, children } = element
    if (type === 'text') {
      this.segments.push({
        type: 'text',
        data: {
          text: attrs.content
        }
      })
    } else if (type === 'at') {
      if (attrs.type === 'all') {
        this.segments.push({
          type: 'mention_all',
          data: {}
        })
      } else {
        this.segments.push({
          type: 'mention',
          data: {
            user_id: +attrs.id
          }
        })
      }
    } else if (type === 'img' || type === 'image') {
      let uri = attrs.src
      const cap = /^data:([\w/.+-]+);base64,/.exec(uri)
      if (cap) uri = 'base64://' + uri.slice(cap[0].length)
      this.segments.push({
        type: 'image',
        data: {
          uri,
          sub_type: 'normal'
        }
      })
    } else if (type === 'audio') {
      let uri = attrs.src
      const cap = /^data:([\w/.+-]+);base64,/.exec(uri)
      if (cap) uri = 'base64://' + uri.slice(cap[0].length)
      this.segments.push({
        type: 'record',
        data: {
          uri
        }
      })
    } else if (type === 'quote') {
      this.segments.push({
        type: 'reply',
        data: {
          message_seq: +attrs.id
        }
      })
    } else {
      await this.render(children)
    }
  }
}
