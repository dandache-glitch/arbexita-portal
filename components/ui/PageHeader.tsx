export function PageHeader({
  title,
  subtitle,
  right
}: {
  title: string;
  subtitle?: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
      <div>
        <div className="h1">{title}</div>
        {subtitle ? <div className="small" style={{ marginTop: 6 }}>{subtitle}</div> : null}
      </div>
      {right ? <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{right}</div> : null}
    </div>
  );
}
