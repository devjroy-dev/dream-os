// listenHarvey.ts — Donna's voice back to Harvey. The other half of the two-way wire.
//
// Until now Donna could only END her run and have her last words bubble up to Harvey;
// there was no channel for her to ASK him something and get an answer. This is that
// channel from her side: she calls listen_harvey_talk to speak to him — to hand him a
// finding, or to ask exactly what she needs (which client, which binder) and receive
// his reply as his next message. Paired with dear_donna_talk (his side), the two make a
// real back-and-forth instead of a one-shot handoff. Soul governs how many turns they
// take; the code only carries the wire (with a fuse upstream so a loop can't run away).
import type Anthropic from '@anthropic-ai/sdk';

export const LISTEN_HARVEY_TALK_TOOL: Anthropic.Tool = {
  name: 'listen_harvey_talk',
  description:
    "Speak to Harvey. Use this to hand him what you found in one or two plain lines, or to ask him exactly what you need to finish — which client he means, which binder, anything unresolved — and his answer will come back to you as his next message. This is your voice to him and the only way your words reach him; everything else you do (filing, searching) is silent work he doesn't see. Say your piece and stop; he is impatient and reads a single clean line fastest.",
  input_schema: {
    type: 'object',
    properties: {
      message: {
        type: 'string',
        description: "What you say to Harvey — your finding, or the precise thing you need from him.",
      },
    },
    required: ['message'],
  },
};
