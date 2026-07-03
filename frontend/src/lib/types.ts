export interface PartyDetails {
  printName: string;
  title: string;
  company: string;
  noticeAddress: string;
}

export type TermType = "fixed" | "perpetual";

export interface NdaFormValues {
  purpose: string;
  effectiveDate: string;
  mndaTermType: TermType;
  mndaTermYears: string;
  confidentialityTermType: TermType;
  confidentialityTermYears: string;
  governingLaw: string;
  jurisdiction: string;
  modifications: string;
  party1: PartyDetails;
  party2: PartyDetails;
}

export const emptyParty: PartyDetails = {
  printName: "",
  title: "",
  company: "",
  noticeAddress: "",
};

/**
 * Local (not UTC) calendar date as YYYY-MM-DD, for the date input's default value.
 * Left for the caller to invoke client-side only (e.g. in an effect after mount) —
 * computing "today" at module scope would run during SSR too, on the server's
 * clock/timezone, risking a hydration mismatch against the browser's date.
 */
export function getTodayLocalDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export const defaultNdaFormValues: NdaFormValues = {
  purpose: "Evaluating whether to enter into a business relationship with the other party.",
  effectiveDate: "",
  mndaTermType: "fixed",
  mndaTermYears: "1",
  confidentialityTermType: "fixed",
  confidentialityTermYears: "1",
  governingLaw: "",
  jurisdiction: "",
  modifications: "",
  party1: { ...emptyParty },
  party2: { ...emptyParty },
};
