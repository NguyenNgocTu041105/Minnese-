import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        'react/jsx-dev-runtime',
        'lucide-react',
        'recharts',
        'pinyin-pro',
        'firebase/app',
        'firebase/auth',
        'firebase/firestore',
        'canvas-confetti',
        'motion',
        'motion/react',
        'react-markdown',
        'remark-gfm',
        'hanzi-writer',
        'papaparse',
        'xlsx',
        'pdfjs-dist',
      ],
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      sourcemap: false,
      chunkSizeWarningLimit: 2000,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules/recharts')) {
              return 'recharts';
            }
            if (id.includes('node_modules/firebase')) {
              return 'firebase';
            }
            if (id.includes('node_modules/pdfjs-dist')) {
              return 'pdfjs';
            }
            if (id.includes('node_modules/xlsx') || id.includes('node_modules/papaparse')) {
              return 'xlsx';
            }
            if (id.includes('node_modules/lucide-react')) {
              return 'lucide';
            }
            if (id.includes('data/newHsk1') || id.includes('data/hsk1WorkbookData')) {
              return 'hsk1-data';
            }
            if (id.includes('data/newHsk2') || id.includes('data/hsk2WorkbookData')) {
              return 'hsk2-data';
            }
            if (id.includes('data/newHsk3') || id.includes('data/hsk3WorkbookData')) {
              return 'hsk3-data';
            }
            if (id.includes('data/newHsk') || id.includes('WorkbookData')) {
              return 'hsk-advanced-data';
            }
            if (id.includes('node_modules/hanzi-writer')) {
              return 'hanzi-writer';
            }
            if (id.includes('node_modules/pinyin-pro')) {
              return 'pinyin-pro';
            }
          },
        },
      },
    },
    server: {
      warmup: {
        clientFiles: [
          './src/main.tsx',
          './src/App.tsx',
          './src/components/Navbar.tsx',
          './src/components/Dashboard/DashboardView.tsx',
          './src/components/Coursebook/CoursebookView.tsx',
          './src/components/Coursebook/WorkbookView.tsx',
          './src/components/Coursebook/LessonExercisesStudio.tsx',
          './src/components/Quizzes/QuizzesView.tsx',
          './src/components/Quizzes/OnlineExamRunner.tsx',
          './src/components/HSKMockExam.tsx',
          './src/components/AITutor/AITutorView.tsx',
          './src/components/Flashcards/FlashcardsView.tsx',
          './src/components/Dictionary/DictionaryView.tsx',
          './src/components/Admin/AdminDashboard.tsx',
          './src/components/QBankAdmin.tsx',
          './src/components/Dashboard/JoinClassModal.tsx',
          './src/components/Auth/AuthModal.tsx',
          './src/components/LiveVoiceCall/LiveVoiceCallModal.tsx',
          './src/data/newHsk1BookData.ts',
          './src/data/newHsk2BookData.ts',
          './src/data/newHsk3BookData.ts',
          './src/data/newHsk4BookData.ts',
          './src/data/newHsk5BookData.ts',
          './src/data/newHsk6BookData.ts',
          './src/data/hskMockExamFixtures.ts',
          './src/components/Dictionary/WordDetailModal.tsx',
          './src/components/HSKIllustrationCanvas.tsx',
        ],
      },
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {
        ignored: [
          '**/artifacts/**',
          '**/scratch/**',
          '**/*.log',
          '**/public/audio/**',
          '**/tests/**',
          '**/*.md',
          '**/data/qbank.db*',
        ],
      },
    },
  };
});
