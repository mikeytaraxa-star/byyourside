import { useCallback, useEffect, useRef, useState } from "react";
import type { AppLocation, EvenAppBridge } from "@evenrealities/even_hub_sdk";
import { decodeGesture, G2_MENU, type Gesture, type GestureSource } from "@/components/demo/gestures";

export type G2Status = "idle" | "connecting" | "connected" | "simulated" | "error";
export type MotionSample = { x: number; y: number; z: number };
export type G2Display = { clock: string; title: string; body: string; footer?: string | undefined };

export function useEvenHub({ display, onGesture }: { display: G2Display; onGesture: (gesture: Gesture, source: GestureSource) => void }) {
  const [status, setStatus] = useState<G2Status>("idle");
  const [message, setMessage] = useState(
    "No glasses connected — the full showcase works without them.",
  );
  const [location, setLocation] = useState<AppLocation | null>(null);
  const [motion, setMotion] = useState<MotionSample | null>(null);
  const bridgeRef = useRef<EvenAppBridge | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const displayRef = useRef(display);
  const onGestureRef = useRef(onGesture);
  const audioRef = useRef<((chunk: Uint8Array) => void) | null>(null);

  useEffect(() => {
    displayRef.current = display;
  }, [display]);
  useEffect(() => {
    onGestureRef.current = onGesture;
  }, [onGesture]);

  const stop = useCallback(() => {
    cleanupRef.current?.();
    cleanupRef.current = null;
    audioRef.current = null;
    bridgeRef.current = null;
    setStatus("idle");
    setLocation(null);
    setMotion(null);
    setMessage("Sensor stream stopped.");
  }, []);

  useEffect(() => () => cleanupRef.current?.(), []);

  useEffect(() => {
    const bridge = bridgeRef.current;
    if (status !== "connected" || !bridge) return;
    const current = displayRef.current;
    void import("@evenrealities/even_hub_sdk").then((sdk) => {
      if (bridgeRef.current !== bridge) return;
      void bridge.textContainerUpgrade(
        new sdk.TextContainerUpgrade({
          containerID: 1,
          containerName: "bys-clock",
          content: current.clock,
          textColor: 4,
        }),
      );
      void bridge.textContainerUpgrade(
        new sdk.TextContainerUpgrade({
          containerID: 2,
          containerName: "bys-reminder",
          content: `${current.title}\n${current.body}${current.footer ? `\n\n${current.footer}` : ""}`,
          textColor: 4,
        }),
      );
    });
  }, [display, status]);

  const connect = useCallback(async () => {
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
      bridgeRef.current = bridge;
      const result = await bridge.createStartUpPageContainer(
        new sdk.CreateStartUpPageContainer({
          containerTotalNum: 2,
          menuObject: new sdk.MenuContainerProperty({ menuItems: G2_MENU.map((item) => new sdk.MenuItemProperty(item)) }),
          textObject: [
            new sdk.TextContainerProperty({
              containerID: 1,
              containerName: "bys-clock",
              xPosition: 24,
              yPosition: 24,
              width: 128,
              height: 48,
              content: displayRef.current.clock,
              textColor: 4,
              isEventCapture: 0,
            }),
            new sdk.TextContainerProperty({
              containerID: 2,
              containerName: "bys-reminder",
              xPosition: 292,
              yPosition: 38,
              width: 260,
              height: 190,
              content: `${displayRef.current.title}\n${displayRef.current.body}`,
              textColor: 4,
              isEventCapture: 1,
            }),
          ],
        }),
      );
      if (result !== sdk.StartUpPageCreateResult.success)
        throw new Error(`G2 page creation failed (${result})`);

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
          event.sysEvent?.eventType === sdk.OsEventTypeList.IMU_DATA_REPORT &&
          event.sysEvent.imuData
        ) {
          setMotion({
            x: event.sysEvent.imuData.x ?? 0,
            y: event.sysEvent.imuData.y ?? 0,
            z: event.sysEvent.imuData.z ?? 0,
          });
        }
      });
      const unsubscribeLocation = bridge.onAppLocationChanged(setLocation);
      cleanupRef.current = () => {
        unsubscribeEvents();
        unsubscribeLocation();
        audioRef.current = null;
        void bridge.audioControl(false);
        void bridge.imuControl(false);
        void bridge.stopAppLocationUpdates();
        void bridge.shutDownPageContainer();
      };

      setStatus("connected");
      setMessage("G2 connected · temple and paired R1 input enabled · contextual menu ready.");
      await bridge.imuControl(true, sdk.ImuReportPace.P500);
      await bridge.startAppLocationUpdates({
        accuracy: sdk.AppLocationAccuracy.Medium,
        intervalMs: 5000,
        distanceFilter: 5,
      });
      const currentLocation = await bridge.getAppLocation({
        accuracy: sdk.AppLocationAccuracy.High,
        timeoutMs: 5000,
      });
      if (currentLocation) setLocation(currentLocation);
      return true;
    } catch (error) {
      cleanupRef.current?.();
      cleanupRef.current = null;
      if (bridgeRef.current) void bridgeRef.current.shutDownPageContainer();
      bridgeRef.current = null;
      setStatus("error");
      setMessage(
        error instanceof Error
          ? `${error.message}. Run the no-hardware demo instead.`
          : "G2 is unavailable. Run the no-hardware demo instead.",
      );
      return false;
    }
  }, [stop]);

  const startAudio = useCallback(async (onChunk: (chunk: Uint8Array) => void) => {
    const bridge = bridgeRef.current;
    if (!bridge) throw new Error("Connect G2 inside Even App before using its microphone.");
    const sdk = await import("@evenrealities/even_hub_sdk");
    audioRef.current = onChunk;
    if (!await bridge.audioControl(true, sdk.AudioInputSource.Glasses)) {
      audioRef.current = null;
      throw new Error("G2 microphone permission was not granted.");
    }
  }, []);
  const stopAudio = useCallback(async () => {
    audioRef.current = null;
    if (bridgeRef.current) await bridgeRef.current.audioControl(false);
  }, []);

  const simulate = useCallback(() => {
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

  return { status, message, location, motion, connect, simulate, stop, startAudio, stopAudio };
}

export type EvenHubController = ReturnType<typeof useEvenHub>;
