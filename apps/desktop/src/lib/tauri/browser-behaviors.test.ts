import { disableBrowserBehaviors } from "./browser-behaviors";

function press(init: KeyboardEventInit): boolean {
  const event = new KeyboardEvent("keydown", { cancelable: true, bubbles: true, ...init });
  document.body.dispatchEvent(event);
  return event.defaultPrevented;
}

describe("disableBrowserBehaviors (development)", () => {
  beforeAll(() => disableBrowserBehaviors({ production: false }));

  it("blocks find and print", () => {
    expect(press({ key: "f", ctrlKey: true })).toBe(true);
    expect(press({ key: "F3" })).toBe(true);
    expect(press({ key: "p", ctrlKey: true })).toBe(true);
  });

  it("matches regardless of caps lock", () => {
    expect(press({ key: "F", ctrlKey: true })).toBe(true);
  });

  it("leaves typing, clipboard and the app's own shortcuts alone", () => {
    expect(press({ key: "f" })).toBe(false);
    expect(press({ key: "c", ctrlKey: true })).toBe(false);
    expect(press({ key: "v", ctrlKey: true })).toBe(false);
    expect(press({ key: "a", ctrlKey: true })).toBe(false);
    expect(press({ key: "z", ctrlKey: true })).toBe(false);
    expect(press({ key: "b", ctrlKey: true })).toBe(false); // sidebar toggle
  });

  it("keeps reload and devtools available", () => {
    expect(press({ key: "F5" })).toBe(false);
    expect(press({ key: "r", ctrlKey: true })).toBe(false);
    expect(press({ key: "i", ctrlKey: true, shiftKey: true })).toBe(false);
  });

  it("blocks the context menu", () => {
    const event = new MouseEvent("contextmenu", { cancelable: true, bubbles: true });
    document.body.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
  });
});
