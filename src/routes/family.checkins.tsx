import {createFileRoute} from '@tanstack/react-router';
import {CheckinsPage} from '@/components/care/CarePages';
export const Route=createFileRoute('/family/checkins')({head:()=>({meta:[{title:'ByYourSide — Family check-ins'},{name:'description',content:'Understand help requests and who is checking in.'},{property:'og:title',content:'ByYourSide — Family check-ins'},{property:'og:description',content:'Understand help requests and who is checking in.'},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary'}]}),component:CheckinsPage});
