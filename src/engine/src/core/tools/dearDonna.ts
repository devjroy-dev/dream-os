// dearDonna.ts — Harvey's channel to Donna, now TWO-WAY. He holds no DB tools; this is
// his one operational lever. Renamed dear_donna -> dear_donna_talk because it is no
// longer a one-shot instruction that dead-ends in a return value: it is a live line he
// can talk on. He hands Donna something; she does the work and speaks back (via her
// listen_harvey_talk); if she asks him something, he answers by calling this again, and
// she resumes where she left off. The exchange continues until he has what he needs and
// turns to the client. "dear_donna_talk" reads as character, not machinery, if it ever
// surfaces in a log.
import type Anthropic from '@anthropic-ai/sdk';

export const DEAR_DONNA_TALK_TOOL: Anthropic.Tool = {
  name: 'dear_donna_talk',
  description:
    "Talk to Donna — your operator — in plain English. Hand her something to do against the records (log or update a lead, record the true state of something, look a record up), or answer a question she just asked you. She does the doing; you do the thinking. She may come back with what she found, or with a question she needs answered to finish (which client, which binder) — when she does, call this again with your answer and she picks up where she left off. Keep going until you have what you need, then speak to the client. Hand her one clear thing at a time; English is her second language, so the simpler and more direct your line, the truer her work. When you tell her to record something, state its truth-status: the owner's OWN action about themselves is confirmed; anything relayed about a third party is unverified until confirmed; money you keep careful — affirmed is not proven. You never treat silence as confirmation. Use this only when something must actually be done or looked up — never on a pure-advice turn.",
  input_schema: {
    type: 'object',
    properties: {
      message: {
        type: 'string',
        description:
          "Your plain-English message to Donna — an instruction, or your answer to what she just asked. E.g. 'Log a new lead: Kabira Studios, product shoot, found us on Instagram, stage new.' or, answering her: 'The Kabira you want is the one in new stage — that binder id.'",
      },
    },
    required: ['message'],
  },
};
