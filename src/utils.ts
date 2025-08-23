import { Context, Universal, h } from 'koishi'
import { MilkyBot } from './bot'
import { Event, FriendEntity, GetLoginInfoOutput, GetUserProfileOutput, GroupEntity, GroupMemberEntity, IncomingMessage } from '@saltify/milky-types'

export function decodeGroupChannel(group: GroupEntity): Universal.Channel {
  return {
    id: String(group.group_id),
    type: Universal.Channel.Type.TEXT,
    name: group.group_name
  }
}

export function decodePrivateChannel(user: GetUserProfileOutput, id: string): Universal.Channel {
  return {
    id,
    type: Universal.Channel.Type.DIRECT,
    name: user.nickname
  }
}

export function decodeGuild(group: GroupEntity): Universal.Guild {
  return {
    id: String(group.group_id),
    name: group.group_name,
    avatar: `https://p.qlogo.cn/gh/${group.group_id}/${group.group_id}/640`
  }
}

export function decodeGuildMember(member: GroupMemberEntity): Universal.GuildMember {
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

export function decodeUser(user: GetUserProfileOutput, id: string): Universal.User {
  return {
    id,
    name: user.nickname,
    avatar: `http://q.qlogo.cn/headimg_dl?dst_uin=${id}&spec=640`
  }
}

export function decodeFriend(friend: FriendEntity): Universal.User {
  return {
    id: String(friend.user_id),
    name: friend.nickname,
    avatar: `http://q.qlogo.cn/headimg_dl?dst_uin=${friend.user_id}&spec=640`
  }
}

export function decodeLoginUser(user: GetLoginInfoOutput): Universal.User {
  return {
    id: String(user.uin),
    name: user.nickname,
    avatar: `http://q.qlogo.cn/headimg_dl?dst_uin=${user.uin}&spec=640`
  }
}

export function decodeGuildChannelId(data: { message_scene: 'friend' | 'group' | 'temp', peer_id: number }): [string | undefined, string] {
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

  payload.timestamp = input.time * 1000
  payload.channel = {
    id: channelId,
    type: guildId ? Universal.Channel.Type.TEXT : Universal.Channel.Type.DIRECT
  }
  payload.user = {
    id: input.sender_id.toString(),
    avatar: `http://q.qlogo.cn/headimg_dl?dst_uin=${input.sender_id}&spec=640`
  }
  if (input.message_scene === 'group') {
    payload.guild = {
      id: guildId,
      name: input.group.group_name,
      avatar: `https://p.qlogo.cn/gh/${guildId}/${guildId}/640`
    }
    payload.member = {
      user: payload.user,
      nick: input.group_member.card || input.group_member.nickname,
      avatar: `http://q.qlogo.cn/headimg_dl?dst_uin=${input.sender_id}&spec=640`,
      joinedAt: input.group_member.join_time * 1000
    }
    payload.channel.name = input.group.group_name
    payload.user.name = input.group_member.nickname
  } else if (input.message_scene === 'friend') {
    payload.channel.name = input.friend.nickname
    payload.user.name = input.friend.nickname
  }
  return message
}

export async function adaptSession<C extends Context>(bot: MilkyBot<C>, body: Event) {
  const session = bot.session()
  session.setInternal('milky', body)

  switch (body.event_type) {
    case 'message_receive': {
      session.type = 'message'
      await decodeMessage(bot, body.data, session.event.message = {}, session.event)
      break
    }
    case 'message_recall': {
      const [guildId, channelId] = decodeGuildChannelId(body.data)
      session.type = 'message-deleted'
      session.userId = String(body.data.sender_id)
      session.isDirect = body.data.message_scene !== 'group'
      session.channelId = channelId
      session.guildId = guildId
      session.messageId = String(body.data.message_seq)
      session.timestamp = body.time * 1000
      break
    }
    case 'friend_request': {
      session.type = 'friend-request'
      session.userId = String(body.data.initiator_id)
      session.channelId = `private:${session.userId}`
      session.messageId = `${body.data.initiator_uid}|0`
      session.timestamp = body.time * 1000
      break
    }
    case 'group_join_request': {
      session.type = 'guild-member-request'
      session.userId = String(body.data.initiator_id)
      session.channelId = String(body.data.group_id)
      session.guildId = String(body.data.group_id)
      session.messageId = `${body.data.notification_seq}|${body.data.is_filtered ? 1 : 0}`
      session.timestamp = body.time * 1000
      break
    }
    case 'group_invited_join_request': {
      session.type = 'guild-member-request'
      session.userId = String(body.data.target_user_id)
      session.channelId = String(body.data.group_id)
      session.guildId = String(body.data.group_id)
      session.messageId = `${body.data.notification_seq}|0`
      session.timestamp = body.time * 1000
      break
    }
    case 'group_invitation': {
      session.type = 'guild-request'
      session.userId = String(body.data.initiator_id)
      session.channelId = String(body.data.group_id)
      session.guildId = String(body.data.group_id)
      session.messageId = `${body.data.invitation_seq}|0`
      session.timestamp = body.time * 1000
      break
    }
    case 'group_member_increase': {
      session.type = 'guild-member-added'
      session.userId = String(body.data.user_id)
      session.channelId = String(body.data.group_id)
      session.guildId = String(body.data.group_id)
      session.timestamp = body.time * 1000
      break
    }
    case 'group_member_decrease': {
      session.type = 'guild-member-removed'
      session.userId = String(body.data.user_id)
      session.channelId = String(body.data.group_id)
      session.guildId = String(body.data.group_id)
      session.timestamp = body.time * 1000
      break
    }
  }

  if (session.type) return session
}

export function getSceneAndPeerId(channelId: string): ['friend' | 'group' | 'temp', number] {
  let scene: 'friend' | 'group' | 'temp'
  let peerId: number
  if (channelId.startsWith('private:temp_')) {
    scene = 'temp'
    peerId = +channelId.replace('private:temp_', '')
  } else if (channelId.startsWith('private:')) {
    scene = 'friend'
    peerId = +channelId.replace('private:', '')
  } else {
    scene = 'group'
    peerId = +channelId
  }
  return [scene, peerId]
}
