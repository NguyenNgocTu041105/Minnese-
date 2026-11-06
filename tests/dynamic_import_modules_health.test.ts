import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { createServer, ViteDevServer } from 'vite';
import { retryPromise, lazyWithRetry } from '../src/App';
import { ErrorBoundary } from '../src/components/ErrorBoundary';

describe('Dynamic Import Modules Health & Resilience Suite', () => {
  const rootDir = process.cwd();

  const LAZY_MODULE_ENTRIES = [
    { name: 'CoursebookView', file: 'src/components/Coursebook/CoursebookView.tsx', exportName: 'CoursebookView' },
    { name: 'QuizzesView', file: 'src/components/Quizzes/QuizzesView.tsx', exportName: 'QuizzesView' },
    { name: 'AITutorView', file: 'src/components/AITutor/AITutorView.tsx', exportName: 'AITutorView' },
    { name: 'FlashcardsView', file: 'src/components/Flashcards/FlashcardsView.tsx', exportName: 'FlashcardsView' },
    { name: 'DictionaryView', file: 'src/components/Dictionary/DictionaryView.tsx', exportName: 'DictionaryView' },
    { name: 'AdminDashboard', file: 'src/components/Admin/AdminDashboard.tsx', exportName: 'AdminDashboard' },
    { name: 'QBankAdmin', file: 'src/components/QBankAdmin.tsx', exportName: 'QBankAdmin' },
    { name: 'JoinClassModal', file: 'src/components/Dashboard/JoinClassModal.tsx', exportName: 'JoinClassModal' },
    { name: 'AuthModal', file: 'src/components/Auth/AuthModal.tsx', exportName: 'AuthModal' },
    { name: 'LiveVoiceCallModal', file: 'src/components/LiveVoiceCall/LiveVoiceCallModal.tsx', exportName: 'LiveVoiceCallModal' },
  ];

  const CORE_CHILD_MODULES = [
    'src/components/HSKMockExam.tsx',
    'src/components/Coursebook/WorkbookView.tsx',
    'src/components/Coursebook/LessonExercisesStudio.tsx',
    'src/components/Quizzes/OnlineExamRunner.tsx',
    'src/data/newHsk1BookData.ts',
    'src/data/newHsk2BookData.ts',
    'src/data/newHsk3BookData.ts',
    'src/data/newHsk4BookData.ts',
    'src/data/newHsk5BookData.ts',
    'src/data/newHsk6BookData.ts',
    'src/data/hskMockExamFixtures.ts',
    'src/components/Dictionary/WordDetailModal.tsx',
    'src/components/HSKIllustrationCanvas.tsx',
  ];

  // Helper to extract relative import/export specifiers from code
  function extractRelativeImportSpecifiers(sourceCode: string): string[] {
    const specifiers: string[] = [];
    // Match static import ... from '...'
    const staticImportRegex = /(?:import|export)\s+(?:[\w*\s{},]*\s+from\s+)?['"](\.[^'"]+)['"]/g;
    let match: RegExpExecArray | null;
    while ((match = staticImportRegex.exec(sourceCode)) !== null) {
      specifiers.push(match[1]);
    }

    // Match dynamic import('...')
    const dynamicImportRegex = /import\s*\(\s*['"](\.[^'"]+)['"]\s*\)/g;
    while ((match = dynamicImportRegex.exec(sourceCode)) !== null) {
      specifiers.push(match[1]);
    }

    return Array.from(new Set(specifiers));
  }

  // Resolve a relative specifier from a directory and verify exact case-matching on disk
  function resolveWithExactCasing(fromFile: string, specifier: string): { resolvedPath: string; exactCaseMatch: boolean } | null {
    const fromDir = path.dirname(fromFile);
    const targetBase = path.resolve(fromDir, specifier);

    const candidates = [
      targetBase,
      `${targetBase}.ts`,
      `${targetBase}.tsx`,
      `${targetBase}.js`,
      `${targetBase}.jsx`,
      path.join(targetBase, 'index.ts'),
      path.join(targetBase, 'index.tsx'),
      path.join(targetBase, 'index.js'),
    ];

    for (const candidate of candidates) {
      if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
        // Verify case-sensitive exact match for each path segment
        const segments = path.relative(rootDir, candidate).split(path.sep);
        let currentPath = rootDir;
        let isCaseAccurate = true;

        for (const segment of segments) {
          const filesInCurrentDir = fs.readdirSync(currentPath);
          if (!filesInCurrentDir.includes(segment)) {
            // Found on disk due to case-insensitivity, but exact case differs!
            isCaseAccurate = false;
            break;
          }
          currentPath = path.join(currentPath, segment);
        }

        return { resolvedPath: candidate, exactCaseMatch: isCaseAccurate };
      }
    }

    return null;
  }

  // Recursive traversal of module graph
  function traverseModuleGraph(startFile: string): { visitedFiles: Set<string>; missingImports: string[]; casingMismatches: string[] } {
    const visitedFiles = new Set<string>();
    const missingImports: string[] = [];
    const casingMismatches: string[] = [];

    function visit(fileAbsPath: string) {
      if (visitedFiles.has(fileAbsPath)) return;
      visitedFiles.add(fileAbsPath);

      if (!fs.existsSync(fileAbsPath)) {
        missingImports.push(fileAbsPath);
        return;
      }

      // Only parse code files (.ts, .tsx, .js, .jsx)
      if (!/\.[jt]sx?$/.test(fileAbsPath)) return;

      const content = fs.readFileSync(fileAbsPath, 'utf-8');
      const specifiers = extractRelativeImportSpecifiers(content);

      for (const spec of specifiers) {
        // Skip css/asset imports in this AST check
        if (/\.(css|png|jpg|svg|json)$/i.test(spec)) continue;

        const resolved = resolveWithExactCasing(fileAbsPath, spec);
        if (!resolved) {
          missingImports.push(`${spec} (imported in ${path.relative(rootDir, fileAbsPath)})`);
        } else {
          if (!resolved.exactCaseMatch) {
            casingMismatches.push(`${spec} in ${path.relative(rootDir, fileAbsPath)} does not match exact disk casing`);
          }
          visit(resolved.resolvedPath);
        }
      }
    }

    visit(path.resolve(rootDir, startFile));
    return { visitedFiles, missingImports, casingMismatches };
  }

  // Helper to extract exported identifiers from a TypeScript/JavaScript file
  function extractModuleExports(fileAbsPath: string): Set<string> {
    const code = fs.readFileSync(fileAbsPath, 'utf-8');
    const exports = new Set<string>();

    const namedDecl = /export\s+(?:async\s+)?(?:const|let|var|function\*?|class|interface|type|enum)\s+([a-zA-Z0-9_$]+)/g;
    let m: RegExpExecArray | null;
    while ((m = namedDecl.exec(code)) !== null) exports.add(m[1]);

    const blockExport = /export\s*\{([^}]+)\}/g;
    while ((m = blockExport.exec(code)) !== null) {
      const parts = m[1].split(',');
      for (const part of parts) {
        const clean = part.trim();
        if (!clean) continue;
        const sub = clean.split(/\s+as\s+/);
        exports.add(sub[sub.length - 1].trim());
      }
    }

    if (/export\s+default\s+/.test(code)) exports.add('default');

    return exports;
  }

  // Verify that all relative named and default imports in a module tree match exports
  function verifyTransitiveExports(startFile: string): string[] {
    const visited = new Set<string>();
    const errors: string[] = [];

    function check(fileAbsPath: string) {
      if (visited.has(fileAbsPath)) return;
      visited.add(fileAbsPath);
      if (!fs.existsSync(fileAbsPath) || !/\.[jt]sx?$/.test(fileAbsPath)) return;

      const code = fs.readFileSync(fileAbsPath, 'utf-8');
      const importRegex = /import\s+(?:type\s+)?(?:([a-zA-Z0-9_$]+)|\{([^}]+)\}|(?:\*\s+as\s+([a-zA-Z0-9_$]+)))\s+from\s+['"](\.[^'"]+)['"]/g;
      let m: RegExpExecArray | null;

      while ((m = importRegex.exec(code)) !== null) {
        const defaultImport = m[1];
        const namedImports = m[2];
        const specifier = m[4];

        if (/\.(css|png|jpg|svg|json)$/i.test(specifier)) continue;

        const resolved = resolveWithExactCasing(fileAbsPath, specifier);
        if (!resolved) continue;

        const availableExports = extractModuleExports(resolved.resolvedPath);

        if (defaultImport && !availableExports.has('default')) {
          errors.push(`Missing default export from ${path.relative(rootDir, resolved.resolvedPath)} (imported in ${path.relative(rootDir, fileAbsPath)})`);
        }

        if (namedImports) {
          const names = namedImports.split(',').map((s) => s.trim().split(/\s+as\s+/)[0].trim().replace(/^type\s+/, '')).filter(Boolean);
          for (const name of names) {
            if (!availableExports.has(name)) {
              errors.push(`Missing named export '${name}' from ${path.relative(rootDir, resolved.resolvedPath)} (imported in ${path.relative(rootDir, fileAbsPath)})`);
            }
          }
        }

        check(resolved.resolvedPath);
      }
    }

    check(startFile);
    return errors;
  }

  describe('1. Transitive Module Graph & Export Validation', () => {
    it('should verify all 10 lazy components exist and export their declared identifiers', () => {
      for (const entry of LAZY_MODULE_ENTRIES) {
        const fullPath = path.resolve(rootDir, entry.file);
        expect(fs.existsSync(fullPath), `Module file does not exist: ${entry.file}`).toBe(true);

        const content = fs.readFileSync(fullPath, 'utf-8');
        const hasExport =
          content.includes(`export const ${entry.exportName}`) ||
          content.includes(`export function ${entry.exportName}`) ||
          content.includes(`export class ${entry.exportName}`) ||
          content.includes(`export { ${entry.exportName}`);

        expect(hasExport, `Module ${entry.file} must export ${entry.exportName}`).toBe(true);
      }
    });

    it('should verify all core child modules exist on disk', () => {
      for (const child of CORE_CHILD_MODULES) {
        const fullPath = path.resolve(rootDir, child);
        expect(fs.existsSync(fullPath), `Core child module missing: ${child}`).toBe(true);
      }
    });

    it('should recursively traverse the import graph of all 10 lazy views without missing paths or casing errors', () => {
      let totalModulesScanned = 0;

      for (const entry of LAZY_MODULE_ENTRIES) {
        const result = traverseModuleGraph(entry.file);
        totalModulesScanned += result.visitedFiles.size;

        expect(
          result.missingImports,
          `Found missing import specifiers in graph of ${entry.name}: ${result.missingImports.join(', ')}`
        ).toEqual([]);

        expect(
          result.casingMismatches,
          `Found casing mismatches in graph of ${entry.name}: ${result.casingMismatches.join(', ')}`
        ).toEqual([]);
      }

      expect(totalModulesScanned).toBeGreaterThan(30);
    });

    it('should recursively verify that all imported named and default symbols exist in referenced modules', () => {
      for (const entry of LAZY_MODULE_ENTRIES) {
        const fullPath = path.resolve(rootDir, entry.file);
        const exportErrors = verifyTransitiveExports(fullPath);
        expect(
          exportErrors,
          `Found unresolved named/default import bindings in ${entry.name} graph:\n${exportErrors.join('\n')}`
        ).toEqual([]);
      }
    });
  });

  describe('2. Real Vite Server Transform Verification', () => {
    let viteServer: ViteDevServer;

    beforeAll(async () => {
      viteServer = await createServer({
        root: rootDir,
        server: { middlewareMode: true, hmr: false, ws: false, watch: null },
        appType: 'spa',
      });
    }, 30000);

    afterAll(async () => {
      if (viteServer) {
        await Promise.race([
          viteServer.close(),
          new Promise((resolve) => setTimeout(resolve, 2000)),
        ]);
      }
    }, 5000);

    it('should successfully transform all 10 lazy route components without Vite compilation errors', async () => {
      for (const entry of LAZY_MODULE_ENTRIES) {
        const url = `/${entry.file.replace(/\\/g, '/')}`;
        const transformed = await viteServer.transformRequest(url);

        expect(transformed, `Vite failed to transform ${url}`).not.toBeNull();
        expect(transformed?.code, `Transformed code empty for ${url}`).toBeDefined();
        expect(transformed!.code.length).toBeGreaterThan(100);
      }
    });

    it('should successfully transform all heavy child components (Coursebook, HSKMockExam, OnlineExamRunner)', async () => {
      for (const child of CORE_CHILD_MODULES) {
        const url = `/${child.replace(/\\/g, '/')}`;
        const transformed = await viteServer.transformRequest(url);

        expect(transformed, `Vite failed to transform core child ${url}`).not.toBeNull();
        expect(transformed?.code, `Transformed code empty for core child ${url}`).toBeDefined();
        expect(transformed!.code.length).toBeGreaterThan(50);
      }
    });

    it('should successfully transform root entry points (App.tsx and main.tsx)', async () => {
      for (const entry of ['/src/App.tsx', '/src/main.tsx']) {
        const transformed = await viteServer.transformRequest(entry);
        expect(transformed, `Vite failed to transform root ${entry}`).not.toBeNull();
        expect(transformed!.code.length).toBeGreaterThan(100);
      }
    });

    it('should serve CoursebookView and QuizzesView over HTTP with status 200 and valid JS MIME without chunked compression stalls', async () => {
      const express = (await import('express')).default;
      const compression = (await import('compression')).default;
      const http = (await import('http')).default;

      const app = express();
      app.use(
        compression({
          filter: (req: any, res: any) => {
            if (process.env.NODE_ENV !== 'production') {
              const url = req.originalUrl || req.url || '';
              const pathname = req.path || url.split('?')[0];
              if (!pathname.startsWith('/api/')) {
                return false;
              }
            }
            return compression.filter(req, res);
          },
        })
      );
      app.use(viteServer.middlewares);

      const server = http.createServer(app);
      await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
      const address = server.address() as any;
      const baseUrl = `http://127.0.0.1:${address.port}`;

      try {
        const testUrls = [
          '/src/components/Coursebook/CoursebookView.tsx',
          '/src/components/Quizzes/QuizzesView.tsx',
          '/src/components/HSKMockExam.tsx',
          '/src/components/AITutor/AITutorView.tsx',
        ];

        for (const testUrl of testUrls) {
          const res = await fetch(`${baseUrl}${testUrl}`);
          expect(res.status, `HTTP GET ${testUrl} must return 200`).toBe(200);

          const contentType = res.headers.get('content-type') || '';
          expect(
            contentType.includes('javascript'),
            `Content-Type for ${testUrl} must be javascript, got ${contentType}`
          ).toBe(true);

          // Crucial: ensure no Content-Encoding: gzip/br is applied to dev ES modules
          const contentEncoding = res.headers.get('content-encoding');
          expect(
            contentEncoding,
            `Dev ES module ${testUrl} must not be compressed to prevent chunked transfer dropouts`
          ).toBeNull();

          const body = await res.text();
          expect(body.length).toBeGreaterThan(100);
          expect(body.includes('import'), `Response body of ${testUrl} must contain valid module imports`).toBe(true);
        }
      } finally {
        await new Promise<void>((resolve) => server.close(() => resolve()));
      }
    });
  });

  describe('3. Dynamic Import Resilience (lazyWithRetry & ErrorBoundary)', () => {
    it('retryPromise should resolve immediately on first try when successful', async () => {
      let callCount = 0;
      const factory = async () => {
        callCount++;
        return { value: 'success_first_try' };
      };

      const result = await retryPromise(factory, 3, 50);
      expect(result).toEqual({ value: 'success_first_try' });
      expect(callCount).toBe(1);
    });

    it('retryPromise should retry on transient failure and resolve when subsequent attempt succeeds', async () => {
      let callCount = 0;
      const factory = async () => {
        callCount++;
        if (callCount < 2) {
          throw new Error('Failed to fetch dynamically imported module: http://localhost:3000/src/test');
        }
        return { value: 'recovered_on_retry' };
      };

      const startTime = Date.now();
      const result = await retryPromise(factory, 3, 40);
      const duration = Date.now() - startTime;

      expect(result).toEqual({ value: 'recovered_on_retry' });
      expect(callCount).toBe(2);
      expect(duration).toBeGreaterThanOrEqual(35); // Confirms backoff occurred
    });

    it('retryPromise should catch synchronous exceptions in factory and retry instead of crashing', async () => {
      let callCount = 0;
      const factory = () => {
        callCount++;
        if (callCount < 2) {
          throw new Error('Sync module initialization error');
        }
        return Promise.resolve({ value: 'recovered_from_sync_error' });
      };

      const result = await retryPromise(factory, 3, 20);
      expect(result).toEqual({ value: 'recovered_from_sync_error' });
      expect(callCount).toBe(2);
    });

    it('retryPromise should stop and reject after max retries are exhausted without looping indefinitely', async () => {
      let callCount = 0;
      const factory = async () => {
        callCount++;
        throw new Error('Persistent network drop');
      };

      await expect(retryPromise(factory, 3, 20)).rejects.toThrow('Persistent network drop');
      expect(callCount).toBe(3);
    });

    it('lazyWithRetry should auto-reset internal payload after rejection to allow subsequent mount / ErrorBoundary retry recovery', async () => {
      let callCount = 0;
      const factory = async () => {
        callCount++;
        if (callCount <= 2) {
          throw new Error(`Temporary offline error ${callCount}`);
        }
        return { default: () => 'Successfully loaded component' };
      };

      // 2 retries, short 5ms delay
      const lazyComp = lazyWithRetry(factory, 2, 5);

      // Trigger initial load via React.lazy initializer
      try {
        (lazyComp as any)._init((lazyComp as any)._payload);
      } catch {}

      // Wait for the 2 retries to complete and fail
      await new Promise((resolve) => setTimeout(resolve, 60));

      expect(callCount).toBe(2);
      // Verify payload status was self-reset to -1 (ready for fresh load on remount)
      expect((lazyComp as any)._payload._status).toBe(-1);

      // Simulate ErrorBoundary "Thử lại ngay" remounting the component
      try {
        (lazyComp as any)._init((lazyComp as any)._payload);
      } catch {}

      // Wait for recovery
      await new Promise((resolve) => setTimeout(resolve, 60));

      expect(callCount).toBe(3);
      expect((lazyComp as any)._payload._status).toBe(1); // Fulfilled!
      const resolvedModule = (lazyComp as any)._payload._result;
      expect(typeof resolvedModule.default).toBe('function');
      expect(resolvedModule.default()).toBe('Successfully loaded component');
    });

    it('lazyWithRetry should continue to reset internal payload across multiple consecutive failures so repeated ErrorBoundary retries succeed', async () => {
      let callCount = 0;
      const factory = async () => {
        callCount++;
        // Fail on round 1 (calls 1, 2) and round 2 (calls 3, 4); succeed on round 3 (call 5)
        if (callCount <= 4) {
          throw new Error(`Consecutive network drop ${callCount}`);
        }
        return { default: () => 'Multi-retry recovered component' };
      };

      // 2 retries per round, short 5ms delay
      const lazyComp = lazyWithRetry(factory, 2, 5);

      // Round 1: Trigger initial load -> should fail after 2 retries
      try {
        (lazyComp as any)._init((lazyComp as any)._payload);
      } catch {}
      await new Promise((resolve) => setTimeout(resolve, 60));
      expect(callCount).toBe(2);
      expect((lazyComp as any)._payload._status).toBe(-1);

      // Round 2: User clicks "Thử lại ngay" (1st time) -> fails again after 2 more retries (calls 3, 4)
      try {
        (lazyComp as any)._init((lazyComp as any)._payload);
      } catch {}
      await new Promise((resolve) => setTimeout(resolve, 60));
      expect(callCount).toBe(4);
      // Crucial: payload MUST still be self-reset to -1, not latched at status 2!
      expect((lazyComp as any)._payload._status).toBe(-1);

      // Round 3: User clicks "Thử lại ngay" (2nd time) -> call 5 succeeds!
      try {
        (lazyComp as any)._init((lazyComp as any)._payload);
      } catch {}
      await new Promise((resolve) => setTimeout(resolve, 60));
      expect(callCount).toBe(5);
      expect((lazyComp as any)._payload._status).toBe(1); // Fulfilled!
      const resolved = (lazyComp as any)._payload._result;
      expect(resolved.default()).toBe('Multi-retry recovered component');
    });

    it('retryPromise edge cases: should respect retries = 1 and retries = 0', async () => {
      let callsRetries1 = 0;
      await expect(
        retryPromise(
          async () => {
            callsRetries1++;
            throw new Error('Immediate error');
          },
          1,
          5
        )
      ).rejects.toThrow('Immediate error');
      expect(callsRetries1).toBe(1);

      let callsRetries0 = 0;
      await expect(
        retryPromise(
          async () => {
            callsRetries0++;
            throw new Error('Zero retry error');
          },
          0,
          5
        )
      ).rejects.toThrow('Zero retry error');
      expect(callsRetries0).toBe(1);
    });

    it('ErrorBoundary getDerivedStateFromError should transition state to hasError: true without wiping resetCount', () => {
      const sampleError = new Error('Test dynamic import failure');
      const derived = ErrorBoundary.getDerivedStateFromError(sampleError);

      expect(derived.hasError).toBe(true);
      expect(derived.error).toBe(sampleError);
      // Ensure resetCount is not explicitly set back to 0 so existing resetCount is preserved
      expect((derived as any).resetCount).toBeUndefined();
    });

    it('ErrorBoundary handleReset should monotonically increment resetCount across multiple consecutive errors and resets', () => {
      let resetCallbacks = 0;
      const boundaryInstance = new ErrorBoundary({
        children: null,
        onReset: () => {
          resetCallbacks++;
        },
      });

      // Cycle 1: First error
      boundaryInstance.state = {
        hasError: true,
        error: new Error('Error 1'),
        resetCount: 0,
      };
      boundaryInstance.handleReset();
      expect(boundaryInstance.state.hasError).toBe(false);
      expect(boundaryInstance.state.resetCount).toBe(1);

      // Cycle 2: Second error occurs; getDerivedStateFromError is called
      const partial2 = ErrorBoundary.getDerivedStateFromError(new Error('Error 2'));
      boundaryInstance.state = {
        ...boundaryInstance.state,
        ...partial2,
      };
      expect(boundaryInstance.state.hasError).toBe(true);
      expect(boundaryInstance.state.resetCount).toBe(1); // Preserved!
      boundaryInstance.handleReset();
      expect(boundaryInstance.state.hasError).toBe(false);
      expect(boundaryInstance.state.resetCount).toBe(2); // Incremented to 2!

      // Cycle 3: Third error occurs
      const partial3 = ErrorBoundary.getDerivedStateFromError(new Error('Error 3'));
      boundaryInstance.state = {
        ...boundaryInstance.state,
        ...partial3,
      };
      expect(boundaryInstance.state.resetCount).toBe(2);
      boundaryInstance.handleReset();
      expect(boundaryInstance.state.resetCount).toBe(3); // Incremented to 3!
      expect(resetCallbacks).toBe(3);
    });

    it('ErrorBoundary getDerivedStateFromError should normalize non-Error string or custom objects into Error instances', () => {
      // String error
      const stringResult = ErrorBoundary.getDerivedStateFromError('Failed to fetch dynamically imported module: http://localhost:3000/src/test');
      expect(stringResult.hasError).toBe(true);
      expect(stringResult.error).toBeInstanceOf(Error);
      expect(stringResult.error?.message).toContain('Failed to fetch dynamically imported module');

      // Object error with message
      const objResult = ErrorBoundary.getDerivedStateFromError({ message: '504 Outdated Optimize Dep' });
      expect(objResult.hasError).toBe(true);
      expect(objResult.error).toBeInstanceOf(Error);
      expect(objResult.error?.message).toBe('504 Outdated Optimize Dep');

      // Null / undefined error
      const nullResult = ErrorBoundary.getDerivedStateFromError(null);
      expect(nullResult.hasError).toBe(true);
      expect(nullResult.error).toBeInstanceOf(Error);
      expect(nullResult.error?.message).toBe('Lỗi không xác định');
    });

    it('ErrorBoundary componentDidCatch should capture errorInfo with componentStack', () => {
      const boundaryInstance = new ErrorBoundary({ children: null });
      const testError = new Error('Render crash');
      const testErrorInfo = { componentStack: '\n    in CoursebookView\n    in Suspense\n    in App' };

      boundaryInstance.componentDidCatch(testError, testErrorInfo);
      expect(boundaryInstance.state.errorInfo).toEqual(testErrorInfo);
    });

    it('ErrorBoundary handleReload should await Cache Storage deletion via Promise.all before window reload', async () => {
      const boundaryInstance = new ErrorBoundary({ children: null });
      const deletedCaches: string[] = [];
      let reloadCalled = false;

      const originalWindow = global.window;
      const mockStorage: Record<string, string> = {
        minnese_token: '123',
        minnie_prefs: 'dark',
        other_app_data: 'keep',
      };

      (global as any).window = {
        caches: {
          keys: async () => ['cache-v1', 'cache-v2'],
          delete: async (name: string) => {
            deletedCaches.push(name);
            return true;
          },
        },
        location: {
          reload: () => {
            reloadCalled = true;
          },
        },
      };

      (global as any).localStorage = {
        ...mockStorage,
        removeItem: (k: string) => {
          delete mockStorage[k];
        },
      };

      await boundaryInstance.handleReload();

      expect(deletedCaches).toEqual(['cache-v1', 'cache-v2']);
      expect(reloadCalled).toBe(true);
      expect(mockStorage.minnese_token).toBeUndefined();
      expect(mockStorage.minnie_prefs).toBeUndefined();
      expect(mockStorage.other_app_data).toBe('keep');

      (global as any).window = originalWindow;
    });

    it('retryPromise should safely handle non-standard retries parameters (retries = -1, float, NaN, baseInterval = 0)', async () => {
      let callCountNeg = 0;
      await expect(
        retryPromise(
          async () => {
            callCountNeg++;
            throw new Error('Negative retries error');
          },
          -5,
          0
        )
      ).rejects.toThrow('Negative retries error');
      expect(callCountNeg).toBe(1);

      let callCountFloat = 0;
      const floatResult = await retryPromise(
        async () => {
          callCountFloat++;
          if (callCountFloat < 2) throw new Error('Float retry temp error');
          return 'float_success';
        },
        2.7,
        5
      );
      expect(floatResult).toBe('float_success');
      expect(callCountFloat).toBe(2);
    });
  });

  describe('4. Database Hash Integrity', () => {
    it('must preserve data/hsk_exam.db SHA-256 hash exactly', () => {
      const dbPath = path.resolve(rootDir, 'data/hsk_exam.db');
      expect(fs.existsSync(dbPath), 'data/hsk_exam.db must exist').toBe(true);

      const buffer = fs.readFileSync(dbPath);
      const hash = crypto.createHash('sha256').update(buffer).digest('hex').toUpperCase();

      expect(hash).toBe('DC299C49A28E11EDB833881952956FF8735EBB8F98844F9F05BE0366E4E357F1');
    });
  });
});
