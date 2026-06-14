import { describe, it, expect } from "vitest";
import {
  demoTeamMembers,
  demoPromptTemplates,
  demoTrainingModules,
  demoUsageLogs,
  demoAdoptionMetrics
} from "@/lib/demo-data";

describe("Team AI Training Hub — demo data integrity", () => {
  it("has exactly 6 team members", () => {
    expect(demoTeamMembers.length).toBe(6);
  });

  it("has exactly 8 prompt templates", () => {
    expect(demoPromptTemplates.length).toBe(8);
  });

  it("has exactly 5 training modules", () => {
    expect(demoTrainingModules.length).toBe(5);
  });

  it("every prompt template references a valid creator", () => {
    const memberIds = new Set(demoTeamMembers.map(m => m.id));
    for (const pt of demoPromptTemplates) {
      expect(memberIds.has(pt.createdBy), `Template ${pt.id} has unknown creator ${pt.createdBy}`).toBe(true);
    }
  });

  it("every usage log references a valid team member", () => {
    const memberIds = new Set(demoTeamMembers.map(m => m.id));
    for (const log of demoUsageLogs) {
      expect(memberIds.has(log.memberId), `Usage log ${log.id} references unknown member ${log.memberId}`).toBe(true);
    }
  });

  it("usage logs with template references point to valid templates", () => {
    const templateIds = new Set(demoPromptTemplates.map(pt => pt.id));
    for (const log of demoUsageLogs) {
      if (log.promptTemplateId) {
        expect(templateIds.has(log.promptTemplateId), `Usage log ${log.id} references unknown template ${log.promptTemplateId}`).toBe(true);
      }
    }
  });

  it("adoption scores are between 0 and 100", () => {
    for (const member of demoTeamMembers) {
      expect(member.adoptionScore).toBeGreaterThanOrEqual(0);
      expect(member.adoptionScore).toBeLessThanOrEqual(100);
    }
  });

  it("training completion counts do not exceed total modules", () => {
    for (const member of demoTeamMembers) {
      expect(member.trainingCompleted).toBeLessThanOrEqual(member.totalModules);
    }
  });

  it("prompt template ratings are between 1 and 5", () => {
    for (const pt of demoPromptTemplates) {
      expect(pt.averageRating).toBeGreaterThanOrEqual(1);
      expect(pt.averageRating).toBeLessThanOrEqual(5);
    }
  });

  it("adoption metrics summary values are sensible", () => {
    expect(demoAdoptionMetrics.totalTeamMembers).toBe(6);
    expect(demoAdoptionMetrics.averageAdoptionScore).toBeGreaterThan(0);
    expect(demoAdoptionMetrics.averageAdoptionScore).toBeLessThanOrEqual(100);
    expect(demoAdoptionMetrics.overallTrainingCompletion).toBeGreaterThan(0);
    expect(demoAdoptionMetrics.overallTrainingCompletion).toBeLessThanOrEqual(100);
    expect(demoAdoptionMetrics.totalPromptsUsed).toBeGreaterThan(0);
    expect(demoAdoptionMetrics.totalPromptTemplates).toBe(8);
  });

  it("training module completion rates are between 0 and 100", () => {
    for (const tm of demoTrainingModules) {
      expect(tm.completionRate).toBeGreaterThanOrEqual(0);
      expect(tm.completionRate).toBeLessThanOrEqual(100);
    }
  });

  it("training modules include hands-on practice and capability checks", () => {
    for (const tm of demoTrainingModules) {
      expect(tm.practiceScenario.trim().length, `${tm.id} is missing a practice lab`).toBeGreaterThan(40);
      expect(tm.capabilityOutcome.trim().length, `${tm.id} is missing a capability outcome`).toBeGreaterThan(40);
      expect(`${tm.practiceScenario} ${tm.capabilityOutcome}`.toLowerCase()).toMatch(/workflow|role|review|safe|judgment|decision|approval|compliance/);
    }
  });
});
