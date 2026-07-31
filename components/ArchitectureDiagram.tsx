const STAGES: { label: string; sub: string; ai?: boolean }[] = [
  { label: 'Sources', sub: '77+ RSS feeds' },
  { label: 'Fetch', sub: 'ingest · dedupe' },
  { label: 'Classify', sub: 'Claude Haiku', ai: true },
  { label: 'Generate', sub: 'Claude Sonnet', ai: true },
  { label: 'Illustrate', sub: 'DALL·E 3', ai: true },
  { label: 'Cleanup', sub: 'prune · archive' },
];

const BOX_W = 128;
const BOX_H = 60;
const STEP = 142;
const X0 = 8;
const ROW_Y = 46;

const OUTPUTS = [
  { label: 'marketplacebeta.com', sub: 'public publication', live: true },
  { label: 'Subscriber email', sub: 'Resend · React Email' },
  { label: 'Embedded operator tools', sub: 'PriceScope · AgencyForecast · Recovery estimator' },
];

export default function ArchitectureDiagram() {
  return (
    <figure className="border border-line bg-surface">
      <svg
        viewBox="0 0 900 386"
        className="w-full"
        role="img"
        aria-label="Marketplace Beta pipeline. Seventy-seven plus RSS sources feed a five-stage scheduled pipeline: fetch, classify with Claude Haiku, generate with Claude Sonnet, illustrate with DALL-E 3, and cleanup. All model calls route through the Vercel AI Gateway. Supabase Postgres persists articles, tags, subscribers and run logs. Outputs are the public site, subscriber email, and embedded operator tools."
      >
        <text x={X0} y={22} className="num" fontSize="11" fill="var(--color-fg-3)">
          VERCEL CRON — FIVE SCHEDULED STAGES
        </text>

        {STAGES.map((s, i) => {
          const x = X0 + i * STEP;
          const stroke = s.ai ? 'var(--color-model-dim)' : 'var(--color-line-bright)';
          const labelFill = s.ai ? 'var(--color-model)' : 'var(--color-fg)';
          return (
            <g key={s.label}>
              <rect
                x={x}
                y={ROW_Y}
                width={BOX_W}
                height={BOX_H}
                fill="var(--color-surface-2)"
                stroke={stroke}
              />
              <text x={x + 12} y={ROW_Y + 25} fontSize="13" fill={labelFill}>
                {s.label}
              </text>
              <text
                x={x + 12}
                y={ROW_Y + 43}
                className="num"
                fontSize="10"
                fill="var(--color-fg-3)"
              >
                {s.sub}
              </text>
              {i < STAGES.length - 1 && (
                <path
                  d={`M ${x + BOX_W + 2} ${ROW_Y + BOX_H / 2} L ${x + STEP - 4} ${ROW_Y + BOX_H / 2}`}
                  stroke="var(--color-line-bright)"
                  strokeWidth={1}
                  markerEnd="url(#arrow)"
                />
              )}
            </g>
          );
        })}

        <defs>
          <marker
            id="arrow"
            viewBox="0 0 8 8"
            refX="6"
            refY="4"
            markerWidth="6"
            markerHeight="6"
            orient="auto"
          >
            <path d="M 0 1 L 6 4 L 0 7 z" fill="var(--color-line-bright)" />
          </marker>
        </defs>

        {/* Gateway spans the three model stages */}
        <rect
          x={X0 + 2 * STEP}
          y={142}
          width={BOX_W + 2 * STEP}
          height={30}
          fill="none"
          stroke="var(--color-model-dim)"
          strokeDasharray="4 3"
        />
        <text
          x={X0 + 2 * STEP + 12}
          y={161}
          className="num"
          fontSize="11"
          fill="var(--color-model)"
        >
          Vercel AI Gateway — every model call routed and metered
        </text>
        {[2, 3, 4].map((i) => (
          <line
            key={i}
            x1={X0 + i * STEP + BOX_W / 2}
            y1={ROW_Y + BOX_H}
            x2={X0 + i * STEP + BOX_W / 2}
            y2={142}
            stroke="var(--color-model-dim)"
            strokeWidth={1}
            strokeDasharray="3 3"
          />
        ))}

        {/* Persistence */}
        <rect
          x={X0}
          y={198}
          width={846}
          height={38}
          fill="var(--color-surface-2)"
          stroke="var(--color-line-bright)"
        />
        <text x={X0 + 12} y={222} fontSize="12" fill="var(--color-fg)">
          Supabase / PostgreSQL
          <tspan className="num" fontSize="10" fill="var(--color-fg-3)" dx="10">
            articles · tags · subscribers · run logs · full-text search index
          </tspan>
        </text>

        {/* Outputs */}
        <text x={X0} y={272} className="num" fontSize="11" fill="var(--color-fg-3)">
          OUTPUTS
        </text>
        {OUTPUTS.map((o, i) => {
          const w = 274;
          const x = X0 + i * (w + 12);
          return (
            <g key={o.label}>
              <rect
                x={x}
                y={286}
                width={w}
                height={58}
                fill="var(--color-surface-2)"
                stroke={o.live ? 'var(--color-signal-dim)' : 'var(--color-line-bright)'}
              />
              <text
                x={x + 12}
                y={311}
                fontSize="13"
                fill={o.live ? 'var(--color-signal)' : 'var(--color-fg)'}
              >
                {o.label}
              </text>
              <text
                x={x + 12}
                y={329}
                className="num"
                fontSize="10"
                fill="var(--color-fg-3)"
              >
                {o.sub}
              </text>
            </g>
          );
        })}

        <text x={X0} y={372} className="num" fontSize="10" fill="var(--color-fg-3)">
          Cyan marks a model call. Amber marks something live and reachable.
        </text>
      </svg>
    </figure>
  );
}
