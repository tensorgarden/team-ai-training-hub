import { describe, it, expect } from "vitest";
import {
  demoTeamMembers,
  demoPromptTemplates,
  demoTrainingModules,
  demoUsageLogs,
  demoCapabilityChecks,
  demoAdoptionMetrics,
  demoPrePostBenchmarks,
  demoShadowAiSignals
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

  it("keeps governance-review usage out of ROI credit", () => {
    const reviewRequired = demoUsageLogs.filter(log => log.governanceStatus === "needs_review");
    const eligibleSavedMinutes = demoUsageLogs
      .filter(log => log.roiEligible)
      .reduce((sum, log) => sum + log.estimatedTimeSavedMinutes, 0);
    const allSavedMinutes = demoUsageLogs.reduce((sum, log) => sum + log.estimatedTimeSavedMinutes, 0);

    expect(reviewRequired.length).toBeGreaterThan(0);
    expect(eligibleSavedMinutes).toBeLessThan(allSavedMinutes);

    for (const log of demoUsageLogs) {
      if (log.governanceStatus === "needs_review") {
        expect(log.roiEligible, `${log.id} should not count toward ROI before governance review`).toBe(false);
        expect(log.governanceReviewReason?.trim().length ?? 0, `${log.id} needs a review reason`).toBeGreaterThan(50);
      } else {
        expect(log.roiEligible, `${log.id} should count only after approval`).toBe(true);
        expect(log.governanceReviewReason, `${log.id} should not carry a review reason`).toBeNull();
      }
    }

    const boardSummary = demoUsageLogs.find(log => log.id === "ul_008");
    expect(boardSummary?.governanceStatus).toBe("needs_review");
    expect(boardSummary?.roiEligible).toBe(false);
  });

  it("tracks pre/post business benchmarks with defensible improvement deltas", () => {
    const memberIds = new Set(demoTeamMembers.map(member => member.id));
    const moduleIds = new Set(demoTrainingModules.map(module => module.id));

    expect(demoPrePostBenchmarks.length).toBeGreaterThanOrEqual(3);
    expect(demoPrePostBenchmarks.some(benchmark => benchmark.direction === "higher_is_better")).toBe(true);
    expect(demoPrePostBenchmarks.some(benchmark => benchmark.direction === "lower_is_better")).toBe(true);

    for (const benchmark of demoPrePostBenchmarks) {
      expect(memberIds.has(benchmark.ownerMemberId), `${benchmark.id} has unknown owner`).toBe(true);
      expect(benchmark.relatedModuleIds.length, `${benchmark.id} needs a training-module link`).toBeGreaterThan(0);
      for (const moduleId of benchmark.relatedModuleIds) {
        expect(moduleIds.has(moduleId), `${benchmark.id} references unknown module ${moduleId}`).toBe(true);
      }

      expect(benchmark.baselineValue, `${benchmark.id} missing baseline value`).toBeGreaterThan(0);
      expect(benchmark.postTrainingValue, `${benchmark.id} missing post-training value`).toBeGreaterThan(0);
      expect(new Date(benchmark.measuredAfter).getTime(), `${benchmark.id} measuredAfter must follow measuredBefore`).toBeGreaterThan(new Date(benchmark.measuredBefore).getTime());

      const improvementRate = benchmark.direction === "lower_is_better"
        ? (benchmark.baselineValue - benchmark.postTrainingValue) / benchmark.baselineValue
        : (benchmark.postTrainingValue - benchmark.baselineValue) / benchmark.baselineValue;

      expect(improvementRate, `${benchmark.id} should improve after training`).toBeGreaterThan(0.10);
      expect(improvementRate, `${benchmark.id} improvement is too aggressive for demo data`).toBeLessThan(0.60);
    }
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

  it("assigns accountable peer coaching to every member below their role benchmark", () => {
    const memberById = new Map(demoTeamMembers.map(member => [member.id, member]));
    const belowBenchmark = demoTeamMembers.filter(member => member.adoptionScore < member.roleBenchmark);

    expect(belowBenchmark.length).toBeGreaterThan(0);

    for (const member of belowBenchmark) {
      const coach = member.adoptionCoachMemberId
        ? memberById.get(member.adoptionCoachMemberId)
        : undefined;

      expect(coach, `${member.fullName} needs a valid peer coach`).toBeDefined();
      expect(coach?.id, `${member.fullName} cannot coach themself`).not.toBe(member.id);
      expect(coach?.adoptionScore, `${member.fullName}'s coach should model target-level adoption`).toBeGreaterThanOrEqual(coach?.roleBenchmark ?? 101);
      expect(member.nextCoachingAt, `${member.fullName} needs a scheduled coaching session`).toBeTruthy();
      expect(Number.isNaN(new Date(member.nextCoachingAt ?? "").getTime()), `${member.fullName} has an invalid coaching date`).toBe(false);
      expect(member.coachingFocus?.trim().length ?? 0, `${member.fullName} needs a concrete coaching focus`).toBeGreaterThan(80);
    }

    for (const member of demoTeamMembers.filter(member => member.adoptionScore >= member.roleBenchmark)) {
      expect(member.adoptionCoachMemberId, `${member.fullName} should not be in the coaching queue`).toBeNull();
      expect(member.nextCoachingAt, `${member.fullName} should not have a coaching deadline`).toBeNull();
      expect(member.coachingFocus, `${member.fullName} should not have a coaching intervention`).toBeNull();
    }
  });

  it("pairs below-benchmark coaching with concrete manager support", () => {
    const belowBenchmark = demoTeamMembers.filter(member => member.adoptionScore < member.roleBenchmark);

    for (const member of belowBenchmark) {
      expect(member.managerSupportOwner?.trim().length ?? 0, `${member.fullName} needs a named manager sponsor`).toBeGreaterThan(5);
      expect(member.managerCheckInAt, `${member.fullName} needs a manager follow-up`).toBeTruthy();
      expect(member.managerSupportAction?.trim().length ?? 0, `${member.fullName} needs a concrete manager action`).toBeGreaterThan(80);
      expect(member.managerSupportAction?.toLowerCase() ?? "", `${member.fullName} support must connect to daily work`).toMatch(/workflow|practice|review|sandbox/);

      const coachingTime = new Date(member.nextCoachingAt ?? "").getTime();
      const checkInTime = new Date(member.managerCheckInAt ?? "").getTime();
      expect(checkInTime, `${member.fullName} manager follow-up should happen after peer coaching`).toBeGreaterThan(coachingTime);
    }

    for (const member of demoTeamMembers.filter(member => member.adoptionScore >= member.roleBenchmark)) {
      expect(member.managerSupportOwner, `${member.fullName} should not need a manager intervention`).toBeNull();
      expect(member.managerCheckInAt, `${member.fullName} should not have a manager follow-up`).toBeNull();
      expect(member.managerSupportAction, `${member.fullName} should not have a manager support action`).toBeNull();
    }
  });

  it("schedules evidence-based workflow transfer validation after manager support", () => {
    const belowBenchmark = demoTeamMembers.filter(member => member.adoptionScore < member.roleBenchmark);

    for (const member of belowBenchmark) {
      expect(member.workflowTransferReviewer?.trim().length ?? 0, `${member.fullName} needs a named transfer reviewer`).toBeGreaterThan(5);
      expect(member.workflowTransferReviewAt, `${member.fullName} needs a workflow transfer review`).toBeTruthy();
      expect(member.workflowTransferSuccessCriteria?.trim().length ?? 0, `${member.fullName} needs observable transfer criteria`).toBeGreaterThan(100);
      expect(member.workflowTransferSuccessCriteria?.toLowerCase() ?? "", `${member.fullName} transfer criteria must test work, not attendance`).toMatch(/workflow/);

      const managerCheckInTime = new Date(member.managerCheckInAt ?? "").getTime();
      const transferReviewTime = new Date(member.workflowTransferReviewAt ?? "").getTime();
      expect(transferReviewTime, `${member.fullName} transfer review should follow manager support`).toBeGreaterThan(managerCheckInTime);
    }

    for (const member of demoTeamMembers.filter(member => member.adoptionScore >= member.roleBenchmark)) {
      expect(member.workflowTransferReviewer, `${member.fullName} should not need transfer review`).toBeNull();
      expect(member.workflowTransferReviewAt, `${member.fullName} should not have a transfer-review deadline`).toBeNull();
      expect(member.workflowTransferSuccessCriteria, `${member.fullName} should not have transfer-review criteria`).toBeNull();
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

  it("schedules concrete reinforcement so training is not a one-time event", () => {
    for (const tm of demoTrainingModules) {
      expect(tm.reinforcementCadenceDays, `${tm.id} reinforcement is too frequent`).toBeGreaterThanOrEqual(14);
      expect(tm.reinforcementCadenceDays, `${tm.id} reinforcement is too infrequent`).toBeLessThanOrEqual(30);
      expect(tm.reinforcementActivity.trim().length, `${tm.id} needs a concrete reinforcement activity`).toBeGreaterThan(80);
      expect(tm.reinforcementActivity.toLowerCase(), `${tm.id} reinforcement is not applied practice`).toMatch(/repeat|re-run|audit|retake|review/);
    }
  });

  it("builds critical-thinking checkpoints into every training module", () => {
    for (const tm of demoTrainingModules) {
      expect(tm.criticalThinkingCheckpoint.trim().length, `${tm.id} needs a substantial reliance check`).toBeGreaterThan(100);
      expect(tm.criticalThinkingCheckpoint.toLowerCase(), `${tm.id} must require verification or challenge`).toMatch(/verify|challenge|evidence/);
      expect(tm.criticalThinkingCheckpoint.toLowerCase(), `${tm.id} must define when not to trust the output`).toMatch(/reject|not be trusted|unsupported|escalate|approval/);
    }
  });

  it("requires an independent judgment before learners see AI advice", () => {
    for (const tm of demoTrainingModules) {
      const drill = tm.independentJudgmentDrill.toLowerCase();

      expect(tm.independentJudgmentDrill.trim().length, `${tm.id} needs a substantial human-first drill`).toBeGreaterThan(130);
      expect(drill, `${tm.id} must capture a decision before AI advice`).toMatch(/before (viewing|opening|seeing)|without ai/);
      expect(drill, `${tm.id} must compare human and AI judgments`).toMatch(/compare/);
      expect(drill, `${tm.id} must require an evidence-based final decision`).toMatch(/revise|reject|kept|unchanged|escalate/);
    }
  });

  it("makes learners reflect on confidence and ownership after AI-assisted work", () => {
    for (const tm of demoTrainingModules) {
      const reflection = tm.reasoningOwnershipReflection.toLowerCase();

      expect(tm.reasoningOwnershipReflection.trim().length, `${tm.id} needs a substantial ownership reflection`).toBeGreaterThan(130);
      expect(reflection, `${tm.id} must preserve accountable human reasoning`).toMatch(/reasoning remains yours|analysis you still own|judgments remain yours|claims you personally own|judgment remains yours/);
      expect(reflection, `${tm.id} must make confidence observable`).toMatch(/rate (your )?confidence/);
      expect(reflection, `${tm.id} must expose speed-versus-depth trade-offs`).toMatch(/speed|faster generation|saved time/);
      expect(reflection, `${tm.id} must protect depth of thought or review`).toMatch(/depth|deeper source review/);
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

  it("needs-review capability checks have accountable remediation plans", () => {
    const needsReview = demoCapabilityChecks.filter(cc => cc.status === "needs_review");
    expect(needsReview.length).toBeGreaterThan(0);

    for (const cc of needsReview) {
      const ownerId = cc.reviewOwnerMemberId ?? "";
      const dueAt = cc.reviewDueAt ?? "";
      const attemptedAt = cc.attemptedAt ?? "";

      expect(memberIds.has(ownerId), `${cc.id} has no valid remediation owner`).toBe(true);
      expect(dueAt, `${cc.id} has no remediation due date`).toBeTruthy();
      expect(cc.remediationPlan?.trim().length ?? 0, `${cc.id} remediation plan is too thin`).toBeGreaterThan(80);

      const dueTime = new Date(dueAt).getTime();
      const attemptedTime = new Date(attemptedAt).getTime();
      const daysToReview = (dueTime - attemptedTime) / (1000 * 60 * 60 * 24);

      expect(dueTime, `${cc.id} remediation due date must follow the failed check`).toBeGreaterThan(attemptedTime);
      expect(daysToReview, `${cc.id} remediation due date is not near-term`).toBeLessThanOrEqual(14);
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

describe("Team AI Training Hub — shadow AI signal governance", () => {
  const memberIds = new Set(demoTeamMembers.map(m => m.id));

  it("routes every detected unsanctioned tool to a named independent reviewer with a near-term deadline", () => {
    expect(demoShadowAiSignals.length).toBeGreaterThanOrEqual(3);

    for (const signal of demoShadowAiSignals) {
      expect(memberIds.has(signal.memberId), `${signal.id} references unknown member ${signal.memberId}`).toBe(true);
      expect(memberIds.has(signal.reviewerMemberId), `${signal.id} has unknown reviewer ${signal.reviewerMemberId}`).toBe(true);
      expect(signal.reviewerMemberId, `${signal.id} reviewer must be independent of the reporter`).not.toBe(signal.memberId);
      expect(signal.toolName.trim().length, `${signal.id} needs a tool name`).toBeGreaterThan(3);
      expect(signal.observedUse.trim().length, `${signal.id} needs a concrete observed-use description`).toBeGreaterThan(60);

      const detectedTime = new Date(signal.detectedAt).getTime();
      const dueTime = new Date(signal.reviewDueAt).getTime();
      const daysToReview = (dueTime - detectedTime) / (1000 * 60 * 60 * 24);

      expect(Number.isNaN(detectedTime), `${signal.id} has an invalid detection date`).toBe(false);
      expect(dueTime, `${signal.id} review deadline must follow detection`).toBeGreaterThan(detectedTime);
      expect(daysToReview, `${signal.id} review deadline is not near-term`).toBeLessThanOrEqual(14);
    }
  });

  it("never treats an unassessed tool as approved or routes it without review", () => {
    const unassessed = demoShadowAiSignals.filter(signal => signal.assessmentStatus === "unassessed");
    expect(unassessed.length, "fixture must include a pending assessment so the review queue is not vacuous").toBeGreaterThan(0);

    for (const signal of unassessed) {
      expect(signal.approvedAlternativeTool, `${signal.id} cannot name an approved alternative before assessment`).toBeNull();
      expect(signal.reviewDueAt, `${signal.id} must stay visibly routed to review`).toBeTruthy();
    }
  });

  it("names an approved alternative before redirecting staff away from an unsanctioned tool", () => {
    const redirected = demoShadowAiSignals.filter(
      signal => signal.assessmentStatus === "approved_alternative_offered" || signal.assessmentStatus === "approved"
    );
    expect(redirected.length, "fixture must include a redirected signal so the alternative path is not vacuous").toBeGreaterThan(0);

    for (const signal of redirected) {
      expect(signal.approvedAlternativeTool?.trim().length ?? 0, `${signal.id} needs a named approved alternative`).toBeGreaterThan(20);
      expect(signal.approvedAlternativeTool?.toLowerCase() ?? "", `${signal.id} alternative must be an approved workspace, not a ban`).toContain("approved");
    }
  });

  it("briefs the halt procedure before acting on high-sensitivity shadow AI signals", () => {
    const highSensitivityActedOn = demoShadowAiSignals.filter(
      signal => signal.dataSensitivity === "high" && signal.assessmentStatus !== "unassessed"
    );
    expect(highSensitivityActedOn.length, "fixture must include an acted-on high-sensitivity signal").toBeGreaterThan(0);

    for (const signal of highSensitivityActedOn) {
      expect(signal.haltProcedureBriefed, `${signal.id} cannot be acted on until staff know how to halt the tool mid-incident`).toBe(true);
    }
  });

  it("tracks adoption velocity (week-over-week) to measure capability liquidity", () => {
    expect(demoAdoptionMetrics.adoptionVelocityWoW, "adoption velocity must be a measurable percentage change").toBeGreaterThan(0);
    expect(demoAdoptionMetrics.adoptionVelocityWoW, "adoption velocity should be realistic (not exceeding 50% WoW)").toBeLessThan(50);
    expect(["accelerating", "stable", "declining"]).toContain(demoAdoptionMetrics.adoptionVelocityDirection);
  });

  it("measures members meeting or exceeding role benchmarks to assess capability alignment", () => {
    expect(demoAdoptionMetrics.memberCountAboveRoleBenchmark, "at least some members should meet role benchmarks").toBeGreaterThan(0);
    expect(demoAdoptionMetrics.memberCountAboveRoleBenchmark, "member count must not exceed total team size").toBeLessThanOrEqual(demoAdoptionMetrics.totalTeamMembers);

    const actualCountAboveBenchmark = demoTeamMembers.filter(member => member.adoptionScore >= member.roleBenchmark).length;
    expect(demoAdoptionMetrics.memberCountAboveRoleBenchmark, "metric count must match actual data").toBe(actualCountAboveBenchmark);
  });
});
