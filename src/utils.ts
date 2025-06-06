import { Context, Universal, h, Session } from 'koishi'
import { Event, Events, Friend, Group, LoginInfo, GroupMember } from './types'
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

export function decodeGuildChannelId(data: Events['message_receive']): [string | undefined, string] {
  if (data.message_scene === 'group') {
    return [String(data.peer_id), String(data.peer_id)]
  } else if (data.message_scene === 'temp') {
    return [undefined, 'private:temp_' + data.peer_id]
  } else {
    return [undefined, 'private:' + data.peer_id]
  }
}

export function adaptMessage<C extends Context = Context>(
  bot: MilkyBot<C>,
  data: Events['message_receive'],
  session: Session,
) {
  const elements: h[] = []
  for (const segment of data.segments) {
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

  session.elements = elements
  session.timestamp = data.time * 1000
  session.messageId = data.message_seq.toString()

  const [guildId, channelId] = decodeGuildChannelId(data)
  session.event.channel = {
    id: channelId,
    name: guildId ? data.group.name : data.friend?.nickname,
    type: guildId ? Universal.Channel.Type.TEXT : Universal.Channel.Type.DIRECT
  }
  session.event.guild = guildId && {
    id: guildId,
    name: data.group.name,
    avatar: `https://p.qlogo.cn/gh/${guildId}/${guildId}/640`
  }
  session.event.user = {
    id: data.sender_id.toString(),
    name: guildId ? data.group_member.nickname : data.friend?.nickname,
    avatar: `http://q.qlogo.cn/headimg_dl?dst_uin=${data.sender_id}&spec=640`
  }
  session.event.member = guildId && {
    user: session.event.user,
    nick: data.group_member.card || data.group_member.nickname,
    avatar: `http://q.qlogo.cn/headimg_dl?dst_uin=${data.sender_id}&spec=640`,
    joinedAt: data.group_member.join_time * 1000
  }
}

export async function adaptSession<C extends Context>(bot: MilkyBot<C>, body: Event) {
  const session = bot.session()
  session.setInternal('milky', body.data)

  switch (body.event_type) {
    case 'message_receive':
      session.type = 'message'
      adaptMessage(bot, body.data, session)
      break
  }

  if (session.type) return session
}
