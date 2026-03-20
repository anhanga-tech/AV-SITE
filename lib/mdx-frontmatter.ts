const YAML_FRONTMATTER_PATTERN = /^---\r?\n[\s\S]*?\r?\n---\r?\n*/;

export function stripYamlFrontmatter(source: string): string {
  return source.replace(YAML_FRONTMATTER_PATTERN, '');
}
