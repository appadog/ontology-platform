import { ReactNode, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  AlertTriangle,
  Check,
  GitCompareArrows,
  History,
  Lightbulb,
  ShieldQuestion,
  Sparkles,
  X,
} from "lucide-react";
import styled from "styled-components";
import { SuggestionDecisionError } from "../shared/api/client";
import {
  useDecideLearningSuggestion,
  useLearningAutoApprovalCandidates,
  useLearningCorrectionPatterns,
  useLearningPromptSuggestions,
  useLearningSummary,
  useProject,
} from "../shared/api/queries";
import {
  AutoApprovalCandidatePreview,
  CorrectionPattern,
  LearningRiskLabel,
  PromptSuggestion,
  PromptSuggestionState,
  SuggestionDecisionType,
  SuggestionDismissReasonCode,
} from "../shared/api/types";
import { Breadcrumbs } from "../shared/layout/Breadcrumbs";
import { PageHeader } from "../shared/layout/PageHeader";
import { HanaBadge, HanaButton, HanaCard } from "../shared/ui/hana";
import { MetricCard } from "../shared/ui/platform/MetricCard";
import { StatusBadge } from "../shared/ui/platform/StatusBadge";
import { PageState } from "../shared/ui/platform/PageState";
import { CardBody, KeyValue, Muted, Stack } from "./mvp3Shared";
import { PageActions } from "./mvp4Shared";

type Section = "summary" | "patterns" | "suggestions" | "auto-approval" | "history";

const sections: { id: Section; label: string; icon: typeof Sparkles }[] = [
  { id: "summary", label: "Summary", icon: Sparkles },
  { id: "patterns", label: "Correction Patterns", icon: GitCompareArrows },
  { id: "suggestions", label: "Prompt Improvements", icon: Lightbulb },
  { id: "auto-approval", label: "Auto-Approval Preview", icon: ShieldQuestion },
  { id: "history", label: "Decision History", icon: History },
];

const dismissReasonCodes: SuggestionDismissReasonCode[] = [
  "NOT_RELEVANT",
  "INSUFFICIENT_EVIDENCE",
  "DUPLICATE",
  "OUT_OF_SCOPE",
  "RISK_TOO_HIGH",
  "OTHER",
];

function riskTone(risk: LearningRiskLabel) {
  if (risk === "HIGH") return "danger" as const;
  if (risk === "MEDIUM") return "warning" as const;
  return "success" as const;
}

function stateTone(state: PromptSuggestionState) {
  if (state === "ACCEPTED") return "success" as const;
  if (state === "DISMISSED") return "warning" as const;
  if (state === "SUPERSEDED") return "muted" as const;
  return "neutral" as const;
}

function formatDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

export function LearningInsightsPage() {
  const { projectId = "", patternId, suggestionId, autoApprovalPreviewId } = useParams();
  const projectQuery = useProject(projectId);
  const summaryQuery = useLearningSummary(projectId);
  const patternsQuery = useLearningCorrectionPatterns(projectId);
  const suggestionsQuery = useLearningPromptSuggestions(projectId);
  const autoApprovalQuery = useLearningAutoApprovalCandidates(projectId);
  const decideMutation = useDecideLearningSuggestion(projectId);

  const [section, setSection] = useState<Section>("summary");
  const [selectedPatternId, setSelectedPatternId] = useState<string | null>(null);
  const [selectedSuggestionId, setSelectedSuggestionId] = useState<string | null>(null);
  const [selectedPreviewId, setSelectedPreviewId] = useState<string | null>(null);
  const [decisionModal, setDecisionModal] = useState<{ suggestion: PromptSuggestion; decision: SuggestionDecisionType } | null>(null);
  const [dismissReason, setDismissReason] = useState<SuggestionDismissReasonCode>("INSUFFICIENT_EVIDENCE");
  const [decisionNote, setDecisionNote] = useState("");
  const [decisionError, setDecisionError] = useState<string | null>(null);

  useEffect(() => {
    if (patternId) {
      setSection("patterns");
      setSelectedPatternId(patternId);
    } else if (suggestionId) {
      setSection("suggestions");
      setSelectedSuggestionId(suggestionId);
    } else if (autoApprovalPreviewId) {
      setSection("auto-approval");
      setSelectedPreviewId(autoApprovalPreviewId);
    }
  }, [patternId, suggestionId, autoApprovalPreviewId]);

  const summary = summaryQuery.data;
  const patterns = patternsQuery.data ?? [];
  const suggestions = suggestionsQuery.data ?? [];
  const autoApprovalCandidates = autoApprovalQuery.data ?? [];

  const selectedPattern = useMemo(
    () => patterns.find((pattern) => pattern.id === selectedPatternId) ?? patterns[0] ?? null,
    [patterns, selectedPatternId],
  );
  const selectedSuggestion = useMemo(
    () => suggestions.find((item) => item.id === selectedSuggestionId) ?? suggestions[0] ?? null,
    [suggestions, selectedSuggestionId],
  );
  const selectedPreview = useMemo(
    () => autoApprovalCandidates.find((item) => item.id === selectedPreviewId) ?? autoApprovalCandidates[0] ?? null,
    [autoApprovalCandidates, selectedPreviewId],
  );
  const decidedSuggestions = useMemo(
    () => suggestions.filter((item) => item.decision_audit_note),
    [suggestions],
  );

  if (projectQuery.isLoading || summaryQuery.isLoading) {
    return <PageState kind="loading" title="Learning Insights is loading" description="Project learning signals are being prepared." />;
  }

  if (projectQuery.isError || !projectQuery.data) {
    return <PageState kind="error" title="Project context unavailable" description="Learning Insights requires a valid selected project." />;
  }

  if (summaryQuery.isError) {
    return (
      <PageState
        kind="error"
        title="Learning signals could not load"
        description="Source artifacts may be unavailable, or the learning service returned an error. Retry from the selected project."
        actionLabel="Retry"
        onAction={() => void summaryQuery.refetch()}
      />
    );
  }

  const openDecision = (suggestion: PromptSuggestion, decision: SuggestionDecisionType) => {
    setDecisionModal({ suggestion, decision });
    setDismissReason("INSUFFICIENT_EVIDENCE");
    setDecisionNote("");
    setDecisionError(null);
  };

  const confirmDecision = () => {
    if (!decisionModal) return;
    const { suggestion, decision } = decisionModal;
    setDecisionError(null);
    decideMutation.mutate(
      {
        suggestionId: suggestion.id,
        payload: {
          decision,
          dismiss_reason_code: decision === "DISMISS" ? dismissReason : null,
          note: decisionNote.trim() ? decisionNote.trim() : null,
          intended_next_action: decision === "ACCEPT" ? "USE_IN_NEXT_PROMPT_DRAFT" : "MONITOR_FOR_MORE_EVIDENCE",
        },
      },
      {
        onSuccess: () => {
          setDecisionModal(null);
        },
        onError: (error) => {
          if (error instanceof SuggestionDecisionError) {
            setDecisionError(
              error.code === "PROMPT_SUGGESTION_DECISION_CONFLICT"
                ? `This suggestion is already ${error.state ?? "decided"}. It can no longer be accepted or dismissed.`
                : error.message,
            );
          } else {
            setDecisionError("The decision could not be recorded. Please retry.");
          }
        },
      },
    );
  };

  return (
    <>
      <Breadcrumbs
        items={[
          { label: projectQuery.data.name, to: `/projects/${projectId}` },
          { label: "Learning Insights" },
        ]}
      />
      <PageHeader title="학습 인사이트" description={`${projectQuery.data.name} · Active learning recommendation & audit loop`}>
        <PageActions>
          <HanaBadge tone="neutral">MVP6.2</HanaBadge>
          <HanaBadge tone="warning">Recommendation only · audit-only</HanaBadge>
        </PageActions>
      </PageHeader>

      <SectionBar role="tablist" aria-label="Learning Insights sections">
        {sections.map((item) => {
          const Icon = item.icon;
          const count = sectionCount(item.id, summary, suggestions, patterns, autoApprovalCandidates, decidedSuggestions.length);
          return (
            <SectionTab
              key={item.id}
              type="button"
              role="tab"
              aria-selected={section === item.id}
              data-active={section === item.id}
              onClick={() => setSection(item.id)}
            >
              <Icon aria-hidden="true" />
              <span>{item.label}</span>
              {count !== null && <em>{count}</em>}
            </SectionTab>
          );
        })}
      </SectionBar>

      {section === "summary" && summary && (
        <Stack>
          <StrongSummary>
            <div>
              <span>Most important improvement signal</span>
              <h2>{summary.top_patterns[0]?.title ?? "No high-priority pattern yet"}</h2>
              <p>
                {summary.total_signal_count} traceable learning signals across {summary.source_artifact_scope.length} approved
                source artifact types. Generated {formatDate(summary.generated_at)}.
              </p>
              <BadgeRow>
                {summary.top_patterns[0] && <HanaBadge tone={riskTone(summary.top_patterns[0].risk_label)}>{summary.top_patterns[0].risk_label} risk</HanaBadge>}
                <HanaBadge tone="neutral">{summary.window.label}</HanaBadge>
                <HanaBadge tone="warning">Not enforced</HanaBadge>
              </BadgeRow>
            </div>
            <HanaButton type="button" variant="primary" onClick={() => setSection("patterns")}>
              Review correction patterns
            </HanaButton>
          </StrongSummary>

          <KpiGrid>
            <MetricCard label="Open suggestions" value={summary.open_prompt_suggestion_count}>Need a human decision</MetricCard>
            <MetricCard label="High-risk suggestions" value={summary.high_risk_prompt_suggestion_count}>Review carefully</MetricCard>
            <MetricCard label="Accepted" value={summary.accepted_prompt_suggestion_count}>For future prompt drafting</MetricCard>
            <MetricCard label="Dismissed" value={summary.dismissed_prompt_suggestion_count}>Audit record only</MetricCard>
            <MetricCard label="Superseded" value={summary.superseded_prompt_suggestion_count}>Read-side history</MetricCard>
            <MetricCard label="Auto-approval previews" value={summary.auto_approval_preview_count}>Not enforced</MetricCard>
          </KpiGrid>

          <HanaCard emphasis="default" title="Learning signal taxonomy" description="Counts by frozen signal type from approved source artifacts.">
            <CardBody>
              <SignalGrid>
                {summary.signal_counts.map((signal) => (
                  <SignalChip key={signal.signal_type} data-empty={signal.count === 0}>
                    <strong>{signal.signal_type}</strong>
                    <span>{signal.count} signals{signal.high_risk_count > 0 ? ` · ${signal.high_risk_count} high risk` : ""}</span>
                    <Muted>Last: {formatDate(signal.latest_observed_at)}</Muted>
                  </SignalChip>
                ))}
              </SignalGrid>
              <SafetyNotes>
                {summary.safety_notes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </SafetyNotes>
            </CardBody>
          </HanaCard>
        </Stack>
      )}

      {section === "patterns" && (
        patterns.length === 0 ? (
          <PageState kind="empty" title="No correction patterns" description="Signals exist but no repeated pattern passed the grouping threshold yet, or source artifacts are missing." />
        ) : (
          <TwoColumn>
            <QueueList aria-label="Correction pattern queue">
              {patterns.map((pattern) => (
                <QueueRow
                  key={pattern.id}
                  type="button"
                  data-selected={selectedPattern?.id === pattern.id}
                  onClick={() => setSelectedPatternId(pattern.id)}
                >
                  <RowHead>
                    <strong>{pattern.title}</strong>
                    <HanaBadge tone={riskTone(pattern.risk_label)}>{pattern.risk_label}</HanaBadge>
                  </RowHead>
                  <RowMeta>
                    <HanaBadge tone="neutral">{pattern.primary_signal_type}</HanaBadge>
                    <span>support {pattern.support_count}{pattern.denominator ? ` / ${pattern.denominator}` : ""}</span>
                  </RowMeta>
                </QueueRow>
              ))}
            </QueueList>
            {selectedPattern && <PatternDetail pattern={selectedPattern} />}
          </TwoColumn>
        )
      )}

      {section === "suggestions" && (
        suggestions.length === 0 ? (
          <PageState kind="empty" title="No prompt suggestions" description="No human decision is needed right now. The system has not changed any prompt on its own." />
        ) : (
          <TwoColumn>
            <QueueList aria-label="Prompt suggestion board">
              {suggestions.map((suggestion) => (
                <QueueRow
                  key={suggestion.id}
                  type="button"
                  data-selected={selectedSuggestion?.id === suggestion.id}
                  data-historical={suggestion.state !== "SUGGESTED"}
                  onClick={() => setSelectedSuggestionId(suggestion.id)}
                >
                  <RowHead>
                    <strong>{suggestion.title}</strong>
                    <StatusBadge token={suggestion.state} tone={stateTone(suggestion.state)} />
                  </RowHead>
                  <RowMeta>
                    <HanaBadge tone="neutral">{suggestion.suggestion_kind}</HanaBadge>
                    <HanaBadge tone={riskTone(suggestion.risk_label)}>{suggestion.risk_label} risk</HanaBadge>
                  </RowMeta>
                </QueueRow>
              ))}
            </QueueList>
            {selectedSuggestion && (
              <SuggestionDetail suggestion={selectedSuggestion} onAccept={() => openDecision(selectedSuggestion, "ACCEPT")} onDismiss={() => openDecision(selectedSuggestion, "DISMISS")} />
            )}
          </TwoColumn>
        )
      )}

      {section === "auto-approval" && (
        autoApprovalCandidates.length === 0 ? (
          <PageState kind="empty" title="No auto-approval preview" description="No safe preview candidate is available. Enforcement remains out of scope." />
        ) : (
          <TwoColumn>
            <QueueList aria-label="Auto-approval preview list">
              {autoApprovalCandidates.map((preview) => (
                <QueueRow
                  key={preview.id}
                  type="button"
                  data-selected={selectedPreview?.id === preview.id}
                  onClick={() => setSelectedPreviewId(preview.id)}
                >
                  <RowHead>
                    <strong>{preview.title}</strong>
                    <HanaBadge tone={riskTone(preview.risk_label)}>{preview.risk_label}</HanaBadge>
                  </RowHead>
                  <RowMeta>
                    <StatusBadge token={preview.preview_status} tone="warning" />
                    <span>Not enforced</span>
                  </RowMeta>
                </QueueRow>
              ))}
            </QueueList>
            {selectedPreview && <AutoApprovalDetail preview={selectedPreview} />}
          </TwoColumn>
        )
      )}

      {section === "history" && (
        decidedSuggestions.length === 0 ? (
          <PageState kind="empty" title="No decision history" description="No accept or dismiss decision has been recorded yet." />
        ) : (
          <Timeline aria-label="Decision audit timeline">
            {decidedSuggestions.map((suggestion) => {
              const note = suggestion.decision_audit_note!;
              return (
                <TimelineItem key={note.id} data-decision={note.decision}>
                  <TimelineMarker>{note.decision === "ACCEPT" ? <Check aria-hidden="true" /> : <X aria-hidden="true" />}</TimelineMarker>
                  <TimelineBody>
                    <RowHead>
                      <strong>{note.suggestion_snapshot.title}</strong>
                      <StatusBadge token={suggestion.state} tone={stateTone(suggestion.state)} />
                    </RowHead>
                    <KeyValue>
                      <dt>Command</dt>
                      <dd>{note.decision}</dd>
                      <dt>Actor</dt>
                      <dd>{note.actor_id} · {note.actor_role}</dd>
                      <dt>Decided</dt>
                      <dd>{formatDate(note.decided_at)}</dd>
                      {note.dismiss_reason_code && (
                        <>
                          <dt>Reason</dt>
                          <dd>{note.dismiss_reason_code}</dd>
                        </>
                      )}
                      {note.note && (
                        <>
                          <dt>Note</dt>
                          <dd>{note.note}</dd>
                        </>
                      )}
                      <dt>Next action</dt>
                      <dd>{note.intended_next_action ?? "—"}</dd>
                      <dt>Target prompt</dt>
                      <dd>{note.target_prompt_version_id ?? "—"}</dd>
                      <dt>Source signals</dt>
                      <dd>{note.source_learning_signal_ids.join(", ") || "—"}</dd>
                    </KeyValue>
                    <Muted>No prompt version, candidate, policy, or published graph was changed by this decision.</Muted>
                  </TimelineBody>
                </TimelineItem>
              );
            })}
          </Timeline>
        )
      )}

      {decisionModal && (
        <ModalOverlay role="dialog" aria-modal="true" aria-label="Confirm suggestion decision">
          <ModalCard>
            <ModalHeader>
              <strong>{decisionModal.decision === "ACCEPT" ? "Accept suggestion" : "Dismiss suggestion"}</strong>
              <StatusBadge token={decisionModal.suggestion.state} tone={stateTone(decisionModal.suggestion.state)} />
            </ModalHeader>
            <p>{decisionModal.suggestion.title}</p>
            <SafetyBox>
              {decisionModal.decision === "ACCEPT"
                ? "Accepting records human intent for a future prompt draft only. It does not edit any prompt version, rerun extraction, approve a candidate, change a policy, or mutate the published graph."
                : "Dismissing records an audit decision only. No prompt, candidate, policy, job, or published graph is changed."}
            </SafetyBox>
            {decisionModal.decision === "DISMISS" && (
              <Field>
                <span>Reason code</span>
                <select value={dismissReason} onChange={(event) => setDismissReason(event.target.value as SuggestionDismissReasonCode)}>
                  {dismissReasonCodes.map((code) => (
                    <option key={code} value={code}>
                      {code}
                    </option>
                  ))}
                </select>
              </Field>
            )}
            <Field>
              <span>Note {decisionModal.decision === "DISMISS" && dismissReason === "OTHER" ? "(required for OTHER)" : "(optional)"}</span>
              <textarea value={decisionNote} onChange={(event) => setDecisionNote(event.target.value)} rows={3} />
            </Field>
            {decisionError && <ErrorBox role="alert"><AlertTriangle aria-hidden="true" />{decisionError}</ErrorBox>}
            <ModalActions>
              <HanaButton type="button" variant="secondary" onClick={() => setDecisionModal(null)} disabled={decideMutation.isPending}>
                Cancel
              </HanaButton>
              <HanaButton
                type="button"
                variant="primary"
                onClick={confirmDecision}
                disabled={decideMutation.isPending || (decisionModal.decision === "DISMISS" && dismissReason === "OTHER" && !decisionNote.trim())}
              >
                {decideMutation.isPending ? "Recording…" : decisionModal.decision === "ACCEPT" ? "Accept (audit only)" : "Dismiss (audit only)"}
              </HanaButton>
            </ModalActions>
          </ModalCard>
        </ModalOverlay>
      )}
    </>
  );
}

function sectionCount(
  id: Section,
  summary: ReturnType<typeof useLearningSummary>["data"],
  suggestions: PromptSuggestion[],
  patterns: CorrectionPattern[],
  autoApproval: AutoApprovalCandidatePreview[],
  historyCount: number,
): number | null {
  switch (id) {
    case "patterns":
      return patterns.length;
    case "suggestions":
      return suggestions.filter((item) => item.state === "SUGGESTED").length;
    case "auto-approval":
      return autoApproval.length;
    case "history":
      return historyCount;
    default:
      return summary ? summary.total_signal_count : null;
  }
}

function PatternDetail({ pattern }: { pattern: CorrectionPattern }) {
  return (
    <DetailPanel>
      <RowHead>
        <strong>{pattern.title}</strong>
        <HanaBadge tone={riskTone(pattern.risk_label)}>{pattern.risk_label}</HanaBadge>
      </RowHead>
      <Muted>{pattern.explanation}</Muted>
      <KeyValue>
        <dt>Primary signal</dt>
        <dd>{pattern.primary_signal_type}</dd>
        <dt>Related signals</dt>
        <dd>{pattern.related_signal_types.join(", ") || "—"}</dd>
        <dt>Support</dt>
        <dd>{pattern.support_count}{pattern.denominator ? ` of ${pattern.denominator}` : ""}</dd>
        <dt>Confidence</dt>
        <dd>{pattern.confidence_label}</dd>
        <dt>First / last seen</dt>
        <dd>{formatDate(pattern.first_seen_at)} → {formatDate(pattern.last_seen_at)}</dd>
        <dt>Affected classes</dt>
        <dd>{pattern.affected_classes.map((cls) => cls.label).join(", ") || "—"}</dd>
        <dt>Affected relations</dt>
        <dd>{pattern.affected_relations.map((rel) => rel.label).join(", ") || "—"}</dd>
      </KeyValue>
      <DetailSubhead>Representative examples</DetailSubhead>
      {pattern.representative_examples.map((example) => (
        <ExampleBox key={example.example_id}>
          <span>Before: {example.before ?? "—"}</span>
          <span>After: {example.after ?? "—"}</span>
          <Muted>From artifact {example.source_artifact_id}</Muted>
        </ExampleBox>
      ))}
      <DetailSubhead>Source artifacts</DetailSubhead>
      <SourceArtifacts artifacts={pattern.source_artifacts} />
      <SafetyBox>{pattern.safety_note}</SafetyBox>
    </DetailPanel>
  );
}

function SuggestionDetail({
  suggestion,
  onAccept,
  onDismiss,
}: {
  suggestion: PromptSuggestion;
  onAccept: () => void;
  onDismiss: () => void;
}) {
  const isDecidable = suggestion.state === "SUGGESTED";
  return (
    <DetailPanel>
      <RowHead>
        <strong>{suggestion.title}</strong>
        <StatusBadge token={suggestion.state} tone={stateTone(suggestion.state)} />
      </RowHead>
      <BadgeRow>
        <HanaBadge tone="neutral">{suggestion.suggestion_kind}</HanaBadge>
        <HanaBadge tone={riskTone(suggestion.risk_label)}>{suggestion.risk_label} risk</HanaBadge>
        <HanaBadge tone="neutral">{suggestion.confidence_label} confidence</HanaBadge>
      </BadgeRow>
      <KeyValue>
        <dt>Rationale</dt>
        <dd>{suggestion.rationale}</dd>
        <dt>Expected impact</dt>
        <dd>{suggestion.expected_impact}</dd>
        <dt>Target prompt</dt>
        <dd>{suggestion.target_prompt_version_id ?? "—"}</dd>
      </KeyValue>
      <DetailSubhead>Preview text (proposed, not applied)</DetailSubhead>
      <PreviewBox>{suggestion.preview_text}</PreviewBox>
      <DetailSubhead>Source artifacts</DetailSubhead>
      <SourceArtifacts artifacts={suggestion.source_artifacts} />
      <SafetyBox>{suggestion.safety_note}</SafetyBox>

      {isDecidable ? (
        <DecisionBar>
          <HanaButton type="button" variant="primary" onClick={onAccept}>
            Accept
          </HanaButton>
          <HanaButton type="button" variant="secondary" onClick={onDismiss}>
            Dismiss
          </HanaButton>
        </DecisionBar>
      ) : (
        <HistoricalNotice data-state={suggestion.state}>
          {suggestion.state === "SUPERSEDED"
            ? "This suggestion is superseded (read-side history). It cannot be accepted or dismissed."
            : `This suggestion was already ${suggestion.state.toLowerCase()}. It is a historical record and cannot receive a new decision.`}
        </HistoricalNotice>
      )}

      {suggestion.decision_audit_note && (
        <>
          <DetailSubhead>Decision audit note</DetailSubhead>
          <AuditNoteBox>
            <KeyValue>
              <dt>Command</dt>
              <dd>{suggestion.decision_audit_note.decision}</dd>
              <dt>Result state</dt>
              <dd>{suggestion.state}</dd>
              <dt>Actor</dt>
              <dd>{suggestion.decision_audit_note.actor_id} · {suggestion.decision_audit_note.actor_role}</dd>
              <dt>Decided</dt>
              <dd>{formatDate(suggestion.decision_audit_note.decided_at)}</dd>
              {suggestion.decision_audit_note.dismiss_reason_code && (
                <>
                  <dt>Reason</dt>
                  <dd>{suggestion.decision_audit_note.dismiss_reason_code}</dd>
                </>
              )}
              {suggestion.decision_audit_note.note && (
                <>
                  <dt>Note</dt>
                  <dd>{suggestion.decision_audit_note.note}</dd>
                </>
              )}
            </KeyValue>
            <Muted>No prompt version was changed. No candidate or published graph state was mutated.</Muted>
          </AuditNoteBox>
        </>
      )}
    </DetailPanel>
  );
}

function AutoApprovalDetail({ preview }: { preview: AutoApprovalCandidatePreview }) {
  return (
    <DetailPanel>
      <RowHead>
        <strong>{preview.title}</strong>
        <HanaBadge tone={riskTone(preview.risk_label)}>{preview.risk_label}</HanaBadge>
      </RowHead>
      <PreviewOnlyBanner>
        <ShieldQuestion aria-hidden="true" />
        Recommendation only · Not enforced · Requires later policy approval
      </PreviewOnlyBanner>
      <DetailSubhead>Rule preview ({preview.rule_preview.candidate_kind})</DetailSubhead>
      <ConditionList>
        {preview.rule_preview.conditions.map((condition) => (
          <li key={condition}><code>{condition}</code></li>
        ))}
      </ConditionList>
      <DetailSubhead>Supporting metrics</DetailSubhead>
      <KeyValue>
        {preview.supporting_metrics.map((metric) => (
          <RowFragment key={metric.metric_name}>
            <dt>{metric.metric_name}</dt>
            <dd>
              {metric.value ?? "—"}
              {metric.numerator !== null && metric.denominator !== null ? ` (${metric.numerator}/${metric.denominator})` : ""}
            </dd>
          </RowFragment>
        ))}
      </KeyValue>
      <DetailSubhead>Historical match preview</DetailSubhead>
      <KeyValue>
        <dt>Examined</dt>
        <dd>{preview.historical_match_preview.total_examined}</dd>
        <dt>Would match</dt>
        <dd>{preview.historical_match_preview.would_match_count}</dd>
        <dt>Blocked</dt>
        <dd>{preview.historical_match_preview.blocked_count}</dd>
      </KeyValue>
      {preview.historical_match_preview.outcomes.map((outcome) => (
        <ExampleBox key={`${outcome.artifact_id}-${outcome.outcome}`}>
          <StatusBadge token={outcome.outcome} tone={outcome.outcome === "WOULD_MATCH" ? "success" : "warning"} />
          <Muted>{outcome.reason}</Muted>
        </ExampleBox>
      ))}
      <DetailSubhead>Blocked actions (not available in MVP6.2)</DetailSubhead>
      <BadgeRow>
        {preview.blocked_actions.map((action) => (
          <HanaBadge key={action} tone="danger">{action}</HanaBadge>
        ))}
      </BadgeRow>
      <DetailSubhead>Source artifacts</DetailSubhead>
      <SourceArtifacts artifacts={preview.source_artifacts} />
      <SafetyBox>{preview.safety_note}</SafetyBox>
    </DetailPanel>
  );
}

function SourceArtifacts({ artifacts }: { artifacts: CorrectionPattern["source_artifacts"] }) {
  if (artifacts.length === 0) {
    return <Muted>No source artifacts attached.</Muted>;
  }
  return (
    <>
      {artifacts.map((artifact) => (
        <ExampleBox key={artifact.artifact_id}>
          <HanaBadge tone="neutral">{artifact.artifact_type}</HanaBadge>
          <span>{artifact.artifact_id}</span>
          {artifact.evidence_refs[0]?.quote && <Muted>“{artifact.evidence_refs[0].quote}”</Muted>}
        </ExampleBox>
      ))}
    </>
  );
}

function RowFragment({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

const SectionBar = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const SectionTab = styled.button`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  min-height: 40px;
  padding: 0 ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme }) => theme.color.surfaceRaised};
  color: ${({ theme }) => theme.color.textMuted};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  cursor: pointer;

  svg {
    width: 16px;
    height: 16px;
  }

  em {
    padding: 0 8px;
    border-radius: 999px;
    background: ${({ theme }) => theme.color.surfaceMuted};
    font-style: normal;
    font-size: ${({ theme }) => theme.typography.fontSize.xs};
  }

  &[data-active="true"] {
    border-color: ${({ theme }) => theme.color.primary};
    color: ${({ theme }) => theme.color.primary};
    background: ${({ theme }) => theme.color.primarySoft};
  }
`;

const StrongSummary = styled.section`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.lg};
  padding: ${({ theme }) => theme.spacing.xl};
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.color.surfaceStrong};
  color: ${({ theme }) => theme.color.textOnStrong};

  span {
    color: #94a3b8;
    font-size: ${({ theme }) => theme.typography.fontSize.sm};
    font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  }

  h2 {
    margin: ${({ theme }) => theme.spacing.sm} 0;
    font-size: ${({ theme }) => theme.typography.fontSize.xl};
  }

  p {
    margin: 0;
    color: #cbd5e1;
    line-height: ${({ theme }) => theme.typography.lineHeight.normal};
  }

  @media (max-width: 760px) {
    flex-direction: column;
  }
`;

const KpiGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: ${({ theme }) => theme.spacing.md};

  @media (max-width: 1100px) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  @media (max-width: 680px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

const SignalGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: ${({ theme }) => theme.spacing.md};

  @media (max-width: 900px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

const SignalChip = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing.xs};
  padding: ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme }) => theme.color.surface};

  strong {
    overflow-wrap: anywhere;
  }

  span {
    color: ${({ theme }) => theme.color.text};
    font-size: ${({ theme }) => theme.typography.fontSize.sm};
  }

  &[data-empty="true"] {
    opacity: 0.55;
  }
`;

const SafetyNotes = styled.ul`
  margin: 0;
  padding-left: ${({ theme }) => theme.spacing.lg};
  color: ${({ theme }) => theme.color.textMuted};
  line-height: ${({ theme }) => theme.typography.lineHeight.normal};
`;

const TwoColumn = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 0.85fr) minmax(320px, 1.15fr);
  gap: ${({ theme }) => theme.spacing.lg};
  align-items: start;

  @media (max-width: 1020px) {
    grid-template-columns: 1fr;
  }
`;

const QueueList = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing.sm};
  min-width: 0;
`;

const QueueRow = styled.button`
  display: grid;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.color.border};
  border-left: 3px solid transparent;
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme }) => theme.color.surfaceRaised};
  text-align: left;
  cursor: pointer;

  &[data-selected="true"] {
    border-color: ${({ theme }) => theme.color.borderStrong};
    border-left-color: ${({ theme }) => theme.color.primary};
    background: ${({ theme }) => theme.color.surfaceSelected};
    box-shadow: ${({ theme }) => theme.shadow.soft};
  }

  &[data-historical="true"] {
    opacity: 0.82;
  }
`;

const RowHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.sm};

  strong {
    overflow-wrap: anywhere;
  }
`;

const RowMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  color: ${({ theme }) => theme.color.textMuted};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
`;

const BadgeRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.xs};
  align-items: center;
`;

const DetailPanel = styled.section`
  display: grid;
  gap: ${({ theme }) => theme.spacing.md};
  min-width: 0;
  padding: ${({ theme }) => theme.spacing.lg};
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.color.surfaceRaised};
`;

const DetailSubhead = styled.h3`
  margin: ${({ theme }) => theme.spacing.sm} 0 0;
  font-size: ${({ theme }) => theme.typography.fontSize.md};
`;

const ExampleBox = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing.xs};
  padding: ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme }) => theme.color.surfaceMuted};

  span {
    overflow-wrap: anywhere;
  }
`;

const PreviewBox = styled.pre`
  margin: 0;
  padding: ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme }) => theme.color.surfaceInfo};
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  font-family: ${({ theme }) => theme.typography.fontFamily};
  line-height: ${({ theme }) => theme.typography.lineHeight.normal};
`;

const SafetyBox = styled.div`
  padding: ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.color.warningSoft};
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme }) => theme.color.surfaceWarning};
  color: ${({ theme }) => theme.color.warning};
  line-height: ${({ theme }) => theme.typography.lineHeight.normal};
`;

const PreviewOnlyBanner = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.color.warningSoft};
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme }) => theme.color.surfaceWarning};
  color: ${({ theme }) => theme.color.warning};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};

  svg {
    width: 18px;
    height: 18px;
    flex-shrink: 0;
  }
`;

const ConditionList = styled.ul`
  display: grid;
  gap: ${({ theme }) => theme.spacing.xs};
  margin: 0;
  padding-left: ${({ theme }) => theme.spacing.lg};

  code {
    overflow-wrap: anywhere;
  }
`;

const DecisionBar = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const HistoricalNotice = styled.div`
  padding: ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme }) => theme.color.surfaceMuted};
  color: ${({ theme }) => theme.color.textMuted};
  line-height: ${({ theme }) => theme.typography.lineHeight.normal};
`;

const AuditNoteBox = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.color.positiveSoft};
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme }) => theme.color.surfaceSuccess};
`;

const Timeline = styled.ol`
  display: grid;
  gap: ${({ theme }) => theme.spacing.md};
  margin: 0;
  padding: 0;
  list-style: none;
`;

const TimelineItem = styled.li`
  display: grid;
  grid-template-columns: 40px minmax(0, 1fr);
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.lg};
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.color.surfaceRaised};
`;

const TimelineMarker = styled.div`
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: 999px;
  background: ${({ theme }) => theme.color.surfaceMuted};

  svg {
    width: 18px;
    height: 18px;
  }
`;

const TimelineBody = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing.sm};
  min-width: 0;
`;

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 50;
  display: grid;
  place-items: center;
  padding: ${({ theme }) => theme.spacing.lg};
  background: rgba(15, 23, 42, 0.45);
`;

const ModalCard = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing.md};
  width: min(520px, 100%);
  padding: ${({ theme }) => theme.spacing.xl};
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.color.surfaceRaised};
  box-shadow: ${({ theme }) => theme.shadow.soft};

  p {
    margin: 0;
    overflow-wrap: anywhere;
  }
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.sm};

  strong {
    font-size: ${({ theme }) => theme.typography.fontSize.lg};
  }
`;

const Field = styled.label`
  display: grid;
  gap: ${({ theme }) => theme.spacing.xs};

  span {
    color: ${({ theme }) => theme.color.textMuted};
    font-size: ${({ theme }) => theme.typography.fontSize.xs};
    font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
    text-transform: uppercase;
  }

  select,
  textarea {
    padding: ${({ theme }) => theme.spacing.sm};
    border: 1px solid ${({ theme }) => theme.color.border};
    border-radius: ${({ theme }) => theme.radius.sm};
    background: ${({ theme }) => theme.color.surfaceRaised};
    font-family: ${({ theme }) => theme.typography.fontFamily};
    font-size: ${({ theme }) => theme.typography.fontSize.md};
  }
`;

const ErrorBox = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.color.dangerSoft};
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme }) => theme.color.dangerSoft};
  color: ${({ theme }) => theme.color.danger};

  svg {
    width: 18px;
    height: 18px;
    flex-shrink: 0;
  }
`;

const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.spacing.sm};
`;
