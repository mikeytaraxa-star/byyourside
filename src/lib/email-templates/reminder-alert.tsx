import * as React from 'react'
import { Body, Container, Head, Heading, Html, Preview, Text, Hr } from '@react-email/components'
import type { TemplateEntry } from './registry'

interface Props {
  reminder?: string
  scheduledTime?: string
  important?: boolean
  missedDays?: number
}

function ReminderAlert({ reminder = 'A reminder', scheduledTime, important = false, missedDays = 1 }: Props) {
  const title = important ? 'An important reminder needs a check-in' : 'A reminder has not been confirmed'
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>{title}. Please check in with Your Loved One.</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Text style={styles.brand}>ByYourSide</Text>
          <Heading style={styles.heading}>{title}</Heading>
          <Text style={styles.text}>{reminder}{scheduledTime ? ` — scheduled for ${scheduledTime}` : ''}.</Text>
          {important && missedDays >= 2 && <Text style={styles.text}>This important reminder has remained unconfirmed for {missedDays} consecutive days. Please contact Your Loved One directly or ask someone nearby to check in.</Text>}
          <Text style={styles.text}>Please check in with Your Loved One. No confirmation has been recorded; this does not prove the task was missed or medication was not taken.</Text>
          <Hr style={styles.rule} />
          <Text style={styles.note}>ByYourSide is a reminder companion, not an emergency service. If you believe there is immediate danger, contact local emergency services.</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: ReminderAlert,
  subject: 'ByYourSide — please check in with Your Loved One',
  displayName: 'Family reminder alert',
  previewData: { reminder: 'Take the blue pill', scheduledTime: '08:00', important: false },
} satisfies TemplateEntry

// Email clients require self-contained inline styles; colors reflect the app's warm brand.
const styles = {
  body: { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif', color: '#302820' },
  container: { maxWidth: '560px', padding: '32px 24px' },
  brand: { color: '#ad5e26', fontSize: '18px', fontWeight: 700 },
  heading: { fontSize: '24px', lineHeight: '32px', fontWeight: 700 },
  text: { fontSize: '16px', lineHeight: '26px' },
  rule: { borderColor: '#eadfd6', margin: '24px 0' },
  note: { color: '#766b62', fontSize: '13px', lineHeight: '21px' },
}