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

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { CodeMirrorEditor } from './CodeMirrorEditor';

vi.mock('./editor-bundle.generated', () => ({
  EDITOR_BUNDLE_SOURCE: '/* stub bundle */',
}));

const getIframe = () =>
  document.querySelector('iframe') as HTMLIFrameElement | null;

// Dispatch a message as if it came from the iframe's contentWindow.
const messageFromIframe = (data: unknown) => {
  const iframe = getIframe();
  const event = new MessageEvent('message', {
    data,
    source: iframe?.contentWindow,
  });
  act(() => {
    window.dispatchEvent(event);
  });
};

describe('CodeMirrorEditor', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    act(() => {
      vi.runOnlyPendingTimers();
    });
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('posts init after the iframe signals ready', () => {
    render(
      <CodeMirrorEditor
        value="hello: world"
        onChange={() => {}}
        diagnostics={[]}
        theme="light"
      />
    );
    const iframe = getIframe()!;
    const postSpy = vi.spyOn(iframe.contentWindow!, 'postMessage');

    messageFromIframe({ type: 'ready' });

    expect(postSpy).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'init', value: 'hello: world', theme: 'light' }),
      '*'
    );
  });

  it('calls onChange when the iframe reports a change', () => {
    const onChange = vi.fn();
    render(
      <CodeMirrorEditor value="" onChange={onChange} diagnostics={[]} theme="light" />
    );
    messageFromIframe({ type: 'ready' });
    messageFromIframe({ type: 'change', value: 'new: text' });
    expect(onChange).toHaveBeenCalledWith('new: text');
  });

  it('falls back to a textarea if ready never arrives', () => {
    render(
      <CodeMirrorEditor value="x: 1" onChange={() => {}} diagnostics={[]} theme="light" />
    );
    expect(getIframe()).not.toBeNull();
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(getIframe()).toBeNull();
    expect(screen.getByRole('textbox')).toHaveValue('x: 1');
  });

  it('falls back to a textarea on an error message', () => {
    render(
      <CodeMirrorEditor value="x: 1" onChange={() => {}} diagnostics={[]} theme="light" />
    );
    messageFromIframe({ type: 'error', message: 'boom' });
    expect(getIframe()).toBeNull();
    expect(screen.getByRole('textbox')).toHaveValue('x: 1');
  });

  it('posts setDiagnostics after ready', () => {
    const diagnostics = [
      { line: 1, column: 1, message: 'oops', severity: 'error' as const },
    ];
    render(
      <CodeMirrorEditor
        value=""
        onChange={() => {}}
        diagnostics={diagnostics}
        theme="light"
      />
    );
    const iframe = getIframe()!;
    const postSpy = vi.spyOn(iframe.contentWindow!, 'postMessage');
    messageFromIframe({ type: 'ready' });
    expect(postSpy).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'setDiagnostics', diagnostics }),
      '*'
    );
  });

  it('does not post setTheme before ready', () => {
    const { rerender } = render(
      <CodeMirrorEditor value="" onChange={() => {}} diagnostics={[]} theme="light" />
    );
    const iframe = getIframe()!;
    const postSpy = vi.spyOn(iframe.contentWindow!, 'postMessage');
    // change theme prop BEFORE ready
    rerender(
      <CodeMirrorEditor value="" onChange={() => {}} diagnostics={[]} theme="dark" />
    );
    expect(postSpy).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: 'setTheme' }),
      '*'
    );
  });

  it('typing in the fallback textarea calls onChange', async () => {
    const onChange = vi.fn();
    render(
      <CodeMirrorEditor value="a" onChange={onChange} diagnostics={[]} theme="light" />
    );
    messageFromIframe({ type: 'error', message: 'boom' });
    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
    act(() => {
      // simulate a controlled-input change
      const setter = Object.getOwnPropertyDescriptor(
        window.HTMLTextAreaElement.prototype,
        'value'
      )!.set!;
      setter.call(textarea, 'ab');
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
    });
    expect(onChange).toHaveBeenCalledWith('ab');
  });
});
