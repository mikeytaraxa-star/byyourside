import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useEvenHub } from "./use-even-hub";

const display = { clock: "14:00", title: "TODAY", body: "Blue pill" };

describe("G2 no-hardware showcase", () => {
  it("provides clearly simulated location and motion samples", () => {
    const { result, unmount } = renderHook(() => useEvenHub({ display, onTap: () => {} }));
    act(() => result.current.simulate());
    expect(result.current.status).toBe("simulated");
    expect(result.current.location).toMatchObject({ latitude: 52.52, longitude: 13.405 });
    expect(result.current.motion).not.toBeNull();
    expect(result.current.message).toContain("simulation");
    act(() => result.current.stop());
    expect(result.current.location).toBeNull();
    unmount();
  });
});
