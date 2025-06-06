import { Dict } from 'koishi'

export interface ApiResponse<T = Dict> {
  status: 'ok' | 'failed'
  retcode: number
  data: T
  message?: string
}

export interface Events {
  message_receive: IncomingMessage
  bot_offline: BotOfflineData
}

export type Event = {
  [K in keyof Events]: {
    time: number
    self_id: number
    event_type: K
    data: Events[K]
  }
}[keyof Events]

export interface BotOfflineData {
  reason: string
}

export interface FriendCategory {
  category_id: number
  category_name: string
}

export interface Friend {
  user_id: number
  qid?: string
  nickname: string
  sex: 'male' | 'female' | 'unknown'
  remark: string
  category?: FriendCategory
}

export interface Group {
  group_id: number
  name: string
  member_count: number
  max_member_count: number
}

export interface GroupMember {
  group_id: number
  user_id: number
  nickname: string
  card: string
  title?: string
  sex: 'male' | 'female' | 'unknown'
  level: number
  role: 'owner' | 'admin' | 'member'
  join_time: number
  last_sent_time: number
}

export interface Segment {
  type: string
  data: Dict
}

export interface IncomingMessage {
  peer_id: number
  message_seq: number
  sender_id: number
  time: number
  segments: Segment[]
  message_scene: 'friend' | 'group' | 'temp'
  friend?: Friend
  client_seq?: number
  group?: Group
  group_member?: GroupMember
}

export interface LoginInfo {
  uin: number
  nickname: string
}
