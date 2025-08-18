import { Dict, HTTP } from 'koishi'
import { GetCookiesOutput, GetCSRFTokenOutput, GetForwardedMessagesOutput, GetFriendInfoOutput, GetFriendListOutput, GetFriendRequestsOutput, GetGroupAnnouncementListOutput, GetGroupEssenceMessagesOutput, GetGroupInfoOutput, GetGroupListOutput, GetGroupMemberInfoOutput, GetGroupMemberListOutput, GetGroupNotificationsOutput, GetHistoryMessagesOutput, GetImplInfoOutput, GetLoginInfoOutput, GetMessageOutput, GetResourceTempUrlOutput, GetUserProfileOutput, OutgoingSegment, SendGroupMessageOutput, SendPrivateMessageOutput, UploadGroupFileOutput, UploadPrivateFileOutput } from '@saltify/milky-types'

interface ApiResponse<T = Dict> {
  status: 'ok' | 'failed'
  retcode: number
  data: T
  message?: string
}

export class Internal {
  constructor(private http: HTTP) { }

  async #request<T>(urlPath: string, data?: any) {
    const res = await this.http.post<ApiResponse<T>>(urlPath, data ?? {})
    if (res.status === 'failed') {
      throw new Error(res.message)
    } else {
      return res.data
    }
  }

  /** 获取登录信息 */
  async getLoginInfo() {
    return await this.#request<GetLoginInfoOutput>('/api/get_login_info', {})
  }

  /** 获取协议端信息 */
  async getImplInfo() {
    return await this.#request<GetImplInfoOutput>('/api/get_impl_info', {})
  }

  /** 获取用户个人信息 */
  async getUserProfile(user_id: number) {
    return await this.#request<GetUserProfileOutput>('/api/get_user_profile', { user_id })
  }

  /** 获取好友列表 */
  async getFriendList(no_cache?: boolean) {
    return await this.#request<GetFriendListOutput>('/api/get_friend_list', { no_cache })
  }

  /** 获取好友信息 */
  async getFriendInfo(user_id: number, no_cache?: boolean) {
    return await this.#request<GetFriendInfoOutput>('/api/get_friend_info', { user_id, no_cache })
  }

  /** 获取群列表 */
  async getGroupList(no_cache?: boolean) {
    return await this.#request<GetGroupListOutput>('/api/get_group_list', { no_cache })
  }

  /** 获取群信息 */
  async getGroupInfo(group_id: number, no_cache?: boolean) {
    return await this.#request<GetGroupInfoOutput>('/api/get_group_info', { group_id, no_cache })
  }

  /** 获取群成员列表 */
  async getGroupMemberList(group_id: number, no_cache?: boolean) {
    return await this.#request<GetGroupMemberListOutput>('/api/get_group_member_list', { group_id, no_cache })
  }

  /** 获取群成员信息 */
  async getGroupMemberInfo(group_id: number, user_id: number, no_cache?: boolean) {
    return await this.#request<GetGroupMemberInfoOutput>('/api/get_group_member_info', { group_id, user_id, no_cache })
  }

  /** 获取 Cookies */
  async getCookies(domain: string) {
    return await this.#request<GetCookiesOutput>('/api/get_cookies', { domain })
  }

  /** 获取 CSRF Token */
  async getCSRFToken() {
    return await this.#request<GetCSRFTokenOutput>('/api/get_csrf_token', {})
  }

  /** 发送私聊消息 */
  async sendPrivateMessage(user_id: number, message: OutgoingSegment[]) {
    return await this.#request<SendPrivateMessageOutput>('/api/send_private_message', { user_id, message })
  }

  /** 发送群消息 */
  async sendGroupMessage(group_id: number, message: OutgoingSegment[]) {
    return await this.#request<SendGroupMessageOutput>('/api/send_group_message', { group_id, message })
  }

  /** 获取消息 */
  async getMessage(message_scene: 'friend' | 'group' | 'temp', peer_id: number, message_seq: number) {
    return await this.#request<GetMessageOutput>('/api/get_message', { message_scene, peer_id, message_seq })
  }

  /** 获取历史消息 */
  async getHistoryMessages(message_scene: 'friend' | 'group' | 'temp', peer_id: number, start_message_seq?: number, limit?: number) {
    return await this.#request<GetHistoryMessagesOutput>('/api/get_history_messages', { message_scene, peer_id, start_message_seq, limit })
  }

  /** 获取临时资源链接 */
  async getResourceTempUrl(resource_id: string) {
    return await this.#request<GetResourceTempUrlOutput>('/api/get_resource_temp_url', { resource_id })
  }

  /** 获取合并转发消息内容 */
  async getForwardedMessages(forward_id: string) {
    return await this.#request<GetForwardedMessagesOutput>('/api/get_forwarded_messages', { forward_id })
  }

  /** 撤回私聊消息 */
  async recallPrivateMessage(user_id: number, message_seq: number) {
    return await this.#request<{}>('/api/recall_private_message', { user_id, message_seq })
  }

  /** 撤回群消息 */
  async recallGroupMessage(group_id: number, message_seq: number) {
    return await this.#request<{}>('/api/recall_group_message', { group_id, message_seq })
  }

  /** 标记消息为已读 */
  async markMessageAsRead(message_scene: 'friend' | 'group' | 'temp', peer_id: number, message_seq: number) {
    return await this.#request<{}>('/api/mark_message_as_read', { message_scene, peer_id, message_seq })
  }

  /** 发送好友戳一戳 */
  async sendFriendNudge(user_id: number, is_self?: boolean) {
    return await this.#request<{}>('/api/send_friend_nudge', { user_id, is_self })
  }

  /** 发送名片点赞 */
  async sendProfileLike(user_id: number, count?: number) {
    return await this.#request<{}>('/api/send_profile_like', { user_id, count })
  }

  /** 获取好友请求列表 */
  async getFriendRequests(limit?: number, is_filtered?: boolean) {
    return await this.#request<GetFriendRequestsOutput>('/api/get_friend_requests', { limit, is_filtered })
  }

  /** 同意好友请求 */
  async acceptFriendRequest(initiator_uid: string, is_filtered?: boolean) {
    return await this.#request<{}>('/api/accept_friend_request', { initiator_uid, is_filtered })
  }

  /** 拒绝好友请求 */
  async rejectFriendRequest(initiator_uid: string, is_filtered?: boolean, reason?: string) {
    return await this.#request<{}>('/api/reject_friend_request', { initiator_uid, is_filtered, reason })
  }

  /** 设置群名称 */
  async setGroupName(group_id: number, new_group_name: string) {
    return await this.#request<{}>('/api/set_group_name', { group_id, new_group_name })
  }

  /** 设置群头像 */
  async setGroupAvatar(group_id: number, image_uri: string) {
    return await this.#request<{}>('/api/set_group_avatar', { group_id, image_uri })
  }

  /** 设置群名片 */
  async setGroupMemberCard(group_id: number, user_id: number, card: string) {
    return await this.#request<{}>('/api/set_group_member_card', { group_id, user_id, card })
  }

  /** 设置群成员专属头衔 */
  async setGroupMemberSpecialTitle(group_id: number, user_id: number, special_title: string) {
    return await this.#request<{}>('/api/set_group_member_special_title', { group_id, user_id, special_title })
  }

  /** 设置群管理员 */
  async setGroupMemberAdmin(group_id: number, user_id: number, is_set?: boolean) {
    return await this.#request<{}>('/api/set_group_member_admin', { group_id, user_id, is_set })
  }

  /** 设置群成员禁言 */
  async setGroupMemberMute(group_id: number, user_id: number, duration?: number) {
    return await this.#request<{}>('/api/set_group_member_mute', { group_id, user_id, duration })
  }

  /** 设置群全员禁言 */
  async setGroupWholeMute(group_id: number, is_mute?: boolean) {
    return await this.#request<{}>('/api/set_group_whole_mute', { group_id, is_mute })
  }

  /** 踢出群成员 */
  async kickGroupMember(group_id: number, user_id: number, reject_add_request?: boolean) {
    return await this.#request<{}>('/api/kick_group_member', { group_id, user_id, reject_add_request })
  }

  /** 获取群公告列表 */
  async getGroupAnnouncementList(group_id: number) {
    return await this.#request<GetGroupAnnouncementListOutput>('/api/get_group_announcement_list', { group_id })
  }

  /** 发送群公告 */
  async sendGroupAnnouncement(group_id: number, content: string, image_uri?: string) {
    return await this.#request<{}>('/api/send_group_announcement', { group_id, content, image_uri })
  }

  /** 删除群公告 */
  async deleteGroupAnnouncement(group_id: number, announcement_id: string) {
    return await this.#request<{}>('/api/delete_group_announcement', { group_id, announcement_id })
  }

  /** 获取群精华消息列表 */
  async getGroupEssenceMessages(group_id: number, page_index: number, page_size: number) {
    return await this.#request<GetGroupEssenceMessagesOutput>('/api/get_group_essence_messages', { group_id, page_index, page_size })
  }

  /** 设置群精华消息 */
  async setGroupEssenceMessage(group_id: number, message_seq: number, is_set?: boolean) {
    return await this.#request<{}>('/api/set_group_essence_message', { group_id, message_seq, is_set })
  }

  /** 退出群 */
  async quitGroup(group_id: number) {
    return await this.#request<{}>('/api/quit_group', { group_id })
  }

  /** 发送群消息表情回应 */
  async sendGroupMessageReaction(group_id: number, message_seq: number, reaction: string, is_add?: boolean) {
    return await this.#request<{}>('/api/send_group_message_reaction', { group_id, message_seq, reaction, is_add })
  }

  /** 发送群戳一戳 */
  async sendGroupNudge(group_id: number, user_id: number) {
    return await this.#request<{}>('/api/send_group_nudge', { group_id, user_id })
  }

  /** 获取群通知列表 */
  async getGroupNotifications(start_notification_seq?: number, is_filtered?: boolean, limit?: number) {
    return await this.#request<GetGroupNotificationsOutput>('/api/get_group_notifications', { start_notification_seq, is_filtered, limit })
  }

  /** 同意入群/邀请他人入群请求 */
  async acceptGroupRequest(notification_seq: number, is_filtered?: boolean) {
    return await this.#request<{}>('/api/accept_group_request', { notification_seq, is_filtered })
  }

  /** 拒绝入群/邀请他人入群请求 */
  async rejectGroupRequest(notification_seq: number, is_filtered?: boolean, reason?: string) {
    return await this.#request<{}>('/api/reject_group_request', { notification_seq, is_filtered, reason })
  }

  /** 同意他人邀请自身入群 */
  async acceptGroupInvitation(group_id: number, invitation_seq: number) {
    return await this.#request<{}>('/api/accept_group_invitation', { group_id, invitation_seq })
  }

  /** 拒绝他人邀请自身入群 */
  async rejectGroupInvitation(group_id: number, invitation_seq: number) {
    return await this.#request<{}>('/api/reject_group_invitation', { group_id, invitation_seq })
  }

  /** 上传私聊文件 */
  async uploadPrivateFile(user_id: number, file_uri: string, file_name: string) {
    return await this.#request<UploadPrivateFileOutput>('/api/upload_private_file', { user_id, file_uri, file_name })
  }

  /** 上传群文件 */
  async uploadGroupFile(group_id: number, parent_folder_id: string | undefined, file_uri: string, file_name: string) {
    return await this.#request<UploadGroupFileOutput>('/api/upload_group_file', { group_id, file_uri, file_name, parent_folder_id })
  }
}
