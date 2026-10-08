import ts from 'typescript';
import { createHash } from 'node:crypto';
import { readdir, readFile, realpath, stat } from 'node:fs/promises';
import { resolve, relative, sep } from 'node:path';
import { setImmediate as yieldTurn } from 'node:timers/promises';
import type { Flow } from '../domain/flow.js';
import type { Trace, TraceEvent } from '../domain/trace.js';

type FunctionNode =
  | ts.FunctionDeclaration
  | ts.MethodDeclaration
  | ts.ArrowFunction
  | ts.FunctionExpression
  | ts.ConstructorDeclaration;
interface SymbolEntry {
  id: string;
  name: string;
  node: FunctionNode;
  file: ts.SourceFile;
}
export interface AnalysisInput {
  provider?: 'source' | 'codegraph' | undefined;
  projectRoot: string;
  target: string;
  scenario?: Record<string, unknown> | undefined;
  maxDepth?: number | undefined;
  maxEvents?: number | undefined;
}
export interface AnalysisControl {
  signal?: AbortSignal;
  progress?: (stage: string, count: number) => void;
}
export class CandidateError extends Error {
  constructor(
    public readonly candidates: Array<{
      id: string;
      name: string;
      file: string;
      line: number;
    }>,
  ) {
    super('Select an unambiguous target using its candidate ID');
  }
}
const unknown = (expression: string) => ({
  unresolved: expression.slice(0, 300),
});
const isUnknown = (value: unknown): boolean =>
  Boolean(value && typeof value === 'object' && 'unresolved' in value);
const blocked = new Set([
  'node_modules',
  '.git',
  'dist',
  'build',
  'coverage',
  '.next',
  'vendor',
]);
const functionLike = (node: ts.Node): node is FunctionNode =>
  ts.isFunctionDeclaration(node) ||
  ts.isMethodDeclaration(node) ||
  ts.isArrowFunction(node) ||
  ts.isFunctionExpression(node) ||
  ts.isConstructorDeclaration(node);

export class SourceAnalyzer {
  private cache = new Map<string, { hash: string; file: ts.SourceFile }>();
  async analyze(
    input: AnalysisInput,
    control: AnalysisControl = {},
  ): Promise<Flow> {
    const root = await realpath(resolve(input.projectRoot));
    const files = new Map<string, ts.SourceFile>();
    const diagnostics: string[] = [];
    let hits = 0;
    let bytes = 0;
    let entriesVisited = 0;
    const cancelled = () => {
      if (control.signal?.aborted) throw new Error('Analysis cancelled');
    };
    const walk = async (directory: string): Promise<void> => {
      cancelled();
      for (const entry of (
        await readdir(directory, { withFileTypes: true })
      ).sort((a, b) => a.name.localeCompare(b.name))) {
        cancelled();
        if (++entriesVisited > 10000) {
          if (!diagnostics.includes('Directory entry limit reached (10000)'))
            diagnostics.push('Directory entry limit reached (10000)');
          return;
        }
        if (entry.isSymbolicLink()) {
          diagnostics.push(
            'Skipped symlink: ' +
              relative(root, resolve(directory, entry.name)),
          );
          continue;
        }
        const path = resolve(directory, entry.name);
        if (
          entry.isDirectory() &&
          !blocked.has(entry.name) &&
          !entry.name.startsWith('.')
        )
          await walk(path);
        else if (
          entry.isFile() &&
          /\.[cm]?[jt]sx?$/.test(entry.name) &&
          !entry.name.endsWith('.d.ts')
        ) {
          if (files.size >= 400) {
            if (!diagnostics.includes('File limit reached (400)'))
              diagnostics.push('File limit reached (400)');
            continue;
          }
          const size = (await stat(path)).size;
          if (size > 1024 * 1024 || bytes + size > 20 * 1024 * 1024) {
            diagnostics.push(
              'Skipped oversized source: ' + relative(root, path),
            );
            continue;
          }
          const text = await readFile(path, 'utf8');
          bytes += size;
          const hash = createHash('sha256').update(text).digest('hex');
          const cached = this.cache.get(path);
          let file: ts.SourceFile;
          if (cached?.hash === hash) {
            file = cached.file;
            hits++;
          } else {
            file = ts.createSourceFile(
              path,
              text,
              ts.ScriptTarget.Latest,
              true,
            );
            this.cache.set(path, { hash, file });
          }
          files.set(path, file);
          control.progress?.('indexing', files.size);
          await yieldTurn();
        }
      }
    };
    await walk(root);
    for (const path of this.cache.keys())
      if (!files.has(path)) this.cache.delete(path);
    if (!files.size)
      throw new Error(
        'No supported TypeScript/JavaScript files found in projectRoot',
      );
    const options: ts.CompilerOptions = {
      target: ts.ScriptTarget.Latest,
      module: ts.ModuleKind.NodeNext,
      moduleResolution: ts.ModuleResolutionKind.NodeNext,
      allowJs: true,
      checkJs: true,
      noLib: true,
      noEmit: true,
      experimentalDecorators: true,
    };
    const host = ts.createCompilerHost(options);
    // The compiler can only read enumerated project sources; no external code is executed.
    host.getSourceFile = (name) => files.get(resolve(name));
    host.readFile = (name) => files.get(resolve(name))?.text;
    host.fileExists = (name) => files.has(resolve(name));
    const program = ts.createProgram([...files.keys()], options, host);
    const checker = program.getTypeChecker();
    const symbols: SymbolEntry[] = [];
    const byNode = new Map<ts.Node, SymbolEntry>();
    const sourceOf = (node: ts.Node) => {
      const file = node.getSourceFile();
      return {
        file: relative(root, file.fileName).split(sep).join('/'),
        line: file.getLineAndCharacterOfPosition(node.getStart(file)).line + 1,
        endLine: file.getLineAndCharacterOfPosition(node.getEnd()).line + 1,
      };
    };
    for (const file of files.values()) {
      const visit = (node: ts.Node) => {
        if (functionLike(node) && node.body) {
          const owner = ts.isClassDeclaration(node.parent)
            ? node.parent.name?.text
            : undefined;
          let name = 'anonymous';
          if ('name' in node && node.name) name = node.name.getText(file);
          else if (ts.isVariableDeclaration(node.parent))
            name = node.parent.name.getText(file);
          else if (ts.isPropertyAssignment(node.parent))
            name = node.parent.name.getText(file);
          else if (ts.isConstructorDeclaration(node)) name = 'constructor';
          const full = owner ? owner + '.' + name : name;
          const source = sourceOf(node);
          const item = {
            id: source.file + ':' + source.line + ':' + full,
            name: full,
            node,
            file,
          };
          symbols.push(item);
          byNode.set(node, item);
        }
        ts.forEachChild(node, visit);
      };
      visit(file);
      const errors = program.getSyntacticDiagnostics(file);
      if (errors.length)
        diagnostics.push(
          'Syntax errors in ' +
            relative(root, file.fileName) +
            ': ' +
            errors.length,
        );
    }
    const resolveCall = (call: ts.CallExpression): SymbolEntry | undefined => {
      const declaration = checker.getResolvedSignature(call)?.declaration;
      if (declaration && byNode.has(declaration))
        return byNode.get(declaration);
      let symbol = checker.getSymbolAtLocation(call.expression);
      if (symbol && symbol.flags & ts.SymbolFlags.Alias)
        symbol = checker.getAliasedSymbol(symbol);
      for (const d of symbol?.declarations ?? []) {
        if (byNode.has(d)) return byNode.get(d);
        if (
          ts.isVariableDeclaration(d) &&
          d.initializer &&
          byNode.has(d.initializer)
        )
          return byNode.get(d.initializer);
      }
      return undefined;
    };
    let candidates = symbols.filter(
      (s) => s.id === input.target || s.name === input.target,
    );
    if (!candidates.length) {
      const routes = new Set<SymbolEntry>();
      for (const file of files.values()) {
        const visit = (node: ts.Node) => {
          if (
            ts.isCallExpression(node) &&
            ts.isPropertyAccessExpression(node.expression) &&
            ['get', 'post', 'put', 'delete', 'patch', 'use'].includes(
              node.expression.name.text,
            ) &&
            node.arguments[0] &&
            ts.isStringLiteral(node.arguments[0]) &&
            node.arguments[0].text === input.target
          ) {
            for (const arg of node.arguments.slice(1)) {
              if (byNode.has(arg)) routes.add(byNode.get(arg)!);
              const symbol = checker.getSymbolAtLocation(arg);
              for (const d of symbol?.declarations ?? [])
                if (byNode.has(d)) routes.add(byNode.get(d)!);
                else if (
                  ts.isVariableDeclaration(d) &&
                  d.initializer &&
                  byNode.has(d.initializer)
                )
                  routes.add(byNode.get(d.initializer)!);
            }
          }
          ts.forEachChild(node, visit);
        };
        visit(file);
      }
      for (const item of symbols) {
        if (!ts.isMethodDeclaration(item.node)) continue;
        const decoratorPath = (node: ts.Node, names: string[]) => {
          if (!ts.canHaveDecorators(node)) return undefined;
          for (const decorator of ts.getDecorators(node) ?? []) {
            const call = decorator.expression;
            if (
              ts.isCallExpression(call) &&
              names.includes(call.expression.getText()) &&
              call.arguments[0] &&
              ts.isStringLiteral(call.arguments[0])
            )
              return call.arguments[0].text;
          }
          return undefined;
        };
        const methodPath = decoratorPath(item.node, [
          'Get',
          'Post',
          'Put',
          'Patch',
          'Delete',
        ]);
        if (methodPath !== undefined) {
          const prefix = decoratorPath(item.node.parent, ['Controller']) ?? '';
          const full =
            '/' +
            [prefix, methodPath]
              .map((x) => x.replace(/^\/|\/$/g, ''))
              .filter(Boolean)
              .join('/');
          if (full === input.target) routes.add(item);
        }
      }
      candidates = [...routes];
    }
    if (!candidates.length)
      candidates = symbols.filter((s) =>
        s.name.toLowerCase().includes(input.target.toLowerCase()),
      );
    if (candidates.length !== 1)
      throw new CandidateError(
        (candidates.length ? candidates : symbols)
          .slice(0, 30)
          .map((s) => ({ id: s.id, name: s.name, ...sourceOf(s.node) })),
      );
    const target = candidates[0]!;
    const events: TraceEvent[] = [];
    const scenario = structuredClone(input.scenario ?? {});
    const stack: string[] = [];
    const active = new Set<string>();
    const frames: Record<string, unknown>[] = [];
    const callIds: string[] = [];
    const maxEvents = input.maxEvents ?? 1000;
    const maxDepth = input.maxDepth ?? 12;
    let truncated = diagnostics.some((d) => /limit|oversized/.test(d));
    let sequence = 0;
    let operations = 0;
    let eventBytes = 0;
    let byteLimitReached = false;
    const safeSet = (
      env: Record<string, unknown>,
      key: string,
      value: unknown,
    ) => {
      if (!['__proto__', 'prototype', 'constructor'].includes(key))
        env[key] = value;
    };
    const emit = (
      kind: TraceEvent['kind'],
      item: SymbolEntry,
      node: ts.Node,
      values: Record<string, unknown>,
      certainty: TraceEvent['certainty'] = 'static',
      note?: string,
    ) => {
      if (events.length >= maxEvents || byteLimitReached) {
        truncated = true;
        return;
      }
      const current = callIds.at(-1) ?? 'root';
      const parent = callIds.at(-2);
      const event: TraceEvent = {
        id: 'event-' + events.length,
        kind,
        symbolId: item.id,
        label: item.name,
        callId: current,
        ...(parent ? { parentCallId: parent } : {}),
        source: sourceOf(node),
        values: JSON.parse(JSON.stringify(values)),
        locals: JSON.parse(JSON.stringify(frames.at(-1) ?? {})),
        snippet: node.getText().slice(0, 800),
        stack: [...stack],
        certainty,
        ...(note ? { note } : {}),
      };
      const size = Buffer.byteLength(JSON.stringify(event));
      if (eventBytes + size > 8 * 1024 * 1024) {
        byteLimitReached = true;
        truncated = true;
        return;
      }
      eventBytes += size;
      events.push(event);
    };
    const sample = (parameter: ts.ParameterDeclaration): unknown => {
      const name = parameter.name.getText();
      if (Object.hasOwn(scenario, name)) return structuredClone(scenario[name]);
      const initializer = parameter.initializer;
      if (initializer && ts.isNumericLiteral(initializer))
        return Number(initializer.text);
      if (initializer && ts.isStringLiteralLike(initializer))
        return initializer.text;
      const type = parameter.type?.getText() ?? '';
      if (type === 'number') return 1;
      if (type === 'boolean') return true;
      if (type === 'string')
        return name.toLowerCase().includes('email')
          ? 'demo@example.com'
          : 'sample-' + name;
      if (type.endsWith('[]')) return [];
      return unknown(name + ': supply scenario input');
    };
    const invoke = (
      item: SymbolEntry,
      args: unknown[] | undefined,
    ): unknown => {
      cancelled();
      if (
        active.has(item.id) ||
        stack.length >= maxDepth ||
        events.length >= maxEvents ||
        byteLimitReached
      ) {
        truncated = true;
        emit(
          'unresolved',
          item,
          item.node,
          {},
          'unresolved',
          'Recursion/depth/event limit',
        );
        return unknown(item.name);
      }
      const env: Record<string, unknown> = Object.create(null);
      item.node.parameters.forEach((p, i) =>
        safeSet(
          env,
          p.name.getText(),
          args
            ? i < args.length
              ? args[i]
              : unknown('missing argument: ' + p.name.getText())
            : sample(p),
        ),
      );
      active.add(item.id);
      stack.push(item.id);
      frames.push(env);
      callIds.push('call-' + ++sequence);
      emit(
        'enter',
        item,
        item.node,
        env,
        'mock',
        'Scenario values; application is not executed',
      );
      const result =
        item.node.body && ts.isBlock(item.node.body)
          ? statements(item.node.body.statements, item, env)
          : item.node.body
            ? {
                returned: true,
                value: expression(item.node.body as ts.Expression, item, env),
              }
            : { returned: false, value: undefined };
      emit(
        'return',
        item,
        item.node,
        { result: result.value ?? null },
        isUnknown(result.value) ? 'unresolved' : 'mock',
      );
      stack.pop();
      frames.pop();
      callIds.pop();
      active.delete(item.id);
      return result.value;
    };
    const expression = (
      node: ts.Expression,
      item: SymbolEntry,
      env: Record<string, unknown>,
    ): unknown => {
      if (
        ++operations > 20000 ||
        events.length >= maxEvents ||
        byteLimitReached
      ) {
        truncated = true;
        return unknown('analysis budget');
      }
      if (
        ts.isParenthesizedExpression(node) ||
        ts.isAsExpression(node) ||
        ts.isNonNullExpression(node)
      )
        return expression(node.expression, item, env);
      if (ts.isStringLiteralLike(node)) return node.text;
      if (ts.isNumericLiteral(node)) return Number(node.text);
      if (node.kind === ts.SyntaxKind.TrueKeyword) return true;
      if (node.kind === ts.SyntaxKind.FalseKeyword) return false;
      if (node.kind === ts.SyntaxKind.NullKeyword) return null;
      if (ts.isIdentifier(node))
        return Object.hasOwn(env, node.text)
          ? env[node.text]
          : unknown(node.text);
      if (ts.isObjectLiteralExpression(node)) {
        const value: Record<string, unknown> = Object.create(null);
        for (const p of node.properties) {
          if (ts.isPropertyAssignment(p))
            safeSet(
              value,
              p.name.getText().replace(/^['"]|['"]$/g, ''),
              expression(p.initializer, item, env),
            );
          else if (ts.isShorthandPropertyAssignment(p))
            safeSet(
              value,
              p.name.text,
              env[p.name.text] ?? unknown(p.name.text),
            );
          else return unknown(node.getText());
        }
        return value;
      }
      if (ts.isArrayLiteralExpression(node))
        return node.elements.map((n) => expression(n, item, env));
      if (ts.isPropertyAccessExpression(node)) {
        const base = expression(node.expression, item, env);
        if (
          base &&
          typeof base === 'object' &&
          Object.hasOwn(base, node.name.text)
        )
          return (base as Record<string, unknown>)[node.name.text];
        if (Array.isArray(base) && node.name.text === 'length')
          return base.length;
        return unknown(node.getText());
      }
      if (ts.isElementAccessExpression(node)) {
        const base = expression(node.expression, item, env);
        const key = expression(node.argumentExpression, item, env);
        if (
          base &&
          typeof base === 'object' &&
          (typeof key === 'number' || typeof key === 'string') &&
          Object.hasOwn(base, key)
        )
          return (base as Record<string, unknown>)[String(key)];
        return unknown(node.getText());
      }
      if (ts.isConditionalExpression(node)) {
        const value = expression(node.condition, item, env);
        const selected = isUnknown(value) ? true : Boolean(value);
        emit(
          'branch',
          item,
          node,
          { condition: node.condition.getText(), selected },
          isUnknown(value) ? 'assumed' : 'mock',
        );
        return expression(selected ? node.whenTrue : node.whenFalse, item, env);
      }
      if (ts.isPrefixUnaryExpression(node)) {
        const value = expression(node.operand, item, env);
        if (
          node.operator === ts.SyntaxKind.ExclamationToken &&
          !isUnknown(value)
        )
          return !value;
        if (
          node.operator === ts.SyntaxKind.MinusToken &&
          typeof value === 'number'
        )
          return -value;
        if (
          node.operator === ts.SyntaxKind.PlusPlusToken &&
          ts.isIdentifier(node.operand) &&
          typeof value === 'number'
        ) {
          safeSet(env, node.operand.text, value + 1);
          emit(
            'assign',
            item,
            node,
            { variable: node.operand.text, before: value, after: value + 1 },
            'mock',
          );
          return value + 1;
        }
        return unknown(node.getText());
      }
      if (ts.isPostfixUnaryExpression(node) && ts.isIdentifier(node.operand)) {
        const value = expression(node.operand, item, env);
        if (typeof value === 'number') {
          const after =
            value + (node.operator === ts.SyntaxKind.PlusPlusToken ? 1 : -1);
          safeSet(env, node.operand.text, after);
          emit(
            'assign',
            item,
            node,
            { variable: node.operand.text, before: value, after },
            'mock',
          );
          return value;
        }
        return unknown(node.getText());
      }
      if (ts.isAwaitExpression(node)) {
        emit(
          'await',
          item,
          node,
          { expression: node.expression.getText() },
          'assumed',
          'Await boundary; scheduling is not simulated',
        );
        return expression(node.expression, item, env);
      }
      if (ts.isCallExpression(node)) {
        const args = node.arguments.map((arg) => expression(arg, item, env));
        const callee = resolveCall(node);
        emit(
          'call',
          item,
          node,
          { callee: callee?.id ?? node.expression.getText(), arguments: args },
          callee ? 'static' : 'unresolved',
        );
        if (callee) return invoke(callee, args);
        emit(
          'unresolved',
          item,
          node,
          { expression: node.getText() },
          'unresolved',
          'External or dynamic call is not executed',
        );
        return unknown(node.getText());
      }
      if (ts.isBinaryExpression(node)) {
        const operator = node.operatorToken.kind;
        if (operator === ts.SyntaxKind.EqualsToken) {
          const value = expression(node.right, item, env);
          if (ts.isIdentifier(node.left)) {
            const before = env[node.left.text];
            safeSet(env, node.left.text, value);
            emit(
              'assign',
              item,
              node,
              {
                variable: node.left.text,
                before: before ?? null,
                after: value,
              },
              'mock',
            );
            return value;
          }
          if (ts.isPropertyAccessExpression(node.left)) {
            const base = expression(node.left.expression, item, env);
            if (base && typeof base === 'object' && !isUnknown(base)) {
              const key = node.left.name.text;
              const before = (base as Record<string, unknown>)[key];
              safeSet(base as Record<string, unknown>, key, value);
              emit(
                'mutate',
                item,
                node,
                {
                  expression: node.left.getText(),
                  before: before ?? null,
                  after: value,
                },
                'mock',
              );
              return value;
            }
          }
          return unknown(node.getText());
        }
        const left = expression(node.left, item, env);
        if (
          [
            ts.SyntaxKind.AmpersandAmpersandToken,
            ts.SyntaxKind.BarBarToken,
            ts.SyntaxKind.QuestionQuestionToken,
          ].includes(operator)
        ) {
          if (isUnknown(left)) return unknown(node.getText());
          const evaluateRight =
            operator === ts.SyntaxKind.AmpersandAmpersandToken
              ? Boolean(left)
              : operator === ts.SyntaxKind.BarBarToken
                ? !left
                : left == null;
          return evaluateRight ? expression(node.right, item, env) : left;
        }
        const right = expression(node.right, item, env);
        if (isUnknown(left) || isUnknown(right)) return unknown(node.getText());
        if (operator === ts.SyntaxKind.EqualsEqualsEqualsToken)
          return left === right;
        if (operator === ts.SyntaxKind.ExclamationEqualsEqualsToken)
          return left !== right;
        if (
          operator === ts.SyntaxKind.PlusToken &&
          ['string', 'number'].includes(typeof left) &&
          ['string', 'number'].includes(typeof right)
        )
          return typeof left === 'string' || typeof right === 'string'
            ? String(left) + String(right)
            : Number(left) + Number(right);
        if (typeof left === 'number' && typeof right === 'number') {
          if (operator === ts.SyntaxKind.MinusToken) return left - right;
          if (operator === ts.SyntaxKind.AsteriskToken) return left * right;
          if (operator === ts.SyntaxKind.GreaterThanToken) return left > right;
          if (operator === ts.SyntaxKind.LessThanToken) return left < right;
          if (operator === ts.SyntaxKind.LessThanEqualsToken)
            return left <= right;
          if (operator === ts.SyntaxKind.GreaterThanEqualsToken)
            return left >= right;
        }
        return unknown(node.getText());
      }
      emit(
        'unresolved',
        item,
        node,
        { expression: node.getText().slice(0, 300) },
        'unresolved',
        'Unsupported expression',
      );
      return unknown(node.getText());
    };
    const statements = (
      nodes: ts.NodeArray<ts.Statement> | readonly ts.Statement[],
      item: SymbolEntry,
      env: Record<string, unknown>,
    ): { returned: boolean; value: unknown } => {
      for (const node of nodes) {
        cancelled();
        if (
          events.length >= maxEvents ||
          byteLimitReached ||
          operations > 20000
        ) {
          truncated = true;
          break;
        }
        if (ts.isReturnStatement(node))
          return {
            returned: true,
            value: node.expression
              ? expression(node.expression, item, env)
              : null,
          };
        if (ts.isVariableStatement(node))
          for (const declaration of node.declarationList.declarations) {
            const value = declaration.initializer
              ? expression(declaration.initializer, item, env)
              : unknown(declaration.name.getText());
            safeSet(env, declaration.name.getText(), value);
            emit(
              'assign',
              item,
              declaration,
              { variable: declaration.name.getText(), after: value },
              'mock',
            );
          }
        else if (ts.isExpressionStatement(node))
          expression(node.expression, item, env);
        else if (ts.isBlock(node)) {
          const result = statements(node.statements, item, env);
          if (result.returned) return result;
        } else if (ts.isIfStatement(node)) {
          const condition = expression(node.expression, item, env);
          const selected = isUnknown(condition) ? true : Boolean(condition);
          emit(
            'branch',
            item,
            node,
            {
              condition: node.expression.getText(),
              value: condition,
              selected: selected ? 'then' : 'else',
            },
            isUnknown(condition) ? 'assumed' : 'mock',
            'Unknown condition selects then for this illustrative scenario',
          );
          const chosen = selected ? node.thenStatement : node.elseStatement;
          if (chosen) {
            const result = statements([chosen], item, env);
            if (result.returned) return result;
          }
        } else if (ts.isForOfStatement(node)) {
          const collection = expression(node.expression, item, env);
          const values = Array.isArray(collection)
            ? collection.slice(0, 3)
            : [];
          emit(
            'loop',
            item,
            node,
            {
              expression: node.expression.getText(),
              iterations: values.length,
              remaining: Array.isArray(collection)
                ? Math.max(0, collection.length - 3)
                : 'unknown',
            },
            Array.isArray(collection) ? 'mock' : 'unresolved',
            'At most three scenario iterations',
          );
          if (Array.isArray(collection) && collection.length > 3)
            truncated = true;
          const variable = ts.isVariableDeclarationList(node.initializer)
            ? node.initializer.declarations[0]?.name.getText()
            : node.initializer.getText();
          for (const value of values) {
            if (variable) safeSet(env, variable, value);
            const result = statements([node.statement], item, env);
            if (result.returned) return result;
          }
        } else if (ts.isForStatement(node)) {
          if (
            node.initializer &&
            ts.isVariableDeclarationList(node.initializer)
          )
            for (const d of node.initializer.declarations)
              safeSet(
                env,
                d.name.getText(),
                d.initializer ? expression(d.initializer, item, env) : 0,
              );
          else if (node.initializer) expression(node.initializer, item, env);
          let count = 0;
          for (; count < 3; count++) {
            const condition = node.condition
              ? expression(node.condition, item, env)
              : true;
            if (isUnknown(condition)) {
              emit(
                'unresolved',
                item,
                node,
                { condition },
                'unresolved',
                'Unknown for-loop condition',
              );
              break;
            }
            if (!condition) break;
            emit(
              'loop',
              item,
              node,
              { iteration: count },
              'mock',
              'At most three scenario iterations',
            );
            const result = statements([node.statement], item, env);
            if (result.returned) return result;
            if (node.incrementor) expression(node.incrementor, item, env);
          }
          if (count === 3) {
            truncated = true;
            emit(
              'loop',
              item,
              node,
              { iterations: 3 },
              'assumed',
              'Remaining iterations not expanded',
            );
          }
        } else if (
          ts.isWhileStatement(node) ||
          ts.isWhileStatement(node) ||
          ts.isDoStatement(node) ||
          ts.isSwitchStatement(node) ||
          ts.isTryStatement(node)
        ) {
          emit(
            'unresolved',
            item,
            node,
            { statement: node.getText().slice(0, 300) },
            'unresolved',
            'Control flow not simulated; expand source manually',
          );
        } else if (ts.isThrowStatement(node)) {
          const value = expression(node.expression, item, env);
          emit('throw', item, node, { value }, 'mock');
          return { returned: true, value: unknown('exception path') };
        } else if (
          !ts.isFunctionDeclaration(node) &&
          !ts.isEmptyStatement(node)
        )
          emit(
            'unresolved',
            item,
            node,
            { statement: node.getText().slice(0, 300) },
            'unresolved',
            'Unsupported statement',
          );
      }
      return { returned: false, value: null };
    };
    control.progress?.('tracing', files.size);
    invoke(target, undefined);
    if (truncated)
      diagnostics.push(
        'Analysis is bounded; some code/iterations were not expanded',
      );
    diagnostics.push(
      'Static scenario simulation only. External effects, closures, async ordering and unsupported syntax are not runtime facts.',
    );
    const sourceHash = createHash('sha256')
      .update(
        [...files.values()].map((f) => f.fileName + '\n' + f.text).join('\n'),
      )
      .digest('hex');
    const trace: Trace = {
      version: 2,
      provider: 'typescript-ast',
      projectRoot: root,
      sourceHash,
      target: target.id,
      scenario,
      events,
      diagnostics,
      truncated,
      filesAnalyzed: files.size,
      cacheHits: hits,
    };
    return traceToFlow(trace, input.target);
  }
}
export function traceToFlow(trace: Trace, endpoint: string): Flow {
  return {
    endpoint: endpoint.slice(0, 200),
    trace,
    steps: trace.events.map((event, i) => ({
      from: i ? trace.events[i - 1]!.symbolId : event.symbolId,
      to: event.symbolId,
      dtoName: event.kind + ' · ' + event.label.slice(0, 120),
      dtoFields: { ...event.values, certainty: event.certainty },
    })),
  };
}
