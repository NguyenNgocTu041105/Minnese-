import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Logo Mẫu 1 (Mascot Minnie & Corgi + Wordmark + Assets) Verification', () => {
  const rootDir = path.resolve(__dirname, '..');
  const publicDir = path.join(rootDir, 'public');
  const indexHtmlPath = path.join(rootDir, 'index.html');
  const logoComponentPath = path.join(rootDir, 'src', 'components', 'MinnieLogo.tsx');

  describe('R2. Static Web Assets & Favicon Files', () => {
    it('public/minnie-mascot.png exists and is a valid non-empty PNG', () => {
      const mascotPath = path.join(publicDir, 'minnie-mascot.png');
      expect(fs.existsSync(mascotPath)).toBe(true);
      const stat = fs.statSync(mascotPath);
      expect(stat.size).toBeGreaterThan(50000); // High-res image > 50KB

      // Check PNG magic bytes: \x89PNG\r\n\x1a\n
      const buffer = fs.readFileSync(mascotPath);
      expect(buffer[0]).toBe(0x89);
      expect(buffer[1]).toBe(0x50); // 'P'
      expect(buffer[2]).toBe(0x4E); // 'N'
      expect(buffer[3]).toBe(0x47); // 'G'
    });

    it('public/favicon.png exists and is a valid non-empty PNG', () => {
      const favPngPath = path.join(publicDir, 'favicon.png');
      expect(fs.existsSync(favPngPath)).toBe(true);
      const stat = fs.statSync(favPngPath);
      expect(stat.size).toBeGreaterThan(1000);

      const buffer = fs.readFileSync(favPngPath);
      expect(buffer[0]).toBe(0x89);
      expect(buffer[1]).toBe(0x50);
      expect(buffer[2]).toBe(0x4E);
      expect(buffer[3]).toBe(0x47);
    });

    it('public/favicon.svg exists and contains valid SVG tags with lavender styling', () => {
      const favSvgPath = path.join(publicDir, 'favicon.svg');
      expect(fs.existsSync(favSvgPath)).toBe(true);
      const content = fs.readFileSync(favSvgPath, 'utf-8');
      expect(content).toContain('<svg');
      expect(content).toContain('</svg>');
      expect(content).toContain('viewBox');
      expect(content).toContain('#D8B4FE');
    });

    it('index.html contains link tags referencing the mascot favicon', () => {
      expect(fs.existsSync(indexHtmlPath)).toBe(true);
      const html = fs.readFileSync(indexHtmlPath, 'utf-8');
      expect(html).toMatch(/<link\s+rel=["']icon["']\s+type=["']image\/png["']\s+href=["']\/favicon\.png(?:\?v=\d+)?["']/);
      expect(html).toMatch(/href=["']\/favicon\.png(?:\?v=\d+)?["']/);
    });
  });

  describe('R1. Responsive MinnieLogo Component Specifications', () => {
    it('MinnieLogo.tsx exists and exports MinnieLogo and MinnieLogoProps', () => {
      expect(fs.existsSync(logoComponentPath)).toBe(true);
      const src = fs.readFileSync(logoComponentPath, 'utf-8');
      expect(src).toContain('export const MinnieLogo');
      expect(src).toContain('export interface MinnieLogoProps');
    });

    it('displays the circular mascot with lavender border #D8B4FE', () => {
      const src = fs.readFileSync(logoComponentPath, 'utf-8');
      expect(src).toContain('#D8B4FE');
      expect(src).toContain('rounded-full');
      expect(src).toContain('/minnie-mascot.png');
    });

    it('includes MINNIE in lavender and CHINESE in high-contrast/white', () => {
      const src = fs.readFileSync(logoComponentPath, 'utf-8');
      expect(src).toContain('MINNIE');
      expect(src).toContain('CHINESE');
      expect(src).toContain('text-[#7C3AED]');
      expect(src).toContain('dark:text-[#D8B4FE]');
      expect(src).toContain('dark:text-[#FFFFFF]');
    });

    it('includes the subtitle Khảo Thí Tiếng Trung 3.0 in teal/emerald styling', () => {
      const src = fs.readFileSync(logoComponentPath, 'utf-8');
      expect(src).toContain('Khảo Thí Tiếng Trung 3.0');
      expect(src).toMatch(/text-teal-[0-9]+|text-emerald-[0-9]+/);
    });

    it('supports horizontal, badge, and avatar variants cleanly', () => {
      const src = fs.readFileSync(logoComponentPath, 'utf-8');
      expect(src).toContain("variant === 'avatar'");
      expect(src).toContain("variant === 'badge'");
      expect(src).toContain('showText');
    });

    it('includes responsive classes for mobile protection and layout stability', () => {
      const src = fs.readFileSync(logoComponentPath, 'utf-8');
      expect(src).toContain('whitespace-nowrap');
      expect(src).toContain('min-w-0');
      expect(src).toContain('sm:');
    });
  });
});
