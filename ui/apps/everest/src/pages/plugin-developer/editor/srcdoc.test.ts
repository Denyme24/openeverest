// Copyright (C) 2026 The OpenEverest Contributors
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

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
