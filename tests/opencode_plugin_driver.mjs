// Usage: node driver.mjs <plugin> <skill|command|context|v1-config|v1-context> [options]
// Print registrations as JSON. Context modes print {system, toasts} when either
// is non-empty; `options` is {parentID} for context modes, a config object for
// v1-config.
import { pathToFileURL } from 'node:url';

const pluginPath = process.argv[2];
const mode = process.argv[3];
const options = process.argv[4] ? JSON.parse(process.argv[4]) : undefined;
const { default: definition } = await import(pathToFileURL(pluginPath).href);

const skills = new Map();
const commands = new Map();
const hooks = new Map();
const prompts = [];
const toasts = [];

const editorFor = (store) => ({
  get: (id) => store.get(id),
  add: (entry) => store.set(entry.id ?? entry.name, entry),
});

const v2ctx = {
  skill: {
    transform: async (cb) => {
      cb(editorFor(skills));
      return { dispose: async () => {} };
    },
  },
  command: {
    transform: async (cb) => {
      cb(editorFor(commands));
      return { dispose: async () => {} };
    },
  },
  session: {
    hook: async (name, handler) => {
      hooks.set(name, handler);
      return { dispose: async () => {} };
    },
    prompt: async (input) => {
      prompts.push(input);
    },
  },
};

// V1 plugins receive the OpenCode client; the toast path is optional.
const v1ctx = {
  client: {
    tui: {
      showToast: async ({ body }) => {
        toasts.push(body?.message);
      },
    },
  },
};

const joined = (event) => event.system.map((part) => part.text ?? String(part)).join('\n---SEP---\n');

const emitContext = (system) => {
  if (!system && toasts.length === 0) return;
  process.stdout.write(JSON.stringify({ system, toasts }));
};

if (mode === 'v1-config' || mode === 'v1-context') {
  const v1 = await definition.server(v1ctx);
  if (mode === 'v1-config') {
    const config = options || {};
    await v1.config(config);
    await v1.config(config);
    process.stdout.write(JSON.stringify(config));
  } else {
    const output = { system: [] };
    await v1['experimental.chat.system.transform'](options || {}, output);
    emitContext(output.system.join('\n---SEP---\n'));
  }
} else {
  await definition.setup(v2ctx);

  if (mode === 'skill') {
    process.stdout.write(JSON.stringify([...skills.values()]));
  } else if (mode === 'command') {
    const out = [...commands.values()].map((command) => ({
      name: command.name,
      description: command.description,
    }));
    const entry = [...commands.values()][0];
    if (entry) {
      await entry.execute({ sessionID: "ses_test", prompt: { text: "" }, delivery: "steer" });
      out[0].template = prompts[prompts.length - 1]?.text;
    }
    process.stdout.write(JSON.stringify(out));
  } else {
    const handler = hooks.get('context');
    if (!handler) process.exit(0);
    const event = { system: [], ...(options || {}) };
    await handler(event);
    emitContext(joined(event));
  }
}
