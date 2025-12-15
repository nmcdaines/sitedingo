export default function ProjectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // This layout removes the default header from the root layout
  // The project page has its own full-screen header
  return <>{children}</>;
}
