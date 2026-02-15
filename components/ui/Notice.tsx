export function Notice({
  children,
  tone = "default"
}: {
  children: React.ReactNode;
  tone?: "default" | "error" | "success";
}) {
  const cls = tone === "default" ? "notice" : `notice ${tone}`;
  return <div className={cls}>{children}</div>;
}
