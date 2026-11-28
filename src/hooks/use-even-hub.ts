import { useCallback, useEffect, useRef, useState } from "react";
import type { AppLocation, EvenAppBridge } from "@evenrealities/even_hub_sdk";
import { decodeGesture, G2_MENU, type Gesture, type GestureSource } from "@/components/demo/gestures";
import { latestUpdateQueue } from "@/lib/latest-update";
import { G2_REGIONS, nativeDisplay } from "@/lib/g2-display";

export type G2Status = "idle" | "connecting" | "connected" | "simulated" | "error";
export type MotionSample = { x: number; y: number; z: number };
export type G2Display = { clock: string; title: string; body: string; footer?: string | undefined; menuItems?: { itemID: number; itemName: string }[] };

export function useEvenHub({ display, onGesture, autoSensors = true }: { display: G2Display; onGesture: (gesture: Gesture, source: GestureSource) => void; autoSensors?: boolean }) {
  const [status, setStatus] = useState<G2Status>("idle");
  const [message, setMessage] = useState(
    "No glasses connected — the full showcase works without them.",
  );
  const [location, setLocation] = useState<AppLocation | null>(null);
  const [motion, setMotion] = useState<MotionSample | null>(null);
  const [sensorsActive, setSensorsActive] = useState(false);
  const [battery, setBattery] = useState<number | null>(null);
  const bridgeRef = useRef<EvenAppBridge | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const displayRef = useRef(display);
  const onGestureRef = useRef(onGesture);
  const audioRef = useRef<((chunk: Uint8Array) => void) | null>(null);
  const audioRevision = useRef(0);
  const audioQueue = useRef<Promise<void>>(Promise.resolve());
  const updatesRef = useRef<ReturnType<typeof latestUpdateQueue<G2Display>> | null>(null);
  const connectionRevision = useRef(0);
  const sensorQueue = useRef<Promise<void>>(Promise.resolve());
  const sensorRevision = useRef(0);
  const sensorsEnabled = useRef(false);

  const closeAudio = useCallback((bridge: EvenAppBridge) => {
    audioRevision.current += 1;
    audioRef.current = null;
    const operation = audioQueue.current.catch(() => {}).then(async () => { await bridge.audioControl(false); });
    audioQueue.current = operation;
    return operation;
  }, []);

  useEffect(() => {
    displayRef.current = display;
  }, [display]);
  useEffect(() => {
    onGestureRef.current = onGesture;
  }, [onGesture]);

  const stop = useCallback(() => {
    sensorRevision.current += 1;sensorsEnabled.current=false;
    connectionRevision.current += 1;
    updatesRef.current?.stop();
    updatesRef.current = null;
    cleanupRef.current?.();
    cleanupRef.current = null;
    audioRef.current = null;
    bridgeRef.current = null;
    setStatus("idle");
    setLocation(null);
    setMotion(null);
    setSensorsActive(false);
    setBattery(null);
    setMessage("Sensor stream stopped.");
  }, []);

  useEffect(() => () => { connectionRevision.current += 1; updatesRef.current?.stop(); cleanupRef.current?.(); }, []);

  useEffect(() => {
    const bridge = bridgeRef.current;
    if (status !== "connected" || !bridge) return;
    updatesRef.current?.push(display);
  }, [display, status]);

  const connect = useCallback(async () => {
    const revision = ++connectionRevision.current;
    updatesRef.current?.stop();
    updatesRef.current = null;
    cleanupRef.current?.();
    cleanupRef.current = null;
    setStatus("connecting");
    setMessage("Looking for the Even App and your G2 glasses…");
    try {
      const sdk = await import("@evenrealities/even_hub_sdk");
      const bridge = await Promise.race([
        sdk.waitForEvenAppBridge(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Even App was not found")), 6000),
        ),
      ]);
      if (revision !== connectionRevision.current) return false;
      bridgeRef.current = bridge;
      const initial = nativeDisplay(displayRef.current);
      let menuItems = displayRef.current.menuItems ?? G2_MENU;
      let menuSignature = JSON.stringify(menuItems);
      const result = await bridge.createStartUpPageContainer(
        new sdk.CreateStartUpPageContainer({
          containerTotalNum: 3,
          menuObject: new sdk.MenuContainerProperty({ menuItems: menuItems.map((item) => new sdk.MenuItemProperty(item)) }),
          textObject: (Object.keys(G2_REGIONS) as Array<keyof typeof G2_REGIONS>).map((key) =>
            new sdk.TextContainerProperty({ ...G2_REGIONS[key], content: initial[key], textColor: 4 }),
          ),
        }),
      );
      if (revision !== connectionRevision.current) {
        if (bridgeRef.current === bridge) bridgeRef.current = null;
        await bridge.shutDownPageContainer();
        return false;
      }
      if (result !== sdk.StartUpPageCreateResult.success)
        throw new Error(`G2 page creation failed (${result})`);
      updatesRef.current = latestUpdateQueue<G2Display>(async (current) => {
        const next = nativeDisplay(current);
        menuItems = current.menuItems ?? G2_MENU;
        const signature = JSON.stringify(menuItems);
        if (signature !== menuSignature) {
          if (bridgeRef.current !== bridge) return;
          const rebuilt = await bridge.rebuildPageContainer(new sdk.RebuildPageContainer({
            containerTotalNum: 3,
            menuObject: new sdk.MenuContainerProperty({ menuItems: menuItems.map(item => new sdk.MenuItemProperty(item)) }),
            textObject: (Object.keys(G2_REGIONS) as Array<keyof typeof G2_REGIONS>).map(key =>
              new sdk.TextContainerProperty({ ...G2_REGIONS[key], content: next[key], textColor: 4 })),
          }));
          if (!rebuilt) throw new Error('G2 rejected a language update');
          menuSignature = signature;
          return;
        }
        for (const key of Object.keys(G2_REGIONS) as Array<keyof typeof G2_REGIONS>) {
          if (bridgeRef.current !== bridge) return;
          const region = G2_REGIONS[key];
          const updated = await bridge.textContainerUpgrade(new sdk.TextContainerUpgrade({
            containerID: region.containerID, containerName: region.containerName, content: next[key], textColor: 4,
          }));
          if (!updated) throw new Error("G2 rejected a display update");
        }
      }, () => setMessage("The glasses display could not update. Please reconnect G2."));

      const unsubscribeEvents = bridge.onEvenHubEvent((event) => {
        const input = decodeGesture(event);
        if (input) onGestureRef.current(input.gesture, input.source);
        if (event.audioEvent?.source === sdk.AudioInputSource.Glasses)
          audioRef.current?.(event.audioEvent.audioPcm);
        if (event.sysEvent?.eventType === sdk.OsEventTypeList.FOREGROUND_EXIT_EVENT ||
            event.sysEvent?.eventType === sdk.OsEventTypeList.SYSTEM_EXIT_EVENT ||
            event.sysEvent?.eventType === sdk.OsEventTypeList.ABNORMAL_EXIT_EVENT) {
          onGestureRef.current("release", "G2 input");
          stop();
        }
        if (
          sensorsEnabled.current && event.sysEvent?.eventType === sdk.OsEventTypeList.IMU_DATA_REPORT &&
          event.sysEvent.imuData
        ) {
          setMotion({
            x: event.sysEvent.imuData.x ?? 0,
            y: event.sysEvent.imuData.y ?? 0,
            z: event.sysEvent.imuData.z ?? 0,
          });
        }
      });
      const unsubscribeLocation = bridge.onAppLocationChanged(value=>{if(sensorsEnabled.current)setLocation(value);});
      const unsubscribeDevice = bridge.onDeviceStatusChanged((device) => {
        if (typeof device.batteryLevel === 'number' && device.batteryLevel >= 0 && device.batteryLevel <= 100) setBattery(device.batteryLevel);
        if (device.connectType === sdk.DeviceConnectType.Disconnected || device.connectType === sdk.DeviceConnectType.ConnectionFailed) {
          onGestureRef.current("release", "G2 input");
          stop();
          setMessage("G2 disconnected. Reconnect your glasses in Even App.");
        }
      });
      cleanupRef.current = () => {
        unsubscribeEvents();
        unsubscribeLocation();
        unsubscribeDevice();
        audioRef.current = null;
        void closeAudio(bridge).catch(() => {});
        void bridge.imuControl(false);
        void bridge.stopAppLocationUpdates();
        void bridge.shutDownPageContainer();
      };

      setStatus("connected");
      setMessage("G2 connected · temple and paired R1 input enabled · contextual menu ready.");
      if (!autoSensors) return true;
      sensorsEnabled.current=true;
      // Sensor permission failures must not take down a working reminder display.
      try {
      await bridge.imuControl(true, sdk.ImuReportPace.P500);
      if (revision !== connectionRevision.current) return false;
      await bridge.startAppLocationUpdates({
        accuracy: sdk.AppLocationAccuracy.Medium,
        intervalMs: 5000,
        distanceFilter: 5,
      });
      if (revision !== connectionRevision.current) return false;
      const currentLocation = await bridge.getAppLocation({
        accuracy: sdk.AppLocationAccuracy.High,
        timeoutMs: 5000,
      });
      if (revision !== connectionRevision.current) return false;
      if (currentLocation) setLocation(currentLocation);
      setSensorsActive(true);
      } catch {
        sensorsEnabled.current=false;
        await Promise.allSettled([bridge.imuControl(false),bridge.stopAppLocationUpdates()]);
        if (revision === connectionRevision.current) setMessage("G2 connected. Location or motion permission is unavailable.");
      }
      return true;
    } catch (error) {
      if (revision !== connectionRevision.current) return false;
      updatesRef.current?.stop();
      updatesRef.current = null;
      cleanupRef.current?.();
      cleanupRef.current = null;
      if (bridgeRef.current) void bridgeRef.current.shutDownPageContainer();
      bridgeRef.current = null;
      setStatus("error");
      setMessage(
        error instanceof Error
          ? `${error.message}. Open this app through Even App and reconnect.`
          : "G2 is unavailable. Open this app through Even App and reconnect.",
      );
      return false;
    }
  }, [stop, autoSensors, closeAudio]);

  const setSensors = useCallback(async (enabled: boolean) => {
    const bridge = bridgeRef.current;
    if (!bridge) return;
    const revision=++sensorRevision.current;
    sensorsEnabled.current=false;setSensorsActive(false);setLocation(null);setMotion(null);
    const operation=sensorQueue.current.catch(()=>{}).then(async()=>{
      if(bridgeRef.current!==bridge||revision!==sensorRevision.current)return;
      try {
        const sdk=await import('@evenrealities/even_hub_sdk');
        if(!enabled){await Promise.all([bridge.imuControl(false),bridge.stopAppLocationUpdates()]);return;}
        const motionEnabled=await bridge.imuControl(true,sdk.ImuReportPace.P500);
        if(bridgeRef.current!==bridge||revision!==sensorRevision.current){await bridge.imuControl(false);return;}
        const locationEnabled=await bridge.startAppLocationUpdates({accuracy:sdk.AppLocationAccuracy.Medium,intervalMs:5000,distanceFilter:5});
        if(bridgeRef.current!==bridge||revision!==sensorRevision.current||!motionEnabled||!locationEnabled){await Promise.allSettled([bridge.imuControl(false),bridge.stopAppLocationUpdates()]);return;}
        sensorsEnabled.current=true;setSensorsActive(true);
      } catch {
        await Promise.allSettled([bridge.imuControl(false),bridge.stopAppLocationUpdates()]);
        if(revision===sensorRevision.current)setMessage('G2 connected. Sensor permission is unavailable.');
      }
    });
    sensorQueue.current=operation;await operation;
  }, []);

  const readStorage = useCallback(async (key: string) => bridgeRef.current?.getLocalStorage(key) ?? "", []);
  const writeStorage = useCallback(async (key: string, value: string) => {
    const bridge = bridgeRef.current;
    if (!bridge) return false;
    return bridge.setLocalStorage(key, value);
  }, []);

  const startAudio = useCallback(async (onChunk: (chunk: Uint8Array) => void) => {
    const bridge = bridgeRef.current;
    if (!bridge) throw new Error("Connect G2 inside Even App before using its microphone.");
    const revision = ++audioRevision.current;
    const sdk = await import("@evenrealities/even_hub_sdk");
    const operation = audioQueue.current.catch(() => {}).then(async () => {
      if (bridgeRef.current !== bridge || revision !== audioRevision.current) return;
      if (!await bridge.audioControl(true, sdk.AudioInputSource.Glasses)) throw new Error("G2 microphone permission was not granted.");
      if (bridgeRef.current === bridge && revision === audioRevision.current) audioRef.current = onChunk;
      else await bridge.audioControl(false);
    });
    audioQueue.current = operation;
    await operation;
    if (bridgeRef.current !== bridge || revision !== audioRevision.current) throw new Error("Microphone request cancelled.");
  }, []);
  const stopAudio = useCallback(async () => {
    audioRef.current = null;
    if (bridgeRef.current) await closeAudio(bridgeRef.current);
  }, [closeAudio]);

  const simulate = useCallback(() => {
    connectionRevision.current += 1;
    updatesRef.current?.stop();
    updatesRef.current = null;
    cleanupRef.current?.();
    bridgeRef.current = null;
    setStatus("simulated");
    setMessage("Showcase simulation — no location or motion data leaves this browser.");
    setLocation({ latitude: 52.52, longitude: 13.405, accuracy: 8 });
    let tick = 0;
    const interval = setInterval(() => {
      tick += 1;
      setMotion({
        x: Number((Math.sin(tick / 3) * 0.8).toFixed(2)),
        y: Number((Math.cos(tick / 4) * 0.5).toFixed(2)),
        z: Number((0.9 + Math.sin(tick / 5) * 0.2).toFixed(2)),
      });
    }, 500);
    setMotion({ x: 0.12, y: -0.08, z: 0.9 });
    cleanupRef.current = () => clearInterval(interval);
  }, []);

  return { status, message, location, motion, battery, sensorsActive, setSensors, readStorage, writeStorage, connect, simulate, stop, startAudio, stopAudio };
}

export type EvenHubController = ReturnType<typeof useEvenHub>;
