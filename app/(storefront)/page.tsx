const PLACEHOLDER_SECTIONS = [
  { id: 'about', label: 'About' },
  { id: 'new-arrivals', label: 'New Arrivals' },
];

export default function HomePage() {
  return (
    <div className="mx-auto max-w-container px-lg py-3xl">
      {PLACEHOLDER_SECTIONS.map((section) => (
        <section
          key={section.id}
          id={section.id}
          className="flex h-[60vh] scroll-mt-20 items-center justify-center border-b border-dashed border-neutral-300 text-h2 text-neutral-300"
        >
          {section.label} section — coming soon
        </section>
      ))}
    </div>
  );
}
