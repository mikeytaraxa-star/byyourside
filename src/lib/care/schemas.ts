import { z } from 'zod';
import { LANGUAGES } from '@/lib/i18n';
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable();
export const preferencesSchema = z.object({
  greeting: z.string().max(160), evening: z.string().max(160), quietFrom: time.or(z.literal('')), quietTo: time.or(z.literal('')),
  importantDuringQuiet: z.boolean(), morningCheck: time.or(z.literal('')), escalationMinutes: z.number().int().min(15).max(120),
  textSize: z.enum(['regular','large']), displayPosition: z.enum(['left','right']), promptSeconds: z.number().int().min(10).max(90),
  language: z.enum(LANGUAGES), breakUntil: z.string().max(40).refine(v => !v || Number.isFinite(Date.parse(v))), locationSharing: z.boolean(),
  notifyMode: z.enum(['instant', 'digest']).default('instant'),
}).strict();
export const actionSchema = z.object({ reminderId: z.string().uuid(), action: z.enum(['done','later','help','decline','repeat','step']), key: z.string().uuid(), date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), minutes: z.number().int().min(1).max(120).default(15) }).strict();
export const requestSchema = z.discriminatedUnion('op', [
  z.object({op:z.literal('load')}),
  z.object({op:z.literal('action'), ...actionSchema.shape}),
  z.object({op:z.literal('reminder'), id:z.string().uuid().optional(), title:z.string().trim().min(1).max(160),detail:z.string().max(300),local_time:time,critical:z.boolean(),snooze_minutes:z.number().int().min(0).max(120),date_override:date,lead_minutes:z.number().int().min(0).max(180).default(0)}),
  z.object({op:z.literal('routine'),id:z.string().uuid().optional(),title:z.string().trim().min(1).max(100),local_time:time,steps:z.array(z.string().trim().min(1).max(160)).min(1).max(12),enabled:z.boolean(),date_override:date}),
  z.object({op:z.literal('routine-step'),id:z.string().uuid(),date:z.string().regex(/^\d{4}-\d{2}-\d{2}$/),key:z.string().uuid(),step:z.number().int().min(0).max(12)}),
  z.object({op:z.literal('note'),id:z.string().uuid().optional(),label:z.string().trim().min(1).max(80),answer:z.string().max(500),category:z.enum(['person','object','reassurance','message']),phone:z.string().max(30).regex(/^[+\d ()-]*$/),recap_date:date.default(null)}),
  z.object({op:z.literal('delete'),entity:z.enum(['reminder','routine','note']),id:z.string().uuid()}),
  z.object({op:z.literal('settings'),display_name:z.string().trim().min(1).max(80),timezone:z.string().max(80),summary_time:time.or(z.literal('off')),preferences:preferencesSchema}),
  z.object({op:z.literal('ack'),id:z.string().uuid()}),
  z.object({op:z.literal('invite'),role:z.enum(['editor','viewer'])}),
  z.object({op:z.literal('member'),id:z.string().uuid(),notify_order:z.number().int().min(0).max(2)}),
  z.object({op:z.literal('revoke-member'),id:z.string().uuid()}),
  z.object({op:z.literal('revoke-device'),id:z.string().uuid()}),
  z.object({op:z.literal('undo'),id:z.string().uuid()}),
  z.object({op:z.literal('question'),question:z.string().trim().min(1).max(500),draft:z.boolean().default(false)}),
  z.object({op:z.literal('test-alert')}),
  z.object({op:z.literal('export')}),
  z.object({op:z.literal('erase'),confirmation:z.literal('DELETE FAMILY DATA')}),
  z.object({op:z.literal('media'),noteId:z.string().uuid(),kind:z.enum(['photo','audio']),mime:z.enum(['image/jpeg','image/png','image/webp','audio/mpeg','audio/mp4','audio/wav','audio/webm']),data:z.string().max(7_000_000)}),
  z.object({op:z.literal('media-read'),noteId:z.string().uuid()}),
  z.object({op:z.literal('media-remove'),noteId:z.string().uuid()}),
]);
