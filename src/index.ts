import { MilkyBot } from './bot'
import { Event } from '@saltify/milky-types'

export default MilkyBot

type ParamCase<S extends string> = S extends `${infer L}${infer R}` ? `${L extends '_' ? '-' : Lowercase<L>}${ParamCase<R>}` : S

type MilkyEvents = {
  [T in Event as `milky/${ParamCase<T['event_type']>}`]: (input: T, bot: MilkyBot) => void
}

declare module 'koishi' {
  interface Events extends MilkyEvents { }
}
