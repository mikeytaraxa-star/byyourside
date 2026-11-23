import { createFileRoute } from '@tanstack/react-router';
import { G2App } from '@/components/g2/G2App';
import shareImage from '@/assets/byyourside_share.png.asset.json';
import { getRequestOrigin } from '@/lib/origin.functions';
export const Route = createFileRoute('/g2')({
  loader: async () => ({ origin: await getRequestOrigin() }),
  head: ({ loaderData }) => ({ meta: [
    { title: 'ByYourSide — G2 hardware app' },
    { name: 'description', content: 'ByYourSide device companion for Even G2: local reminders, native gestures, and permission-controlled sensors.' },
    { property: 'og:title', content: 'ByYourSide — G2 hardware app' },
    { property: 'og:description', content: 'Connect ByYourSide to Even G2 through Even App. Local reminders and real hardware controls.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
    ...(loaderData ? [
      { property: 'og:image', content: `${loaderData.origin}${shareImage.url}` },
      { name: 'twitter:image', content: `${loaderData.origin}${shareImage.url}` },
    ] : []),
  ] }),
  component: G2App,
});
