import { describe, expect, it } from "vitest";
import { splitMarkdownBlocks } from "./chat-format";

describe("splitMarkdownBlocks", () => {
  it("keeps plain text as a single text block", () => {
    const blocks = splitMarkdownBlocks("أهلاً بك في elloll!\nكيف يمكنني مساعدتك؟");
    expect(blocks).toEqual([
      { type: "text", content: "أهلاً بك في elloll!\nكيف يمكنني مساعدتك؟" },
    ]);
  });

  it("extracts headings, markdown pipe tables, and trailing text into distinct blocks", () => {
    const md = [
      "### مقارنة الأسعار",
      "",
      "| المنتج | القسم | السعر |",
      "| :--- | --- | ---: |",
      "| بنطلون سويت بانت كحلي | بنطلونات | 400 ج.م |",
      "| سنيكرز أبيض وبيج | أحذية | 300 ج.م |",
      "",
      "الإجمالي **700 ج.م** فقط.",
    ].join("\n");

    const blocks = splitMarkdownBlocks(md);
    expect(blocks).toHaveLength(3);
    expect(blocks[0]).toEqual({ type: "text", content: "### مقارنة الأسعار\n" });
    expect(blocks[1]).toEqual({
      type: "table",
      headers: ["المنتج", "القسم", "السعر"],
      rows: [
        ["بنطلون سويت بانت كحلي", "بنطلونات", "400 ج.م"],
        ["سنيكرز أبيض وبيج", "أحذية", "300 ج.م"],
      ],
    });
    expect(blocks[2]).toEqual({
      type: "text",
      content: "\nالإجمالي **700 ج.م** فقط.",
    });
  });

  it("handles tables without outer pipes and normalizes missing trailing cells", () => {
    const md = [
      "المقاس | الصدر | الطول",
      "--- | --- | ---",
      "M | 55 سم",
      "L | 58 سم | 72 سم",
    ].join("\n");

    const blocks = splitMarkdownBlocks(md);
    expect(blocks).toEqual([
      {
        type: "table",
        headers: ["المقاس", "الصدر", "الطول"],
        rows: [
          ["M", "55 سم", ""],
          ["L", "58 سم", "72 سم"],
        ],
      },
    ]);
  });

  it("does not parse prose lines containing | when there is no separator row", () => {
    const md = "السعر 400 ج.م | متوفر للشحن الفوري";
    const blocks = splitMarkdownBlocks(md);
    expect(blocks).toEqual([{ type: "text", content: md }]);
  });
});
