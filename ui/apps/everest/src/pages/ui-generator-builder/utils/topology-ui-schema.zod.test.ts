import { describe, it, expect } from 'vitest';
import { topologyUISchemasSchema } from './topology-ui-schema.zod';

const validField = { uiType: 'text', path: 'a.b' };

const validSchema = {
  standalone: {
    sections: {
      basics: {
        label: 'Basics',
        components: {
          name: validField,
          nodes: { uiType: 'number', path: 'x' },
        },
      },
    },
  },
};

describe('topologyUISchemasSchema', () => {
  it('accepts a valid skeleton', () => {
    expect(topologyUISchemasSchema.safeParse(validSchema).success).toBe(true);
  });

  it('accepts nested groups', () => {
    const withGroup = {
      t: {
        sections: {
          s: {
            components: {
              g: {
                uiType: 'group',
                components: { cpu: { uiType: 'number' } },
              },
            },
          },
        },
      },
    };
    expect(topologyUISchemasSchema.safeParse(withGroup).success).toBe(true);
  });

  it('rejects an unknown field uiType', () => {
    const bad = {
      t: { sections: { s: { components: { n: { uiType: 'integer' } } } } },
    };
    const r = topologyUISchemasSchema.safeParse(bad);
    expect(r.success).toBe(false);
  });

  it('rejects a group missing its components map', () => {
    const bad = {
      t: { sections: { s: { components: { g: { uiType: 'group' } } } } },
    };
    expect(topologyUISchemasSchema.safeParse(bad).success).toBe(false);
  });

  it('passes through unknown extra params on a field', () => {
    const ok = {
      t: {
        sections: {
          s: {
            components: {
              n: { uiType: 'select', fieldParams: { label: 'X' }, anything: 1 },
            },
          },
        },
      },
    };
    expect(topologyUISchemasSchema.safeParse(ok).success).toBe(true);
  });

  it('accepts a deeply nested group (group within a group)', () => {
    const nested = {
      t: {
        sections: {
          s: {
            components: {
              outer: {
                uiType: 'group',
                components: {
                  inner: {
                    uiType: 'group',
                    components: { cpu: { uiType: 'number' } },
                  },
                },
              },
            },
          },
        },
      },
    };
    expect(topologyUISchemasSchema.safeParse(nested).success).toBe(true);
  });

  it('accepts a hidden group (uiType hidden with components)', () => {
    const hiddenGroup = {
      t: {
        sections: {
          s: {
            components: {
              g: { uiType: 'hidden', components: { x: { uiType: 'text' } } },
            },
          },
        },
      },
    };
    expect(topologyUISchemasSchema.safeParse(hiddenGroup).success).toBe(true);
  });

  it('accepts a hidden field (uiType hidden without components)', () => {
    const hiddenField = {
      t: { sections: { s: { components: { h: { uiType: 'hidden' } } } } },
    };
    expect(topologyUISchemasSchema.safeParse(hiddenField).success).toBe(true);
  });

  it('accepts a topology with sectionsOrder', () => {
    const ordered = {
      t: {
        sectionsOrder: ['s'],
        sections: { s: { components: { n: { uiType: 'number' } } } },
      },
    };
    expect(topologyUISchemasSchema.safeParse(ordered).success).toBe(true);
  });
});
