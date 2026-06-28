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

import { EditorState, Compartment } from '@codemirror/state';
import {
  EditorView,
  keymap,
  lineNumbers,
  highlightActiveLine,
} from '@codemirror/view';
import {
  defaultKeymap,
  history,
  historyKeymap,
  indentWithTab,
} from '@codemirror/commands';
import {
  syntaxHighlighting,
  defaultHighlightStyle,
  indentOnInput,
} from '@codemirror/language';
import { yaml } from '@codemirror/lang-yaml';
import {
  lintGutter,
  setDiagnostics as cmSetDiagnostics,
  Diagnostic as CmDiagnostic,
} from '@codemirror/lint';
import { oneDark } from '@codemirror/theme-one-dark';
import {
  EditorTheme,
  Diagnostic,
  HostToEditorMessage,
  isHostToEditorMessage,
  lineColToOffset,
} from './protocol';

const themeCompartment = new Compartment();

const themeExtension = (theme: EditorTheme) =>
  theme === 'dark' ? oneDark : syntaxHighlighting(defaultHighlightStyle);

// targetOrigin '*': the host validates event.source on receipt, which is the
// real protection. Pinning an origin would risk dropping messages behind a dev
// proxy for no security gain.
const postToHost = (msg: { type: string; [k: string]: unknown }) =>
  window.parent.postMessage(msg, '*');

let view: EditorView | null = null;
let changeTimer: ReturnType<typeof setTimeout> | null = null;

const scheduleChange = (value: string) => {
  if (changeTimer) clearTimeout(changeTimer);
  changeTimer = setTimeout(() => postToHost({ type: 'change', value }), 150);
};

const toCmDiagnostics = (text: string, diags: Diagnostic[]): CmDiagnostic[] =>
  diags.map((d) => {
    let from = Math.min(lineColToOffset(text, d.line, d.column), text.length);
    let to =
      d.endLine != null && d.endColumn != null
        ? lineColToOffset(text, d.endLine, d.endColumn)
        : from + 1;
    to = Math.min(to, text.length);
    // Ensure a visible, valid range (from <= to, and >= 1 char when the
    // document is non-empty). At end-of-document, walk `from` back one char.
    if (from >= to && text.length > 0) {
      if (from > 0) {
        from -= 1;
        to = from + 1;
      } else {
        to = Math.min(from + 1, text.length);
      }
    }
    return {
      from,
      to: Math.max(to, from),
      severity: d.severity,
      message: d.message,
    };
  });

const mount = (value: string, theme: EditorTheme) => {
  const state = EditorState.create({
    doc: value,
    extensions: [
      lineNumbers(),
      highlightActiveLine(),
      history(),
      indentOnInput(),
      lintGutter(),
      yaml(),
      keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
      themeCompartment.of(themeExtension(theme)),
      EditorView.updateListener.of((u) => {
        if (u.docChanged) scheduleChange(u.state.doc.toString());
      }),
    ],
  });
  view = new EditorView({
    state,
    parent: document.getElementById('editor') as HTMLElement,
  });
};

const applyDiagnostics = (diags: Diagnostic[]) => {
  if (!view) return;
  const text = view.state.doc.toString();
  view.dispatch(cmSetDiagnostics(view.state, toCmDiagnostics(text, diags)));
};

const applyTheme = (theme: EditorTheme) => {
  if (!view) return;
  view.dispatch({
    effects: themeCompartment.reconfigure(themeExtension(theme)),
  });
};

window.addEventListener('message', (event: MessageEvent) => {
  if (!isHostToEditorMessage(event.data)) return;
  const msg = event.data as HostToEditorMessage;
  try {
    if (msg.type === 'init') {
      if (!view) mount(msg.value, msg.theme);
    } else if (msg.type === 'setDiagnostics') {
      applyDiagnostics(msg.diagnostics);
    } else if (msg.type === 'setTheme') {
      applyTheme(msg.theme);
    }
  } catch (err) {
    postToHost({ type: 'error', message: String(err) });
  }
});

// Tell the host we are ready to receive `init`. Sent after the listener above
// is attached to avoid a race.
postToHost({ type: 'ready' });
