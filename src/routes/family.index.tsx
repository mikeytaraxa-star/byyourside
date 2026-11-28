import {createFileRoute} from '@tanstack/react-router';
import {TodayPage} from '@/components/care/CarePages';
export const Route=createFileRoute('/family/')({head:()=>({meta:[{title:'ByYourSide — Your family’s day'},{name:'description',content:'See today’s reminders, choices and caregiver handover.'},{property:'og:title',content:'ByYourSide — Your family’s day'},{property:'og:description',content:'See today’s reminders, choices and caregiver handover.'},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary'}]}),component:TodayPage});
