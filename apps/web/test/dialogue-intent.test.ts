import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { classifyIntent } from "../src/services/dialogue-intent";

// ===========================================================================
// classifyIntent — greeting / smalltalk / question / unknown detection
// ===========================================================================
describe("classifyIntent — greeting detection", () => {
  it("detects English greetings", () => {
    assert.equal(classifyIntent("hello").kind, "greeting");
    assert.equal(classifyIntent("hi").kind, "greeting");
    assert.equal(classifyIntent("hey").kind, "greeting");
    assert.equal(classifyIntent("Hi there").kind, "greeting");
  });

  it("detects Chinese greetings", () => {
    assert.equal(classifyIntent("你好").kind, "greeting");
    assert.equal(classifyIntent("晚上好").kind, "greeting");
    assert.equal(classifyIntent("您好").kind, "greeting");
  });

  it("marks short input without forcing it to greeting", () => {
    const result = classifyIntent("abc");
    assert.equal(result.kind, "unknown");
    assert.equal(result.isShortInput, true);
    assert.equal(result.isGreeting, false);
  });

  it("lets short Chinese topic words reach normal dialogue", () => {
    assert.equal(classifyIntent("钥匙").kind, "unknown");
    assert.equal(classifyIntent("上楼").kind, "unknown");
    assert.equal(classifyIntent("钟声").kind, "unknown");
  });

  it("marks goodbye as greeting", () => {
    assert.equal(classifyIntent("bye").kind, "greeting");
    assert.equal(classifyIntent("good night").kind, "greeting");
    assert.equal(classifyIntent("再见").kind, "greeting");
  });
});

describe("classifyIntent — smalltalk detection", () => {
  it("detects smalltalk patterns", () => {
    assert.equal(classifyIntent("how are you").kind, "smalltalk");
    assert.equal(classifyIntent("最近怎么样").kind, "smalltalk");
    assert.equal(classifyIntent("how are you doing").kind, "smalltalk");
  });

  it("smalltalk is not flagged as greeting", () => {
    const result = classifyIntent("how are you");
    assert.equal(result.isGreeting, false);
  });
});

describe("classifyIntent — question detection", () => {
  it("detects English questions by punctuation", () => {
    assert.equal(classifyIntent("What happened that night?").kind, "question");
    assert.equal(classifyIntent("Do you know anything?").kind, "question");
  });

  it("detects Chinese questions by punctuation", () => {
    assert.equal(classifyIntent("你知道什么？").kind, "question");
  });

  it("detects questions by starting words", () => {
    assert.equal(classifyIntent("what is your name").kind, "question");
    assert.equal(classifyIntent("who was there").kind, "question");
    assert.equal(classifyIntent("can you help me").kind, "question");
  });
});

describe("classifyIntent — evidence presenting", () => {
  it("detects evidence-related input", () => {
    assert.equal(classifyIntent("I found this evidence").kind, "evidence_presenting");
    assert.equal(classifyIntent("let me show you the clue").kind, "evidence_presenting");
    assert.equal(classifyIntent("我发现了证据").kind, "evidence_presenting");
  });
});

describe("classifyIntent — unknown fallback", () => {
  it("classifies unrecognized input as unknown", () => {
    assert.equal(classifyIntent("I want to go upstairs").kind, "unknown");
    assert.equal(classifyIntent("tell me about the master").kind, "unknown");
    assert.equal(classifyIntent("I think Theo is suspicious").kind, "unknown");
  });
});
