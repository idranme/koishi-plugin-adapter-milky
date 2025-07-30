import { Context, Universal, h, Session } from 'koishi'
import { Event, Events, Friend, Group, LoginInfo, GroupMember, IncomingMessage } from './types'
import { MilkyBot } from './bot'

export function decodeGuild(group: Group): Universal.Guild {
  return {
    id: String(group.group_id),
    name: group.name,
    avatar: `https://p.qlogo.cn/gh/${group.group_id}/${group.group_id}/640`
  }
}

export function decodeGuildMember(member: GroupMember): Universal.GuildMember {
  return {
    user: {
      id: String(member.user_id),
      name: member.nickname,
      avatar: `http://q.qlogo.cn/headimg_dl?dst_uin=${member.user_id}&spec=640`
    },
    nick: member.card || member.nickname,
    avatar: `http://q.qlogo.cn/headimg_dl?dst_uin=${member.user_id}&spec=640`,
    joinedAt: member.join_time * 1000
  }
}

export function decodeUser(friend: Friend): Universal.User {
  return {
    id: String(friend.user_id),
    name: friend.nickname,
    avatar: `http://q.qlogo.cn/headimg_dl?dst_uin=${friend.user_id}&spec=640`
  }
}

export function decodeLoginUser(user: LoginInfo): Universal.User {
  return {
    id: String(user.uin),
    name: user.nickname,
    avatar: `http://q.qlogo.cn/headimg_dl?dst_uin=${user.uin}&spec=640`
  }
}

export function decodeGuildChannelId(data: IncomingMessage): [string | undefined, string] {
  if (data.message_scene === 'group') {
    return [String(data.peer_id), String(data.peer_id)]
  } else if (data.message_scene === 'temp') {
    return [undefined, 'private:temp_' + data.peer_id]
  } else {
    return [undefined, 'private:' + data.peer_id]
  }
}

export async function decodeMessage<C extends Context = Context>(
  bot: MilkyBot<C>,
  input: IncomingMessage,
  message: Universal.Message = {},
  payload: Universal.MessageLike = message
) {
  const [guildId, channelId] = decodeGuildChannelId(input)

  const elements: h[] = []
  for (const segment of input.segments) {
    const { type, data } = segment
    switch (type) {
      case 'text':
        elements.push(h.text(data.text))
        break
      case 'mention':
        elements.push(h.at(data.user_id.toString()))
        break
      case 'mention_all':
        elements.push(h('at', { type: 'all' }))
        break
      case 'reply':
        message.quote = await bot.getMessage(channelId, data.message_seq.toString())
        break
      case 'image':
        elements.push(h.image(data.temp_url))
        break
      case 'record':
        elements.push(h.audio(data.temp_url))
        break
      case 'video':
        elements.push(h.video(data.temp_url))
        break
    }
  }

  message.elements = elements
  message.content = elements.join('')
  message.id = input.message_seq.toString()

  payload.channel = {
    id: channelId,
    name: guildId ? input.group.name : input.friend?.nickname,
    type: guildId ? Universal.Channel.Type.TEXT : Universal.Channel.Type.DIRECT
  }
  payload.guild = guildId && {
    id: guildId,
    name: input.group.name,
    avatar: `https://p.qlogo.cn/gh/${guildId}/${guildId}/640`
  }
  payload.user = {
    id: input.sender_id.toString(),
    name: guildId ? input.group_member.nickname : input.friend?.nickname,
    avatar: `http://q.qlogo.cn/headimg_dl?dst_uin=${input.sender_id}&spec=640`
  }
  payload.member = guildId && {
    user: payload.user,
    nick: input.group_member.card || input.group_member.nickname,
    avatar: `http://q.qlogo.cn/headimg_dl?dst_uin=${input.sender_id}&spec=640`,
    joinedAt: input.group_member.join_time * 1000
  }
  payload.timestamp = input.time * 1000
  return message
}

export async function adaptSession<C extends Context>(bot: MilkyBot<C>, body: Event) {
  const session = bot.session()
  session.setInternal('milky', body.data)

  switch (body.event_type) {
    case 'message_receive':
      session.type = 'message'
      await decodeMessage(bot, body.data, session.event.message = {}, session.event)
      break
  }

  if (session.type) return session
}
