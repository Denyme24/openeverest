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
import {
  isEditorToHostMessage,
  isHostToEditorMessage,
  lineColToOffset,
} from './protocol';

describe('protocol guards', () => {
  it('accepts well-formed editor→host messages', () => {
    expect(isEditorToHostMessage({ type: 'ready' })).toBe(true);
    expect(isEditorToHostMessage({ type: 'change', value: 'a' })).toBe(true);
    expect(isEditorToHostMessage({ type: 'error', message: 'x' })).toBe(true);
  });

  it('rejects junk and host→editor types', () => {
    expect(isEditorToHostMessage(null)).toBe(false);
    expect(isEditorToHostMessage({})).toBe(false);
    expect(isEditorToHostMessage('ready')).toBe(false);
    expect(
      isEditorToHostMessage({ type: 'init', value: '', theme: 'light' })
    ).toBe(false);
  });

  it('accepts well-formed host→editor messages', () => {
    expect(
      isHostToEditorMessage({ type: 'init', value: '', theme: 'dark' })
    ).toBe(true);
    expect(isHostToEditorMessage({ type: 'setTheme', theme: 'light' })).toBe(
      true
    );
    expect(
      isHostToEditorMessage({ type: 'setDiagnostics', diagnostics: [] })
    ).toBe(true);
  });

  it('rejects messages with valid type but invalid payload', () => {
    expect(isEditorToHostMessage({ type: 'change' })).toBe(false); // missing value
    expect(isEditorToHostMessage({ type: 'error' })).toBe(false); // missing message
    expect(isHostToEditorMessage({ type: 'init', value: 'x' })).toBe(false); // missing theme
    expect(isHostToEditorMessage({ type: 'setDiagnostics' })).toBe(false); // missing array
  });
});

describe('lineColToOffset', () => {
  const text = 'abc\ndef\nghi';
  it('maps 1-based line/col to a 0-based offset', () => {
    expect(lineColToOffset(text, 1, 1)).toBe(0);
    expect(lineColToOffset(text, 2, 1)).toBe(4); // start of "def"
    expect(lineColToOffset(text, 2, 3)).toBe(6); // the "f"
    expect(lineColToOffset(text, 3, 3)).toBe(10);
  });
  it('clamps out-of-range line/col into the document', () => {
    expect(lineColToOffset(text, 99, 99)).toBe(text.length);
    expect(lineColToOffset(text, 0, 0)).toBe(0);
  });

  it('clamps each axis independently', () => {
    expect(lineColToOffset(text, 1, 0)).toBe(0); // col too low, line valid
    expect(lineColToOffset(text, 1, 99)).toBe(3); // col too high -> end of 'abc'
    expect(lineColToOffset(text, 0, 2)).toBe(1); // line too low -> line 1, col 2
  });

  it('handles empty string and trailing newline', () => {
    expect(lineColToOffset('', 1, 1)).toBe(0);
    const t = 'abc\n';
    expect(lineColToOffset(t, 1, 1)).toBe(0);
    expect(lineColToOffset(t, 2, 1)).toBe(t.length); // phantom empty line -> end
    expect(lineColToOffset(t, 3, 1)).toBe(t.length); // out-of-range line -> end
  });
});
