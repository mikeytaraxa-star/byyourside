import { useCallback, useEffect, useRef, useState } from "react";
import type { AppLocation, EvenAppBridge } from "@evenrealities/even_hub_sdk";

export type G2Status = "idle" | "connecting" | "connected" | "simulated" | "error";
export type MotionSample = { x: number; y: number; z: number };
export type G2Display = { clock: string; title: string; body: string; footer?: string | undefined };

export function useEvenHub({ display, onTap }: { display: G2Display; onTap: () => void }) {
  const [status, setStatus] = useState<G2Status>("idle");
  const [message, setMessage] = useState(
    "No glasses connected — the full showcase works without them.",
  );
  const [location, setLocation] = useState<AppLocation | null>(null);
  const [motion, setMotion] = useState<MotionSample | null>(null);
  const bridgeRef = useRef<EvenAppBridge | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const displayRef = useRef(display);
  const onTapRef = useRef(onTap);

  useEffect(() => {
    displayRef.current = display;
  }, [display]);
  useEffect(() => {
    onTapRef.current = onTap;
  }, [onTap]);

  const stop = useCallback(() => {
    cleanupRef.current?.();
    cleanupRef.current = null;
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
        const eventType =
          event.textEvent?.eventType ?? event.listEvent?.eventType ?? event.sysEvent?.eventType;
        if (
          eventType === sdk.OsEventTypeList.CLICK_EVENT ||
          (eventType === undefined && (event.textEvent || event.listEvent))
        ) {
          onTapRef.current();
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
        void bridge.imuControl(false);
        void bridge.stopAppLocationUpdates();
        void bridge.shutDownPageContainer();
      };

      setStatus("connected");
      setMessage("G2 live — tap either temple to confirm; location and head motion are streaming.");
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
      bridgeRef.current = null;
      setStatus("error");
      setMessage(
        error instanceof Error
          ? `${error.message}. Run the no-hardware demo instead.`
          : "G2 is unavailable. Run the no-hardware demo instead.",
      );
      return false;
    }
  }, []);

  const simulate = useCallback(() => {
    cleanupRef.current?.();
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

  return { status, message, location, motion, connect, simulate, stop };
}

export type EvenHubController = ReturnType<typeof useEvenHub>;
