import { createFileRoute } from '@tanstack/react-router';
import { FamilyStatusPage } from '@/components/care/FamilyStatus';

export const Route = createFileRoute('/family/status')({
  head: () => ({ meta: [
    { title: 'ByYourSide — Family sync and recorded actions' },
    { name: 'description', content: 'Private companion sync times and recorded reminder choices. Confirmations never prove medication was taken.' },
    { property: 'og:title', content: 'ByYourSide — Family status' },
    { property: 'og:description', content: 'Follow companion check-ins and recorded family care actions without assuming task completion.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary' },
  ] }),
  component: FamilyStatusPage,
});