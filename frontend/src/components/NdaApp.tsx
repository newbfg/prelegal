"use client";

import { useMemo, useState } from "react";
import NdaForm from "./NdaForm";
import NdaDocument from "./NdaDocument";
import AuthStatus from "./AuthStatus";
import { mergeTemplate, mergeTemplatePlain } from "@/lib/mergeTemplate";
import { generateNdaPdf } from "@/lib/pdf";
import { defaultNdaFormValues, getTodayLocalDate, type NdaFormValues } from "@/lib/types";

export default function NdaApp({
  coverPageTemplate,
  standardTermsTemplate,
}: {
  coverPageTemplate: string;
  standardTermsTemplate: string;
}) {
  // Lazy initializer: runs once per environment (server render, then client
  // hydration), using that environment's own local date rather than UTC.
  const [values, setValues] = useState<NdaFormValues>(() => ({
    ...defaultNdaFormValues,
    effectiveDate: getTodayLocalDate(),
  }));
  const [isDownloading, setIsDownloading] = useState(false);

  const merged = useMemo(
    () => mergeTemplate(coverPageTemplate, standardTermsTemplate, values),
    [coverPageTemplate, standardTermsTemplate, values]
  );

  async function handleDownload() {
    setIsDownloading(true);
    try {
      // Yield to the browser first so the "Preparing PDF…" state actually paints
      // before the synchronous, CPU-bound PDF layout work blocks the main thread.
      await new Promise((resolve) => setTimeout(resolve, 0));
      const plain = mergeTemplatePlain(coverPageTemplate, standardTermsTemplate, values);
      const pdf = generateNdaPdf(plain.coverPage, plain.standardTerms);
      pdf.save("mutual-nda.pdf");
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-7xl flex-col gap-8 px-6 py-10">
      <div className="flex justify-end">
        <AuthStatus />
      </div>
      <div className="flex flex-col gap-8 lg:flex-row">
        <section className="lg:w-[420px] lg:flex-none">
          <h1 className="mb-6 text-2xl font-bold text-zinc-900">
            Mutual NDA Creator
          </h1>
          <NdaForm values={values} onChange={setValues} />
        </section>
        <section className="min-w-0 flex-1">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-zinc-900">Preview</h2>
            <button
              type="button"
              onClick={handleDownload}
              disabled={isDownloading}
              className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50"
            >
              {isDownloading ? "Preparing PDF…" : "Download PDF"}
            </button>
          </div>
          <div className="overflow-x-auto">
            <NdaDocument
              coverPage={merged.coverPage}
              standardTerms={merged.standardTerms}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
