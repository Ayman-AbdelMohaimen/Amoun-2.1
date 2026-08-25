/**
 * Wazeer OS v2.0 — Tool Registry
 * Defines Gemini function declarations and their execution logic.
 * Uses an in-memory Virtual File System (VFS) for file operations.
 * search_web is a declaration-only tool — actual search runs via Gemini grounding.
 */

import type { FunctionDeclaration, Part, Content } from '@google/genai';
import type { Type } from '@google/genai';
import { Type as SchemaType } from '@google/genai';
import { createPartFromFunctionResponse } from '@google/genai';
import { scanCode } from '@/services/security/HorusGuard';

// ═══════════════════════════════════════════════════════════════════
// TOOL EXECUTION GUARDS (DSH pattern: pre-execute → deny = skip body)
// ═══════════════════════════════════════════════════════════════════

/**
 * Pre-execute security guard — scans tool input with HorusGuard AST rules.
 * Unsafe (critical/high threats) → the tool body is skipped and the
 * model-visible result becomes a denial, mirroring tools/pre-execute.
 */
function guardToolInput(toolName: string, code: string): string | null {
  const scan = scanCode(code);
  if (scan.safe) return null;
  const summary = scan.threats
    .filter((t) => t.severity === 'critical' || t.severity === 'high')
    .slice(0, 5)
    .map((t) => `${t.pattern} (line ${t.line})`)
    .join('; ');
  return `Blocked by HorusGuard: ${toolName} input contains dangerous patterns → ${summary}`;
}

// ═══════════════════════════════════════════════════════════════════
// VIRTUAL FILE SYSTEM
// ═══════════════════════════════════════════════════════════════════

const vfs = new Map<string, string>();

// ═══════════════════════════════════════════════════════════════════
// TOOL DECLARATIONS (Gemini FunctionDeclaration format)
// ═══════════════════════════════════════════════════════════════════

export const TOOL_DECLARATIONS: FunctionDeclaration[] = [
  {
    name: 'write_file',
    description: 'Writes content to a file in the virtual file system. Creates or overwrites the file at the given path.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        path: { type: SchemaType.STRING, description: 'The file path to write to.' },
        content: { type: SchemaType.STRING, description: 'The full content to write to the file.' },
      },
      required: ['path', 'content'],
    },
  },
  {
    name: 'read_file',
    description: 'Reads the content of a file from the virtual file system.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        path: { type: SchemaType.STRING, description: 'The file path to read.' },
      },
      required: ['path'],
    },
  },
  {
    name: 'list_dir',
    description: 'Lists all files and directories at the given path in the virtual file system.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        path: { type: SchemaType.STRING, description: 'The directory path to list.' },
      },
      required: ['path'],
    },
  },
  {
    name: 'run_command',
    description: 'Executes a shell command in the sandboxed environment. Returns the command output.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        command: { type: SchemaType.STRING, description: 'The shell command to execute.' },
      },
      required: ['command'],
    },
  },
  {
    name: 'search_web',
    description: 'Searches the web for information. Only available when Gemini grounding is enabled. The actual search is performed by Gemini via google_search grounding — this declaration tells the model it CAN search.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        query: { type: SchemaType.STRING, description: 'The search query.' },
      },
      required: ['query'],
    },
  },
];

// ═══════════════════════════════════════════════════════════════════
// TOOL EXECUTION
// ═══════════════════════════════════════════════════════════════════

export async function executeToolCall(
  name: string,
  args: Record<string, unknown>,
): Promise<string> {
  try {
    switch (name) {
      case 'write_file': {
        const path = String(args.path ?? '');
        const content = String(args.content ?? '');
        if (!path) return 'Error: path is required.';
        const denial = guardToolInput('write_file', content);
        if (denial) return denial;
        vfs.set(path, content);
        return `File written successfully: ${path} (${content.length} chars)`;
      }

      case 'read_file': {
        const path = String(args.path ?? '');
        if (!path) return 'Error: path is required.';
        const content = vfs.get(path);
        if (content === undefined) return `Error: File not found: ${path}`;
        return content;
      }

      case 'list_dir': {
        const dir = String(args.path ?? '/');
        const normalized = dir.endsWith('/') ? dir : dir + '/';
        const entries: string[] = [];
        for (const path of vfs.keys()) {
          if (path.startsWith(normalized)) {
            const relative = path.slice(normalized.length);
            const firstSegment = relative.split('/')[0];
            if (firstSegment && !entries.includes(firstSegment)) {
              entries.push(firstSegment);
            }
          }
        }
        if (entries.length === 0) {
          return `Directory is empty: ${dir}`;
        }
        return entries.map((e) => `  ${e}`).join('\n');
      }

      case 'run_command': {
        const command = String(args.command ?? '');
        if (!command) return 'Error: command is required.';
        const denial = guardToolInput('run_command', command);
        if (denial) return denial;
        return `Command execution is sandboxed. Output: [simulated]\n$ ${command}\n> Execution simulated — WebContainer not available in v2.0 MVP`;
      }

      case 'search_web': {
        return 'Web search is handled by Gemini grounding. Results will appear in the response.';
      }

      default:
        return `Unknown tool: ${name}`;
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return `Tool execution error (${name}): ${message}`;
  }
}

// ═══════════════════════════════════════════════════════════════════
// HELPERS FOR GEMINI REACT LOOP
// ═══════════════════════════════════════════════════════════════════

/**
 * Builds a FunctionResponse Part to send back to Gemini after tool execution.
 */
export function buildFunctionResponsePart(
  callId: string,
  name: string,
  result: string,
): Part {
  return createPartFromFunctionResponse(callId, name, { output: result });
}

/**
 * Checks whether any part in the response contains a function call.
 */
export function hasFunctionCalls(parts: Part[]): boolean {
  return parts.some((p) => p.functionCall !== undefined);
}

/**
 * Extracts all function calls from response parts.
 */
export function extractFunctionCalls(parts: Part[]): Array<{ id: string; name: string; args: Record<string, unknown> }> {
  return parts
    .filter((p) => p.functionCall !== undefined)
    .map((p) => ({
      id: p.functionCall!.id ?? crypto.randomUUID(),
      name: p.functionCall!.name ?? '',
      args: p.functionCall!.args ?? {},
    }));
}

/**
 * Resets the VFS. Useful for testing or new sessions.
 */
export function resetVFS(): void {
  vfs.clear();
}
