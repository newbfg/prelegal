import fs from "node:fs";
import path from "node:path";

const TEMPLATES_DIR = path.join(process.cwd(), "..", "templates");

export interface MutualNdaTemplates {
  coverPage: string;
  standardTerms: string;
}

export function readMutualNdaTemplates(): MutualNdaTemplates {
  const coverPage = fs.readFileSync(
    path.join(TEMPLATES_DIR, "mutual-nda-coverpage.md"),
    "utf-8"
  );
  const standardTerms = fs.readFileSync(
    path.join(TEMPLATES_DIR, "mutual-nda.md"),
    "utf-8"
  );
  return { coverPage, standardTerms };
}
