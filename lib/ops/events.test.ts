import assert from "node:assert/strict";
import { test } from "node:test";
import { appendOpsEvent, readOpsEvents } from "./events";

test("ops events stay newest first and capped", () => {
  let events = readOpsEvents("not-json");
  assert.deepEqual(events, []);
  for (let index = 0; index < 45; index += 1) {
    events = appendOpsEvent(events, { title: `e${index}`, at: `2026-09-17T00:00:${String(index).padStart(2, "0")}.000Z` });
  }
  assert.equal(events.length, 40);
  assert.equal(events[0]?.title, "e44");
});
