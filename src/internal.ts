import { HTTP } from 'koishi'
import * as Milky from './types'

export class Internal {
  constructor(private http: HTTP) { }

  async #request<T>(url: string, data?: any) {
    const res = await this.http.post<Milky.ApiResponse<T>>(url, data ?? {})
    if (res.status === 'failed') {
      throw new Error(res.message)
    } else {
      return res.data
    }
  }

  async getLoginInfo() {
    return await this.#request<Milky.LoginInfo>('/api/get_login_info')
  }

  async getGroupList(no_cache?: boolean) {
    return await this.#request<{ groups: Milky.Group[] }>('/api/get_group_list', { no_cache })
  }

  async getGroupInfo(group_id: number, no_cache?: boolean) {
    return await this.#request<{ group: Milky.Group }>('/api/get_group_info', { group_id, no_cache })
  }

  async getGroupMemberList(group_id: number, no_cache?: boolean) {
    return await this.#request<{ members: Milky.GroupMember[] }>('/api/get_group_member_list', { group_id, no_cache })
  }

  async getGroupMemberInfo(group_id: number, user_id: number, no_cache?: boolean) {
    return await this.#request<{ member: Milky.GroupMember }>('/api/get_group_member_info', { group_id, user_id, no_cache })
  }

  async getFriendList(no_cache?: boolean){
    return await this.#request<{ friends: Milky.Friend[] }>('/api/get_friend_list', { no_cache })
  }

  async sendPrivateMessage(user_id: number, message: Milky.Segment[]) {
    return await this.#request<{
      message_seq: number,
      time: number,
      client_seq: number
    }>('/api/send_private_message', { user_id, message })
  }

  async sendGroupMessage(group_id: number, message: Milky.Segment[]) {
    return await this.#request<{
      message_seq: number,
      time: number
    }>('/api/send_group_message', { group_id, message })
  }
}
