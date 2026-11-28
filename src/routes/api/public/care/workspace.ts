import {createFileRoute} from '@tanstack/react-router';
export const Route=createFileRoute('/api/public/care/workspace')({server:{handlers:{POST:async({request})=>{
  const {resolveFamily}=await import('@/lib/care/auth.server');const actor=await resolveFamily(request);
  if(!actor)return Response.json({error:'Your access expired. Send /family for a new code.'},{status:401,headers:{'Cache-Control':'no-store'}});
  const {requestSchema}=await import('@/lib/care/schemas');const parsed=requestSchema.safeParse(await request.json().catch(()=>null));
  if(!parsed.success)return Response.json({error:'Please check the fields and try again.'},{status:400});
  try{const {careOperation}=await import('@/lib/care/service.server');return Response.json(await careOperation(actor,parsed.data),{headers:{'Cache-Control':'no-store'}});}
  catch(error){const message=error instanceof Error?error.message:'Could not save this change';return Response.json({error:message},{status:message.includes('permission')?403:400,headers:{'Cache-Control':'no-store'}});}
}}}});
