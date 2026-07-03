"use client";

import type { NdaFormValues, PartyDetails, TermType } from "@/lib/types";

const inputClass =
  "w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none";
const labelClass = "mb-1 block text-sm font-medium text-zinc-700";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      {hint ? <p className="mb-1 text-xs text-zinc-500">{hint}</p> : null}
      {children}
    </div>
  );
}

function TermChoice({
  label,
  hint,
  type,
  years,
  fixedDescription,
  perpetualDescription,
  onChange,
}: {
  label: string;
  hint: string;
  type: TermType;
  years: string;
  fixedDescription: string;
  perpetualDescription: string;
  onChange: (type: TermType, years: string) => void;
}) {
  return (
    <Field label={label} hint={hint}>
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm text-zinc-800">
          <input
            type="radio"
            checked={type === "fixed"}
            onChange={() => onChange("fixed", years)}
          />
          <span>
            {fixedDescription}{" "}
            <input
              type="number"
              min={1}
              value={years}
              onChange={(e) => onChange("fixed", e.target.value)}
              className="ml-1 w-16 rounded-md border border-zinc-300 px-2 py-1 text-sm"
            />{" "}
            year(s) from Effective Date
          </span>
        </label>
        <label className="flex items-center gap-2 text-sm text-zinc-800">
          <input
            type="radio"
            checked={type === "perpetual"}
            onChange={() => onChange("perpetual", years)}
          />
          <span>{perpetualDescription}</span>
        </label>
      </div>
    </Field>
  );
}

function PartyFieldset({
  label,
  party,
  onChange,
}: {
  label: string;
  party: PartyDetails;
  onChange: (party: PartyDetails) => void;
}) {
  return (
    <fieldset className="space-y-3 rounded-md border border-zinc-200 p-4">
      <legend className="px-1 text-sm font-semibold text-zinc-900">
        {label}
      </legend>
      <Field label="Print Name">
        <input
          type="text"
          value={party.printName}
          onChange={(e) => onChange({ ...party, printName: e.target.value })}
          className={inputClass}
        />
      </Field>
      <Field label="Title">
        <input
          type="text"
          value={party.title}
          onChange={(e) => onChange({ ...party, title: e.target.value })}
          className={inputClass}
        />
      </Field>
      <Field label="Company">
        <input
          type="text"
          value={party.company}
          onChange={(e) => onChange({ ...party, company: e.target.value })}
          className={inputClass}
        />
      </Field>
      <Field label="Notice Address" hint="Use either email or postal address">
        <input
          type="text"
          value={party.noticeAddress}
          onChange={(e) =>
            onChange({ ...party, noticeAddress: e.target.value })
          }
          className={inputClass}
        />
      </Field>
    </fieldset>
  );
}

export default function NdaForm({
  values,
  onChange,
}: {
  values: NdaFormValues;
  onChange: (values: NdaFormValues) => void;
}) {
  function set<K extends keyof NdaFormValues>(key: K, value: NdaFormValues[K]) {
    onChange({ ...values, [key]: value });
  }

  function setMndaTerm(type: NdaFormValues["mndaTermType"], years: string) {
    onChange({ ...values, mndaTermType: type, mndaTermYears: years });
  }

  function setConfidentialityTerm(
    type: NdaFormValues["confidentialityTermType"],
    years: string
  ) {
    onChange({ ...values, confidentialityTermType: type, confidentialityTermYears: years });
  }

  return (
    <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
      <div>
        <h2 className="mb-4 text-lg font-semibold text-zinc-900">
          Deal Terms
        </h2>
        <div className="space-y-4">
          <Field
            label="Purpose"
            hint="How Confidential Information may be used"
          >
            <textarea
              value={values.purpose}
              onChange={(e) => set("purpose", e.target.value)}
              rows={2}
              className={inputClass}
            />
          </Field>
          <Field label="Effective Date">
            <input
              type="date"
              value={values.effectiveDate}
              onChange={(e) => set("effectiveDate", e.target.value)}
              className={inputClass}
            />
          </Field>
          <TermChoice
            label="MNDA Term"
            hint="The length of this MNDA"
            type={values.mndaTermType}
            years={values.mndaTermYears}
            fixedDescription="Expires"
            perpetualDescription="Continues until terminated in accordance with the terms of the MNDA."
            onChange={setMndaTerm}
          />
          <TermChoice
            label="Term of Confidentiality"
            hint="How long Confidential Information is protected"
            type={values.confidentialityTermType}
            years={values.confidentialityTermYears}
            fixedDescription="Confidential Information is protected for"
            perpetualDescription="In perpetuity."
            onChange={setConfidentialityTerm}
          />
          <Field label="Governing Law" hint="Fill in state">
            <input
              type="text"
              value={values.governingLaw}
              onChange={(e) => set("governingLaw", e.target.value)}
              className={inputClass}
              placeholder="e.g. Delaware"
            />
          </Field>
          <Field
            label="Jurisdiction"
            hint="Fill in city or county and state"
          >
            <input
              type="text"
              value={values.jurisdiction}
              onChange={(e) => set("jurisdiction", e.target.value)}
              className={inputClass}
              placeholder="e.g. courts located in New Castle, DE"
            />
          </Field>
          <Field
            label="MNDA Modifications"
            hint="List any modifications to the MNDA (optional)"
          >
            <textarea
              value={values.modifications}
              onChange={(e) => set("modifications", e.target.value)}
              rows={2}
              className={inputClass}
            />
          </Field>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-zinc-900">Parties</h2>
        <PartyFieldset
          label="Party 1"
          party={values.party1}
          onChange={(party1) => set("party1", party1)}
        />
        <PartyFieldset
          label="Party 2"
          party={values.party2}
          onChange={(party2) => set("party2", party2)}
        />
      </div>
    </form>
  );
}
