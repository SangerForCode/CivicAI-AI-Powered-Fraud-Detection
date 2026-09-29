"use client";

/**
 * Missing inputs, unavailable dimensions and data-quality warnings.
 *
 * This section is deliberately never collapsed away or hidden when empty of
 * problems — an incomplete assessment should be as visible as the score.
 */

import { Badge, Card, CardHeader, FieldChip } from "@/components/ui";
import { humaniseField } from "@/lib/format";
import type { RiskAssessment } from "@/types/assessment";

export function DataQuality({ assessment }: { assessment: RiskAssessment }) {
  const { missing_fields, data_quality_warnings, dimensions } = assessment;
  const unavailable = dimensions.filter((dimension) => !dimension.available);
  const nothingToReport =
    missing_fields.length === 0 && data_quality_warnings.length === 0 && unavailable.length === 0;

  return (
    <Card>
      <CardHeader
        title="Data Quality"
        subtitle="What was missing, and what the engine could not evaluate."
      />

      {nothingToReport ? (
        <p className="px-5 py-5 text-[13px] text-ink-muted">
          All scoring inputs were provided and no data-quality issues were detected.
        </p>
      ) : (
        <div className="divide-y divide-line">
          {missing_fields.length > 0 ? (
            <Block
              title="Missing fields"
              count={missing_fields.length}
              description="Submitted as unknown. These were not treated as zero."
            >
              <div className="flex flex-wrap gap-1.5">
                {missing_fields.map((field) => (
                  <FieldChip key={field}>{field}</FieldChip>
                ))}
              </div>
            </Block>
          ) : null}

          {unavailable.length > 0 ? (
            <Block
              title="Unavailable dimensions"
              count={unavailable.length}
              description="Excluded from the score; the remaining weight was rescaled."
            >
              <ul className="space-y-2">
                {unavailable.map((dimension) => (
                  <li key={dimension.key} className="text-[12.5px]">
                    <span className="font-medium text-ink">{dimension.label}</span>
                    <span className="text-ink-muted"> — requires </span>
                    <span className="text-ink-muted">
                      {dimension.missing_fields.map(humaniseField).join(", ")}
                    </span>
                  </li>
                ))}
              </ul>
            </Block>
          ) : null}

          {data_quality_warnings.length > 0 ? (
            <Block
              title="Data-quality warnings"
              count={data_quality_warnings.length}
              description="Observations about the record itself. These do not contribute to the score."
            >
              <ul className="space-y-2.5">
                {data_quality_warnings.map((warning) => (
                  <li key={warning.code} className="rounded-xl border border-line bg-surface-sunken px-3 py-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <code className="font-mono text-[11.5px] font-medium text-ink-muted">
                        {warning.code}
                      </code>
                    </div>
                    <p className="mt-1 text-[12.5px] leading-relaxed text-ink">{warning.message}</p>
                    {warning.fields.length > 0 ? (
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {warning.fields.map((field) => (
                          <FieldChip key={field}>{field}</FieldChip>
                        ))}
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
            </Block>
          ) : null}
        </div>
      )}
    </Card>
  );
}

function Block({
  title,
  count,
  description,
  children,
}: {
  title: string;
  count: number;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="px-5 py-4">
      <div className="flex items-center gap-2">
        <h3 className="text-[13px] font-semibold text-ink">{title}</h3>
        <Badge>{count}</Badge>
      </div>
      <p className="mt-0.5 mb-2.5 text-[12px] text-ink-subtle">{description}</p>
      {children}
    </div>
  );
}
