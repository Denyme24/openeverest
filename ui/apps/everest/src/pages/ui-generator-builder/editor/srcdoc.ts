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

type BuildSrcdocArgs = {
  bundleSource: string;
};

// Build the self-contained HTML for the editor iframe. The CSP is the iframe's
// own policy; `script-src 'unsafe-inline'` is safe because the iframe is a
// sandboxed, opaque origin with no secrets and no same-origin access to the app.
// `bundleSource` must already be safe to inline: the build step escapes any
// literal `</script>` before passing it here (this function does no transform).
export const buildSrcdoc = ({ bundleSource }: BuildSrcdocArgs): string => {
  const csp = [
    `default-src 'none'`,
    `script-src 'unsafe-inline'`,
    `style-src 'unsafe-inline'`,
    `img-src data:`,
    `font-src data:`,
  ].join('; ');

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta http-equiv="Content-Security-Policy" content="${csp}" />
    <style>
      html, body { margin: 0; height: 100%; }
      #editor, .cm-editor { height: 100%; }
    </style>
  </head>
  <body>
    <div id="editor"></div>
    <script>${bundleSource}</script>
  </body>
</html>`;
};
