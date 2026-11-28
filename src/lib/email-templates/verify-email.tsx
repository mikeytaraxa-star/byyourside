import * as React from 'react'
import { Body, Container, Head, Heading, Html, Preview, Text, Hr } from '@react-email/components'
import type { TemplateEntry } from './registry'

interface Props { code?: string }
function VerifyEmail({ code }: Props) {
  return <Html lang="en" dir="ltr"><Head /><Preview>Confirm your inbox for ByYourSide family alerts.</Preview>
    <Body style={styles.body}><Container style={styles.container}>
      <Text style={styles.brand}>ByYourSide</Text><Heading style={styles.heading}>Confirm your family alert inbox</Heading>
      <Text style={styles.text}>Someone in a ByYourSide Telegram chat requested reminder alerts at this address. To approve, send this command to @bysappbot in that same chat, from the account that requested it:</Text>
      <Text style={styles.code}>{code ? `/email verify ${code}` : 'A confirmation code will appear here.'}</Text>
      <Text style={styles.text}>The code expires in 15 minutes. Approval allows this inbox to receive the family's unconfirmed-reminder details, including important reminders. Do not share the code with anyone.</Text>
      <Hr style={styles.rule} /><Text style={styles.note}>If you did not request these alerts, ignore this email. No family reminders will be sent without your approval. ByYourSide will never ask for payment, passwords or a Telegram login code.</Text>
    </Container></Body></Html>
}
export const template = {
  component: VerifyEmail,
  subject: 'ByYourSide — confirm your family alert inbox',
  displayName: 'Verify family alert inbox',
  previewData: { code: '23456-789AB' },
} satisfies TemplateEntry
const styles = {
  body: { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif', color: '#302820' },
  container: { maxWidth: '560px', padding: '32px 24px' },
  brand: { color: '#ad5e26', fontSize: '18px', fontWeight: 700 },
  heading: { fontSize: '24px', lineHeight: '32px' },
  text: { fontSize: '16px', lineHeight: '26px' },
  code: { fontSize: '18px', lineHeight: '28px', fontFamily: 'monospace', overflowWrap: 'anywhere' as const },
  rule: { borderColor: '#eadfd6', margin: '24px 0' },
  note: { color: '#766b62', fontSize: '13px', lineHeight: '21px' },
}