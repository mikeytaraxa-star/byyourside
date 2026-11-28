import {createFileRoute} from '@tanstack/react-router';
import {FamilyProvider} from '@/components/care/FamilyContext';
import {CompanionPage} from '@/components/care/CarePages';
export const Route=createFileRoute('/companion')({head:()=>({meta:[{title:'ByYourSide — your everyday companion'},{name:'description',content:'A calm phone-first companion with familiar routines, reassurance and family-supported reminders.'},{property:'og:title',content:'ByYourSide — everyday companion'},{property:'og:description',content:'One calm prompt and someone familiar close by.'},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary'}]}),component:()=> <FamilyProvider><CompanionPage/></FamilyProvider>});
