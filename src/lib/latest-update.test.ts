import { expect, it, vi } from "vitest";
import { latestUpdateQueue } from "./latest-update";

it("finishes with the latest template even when device writes are slow", async () => {
  let release: (() => void) | undefined;
  const pending = new Promise<void>((resolve) => { release = resolve; });
  const applied: string[] = [];
  const write = vi.fn(async (value: string) => { if (value === "Anna") await pending; applied.push(value); });
  const queue = latestUpdateQueue(write, vi.fn());
  queue.push("Anna"); queue.push("Peter"); queue.push("Today");
  release?.(); await pending; await new Promise((resolve) => setTimeout(resolve, 0));
  expect(applied).toEqual(["Anna", "Today"]);
});
it("drops queued displays when glasses disconnect", async () => {
  let release: (() => void) | undefined;
  const pending = new Promise<void>((resolve) => { release = resolve; });
  const write = vi.fn(async () => { await pending; });
  const queue = latestUpdateQueue(write, vi.fn());
  queue.push("Anna"); queue.push("Peter"); queue.stop(); release?.();
  await pending; await new Promise((resolve) => setTimeout(resolve, 0));
  expect(write).toHaveBeenCalledTimes(1);
});