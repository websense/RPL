import axios from "axios";
import * as cheerio from "cheerio";

/**
 * Normalize text (trim, collapse spaces)
 */
function cleanText(t) {
  return (t || "")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Convert inner HTML of a node to a readable text block:
 * - <br> becomes newlines
 * - collapse excess whitespace
 */
function htmlToText($, el) {
  const clone = $(el).clone();

  // turn <br> into newlines to preserve structure
  clone.find("br").replaceWith("\n");

  // strip extra spaces
  const text = clone.text().replace(/\u00a0/g, " ");
  // collapse 3+ newlines → 2, trim lines
  return text
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean)
    .join("\n");
}

/**
 * Extract the <dd> text that follows a <dt> with label matching `labelRE`.
 */
function ddAfterDt($, labelRE) {
  let value = "";
  $("dl dt").each((_, dt) => {
    const label = cleanText($(dt).text());
    if (labelRE.test(label)) {
      const dd = $(dt).next("dd");
      if (dd && dd.length) {
        value = htmlToText($, dd.get(0));
      }
    }
  });
  return value;
}

async function scrapeUWAUnit(code) {
  const unitCode = String(code || "").trim().toUpperCase();
  if (!/^[A-Z]{3,}\d{3,}$/.test(unitCode)) {
    throw new Error(`Invalid unit code: ${unitCode}`);
  }

  const url = `https://handbooks.uwa.edu.au/unitdetails?code=${encodeURIComponent(unitCode)}`;
  const { data: html } = await axios.get(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
  });

  const $ = cheerio.load(html);

  // Extract Unit name 
  let unitName = cleanText($("#pagetitle").first().text());
  if (!unitName) {
    unitName = cleanText($("h1").first().text()) ||
               cleanText($("meta[property='og:title']").attr("content"));
  }

  // Extract unit credit points
  let creditPoints = "";
  $("dl dt").each((_, dt) => {
    const label = cleanText($(dt).text());
    if (/^credit$/i.test(label)) {
      const ddText = cleanText($(dt).next("dd").text());
      const m = ddText.match(/(\d+)\s*points?/i);
      if (m) creditPoints = m[1];
    }
  });

  // Extract contact hours
  const contactHours = ddAfterDt($, /^contact\s*hours$/i);

  // Extract unit outcomes
  const outcomes = ddAfterDt($, /^outcomes$/i);

  // Extract indicative assessments
  const assessments = ddAfterDt($, /^assessment$/i);

  // Extract unit 
  const unitLevel = (unitCode.match(/[A-Z]+(\d)/i) || [,""])[1] || "";

  return {
    code: unitCode,
    unitLevel,
    unitName,
    outcomes,
    assessments,
    creditPoints,
    contactHours,
    outlineLink: url,
  };
}

export { scrapeUWAUnit };
