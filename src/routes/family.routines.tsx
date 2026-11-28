import {createFileRoute} from '@tanstack/react-router';
import {RoutinesPage} from '@/components/care/CarePages';
export const Route=createFileRoute('/family/routines')({head:()=>({meta:[{title:'ByYourSide — Familiar routines'},{name:'description',content:'Family-approved, step-by-step routines for a calmer day.'},{property:'og:title',content:'ByYourSide — Familiar routines'},{property:'og:description',content:'Family-approved, step-by-step routines for a calmer day.'},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary'}]}),component:RoutinesPage});
