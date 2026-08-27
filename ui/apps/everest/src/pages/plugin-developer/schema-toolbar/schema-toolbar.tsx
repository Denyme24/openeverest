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

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
} from '@mui/material';
import { useState } from 'react';

export type SchemaToolbarProps = {
  names: string[];
  // The parent supplies the YAML; the toolbar only knows the name.
  onSave: (name: string) => void;
  onLoad: (name: string) => void;
  onDelete: (name: string) => void;
  onReset: () => void;
};

// Presentational only: every action is a callback, no persistence here.
export const SchemaToolbar = ({
  names,
  onSave,
  onLoad,
  onDelete,
  onReset,
}: SchemaToolbarProps) => {
  const [selectedName, setSelectedName] = useState('');
  const [saveOpen, setSaveOpen] = useState(false);
  const [draftName, setDraftName] = useState('');

  const canDelete = selectedName !== '' && names.includes(selectedName);
  const trimmedDraft = draftName.trim();

  const handleLoad = (name: string) => {
    setSelectedName(name);
    onLoad(name);
  };

  const openSaveDialog = () => {
    setDraftName(selectedName);
    setSaveOpen(true);
  };

  const closeSaveDialog = () => setSaveOpen(false);

  const confirmSave = () => {
    if (!trimmedDraft) {
      return;
    }
    onSave(trimmedDraft);
    setSelectedName(trimmedDraft);
    setSaveOpen(false);
  };

  const handleDelete = () => {
    if (!canDelete) {
      return;
    }
    onDelete(selectedName);
    setSelectedName('');
  };

  const handleReset = () => {
    onReset();
    setSelectedName('');
  };

  return (
    // One line only: wrapping would misalign this strip with the preview tabs.
    <Stack
      direction="row"
      spacing={1}
      alignItems="center"
      flexWrap="nowrap"
      sx={{ width: '100%', overflowX: 'auto', py: 0.5 }}
    >
      <TextField
        select
        size="small"
        label="Saved schemas"
        value={selectedName}
        onChange={(e) => handleLoad(e.target.value)}
        disabled={names.length === 0}
        sx={{ minWidth: 190, flexShrink: 1 }}
      >
        {names.map((name) => (
          <MenuItem key={name} value={name}>
            {name}
          </MenuItem>
        ))}
      </TextField>
      <Button
        size="small"
        variant="contained"
        onClick={openSaveDialog}
        sx={{ flexShrink: 0 }}
      >
        Save
      </Button>
      <Button
        size="small"
        variant="outlined"
        onClick={handleDelete}
        disabled={!canDelete}
        sx={{ flexShrink: 0 }}
      >
        Delete
      </Button>
      {/* Short label so the strip fits; the tooltip carries the full meaning. */}
      <Tooltip title="Reset to the default example schema">
        <Button
          size="small"
          variant="text"
          onClick={handleReset}
          sx={{ flexShrink: 0, whiteSpace: 'nowrap' }}
        >
          Reset
        </Button>
      </Tooltip>

      <Dialog open={saveOpen} onClose={closeSaveDialog}>
        <DialogTitle>Save schema</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            size="small"
            label="Schema name"
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            sx={{ mt: 1, minWidth: 320 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeSaveDialog}>Cancel</Button>
          <Button
            variant="contained"
            onClick={confirmSave}
            disabled={!trimmedDraft}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
};
