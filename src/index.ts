import { MilkyBot } from './bot'
import * as Milky from './types'

export default MilkyBot

type ParamCase<S extends string> = S extends `${infer L}${infer R}` ? `${L extends '_' ? '-' : Lowercase<L>}${ParamCase<R>}` : S

type MilkyEvents = {
  [T in keyof Milky.Events as `milky/${ParamCase<T>}`]: (input: Milky.Events[T], bot: MilkyBot) => void
}

declare module 'koishi' {
  interface Events extends MilkyEvents { }
}
