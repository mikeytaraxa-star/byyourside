import { act, cleanup, render, fireEvent, screen,waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { G2App } from './G2App';
import type { Gesture, GestureSource } from '@/components/demo/gestures';
const native = vi.hoisted(() => ({
  input: null as ((gesture: Gesture, source: GestureSource) => void) | null,
  chunk: null as ((chunk: Uint8Array) => void) | null,
  readStorage: vi.fn(async () => ''), writeStorage: vi.fn(async () => true),
  startAudio: vi.fn(async (callback: (chunk: Uint8Array) => void) => { native.chunk = callback; }),
  stopAudio: vi.fn(async () => {}), connect: vi.fn(async () => true), stop: vi.fn(),
  setSensors: vi.fn(async () => {}), simulate: vi.fn(),
}));
vi.mock('@/hooks/use-even-hub', () => ({ useEvenHub: ({ onGesture }: { onGesture: (gesture: Gesture, source: GestureSource) => void }) => {
  native.input = onGesture;
  return { status: 'connected', message: '', location: null, motion: null, sensorsActive: false, ...native };
} }));
beforeEach(() => { localStorage.clear(); vi.clearAllMocks(); });
afterEach(() => { cleanup(); vi.useRealTimers();vi.restoreAllMocks(); });
describe('hardware companion privacy', () => {
  it('never opens G2 audio for a long press without consent', async () => {
    render(<G2App />);
    await act(async () => { native.input?.('hold', 'R1 ring'); });
    expect(native.startAudio).not.toHaveBeenCalled();
  });
  it('stops local audio after 12 seconds without any uploads', async () => {
    const fetch = vi.spyOn(globalThis, 'fetch');
    vi.useFakeTimers();
    render(<G2App />);
    await act(async () => {});
    fireEvent.click(screen.getByRole('checkbox', { name: 'Allow local G2 microphone' }));
    await act(async () => { native.input?.('hold', 'Right temple'); });
    expect(native.startAudio).toHaveBeenCalledTimes(1);
    act(() => { native.chunk?.(new Uint8Array(16000)); });
    const stops = native.stopAudio.mock.calls.length;
    await act(async () => { await vi.advanceTimersByTimeAsync(12000); });
    expect(native.stopAudio.mock.calls.length).toBeGreaterThan(stops);
    expect(fetch).not.toHaveBeenCalled();
    fetch.mockRestore();
  });
  function familyFixture(){
    localStorage.setItem('byyourside.g2.pairing.v1','test-family-device-token');
    const notes=[{id:'note-a',label:'Anna’s note',answer:'Private family A reassurance',category:'reassurance',phone:'',media_path:null,media_kind:null,updated_at:'2026-11-28'}];
    return {ok:true,date:'2026-11-28',timezone:'Europe/Berlin',reminders:[{id:'11111111-1111-4111-8111-111111111111',time:'08:30',text:'Family reminder',status:'pending'}],notes,routines:[],preferences:{greeting:'Hello',evening:'Good evening',quietFrom:'',quietTo:'',importantDuringQuiet:true,morningCheck:'',escalationMinutes:30,textSize:'regular',displayPosition:'right',promptSeconds:30,language:'en',breakUntil:'',locationSharing:false,notifyMode:'instant'}};
  }
  it('cannot confirm a hidden reminder while a reassurance note is visible',async()=>{
    const fixture=familyFixture();const actions:unknown[]=[];
    vi.spyOn(globalThis,'fetch').mockImplementation(async(url,init)=>{if(String(url).endsWith('/action'))actions.push(init?.body);return Response.json(fixture);});
    render(<G2App/>);await waitFor(()=>expect(screen.getByRole('button',{name:'Anna’s note'})).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button',{name:'Anna’s note'}));
    expect(screen.getByText('Private family A reassurance')).toBeInTheDocument();
    await act(async()=>{native.input?.('tap','R1 ring');});
    expect(actions).toHaveLength(0);
    expect(screen.queryByText('Private family A reassurance')).not.toBeInTheDocument();
  });
  it('clears family content on unpair and discards late question replies',async()=>{
    const fixture=familyFixture();let finish:(response:Response)=>void=()=>{};
    vi.spyOn(globalThis,'fetch').mockImplementation(async(url)=>String(url).endsWith('/support')?new Promise(resolve=>{finish=resolve;}):Response.json(fixture));
    render(<G2App/>);await waitFor(()=>expect(screen.getByRole('button',{name:'Anna’s note'})).toBeInTheDocument());
    fireEvent.change(screen.getByRole('textbox',{name:'Ask a question'}),{target:{value:'Who is Anna?'}});
    fireEvent.submit(screen.getByRole('textbox',{name:'Ask a question'}).closest('form') as HTMLFormElement);
    fireEvent.click(screen.getByRole('button',{name:'Anna’s note'}));
    fireEvent.click(screen.getByRole('button',{name:'Unpair'}));
    expect(screen.queryByText('Private family A reassurance')).not.toBeInTheDocument();
    await act(async()=>{finish(Response.json({text:'Late private family A answer'}));});
    expect(screen.queryByText('Late private family A answer')).not.toBeInTheDocument();
    expect(localStorage.getItem('byyourside.g2.support.v1')).toBeNull();
  });
  it('uses the family timezone for due reminders rather than the phone timezone',async()=>{
    vi.useFakeTimers();vi.setSystemTime(new Date('2026-11-28T08:00:00Z'));
    const fixture=familyFixture();vi.spyOn(globalThis,'fetch').mockResolvedValue(Response.json(fixture));
    render(<G2App/>);await act(async()=>{await vi.advanceTimersByTimeAsync(1);});
    expect(screen.getByRole('button',{name:/^Done$/})).not.toBeDisabled();
    expect(screen.getByText('09:00',{selector:'time'})).toBeInTheDocument();
  });
});
