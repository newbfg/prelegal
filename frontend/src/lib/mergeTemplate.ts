import type { NdaFormValues } from "./types";

type Escaper = (value: string) => string;

/**
 * The templates are rendered with rehype-raw (so the source's own <span>/<label>
 * tags pass through), so any user-supplied text spliced into the markdown must be
 * escaped first or it would be interpreted as markup/HTML by the renderer.
 */
const htmlEscape: Escaper = (value) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/\|/g, "\\|");

/** For the plain-text PDF renderer, which needs no HTML escaping, only table-cell safety. */
const plainEscape: Escaper = (value) => value.replace(/\|/g, "\\|");

function formatDate(isoDate: string): string {
  if (!isoDate) return "[Today’s date]";
  const date = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "[Today’s date]";
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function describeMndaTerm(values: NdaFormValues): string {
  if (values.mndaTermType === "perpetual") {
    return "Continues until terminated in accordance with the terms of the MNDA";
  }
  const years = values.mndaTermYears || "1";
  return `Expires ${years} year(s) from the Effective Date`;
}

function describeConfidentialityTerm(values: NdaFormValues): string {
  if (values.confidentialityTermType === "perpetual") {
    return "In perpetuity";
  }
  const years = values.confidentialityTermYears || "1";
  return `${years} year(s) from the Effective Date, but in the case of trade secrets until Confidential Information is no longer considered a trade secret under applicable laws`;
}

/**
 * Like String.replace, but throws if the literal target isn't found. mergeCoverPage
 * matches exact prose copied from templates/mutual-nda-coverpage.md; a silent
 * String.replace no-op would ship an unfilled `[bracketed placeholder]` straight
 * to users the moment that file's wording changes, so fail loudly instead.
 */
function mustReplace(source: string, target: string, replacement: string): string {
  if (!source.includes(target)) {
    throw new Error(
      `mergeTemplate: expected to find ${JSON.stringify(target.slice(0, 60))} in the cover page template, but it wasn't there. The template text may have changed — update mergeCoverPage to match.`
    );
  }
  return source.replace(target, replacement);
}

function mergeCoverPage(raw: string, values: NdaFormValues, esc: Escaper): string {
  let merged = raw;

  merged = mustReplace(
    merged,
    "[Evaluating whether to enter into a business relationship with the other party.]",
    `[${esc(values.purpose)}]`
  );

  merged = mustReplace(merged, "[Today’s date]", formatDate(values.effectiveDate));

  const mndaFixed = values.mndaTermType === "fixed";
  merged = mustReplace(
    merged,
    "- [x]     Expires [1 year(s)] from Effective Date.\n- [ ]     Continues until terminated in accordance with the terms of the MNDA.",
    `- [${mndaFixed ? "x" : " "}]     Expires [${esc(values.mndaTermYears || "1")} year(s)] from Effective Date.\n- [${mndaFixed ? " " : "x"}]     Continues until terminated in accordance with the terms of the MNDA.`
  );

  const confidentialityFixed = values.confidentialityTermType === "fixed";
  merged = mustReplace(
    merged,
    "- [x]     [1 year(s)] from Effective Date, but in the case of trade secrets until Confidential Information is no longer considered a trade secret under applicable laws.\n- [ ]     In perpetuity.",
    `- [${confidentialityFixed ? "x" : " "}]     [${esc(values.confidentialityTermYears || "1")} year(s)] from Effective Date, but in the case of trade secrets until Confidential Information is no longer considered a trade secret under applicable laws.\n- [${confidentialityFixed ? " " : "x"}]     In perpetuity.`
  );

  merged = mustReplace(merged, "[Fill in state]", esc(values.governingLaw));
  merged = mustReplace(
    merged,
    "[Fill in city or county and state, i.e. “courts located in New Castle, DE”]",
    esc(values.jurisdiction)
  );

  merged = mustReplace(
    merged,
    "List any modifications to the MNDA",
    // Bracket-wrapped like the Purpose field above: user text becomes a standalone
    // line here, so without a non-"#"/"-"/"|" leading character it could otherwise
    // be misread as a heading, list item, or table row by the markdown renderers.
    values.modifications ? `[${esc(values.modifications)}]` : "None."
  );

  const table = [
    "|| PARTY 1 | PARTY 2 |",
    "|:--- | :----: | :----: |",
    "| Signature | | |",
    `| Print Name | ${esc(values.party1.printName)} | ${esc(values.party2.printName)} |`,
    `| Title | ${esc(values.party1.title)} | ${esc(values.party2.title)} |`,
    `| Company | ${esc(values.party1.company)} | ${esc(values.party2.company)} |`,
    `| Notice Address <label>Use either email or postal address</label> | ${esc(values.party1.noticeAddress)} | ${esc(values.party2.noticeAddress)} |`,
    "| Date | | |",
  ].join("\n");

  if (!/\|\| PARTY 1 \| PARTY 2 \|[\s\S]*?\| Date \| \| \|/.test(merged)) {
    throw new Error(
      "mergeTemplate: expected to find the PARTY 1 / PARTY 2 signature table in the cover page template, but it wasn't there. The template text may have changed — update mergeCoverPage to match."
    );
  }
  merged = merged.replace(
    /\|\| PARTY 1 \| PARTY 2 \|[\s\S]*?\| Date \| \| \|/,
    table
  );

  return merged;
}

function mergeStandardTerms(raw: string, values: NdaFormValues, esc: Escaper): string {
  const spanValues: Record<string, string> = {
    Purpose: esc(values.purpose),
    "Effective Date": formatDate(values.effectiveDate),
    "MNDA Term": esc(describeMndaTerm(values)),
    "Term of Confidentiality": esc(describeConfidentialityTerm(values)),
    "Governing Law": esc(values.governingLaw),
    Jurisdiction: esc(values.jurisdiction),
  };

  return raw.replace(
    /<span class="coverpage_link">([^<]+)<\/span>/g,
    (match, label: string) => spanValues[label] ?? match
  );
}

export interface MergedNdaDocument {
  coverPage: string;
  standardTerms: string;
}

export function mergeTemplate(
  coverPageTemplate: string,
  standardTermsTemplate: string,
  values: NdaFormValues
): MergedNdaDocument {
  return {
    coverPage: mergeCoverPage(coverPageTemplate, values, htmlEscape),
    standardTerms: mergeStandardTerms(standardTermsTemplate, values, htmlEscape),
  };
}

/** Same merge, without HTML-entity escaping — for the plain-text PDF renderer. */
export function mergeTemplatePlain(
  coverPageTemplate: string,
  standardTermsTemplate: string,
  values: NdaFormValues
): MergedNdaDocument {
  return {
    coverPage: mergeCoverPage(coverPageTemplate, values, plainEscape),
    standardTerms: mergeStandardTerms(standardTermsTemplate, values, plainEscape),
  };
}
