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

import { z } from 'zod';

// Runtime schema for the parts of `TopologyUISchemas` the renderer depends on:
// the topology -> sections -> components/groups skeleton and a known `uiType`
// on every leaf. Everything else passes through, so authors can use any field
// params without the validator getting in the way.

// The allowed leaf field uiTypes. Exported so error messages can name them
// without re-hardcoding the list (keeps the validator and its messages in sync).
export const FIELD_UI_TYPES = ['number', 'select', 'text', 'hidden'] as const;

const fieldUiType = z.enum(FIELD_UI_TYPES);
const groupUiType = z.enum(['group', 'hidden']);

const fieldSchema = z.object({ uiType: fieldUiType }).passthrough();

const groupSchema: z.ZodTypeAny = z.lazy(() =>
  z
    .object({
      uiType: groupUiType,
      components: z.record(componentOrGroupSchema),
    })
    .passthrough()
);

const componentOrGroupSchema: z.ZodTypeAny = z.lazy(() =>
  z.union([groupSchema, fieldSchema])
);

const sectionSchema = z
  .object({
    components: z.record(componentOrGroupSchema),
    label: z.string().optional(),
    description: z.string().optional(),
    componentsOrder: z.array(z.string()).optional(),
  })
  .passthrough();

const topologySchema = z
  .object({
    sections: z.record(sectionSchema),
    sectionsOrder: z.array(z.string()).optional(),
  })
  .passthrough();

export const topologyUISchemasSchema = z.record(topologySchema);
