import { describe, it, expect } from 'vitest';
import { buildSrcdoc } from './srcdoc';

describe('buildSrcdoc', () => {
  const out = buildSrcdoc({ bundleSource: 'console.log("hi")' });

  it('embeds a CSP meta scoped to the sandboxed iframe (no parent-affecting rules)', () => {
    expect(out).toContain('Content-Security-Policy');
    expect(out).toContain("default-src 'none'");
    expect(out).toContain("script-src 'unsafe-inline'");
    expect(out).toContain("style-src 'unsafe-inline'");
    expect(out).toContain('img-src data:');
    expect(out).toContain('font-src data:');
  });

  it('inlines the bundle source verbatim inside a script tag', () => {
    expect(out).toContain('console.log("hi")');
    expect(out).toContain('<div id="editor"></div>');
  });
});
