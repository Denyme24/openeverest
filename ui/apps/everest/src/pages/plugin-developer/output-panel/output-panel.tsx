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

import { Box, Button, Paper, Stack, Typography } from '@mui/material';
import { Messages as DatabaseFormMessages } from 'pages/database-form/database-form.messages';

export type OutputPanelProps = {
  payload: Record<string, unknown> | null;
};

export const OutputPanel = ({ payload }: OutputPanelProps): JSX.Element => {
  const json = payload === null ? '' : JSON.stringify(payload, null, 2);

  const handleCopy = () => {
    // Absent in insecure contexts; rejects when permission is denied or the
    // document isn't focused. Neither should throw out of the click handler.
    void navigator.clipboard?.writeText(json).catch(() => {});
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1,
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 2 }}
      >
        <Typography variant="h6">Output</Typography>
        {payload !== null && (
          <Button size="small" onClick={handleCopy}>
            Copy
          </Button>
        )}
      </Stack>
      {payload === null ? (
        <Typography variant="body2" color="text.secondary">
          {`Fill the form and click ${DatabaseFormMessages.createDatabase} to generate the payload.`}
        </Typography>
      ) : (
        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
            overflow: 'auto',
          }}
        >
          <Box
            component="pre"
            data-testid="output-json"
            sx={{
              fontFamily: 'monospace',
              fontSize: '0.8rem',
              whiteSpace: 'pre',
              overflow: 'auto',
              m: 0,
              p: 2,
            }}
          >
            {json}
          </Box>
        </Box>
      )}
    </Paper>
  );
};
