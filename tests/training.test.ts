import { describe, it, expect } from "vitest";
import {
  demoTeamMembers,
  demoPromptTemplates,
  demoTrainingModules,
  demoUsageLogs,
  demoCapabilityChecks,
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

  it("tracks realistic time saved estimates against manual baselines", () => {
    let totalManualMinutes = 0;
    let totalSavedMinutes = 0;

    for (const log of demoUsageLogs) {
      expect(log.manualTimeEstimateMinutes, `${log.id} manual baseline missing`).toBeGreaterThan(0);
      expect(log.estimatedTimeSavedMinutes, `${log.id} saved estimate missing`).toBeGreaterThan(0);
      expect(
        log.estimatedTimeSavedMinutes,
        `${log.id} saves more time than the manual baseline`
      ).toBeLessThan(log.manualTimeEstimateMinutes);

      totalManualMinutes += log.manualTimeEstimateMinutes;
      totalSavedMinutes += log.estimatedTimeSavedMinutes;
    }

    expect(totalSavedMinutes).toBeGreaterThan(300);
    expect(totalSavedMinutes).toBeLessThan(totalManualMinutes);
  });

  it("adoption scores are between 0 and 100", () => {
    for (const member of demoTeamMembers) {
      expect(member.adoptionScore).toBeGreaterThanOrEqual(0);
      expect(member.adoptionScore).toBeLessThanOrEqual(100);
    }
  });

  it("tracks role-based adoption gaps against benchmarks", () => {
    const gaps = demoTeamMembers.map(member => ({
      id: member.id,
      gap: member.adoptionScore - member.roleBenchmark,
    }));

    for (const member of demoTeamMembers) {
      expect(member.roleBenchmark, `${member.fullName} has an unrealistic benchmark`).toBeGreaterThanOrEqual(60);
      expect(member.roleBenchmark, `${member.fullName} has an unrealistic benchmark`).toBeLessThanOrEqual(95);
    }

    expect(gaps.some(({ gap }) => gap < 0)).toBe(true);
    expect(gaps.some(({ gap }) => gap >= 0)).toBe(true);
    expect(gaps.find(({ id }) => id === "mem_006")?.gap).toBeLessThan(0);
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
    expect(demoAdoptionMetrics.totalCapabilityChecks).toBe(15);
    expect(demoAdoptionMetrics.totalCapabilityChecksPassed).toBe(8);
    expect(demoAdoptionMetrics.totalCapabilityChecksPassed).toBeLessThanOrEqual(demoAdoptionMetrics.totalCapabilityChecks);
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

  it("adoption velocity shows positive week-over-week and month-over-month growth", () => {
    expect(demoAdoptionMetrics.previousWeekPrompts).toBeGreaterThan(0);
    expect(demoAdoptionMetrics.previousMonthPrompts).toBeGreaterThan(0);
    expect(demoAdoptionMetrics.promptsThisWeek).toBeGreaterThan(demoAdoptionMetrics.previousWeekPrompts);
    expect(demoAdoptionMetrics.promptsThisMonth).toBeGreaterThan(demoAdoptionMetrics.previousMonthPrompts);
    // Week-over-week growth should be between 5% and 50% for a healthy adoption trajectory
    const wowGrowth = (demoAdoptionMetrics.promptsThisWeek - demoAdoptionMetrics.previousWeekPrompts) / demoAdoptionMetrics.previousWeekPrompts;
    expect(wowGrowth).toBeGreaterThan(0.05);
    expect(wowGrowth).toBeLessThan(0.50);
    // Month-over-month growth should also be positive and in a realistic range
    const momGrowth = (demoAdoptionMetrics.promptsThisMonth - demoAdoptionMetrics.previousMonthPrompts) / demoAdoptionMetrics.previousMonthPrompts;
    expect(momGrowth).toBeGreaterThan(0.05);
    expect(momGrowth).toBeLessThan(0.50);
  });
});

describe("Team AI Training Hub — post-training capability checks", () => {
  const memberIds = new Set(demoTeamMembers.map(m => m.id));
  const moduleIds = new Set(demoTrainingModules.map(m => m.id));

  it("every capability check references a valid member and module", () => {
    for (const cc of demoCapabilityChecks) {
      expect(memberIds.has(cc.memberId), `${cc.id} has unknown member ${cc.memberId}`).toBe(true);
      expect(moduleIds.has(cc.moduleId), `${cc.id} has unknown module ${cc.moduleId}`).toBe(true);
    }
  });

  it("passed checks carry non-null attemptedAt and assessorNotes, and independentApplication is true", () => {
    for (const cc of demoCapabilityChecks) {
      if (cc.status === "passed") {
        expect(cc.attemptedAt, `${cc.id} passed but has null attemptedAt`).toBeTruthy();
        expect(cc.assessorNotes, `${cc.id} passed but has null assessorNotes`).toBeTruthy();
        expect(cc.independentApplication, `${cc.id} passed but independentApplication is false`).toBe(true);
      }
    }
  });

  it("pending checks have null attemptedAt and assessorNotes", () => {
    for (const cc of demoCapabilityChecks) {
      if (cc.status === "pending") {
        expect(cc.attemptedAt, `${cc.id} is pending but has non-null attemptedAt`).toBeNull();
        expect(cc.assessorNotes, `${cc.id} is pending but has non-null assessorNotes`).toBeNull();
      }
    }
  });

  it("needs_review checks have non-null attemptedAt and assessorNotes", () => {
    for (const cc of demoCapabilityChecks) {
      if (cc.status === "needs_review") {
        expect(cc.attemptedAt, `${cc.id} needs_review but has null attemptedAt`).toBeTruthy();
        expect(cc.assessorNotes, `${cc.id} needs_review but has null assessorNotes`).toBeTruthy();
        expect(cc.independentApplication, `${cc.id} needs_review but independentApplication is true`).toBe(false);
      }
    }
  });

  it("high-adoption members have at least one passed capability check", () => {
    const highAdopters = demoTeamMembers.filter(m => m.adoptionScore >= 85);
    expect(highAdopters.length).toBeGreaterThan(0);
    for (const member of highAdopters) {
      const passed = demoCapabilityChecks.filter(cc => cc.memberId === member.id && cc.status === "passed");
      expect(passed.length, `${member.fullName} has adoption score ${member.adoptionScore} but zero passed capability checks`).toBeGreaterThan(0);
    }
  });

  it("every training module has at least one capability check", () => {
    for (const tm of demoTrainingModules) {
      const checks = demoCapabilityChecks.filter(cc => cc.moduleId === tm.id);
      expect(checks.length, `${tm.id} has no capability checks`).toBeGreaterThan(0);
    }
  });

  it("capability check pass rate is below training completion rate, showing the skills-transfer gap", () => {
    // Training completion says 67% of modules done, but only 53% of capability checks passed
    const passRate = demoAdoptionMetrics.totalCapabilityChecksPassed / demoAdoptionMetrics.totalCapabilityChecks;
    const trainingRate = demoAdoptionMetrics.overallTrainingCompletion / 100;
    expect(passRate).toBeLessThan(trainingRate);
  });

  it("every capability check scenario describes a task the learner performed independently", () => {
    for (const cc of demoCapabilityChecks) {
      expect(cc.scenario.trim().length, `${cc.id} scenario is too short`).toBeGreaterThan(60);
    }
  });
});
