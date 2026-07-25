import { describe, expect, it } from 'vitest';
import { allTools, primaryToolHrefs, primaryTools, toolGroups } from './tool-catalog';

describe('tool catalog', () => {
  it('keeps every live tool discoverable exactly once', () => {
    expect(allTools).toHaveLength(21);
    expect(new Set(allTools.map((tool) => tool.href)).size).toBe(21);
    expect(allTools.every((tool) => /^\/tools\/[a-z0-9-]+$/.test(tool.href))).toBe(true);
  });

  it('organizes tools into the three approved task groups', () => {
    expect(toolGroups.map((group) => group.id)).toEqual([
      'encoding-formatting',
      'credentials-security',
      'debugging-validation',
    ]);
    expect(toolGroups.every((group) => group.tools.length > 0)).toBe(true);
  });

  it('uses the four evidence-led homepage pathways without popularity claims', () => {
    expect(primaryTools.map((tool) => tool.href)).toEqual(primaryToolHrefs);
    expect(primaryToolHrefs).toEqual([
      '/tools/env-sanitizer',
      '/tools/webhook-debugger',
      '/tools/sha256-hash',
      '/tools/base64-converter',
    ]);
  });
});
