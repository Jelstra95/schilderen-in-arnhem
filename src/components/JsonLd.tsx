/**
 * Renders a JSON-LD block.
 *
 * Next has no dedicated metadata API for structured data, so a native script
 * tag in a Server Component is the documented approach. `next/script` is the
 * wrong tool here: JSON-LD is data, not executable code.
 *
 * The `<` escape is required. JSON.stringify does not escape HTML, so a stray
 * `</script>` inside any string value would close the tag early.
 * See node_modules/next/dist/docs/01-app/02-guides/json-ld.md
 */
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
