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

import { useEffect, useRef, useState } from 'react';
import { Box } from '@mui/material';
import { EDITOR_BUNDLE_SOURCE } from './editor-bundle.generated';
import { buildSrcdoc } from './srcdoc';
import {
  Diagnostic,
  EditorTheme,
  HostToEditorMessage,
  isEditorToHostMessage,
} from './protocol';

const READY_TIMEOUT_MS = 4000;

type Props = {
  value: string;
  onChange: (value: string) => void;
  diagnostics: Diagnostic[];
  theme: EditorTheme;
};

export const CodeMirrorEditor = ({
  value,
  onChange,
  diagnostics,
  theme,
}: Props) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const valueRef = useRef(value);
  valueRef.current = value;
  const themeRef = useRef(theme);
  themeRef.current = theme;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  // The srcdoc is built once and never changes; value/theme/diagnostics flow
  // exclusively via postMessage, so the iframe is never reloaded mid-session.
  const srcdocRef = useRef<string>();
  if (srcdocRef.current === undefined) {
    srcdocRef.current = buildSrcdoc({ bundleSource: EDITOR_BUNDLE_SOURCE });
  }

  const post = (msg: HostToEditorMessage) =>
    iframeRef.current?.contentWindow?.postMessage(msg, '*');

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.source !== iframeRef.current?.contentWindow) return;
      if (!isEditorToHostMessage(event.data)) return;
      const msg = event.data;
      if (msg.type === 'ready') {
        setReady(true);
        post({ type: 'init', value: valueRef.current, theme: themeRef.current });
      } else if (msg.type === 'change') {
        onChangeRef.current(msg.value);
      } else if (msg.type === 'error') {
        // Surface why the editor bundle failed before we drop to the textarea
        // fallback; otherwise a bundle crash leaves no trace.
        // eslint-disable-next-line no-console
        console.error('YAML editor bundle error:', msg.message);
        setFailed(true);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  useEffect(() => {
    if (ready) return;
    const t = setTimeout(() => setFailed(true), READY_TIMEOUT_MS);
    return () => clearTimeout(t);
  }, [ready]);

  useEffect(() => {
    if (ready && !failed) post({ type: 'setDiagnostics', diagnostics });
  }, [diagnostics, ready, failed]);

  useEffect(() => {
    if (ready && !failed) post({ type: 'setTheme', theme });
  }, [theme, ready, failed]);

  if (failed) {
    return (
      <Box
        component="textarea"
        value={value}
        onChange={(e) =>
          onChange((e.target as HTMLTextAreaElement).value)
        }
        spellCheck={false}
        sx={{
          width: '100%',
          height: '100%',
          fontFamily: 'monospace',
          fontSize: 13,
          border: 'none',
          resize: 'none',
          outline: 'none',
        }}
      />
    );
  }

  return (
    <Box
      component="iframe"
      ref={iframeRef}
      title="YAML editor"
      sandbox="allow-scripts"
      srcDoc={srcdocRef.current}
      sx={{ width: '100%', height: '100%', border: 'none' }}
    />
  );
};
