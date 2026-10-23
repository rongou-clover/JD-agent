import { describe, expect, it } from "vitest";
import type { Diagnosis } from "@/domain/diagnosis";
import { isValidDiagnosis } from "./agent";

const ae: Extract<Diagnosis, { kind: "catalog" }> = { kind: "catalog", jobTitleId: "account-executive", seniority: "S2", otherRoles: [], hybrid: false };
const csm = { jobTitleId: "customer-success-manager", activities: ["Seguire i rinnovi"] };

describe("isValidDiagnosis", () => {
  it("accepts a catalog role with key activities from another role", () => {
    expect(isValidDiagnosis({ ...ae, otherRoles: [csm] })).toBe(true);
  });

  it("rejects unknown ids, the main role among the others and duplicates", () => {
    expect(isValidDiagnosis({ ...ae, jobTitleId: "astronaut" })).toBe(false);
    expect(isValidDiagnosis({ ...ae, otherRoles: [{ ...csm, jobTitleId: "astronaut" }] })).toBe(false);
    expect(isValidDiagnosis({ ...ae, otherRoles: [{ ...csm, jobTitleId: "account-executive" }] })).toBe(false);
    expect(isValidDiagnosis({ ...ae, otherRoles: [csm, csm] })).toBe(false);
  });

  it("rejects a hybrid profile without other roles", () => {
    expect(isValidDiagnosis({ ...ae, hybrid: true })).toBe(false);
  });
});
