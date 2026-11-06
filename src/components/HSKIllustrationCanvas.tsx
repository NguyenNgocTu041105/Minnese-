import React, { useState } from 'react';
import { Maximize2, ZoomIn, Image as ImageIcon } from 'lucide-react';

export interface HSKIllustrationProps {
  /** Scene identifier (e.g. 'taxi', 'apple', 'rain') or raw illustration string */
  scene?: string;
  /** Direct image URL, public path (/images/...), or base64 data URI */
  imageUrl?: string;
  /** Alt text for accessibility */
  alt?: string;
  /** Aspect ratio container style: 'video' (16:9) | '4/3' | 'square' (1:1) | 'banner' (21:9) */
  aspectRatio?: 'video' | '4/3' | 'square' | 'banner';
  /** Height class override */
  heightClass?: string;
  /** Whether to show a zoom icon button overlay */
  showZoomButton?: boolean;
  /** Zoom click handler */
  onZoom?: () => void;
  /** Badge text in top-left corner (e.g. 'Hình minh họa' or 'Phương án B') */
  badgeLabel?: string;
  /** Optional caption displayed underneath */
  caption?: string;
  /** Extra container classes */
  className?: string;
  /** Option card mode: displays compact layout for option buttons */
  isOptionCard?: boolean;
}

export type SceneKey =
  | 'taxi'
  | 'apple'
  | 'reading'
  | 'rain'
  | 'writing'
  | 'airplane'
  | 'train'
  | 'banana'
  | 'watermelon'
  | 'sleeping'
  | 'water'
  | 'sunny'
  | 'wind'
  | 'singing'
  | 'dance'
  | 'coffee'
  | 'tea'
  | 'movie'
  | 'phone'
  | 'cat'
  | 'hospital'
  | 'rice'
  | 'bookshelf'
  | 'running'
  | 'swimming'
  | 'soccer'
  | 'handshake';

/**
 * Normalizes text to extract semantic scene key
 */
export function resolveSceneKey(input?: string): SceneKey | null {
  if (!input) return null;
  const raw = input.toLowerCase();

  // 1. Direct emoji mapping
  if (raw.includes('🚕') || raw.includes('🚖') || raw.includes('taxi')) return 'taxi';
  if (raw.includes('🍎') || raw.includes('🍏') || raw.includes('apple') || raw.includes('苹果') || raw.includes('píngguǒ') || raw.includes('táo')) return 'apple';
  if (raw.includes('📖') || raw.includes('📕') || raw.includes('reading') || raw.includes('看书') || raw.includes('kànshū') || raw.includes('đọc sách')) return 'reading';
  if (raw.includes('🚆') || raw.includes('🚂') || raw.includes('train') || raw.includes('火车') || raw.includes('huǒchē') || raw.includes('tàu hỏa')) return 'train';
  if (raw.includes('🌧️') || raw.includes('⛈️') || raw.includes('rain') || raw.includes('下雨') || raw.includes('xiàyǔ') || raw.includes('mưa')) return 'rain';
  if (raw.includes('✍️') || raw.includes('writing') || raw.includes('写字') || raw.includes('xiězì') || raw.includes('viết chữ')) return 'writing';
  if (raw.includes('✈️') || raw.includes('airplane') || raw.includes('plane') || raw.includes('飞机') || raw.includes('fēijī') || raw.includes('máy bay')) return 'airplane';
  if (raw.includes('🍌') || raw.includes('banana') || raw.includes('香蕉') || raw.includes('xiāngjiāo') || raw.includes('chuối')) return 'banana';
  if (raw.includes('🍉') || raw.includes('watermelon') || raw.includes('西瓜') || raw.includes('xīguā') || raw.includes('dưa hấu')) return 'watermelon';
  if (raw.includes('🛏️') || raw.includes('sleeping') || raw.includes('sleep') || raw.includes('睡觉') || raw.includes('shuìjiào') || raw.includes('ngủ')) return 'sleeping';
  if (raw.includes('🥤') || raw.includes('water') || raw.includes('drink') || raw.includes('喝水') || raw.includes('hēshuǐ') || raw.includes('uống nước')) return 'water';
  if (raw.includes('☀️') || raw.includes('sunny') || raw.includes('sun') || raw.includes('晴天') || raw.includes('qíngtiān') || raw.includes('nắng')) return 'sunny';
  if (raw.includes('💨') || raw.includes('wind') || raw.includes('刮风') || raw.includes('guāfēng') || raw.includes('gió')) return 'wind';
  if (raw.includes('🎤') || raw.includes('singing') || raw.includes('sing') || raw.includes('唱歌') || raw.includes('chànggē') || raw.includes('hát')) return 'singing';
  if (raw.includes('💃') || raw.includes('dance') || raw.includes('跳舞') || raw.includes('tiàowǔ') || raw.includes('khiêu vũ') || raw.includes('nhảy múa')) return 'dance';
  if (raw.includes('☕') || raw.includes('coffee') || raw.includes('咖啡') || raw.includes('kāfēi') || raw.includes('cà phê')) return 'coffee';
  if (raw.includes('🍵') || raw.includes('tea') || raw.includes('茶') || raw.includes('chá') || raw.includes('uống trà') || raw.includes('chè')) return 'tea';
  if (raw.includes('🎬') || raw.includes('movie') || raw.includes('film') || raw.includes('看电影') || raw.includes('diànyǐng') || raw.includes('xem phim')) return 'movie';
  if (raw.includes('📱') || raw.includes('phone') || raw.includes('call') || raw.includes('打电话') || raw.includes('diànhuà') || raw.includes('điện thoại')) return 'phone';
  if (raw.includes('🐱') || raw.includes('cat') || raw.includes('小猫') || raw.includes('xiǎomāo') || raw.includes('mèo')) return 'cat';
  if (raw.includes('🏥') || raw.includes('hospital') || raw.includes('医院') || raw.includes('yīyuàn') || raw.includes('bệnh viện')) return 'hospital';
  if (raw.includes('🍚') || raw.includes('rice') || raw.includes('米饭') || raw.includes('mǐfàn') || raw.includes('cơm')) return 'rice';
  if (raw.includes('📚') || raw.includes('bookshelf') || raw.includes('books') || raw.includes('书架') || raw.includes('shūjià') || raw.includes('giá sách')) return 'bookshelf';
  if (raw.includes('🏃') || raw.includes('running') || raw.includes('run') || raw.includes('跑步') || raw.includes('pǎobù') || raw.includes('chạy bộ')) return 'running';
  if (raw.includes('🏊') || raw.includes('swimming') || raw.includes('swim') || raw.includes('游泳') || raw.includes('yóuyǒng') || raw.includes('bơi lội') || raw.includes('bơi')) return 'swimming';
  if (raw.includes('⚽') || raw.includes('soccer') || raw.includes('football') || raw.includes('足球') || raw.includes('zúqiú') || raw.includes('đá bóng') || raw.includes('bóng đá')) return 'soccer';
  if (raw.includes('🤝') || raw.includes('handshake') || raw.includes('握手') || raw.includes('wòshǒu') || raw.includes('bắt tay')) return 'handshake';

  // 2. Keyword fallback checks
  if (raw.includes('chūzūchē') || raw.includes('chuzuche') || raw.includes('出租车')) return 'taxi';
  return null;
}

/**
 * 27 High-Fidelity SVG Scenes
 */
function renderSvgScene(sceneKey: SceneKey) {
  switch (sceneKey) {
    case 'taxi':
      return (
        <svg viewBox="0 0 400 300" className="w-full h-full select-none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="skyTaxi" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38BDF8" />
              <stop offset="60%" stopColor="#BAE6FD" />
              <stop offset="100%" stopColor="#F0F9FF" />
            </linearGradient>
            <linearGradient id="taxiBody" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FDE047" />
              <stop offset="60%" stopColor="#EAB308" />
              <stop offset="100%" stopColor="#CA8A04" />
            </linearGradient>
            <linearGradient id="roadGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#475569" />
              <stop offset="100%" stopColor="#1E293B" />
            </linearGradient>
            <filter id="shadowTaxi" x="-10%" y="-10%" width="120%" height="130%">
              <feDropShadow dx="0" dy="6" stdDeviation="4" floodColor="#0F172A" floodOpacity="0.4" />
            </filter>
          </defs>
          {/* Sky */}
          <rect width="400" height="200" fill="url(#skyTaxi)" />
          {/* Distant City Skyline */}
          <path d="M0 200 L0 150 L30 150 L30 130 L70 130 L70 160 L120 160 L120 120 L160 120 L160 165 L210 165 L210 140 L260 140 L260 170 L310 170 L310 135 L350 135 L350 160 L400 160 L400 200 Z" fill="#94A3B8" opacity="0.35" />
          {/* Road */}
          <rect y="195" width="400" height="105" fill="url(#roadGrad)" />
          {/* Dashed Road Markings */}
          <line x1="20" y1="250" x2="80" y2="250" stroke="#FDE047" strokeWidth="6" strokeDasharray="10 0" strokeLinecap="round" />
          <line x1="120" y1="250" x2="180" y2="250" stroke="#FDE047" strokeWidth="6" strokeDasharray="10 0" strokeLinecap="round" />
          <line x1="220" y1="250" x2="280" y2="250" stroke="#FDE047" strokeWidth="6" strokeDasharray="10 0" strokeLinecap="round" />
          <line x1="320" y1="250" x2="380" y2="250" stroke="#FDE047" strokeWidth="6" strokeDasharray="10 0" strokeLinecap="round" />
          {/* Taxi Car Shadow */}
          <ellipse cx="200" cy="245" rx="140" ry="12" fill="#0F172A" opacity="0.5" />
          {/* Taxi Car Group */}
          <g filter="url(#shadowTaxi)">
            {/* Cabin Top */}
            <path d="M110 165 L145 115 L245 115 L285 165 Z" fill="url(#taxiBody)" />
            {/* Windows */}
            <path d="M120 162 L150 122 L195 122 L195 162 Z" fill="#0284C7" opacity="0.85" />
            <path d="M202 162 L202 122 L240 122 L272 162 Z" fill="#0284C7" opacity="0.85" />
            {/* TAXI Roof Sign */}
            <rect x="175" y="98" width="50" height="18" rx="4" fill="#FFFFFF" stroke="#EAB308" strokeWidth="2" />
            <text x="200" y="111" textAnchor="middle" fontSize="10" fontWeight="900" fill="#E11D48" fontFamily="Arial, sans-serif">TAXI</text>
            {/* Main Car Body */}
            <rect x="65" y="160" width="270" height="52" rx="14" fill="url(#taxiBody)" />
            {/* Black & White Checkered Door Stripe */}
            <g transform="translate(100, 185)">
              <rect x="0" y="0" width="12" height="6" fill="#000" /><rect x="12" y="0" width="12" height="6" fill="#FFF" />
              <rect x="24" y="0" width="12" height="6" fill="#000" /><rect x="36" y="0" width="12" height="6" fill="#FFF" />
              <rect x="48" y="0" width="12" height="6" fill="#000" /><rect x="60" y="0" width="12" height="6" fill="#FFF" />
              <rect x="72" y="0" width="12" height="6" fill="#000" /><rect x="84" y="0" width="12" height="6" fill="#FFF" />
              <rect x="96" y="0" width="12" height="6" fill="#000" /><rect x="108" y="0" width="12" height="6" fill="#FFF" />
              <rect x="120" y="0" width="12" height="6" fill="#000" /><rect x="132" y="0" width="12" height="6" fill="#FFF" />
              <rect x="144" y="0" width="12" height="6" fill="#000" /><rect x="156" y="0" width="12" height="6" fill="#FFF" />
              <rect x="168" y="0" width="12" height="6" fill="#000" /><rect x="180" y="0" width="12" height="6" fill="#FFF" />
              {/* Row 2 */}
              <rect x="0" y="6" width="12" height="6" fill="#FFF" /><rect x="12" y="6" width="12" height="6" fill="#000" />
              <rect x="24" y="6" width="12" height="6" fill="#FFF" /><rect x="36" y="6" width="12" height="6" fill="#000" />
              <rect x="48" y="6" width="12" height="6" fill="#FFF" /><rect x="60" y="6" width="12" height="6" fill="#000" />
              <rect x="72" y="6" width="12" height="6" fill="#FFF" /><rect x="84" y="6" width="12" height="6" fill="#000" />
              <rect x="96" y="6" width="12" height="6" fill="#FFF" /><rect x="108" y="6" width="12" height="6" fill="#000" />
              <rect x="120" y="6" width="12" height="6" fill="#FFF" /><rect x="132" y="6" width="12" height="6" fill="#000" />
              <rect x="144" y="6" width="12" height="6" fill="#FFF" /><rect x="156" y="6" width="12" height="6" fill="#000" />
              <rect x="168" y="6" width="12" height="6" fill="#FFF" /><rect x="180" y="6" width="12" height="6" fill="#000" />
            </g>
            {/* Headlight & Taillight */}
            <path d="M328 170 L335 174 L335 186 L328 186 Z" fill="#FEF08A" />
            <polygon points="335,172 390,165 390,215 335,188" fill="#FEF08A" opacity="0.3" />
            <rect x="65" y="172" width="6" height="15" rx="2" fill="#EF4444" />
            {/* Door Handles */}
            <rect x="165" y="174" width="14" height="4" rx="2" fill="#475569" />
            <rect x="235" y="174" width="14" height="4" rx="2" fill="#475569" />
            {/* Wheels */}
            <g transform="translate(115, 212)">
              <circle cx="0" cy="0" r="26" fill="#1E293B" />
              <circle cx="0" cy="0" r="16" fill="#94A3B8" />
              <circle cx="0" cy="0" r="7" fill="#334155" />
            </g>
            <g transform="translate(285, 212)">
              <circle cx="0" cy="0" r="26" fill="#1E293B" />
              <circle cx="0" cy="0" r="16" fill="#94A3B8" />
              <circle cx="0" cy="0" r="7" fill="#334155" />
            </g>
          </g>
          {/* Label Badge */}
          <g transform="translate(20, 20)">
            <rect width="130" height="28" rx="8" fill="#0F172A" opacity="0.7" />
            <text x="65" y="18" fill="#FFFFFF" fontSize="12" fontWeight="700" textAnchor="middle" fontFamily="sans-serif">出租车 • Taxi</text>
          </g>
        </svg>
      );

    case 'apple':
      return (
        <svg viewBox="0 0 400 300" className="w-full h-full select-none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="bgApple" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FEF3C7" />
              <stop offset="100%" stopColor="#FDE68A" />
            </linearGradient>
            <radialGradient id="appleGrad" cx="35%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#F87171" />
              <stop offset="40%" stopColor="#EF4444" />
              <stop offset="85%" stopColor="#B91C1C" />
              <stop offset="100%" stopColor="#7F1D1D" />
            </radialGradient>
            <linearGradient id="leafGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#4ADE80" />
              <stop offset="100%" stopColor="#15803D" />
            </linearGradient>
          </defs>
          <rect width="400" height="300" fill="url(#bgApple)" />
          {/* Wooden Table Surface */}
          <path d="M0 220 L400 220 L400 300 L0 300 Z" fill="#78350F" opacity="0.25" />
          {/* White Porcelain Plate */}
          <ellipse cx="200" cy="240" rx="140" ry="28" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="3" />
          <ellipse cx="200" cy="239" rx="110" ry="18" fill="#F8FAFC" />
          {/* Cast Shadow */}
          <ellipse cx="200" cy="235" rx="60" ry="15" fill="#475569" opacity="0.4" />
          {/* Apple Stem */}
          <path d="M200 120 C 205 95, 225 80, 230 70" stroke="#5C2B16" strokeWidth="7" strokeLinecap="round" fill="none" />
          {/* Green Leaf */}
          <path d="M205 100 C 240 85, 260 105, 255 125 C 230 130, 215 115, 205 100 Z" fill="url(#leafGrad)" />
          <path d="M208 102 Q 235 110 252 122" stroke="#166534" strokeWidth="2" fill="none" />
          {/* Apple Body with Specular Curves */}
          <path d="M200 125 C 160 90, 110 110, 110 165 C 110 215, 160 245, 195 242 C 198 242, 202 242, 205 242 C 240 245, 290 215, 290 165 C 290 110, 240 90, 200 125 Z" fill="url(#appleGrad)" />
          {/* 3D Specular Highlight */}
          <ellipse cx="155" cy="150" rx="22" ry="38" transform="rotate(-25 155 150)" fill="#FFFFFF" opacity="0.4" />
          <ellipse cx="148" cy="142" rx="8" ry="16" transform="rotate(-25 148 142)" fill="#FFFFFF" opacity="0.7" />
          {/* Title Badge */}
          <g transform="translate(20, 20)">
            <rect width="130" height="28" rx="8" fill="#991B1B" opacity="0.85" />
            <text x="65" y="18" fill="#FFFFFF" fontSize="12" fontWeight="700" textAnchor="middle" fontFamily="sans-serif">苹果 • Quả táo</text>
          </g>
        </svg>
      );

    case 'reading':
      return (
        <svg viewBox="0 0 400 300" className="w-full h-full select-none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="studyRoom" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1E1B4B" />
              <stop offset="100%" stopColor="#312E81" />
            </linearGradient>
            <linearGradient id="deskLampCone" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FEF08A" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#FEF08A" stopOpacity="0.05" />
            </linearGradient>
          </defs>
          <rect width="400" height="300" fill="url(#studyRoom)" />
          {/* Wooden Study Desk */}
          <rect y="210" width="400" height="90" fill="#78350F" />
          <rect y="210" width="400" height="8" fill="#92400E" />
          {/* Desk Lamp on Left */}
          <rect x="50" y="200" width="40" height="12" rx="4" fill="#334155" />
          <path d="M70 200 L70 120 L110 95" stroke="#64748B" strokeWidth="6" strokeLinecap="round" fill="none" />
          <path d="M100 80 L130 98 L112 115 Z" fill="#F59E0B" />
          {/* Glowing Cone of Light */}
          <polygon points="115,108 30,280 320,280" fill="url(#deskLampCone)" />
          {/* Open Book in Center */}
          <g transform="translate(185, 175)">
            {/* Book Cover Base */}
            <path d="M-85 30 Q -5 40 0 25 Q 5 40 85 30 L 80 50 Q 5 60 0 45 Q -5 60 -80 50 Z" fill="#1D4ED8" />
            {/* Left Page */}
            <path d="M0 25 Q -40 10 -80 20 L -80 -15 Q -40 -25 0 -10 Z" fill="#FEF9C3" stroke="#CBD5E1" strokeWidth="1" />
            {/* Right Page */}
            <path d="M0 25 Q 40 10 80 20 L 80 -15 Q 40 -25 0 -10 Z" fill="#FEF9C3" stroke="#CBD5E1" strokeWidth="1" />
            {/* Chinese Text Lines on Pages */}
            <line x1="-70" y1="-5" x2="-15" y2="-5" stroke="#64748B" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="-70" y1="5" x2="-20" y2="5" stroke="#64748B" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="-70" y1="15" x2="-25" y2="15" stroke="#64748B" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="15" y1="-5" x2="70" y2="-5" stroke="#64748B" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="20" y1="5" x2="70" y2="5" stroke="#64748B" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="25" y1="15" x2="70" y2="15" stroke="#64748B" strokeWidth="2.5" strokeLinecap="round" />
          </g>
          {/* Steaming Mug on Right */}
          <rect x="300" y="195" width="24" height="30" rx="3" fill="#E2E8F0" />
          <path d="M324 202 C 332 202, 332 218, 324 218" stroke="#E2E8F0" strokeWidth="3" fill="none" />
          <path d="M306 188 Q 312 180 308 172" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" fill="none" />
          <path d="M314 188 Q 320 180 316 172" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" fill="none" />
          {/* Title Badge */}
          <g transform="translate(20, 20)">
            <rect width="130" height="28" rx="8" fill="#4338CA" opacity="0.85" />
            <text x="65" y="18" fill="#FFFFFF" fontSize="12" fontWeight="700" textAnchor="middle" fontFamily="sans-serif">看书 • Đọc sách</text>
          </g>
        </svg>
      );

    case 'rain':
      return (
        <svg viewBox="0 0 400 300" className="w-full h-full select-none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="rainSky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1E293B" />
              <stop offset="50%" stopColor="#334155" />
              <stop offset="100%" stopColor="#475569" />
            </linearGradient>
            <linearGradient id="umbrellaGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#FACC15" />
              <stop offset="100%" stopColor="#CA8A04" />
            </linearGradient>
          </defs>
          <rect width="400" height="300" fill="url(#rainSky)" />
          {/* Dark Clouds */}
          <g fill="#475569" opacity="0.9">
            <circle cx="80" cy="70" r="45" /><circle cx="140" cy="60" r="55" /><circle cx="200" cy="70" r="45" /><circle cx="260" cy="60" r="50" /><circle cx="320" cy="70" r="45" />
            <rect x="40" y="70" width="320" height="35" rx="10" />
          </g>
          {/* Rain Streaks */}
          <g stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round" opacity="0.75">
            <line x1="60" y1="120" x2="45" y2="160" /><line x1="120" y1="110" x2="105" y2="150" /><line x1="180" y1="130" x2="165" y2="170" />
            <line x1="240" y1="115" x2="225" y2="155" /><line x1="300" y1="125" x2="285" y2="165" /><line x1="350" y1="110" x2="335" y2="150" />
            <line x1="50" y1="180" x2="35" y2="220" /><line x1="110" y1="190" x2="95" y2="230" /><line x1="170" y1="185" x2="155" y2="225" />
            <line x1="280" y1="180" x2="265" y2="220" /><line x1="340" y1="190" x2="325" y2="230" />
          </g>
          {/* Ground Puddles */}
          <ellipse cx="140" cy="270" rx="50" ry="10" fill="#0284C7" opacity="0.4" />
          <ellipse cx="260" cy="265" rx="60" ry="12" fill="#0284C7" opacity="0.4" />
          {/* Bright Yellow Umbrella */}
          <g transform="translate(200, 195)">
            <path d="M-60 0 C -60 -45, 60 -45, 60 0 Z" fill="url(#umbrellaGrad)" stroke="#EAB308" strokeWidth="2" />
            <line x1="0" y1="-45" x2="0" y2="45" stroke="#334155" strokeWidth="4" strokeLinecap="round" />
            <path d="M0 45 C 0 55, 12 55, 12 45" stroke="#334155" strokeWidth="4" fill="none" strokeLinecap="round" />
          </g>
          {/* Title Badge */}
          <g transform="translate(20, 20)">
            <rect width="130" height="28" rx="8" fill="#0369A1" opacity="0.85" />
            <text x="65" y="18" fill="#FFFFFF" fontSize="12" fontWeight="700" textAnchor="middle" fontFamily="sans-serif">下雨 • Trời mưa</text>
          </g>
        </svg>
      );

    case 'writing':
      return (
        <svg viewBox="0 0 400 300" className="w-full h-full select-none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="bgDeskWriting" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FEF3C7" />
              <stop offset="100%" stopColor="#FDE68A" />
            </linearGradient>
          </defs>
          <rect width="400" height="300" fill="url(#bgDeskWriting)" />
          {/* Xuan Paper Sheet */}
          <rect x="70" y="40" width="260" height="220" rx="4" fill="#FFFBEB" stroke="#D97706" strokeWidth="1.5" />
          {/* Crimson Tianzige Grid (田字格) */}
          <g transform="translate(130, 80)">
            <rect width="140" height="140" fill="#FEF2F2" stroke="#DC2626" strokeWidth="3" />
            {/* Dashed Crosshairs */}
            <line x1="0" y1="70" x2="140" y2="70" stroke="#EF4444" strokeWidth="1.5" strokeDasharray="4 4" />
            <line x1="70" y1="0" x2="70" y2="140" stroke="#EF4444" strokeWidth="1.5" strokeDasharray="4 4" />
            {/* Character '好' in Kaiti font */}
            <text x="70" y="102" fontSize="88" fill="#0F172A" textAnchor="middle" fontFamily="'KaiTi', 'STKaiti', serif" fontWeight="600">好</text>
          </g>
          {/* Chinese Calligraphy Brush */}
          <g transform="translate(260, 45) rotate(35)">
            {/* Bamboo Handle */}
            <rect x="0" y="0" width="10" height="180" rx="4" fill="#92400E" stroke="#78350F" strokeWidth="1" />
            {/* Ferrule */}
            <rect x="0" y="175" width="10" height="15" fill="#CA8A04" />
            {/* Brush Tip with Inked Point */}
            <path d="M0 190 Q 5 220 5 225 Q 5 220 10 190 Z" fill="#0F172A" />
          </g>
          {/* Title Badge */}
          <g transform="translate(20, 20)">
            <rect width="130" height="28" rx="8" fill="#B91C1C" opacity="0.85" />
            <text x="65" y="18" fill="#FFFFFF" fontSize="12" fontWeight="700" textAnchor="middle" fontFamily="sans-serif">写字 • Viết chữ</text>
          </g>
        </svg>
      );

    case 'airplane':
      return (
        <svg viewBox="0 0 400 300" className="w-full h-full select-none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="skyPlane" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0284C7" />
              <stop offset="50%" stopColor="#38BDF8" />
              <stop offset="100%" stopColor="#E0F2FE" />
            </linearGradient>
          </defs>
          <rect width="400" height="300" fill="url(#skyPlane)" />
          {/* Fluffy Clouds */}
          <g fill="#FFFFFF" opacity="0.85">
            <ellipse cx="60" cy="220" rx="45" ry="25" /><ellipse cx="110" cy="210" rx="55" ry="30" /><ellipse cx="160" cy="225" rx="40" ry="20" />
            <ellipse cx="280" cy="90" rx="50" ry="22" /><ellipse cx="330" cy="80" rx="60" ry="28" />
          </g>
          {/* Modern Jetliner Soaring Upwards */}
          <g transform="translate(190, 140) rotate(-18)">
            {/* Shadow */}
            <ellipse cx="10" cy="70" rx="110" ry="12" fill="#0284C7" opacity="0.3" />
            {/* Left Wing & Turbofan Engine */}
            <path d="M-10 10 L-50 85 L-20 85 L25 15 Z" fill="#E2E8F0" stroke="#CBD5E1" strokeWidth="2" />
            <rect x="-42" y="55" width="20" height="12" rx="5" fill="#475569" />
            {/* Right Wing & Turbofan Engine */}
            <path d="M-10 -10 L-50 -85 L-20 -85 L25 -15 Z" fill="#CBD5E1" stroke="#94A3B8" strokeWidth="2" />
            <rect x="-42" y="-67" width="20" height="12" rx="5" fill="#334155" />
            {/* Tail Fin */}
            <path d="M-90 0 L-130 0 L-150 -55 L-120 -55 Z" fill="#E11D48" />
            <path d="M-110 0 L-145 25 L-135 25 L-95 0 Z" fill="#94A3B8" />
            {/* Main Fuselage Body */}
            <path d="M-120 0 Q -100 -20 60 -20 Q 120 -20 140 0 Q 120 20 60 20 Q -100 20 -120 0 Z" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="2" />
            {/* Cockpit Windshield */}
            <path d="M100 -8 Q 120 -6 125 0 Q 120 6 100 8 Z" fill="#0284C7" />
            {/* Blue Airline Speed Stripe */}
            <path d="M-100 2 Q 0 2 110 2" stroke="#0284C7" strokeWidth="4" fill="none" />
            {/* Cabin Windows */}
            {[-60, -40, -20, 0, 20, 40, 60, 80].map((x) => (
              <circle key={x} cx={x} cy="-4" r="2.5" fill="#1E293B" />
            ))}
          </g>
          {/* Title Badge */}
          <g transform="translate(20, 20)">
            <rect width="130" height="28" rx="8" fill="#0369A1" opacity="0.85" />
            <text x="65" y="18" fill="#FFFFFF" fontSize="12" fontWeight="700" textAnchor="middle" fontFamily="sans-serif">飞机 • Máy bay</text>
          </g>
        </svg>
      );

    case 'train':
      return (
        <svg viewBox="0 0 400 300" className="w-full h-full select-none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="skyTrain" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#60A5FA" />
              <stop offset="60%" stopColor="#BFDBFE" />
              <stop offset="100%" stopColor="#EFF6FF" />
            </linearGradient>
            <linearGradient id="trainBody" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="70%" stopColor="#F1F5F9" />
              <stop offset="100%" stopColor="#CBD5E1" />
            </linearGradient>
          </defs>
          <rect width="400" height="300" fill="url(#skyTrain)" />
          {/* Distant Mountains */}
          <polygon points="0,210 90,130 180,210" fill="#93C5FD" opacity="0.4" />
          <polygon points="120,210 240,110 360,210" fill="#60A5FA" opacity="0.35" />
          {/* Railway Bed */}
          <rect y="210" width="400" height="90" fill="#475569" />
          {/* Dual Steel Tracks */}
          <line x1="0" y1="230" x2="400" y2="230" stroke="#94A3B8" strokeWidth="5" />
          <line x1="0" y1="260" x2="400" y2="260" stroke="#94A3B8" strokeWidth="5" />
          {/* Sleepers / Ties */}
          {[10, 40, 70, 100, 130, 160, 190, 220, 250, 280, 310, 340, 370].map((x) => (
            <line key={x} x1={x} y1="225" x2={x + 10} y2="265" stroke="#334155" strokeWidth="5" strokeLinecap="round" />
          ))}
          {/* Bullet Train Locomotive */}
          <g transform="translate(60, 135)">
            <path d="M0 70 L240 70 C 290 70, 330 50, 340 30 C 330 0, 280 0, 220 0 L 0 0 Z" fill="url(#trainBody)" stroke="#94A3B8" strokeWidth="2" />
            {/* Red Speed Stripe */}
            <path d="M0 45 L260 45 C 290 45, 320 35, 330 25" stroke="#E11D48" strokeWidth="6" fill="none" />
            {/* Front Driver Windshield */}
            <path d="M265 10 C 290 10, 315 20, 325 25 L 295 25 C 275 25, 260 20, 265 10 Z" fill="#0284C7" />
            {/* Passenger Windows */}
            {[20, 60, 100, 140, 180, 220].map((x) => (
              <rect key={x} x={x} y="15" width="26" height="18" rx="4" fill="#0F172A" />
            ))}
          </g>
          {/* Title Badge */}
          <g transform="translate(20, 20)">
            <rect width="130" height="28" rx="8" fill="#1E3A8A" opacity="0.85" />
            <text x="65" y="18" fill="#FFFFFF" fontSize="12" fontWeight="700" textAnchor="middle" fontFamily="sans-serif">火车 • Tàu hỏa</text>
          </g>
        </svg>
      );

    case 'banana':
      return (
        <svg viewBox="0 0 400 300" className="w-full h-full select-none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="bgBanana" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FEF9C3" />
              <stop offset="100%" stopColor="#FEF08A" />
            </linearGradient>
            <linearGradient id="bananaGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#FACC15" />
              <stop offset="60%" stopColor="#EAB308" />
              <stop offset="100%" stopColor="#CA8A04" />
            </linearGradient>
          </defs>
          <rect width="400" height="300" fill="url(#bgBanana)" />
          {/* Table Surface */}
          <rect y="210" width="400" height="90" fill="#92400E" opacity="0.2" />
          {/* Cast Shadow */}
          <ellipse cx="200" cy="225" rx="100" ry="16" fill="#78350F" opacity="0.25" />
          {/* Cluster of Bananas */}
          <g transform="translate(130, 80)">
            {/* Banana 1 (Back) */}
            <path d="M20 20 C 70 20, 140 70, 160 130 C 130 110, 60 70, 20 20 Z" fill="#CA8A04" />
            {/* Banana 2 (Middle) */}
            <path d="M15 15 C 60 40, 130 90, 140 145 C 100 130, 45 80, 15 15 Z" fill="url(#bananaGrad)" stroke="#EAB308" strokeWidth="2" />
            {/* Banana 3 (Front Main) */}
            <path d="M10 10 C 50 60, 110 110, 115 160 C 80 140, 30 85, 10 10 Z" fill="#FDE047" stroke="#EAB308" strokeWidth="2" />
            {/* Stem Top */}
            <path d="M0 0 L 25 15 L 15 25 L -5 5 Z" fill="#65A30D" />
            {/* Tips */}
            <circle cx="115" cy="160" r="4" fill="#78350F" />
            <circle cx="140" cy="145" r="4" fill="#78350F" />
            <circle cx="160" cy="130" r="4" fill="#78350F" />
          </g>
          {/* Title Badge */}
          <g transform="translate(20, 20)">
            <rect width="130" height="28" rx="8" fill="#A16207" opacity="0.85" />
            <text x="65" y="18" fill="#FFFFFF" fontSize="12" fontWeight="700" textAnchor="middle" fontFamily="sans-serif">香蕉 • Quả chuối</text>
          </g>
        </svg>
      );

    case 'watermelon':
      return (
        <svg viewBox="0 0 400 300" className="w-full h-full select-none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="bgWatermelon" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ECFDF5" />
              <stop offset="100%" stopColor="#D1FAE5" />
            </linearGradient>
            <linearGradient id="pulpGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FB7185" />
              <stop offset="100%" stopColor="#E11D48" />
            </linearGradient>
          </defs>
          <rect width="400" height="300" fill="url(#bgWatermelon)" />
          {/* Shadow */}
          <ellipse cx="200" cy="240" rx="100" ry="18" fill="#047857" opacity="0.25" />
          {/* Watermelon Slice */}
          <g transform="translate(200, 160)">
            {/* Outer Green Rind */}
            <path d="M-130 0 A 130 130 0 0 0 130 0 Z" fill="#15803D" stroke="#166534" strokeWidth="3" />
            {/* Light Green Inner Rind */}
            <path d="M-122 0 A 122 122 0 0 0 122 0 Z" fill="#BBF7D0" />
            {/* Juicy Red Pulp */}
            <path d="M-112 0 A 112 112 0 0 0 112 0 Z" fill="url(#pulpGrad)" />
            {/* Watermelon Seeds */}
            {[
              { x: -60, y: 35 }, { x: -30, y: 55 }, { x: 0, y: 65 }, { x: 30, y: 55 }, { x: 60, y: 35 },
              { x: -40, y: 25 }, { x: 40, y: 25 }, { x: 0, y: 30 },
            ].map((seed, i) => (
              <path key={i} d={`M${seed.x} ${seed.y} C ${seed.x - 3} ${seed.y + 6}, ${seed.x + 3} ${seed.y + 6}, ${seed.x} ${seed.y} Z`} fill="#0F172A" />
            ))}
          </g>
          {/* Title Badge */}
          <g transform="translate(20, 20)">
            <rect width="130" height="28" rx="8" fill="#BE123C" opacity="0.85" />
            <text x="65" y="18" fill="#FFFFFF" fontSize="12" fontWeight="700" textAnchor="middle" fontFamily="sans-serif">西瓜 • Dưa hấu</text>
          </g>
        </svg>
      );

    case 'sleeping':
      return (
        <svg viewBox="0 0 400 300" className="w-full h-full select-none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="nightSkySleep" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0F172A" />
              <stop offset="100%" stopColor="#1E1B4B" />
            </linearGradient>
          </defs>
          <rect width="400" height="300" fill="url(#nightSkySleep)" />
          {/* Window in Background */}
          <rect x="250" y="30" width="110" height="120" rx="6" fill="#1E293B" stroke="#475569" strokeWidth="4" />
          <line x1="305" y1="30" x2="305" y2="150" stroke="#475569" strokeWidth="3" />
          <line x1="250" y1="90" x2="360" y2="90" stroke="#475569" strokeWidth="3" />
          {/* Crescent Moon in Window */}
          <path d="M290 50 A 16 16 0 0 0 315 75 A 20 20 0 1 1 290 50 Z" fill="#FDE047" />
          {/* Star Twinkles */}
          <circle cx="270" cy="55" r="2" fill="#FFFFFF" /><circle cx="335" cy="115" r="2" fill="#FFFFFF" />
          {/* Wooden Bed Frame */}
          <rect x="40" y="150" width="30" height="110" rx="4" fill="#78350F" />
          <rect x="330" y="180" width="25" height="80" rx="4" fill="#78350F" />
          <rect x="40" y="210" width="310" height="25" fill="#92400E" />
          {/* Soft Mattress & Folded Lavender Quilt */}
          <rect x="65" y="185" width="270" height="35" rx="6" fill="#EDE9FE" />
          <rect x="130" y="185" width="205" height="35" rx="6" fill="#8B5CF6" />
          {/* Cozy White Pillow */}
          <ellipse cx="105" cy="180" rx="25" ry="14" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1" />
          {/* Person Head Resting */}
          <circle cx="105" cy="175" r="12" fill="#FDE047" />
          {/* Sleeping 'Zzz' Floating Up */}
          <text x="135" y="150" fontSize="18" fontWeight="bold" fill="#C4B5FD">Z</text>
          <text x="150" y="135" fontSize="24" fontWeight="bold" fill="#DDD6FE">Z</text>
          <text x="170" y="115" fontSize="30" fontWeight="bold" fill="#EDE9FE">z</text>
          {/* Title Badge */}
          <g transform="translate(20, 20)">
            <rect width="130" height="28" rx="8" fill="#5B21B6" opacity="0.85" />
            <text x="65" y="18" fill="#FFFFFF" fontSize="12" fontWeight="700" textAnchor="middle" fontFamily="sans-serif">睡觉 • Đi ngủ</text>
          </g>
        </svg>
      );

    case 'water':
      return (
        <svg viewBox="0 0 400 300" className="w-full h-full select-none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="bgWater" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#E0F2FE" />
              <stop offset="100%" stopColor="#BAE6FD" />
            </linearGradient>
            <linearGradient id="waterGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38BDF8" />
              <stop offset="100%" stopColor="#0284C7" />
            </linearGradient>
          </defs>
          <rect width="400" height="300" fill="url(#bgWater)" />
          {/* Table */}
          <rect y="220" width="400" height="80" fill="#0369A1" opacity="0.2" />
          {/* Glass Shadow */}
          <ellipse cx="200" cy="235" rx="55" ry="12" fill="#0284C7" opacity="0.3" />
          {/* Clear Glass Tumbler */}
          <g transform="translate(150, 70)">
            {/* Straw */}
            <line x1="85" y1="-15" x2="35" y2="140" stroke="#EF4444" strokeWidth="8" strokeLinecap="round" />
            <line x1="85" y1="-15" x2="105" y2="-25" stroke="#EF4444" strokeWidth="8" strokeLinecap="round" />
            {/* Water Inside Glass */}
            <path d="M12 50 L20 150 C 20 158, 80 158, 80 150 L88 50 Z" fill="url(#waterGrad)" opacity="0.75" />
            {/* Ice Cubes */}
            <rect x="25" y="60" width="24" height="24" rx="4" fill="#FFFFFF" opacity="0.7" stroke="#BAE6FD" strokeWidth="1" />
            <rect x="50" y="80" width="22" height="22" rx="4" fill="#FFFFFF" opacity="0.7" stroke="#BAE6FD" strokeWidth="1" />
            {/* Glass Outline */}
            <path d="M10 20 L20 150 C 20 162, 80 162, 80 150 L90 20 Z" fill="none" stroke="#FFFFFF" strokeWidth="4" />
            <ellipse cx="50" cy="20" rx="40" ry="8" fill="#E0F2FE" opacity="0.5" stroke="#FFFFFF" strokeWidth="3" />
          </g>
          {/* Title Badge */}
          <g transform="translate(20, 20)">
            <rect width="130" height="28" rx="8" fill="#0284C7" opacity="0.85" />
            <text x="65" y="18" fill="#FFFFFF" fontSize="12" fontWeight="700" textAnchor="middle" fontFamily="sans-serif">喝水 • Uống nước</text>
          </g>
        </svg>
      );

    case 'sunny':
      return (
        <svg viewBox="0 0 400 300" className="w-full h-full select-none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="skySunny" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0284C7" />
              <stop offset="60%" stopColor="#38BDF8" />
              <stop offset="100%" stopColor="#BAE6FD" />
            </linearGradient>
            <radialGradient id="sunRadial" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FEF08A" />
              <stop offset="70%" stopColor="#FACC15" />
              <stop offset="100%" stopColor="#F59E0B" />
            </radialGradient>
          </defs>
          <rect width="400" height="300" fill="url(#skySunny)" />
          {/* Radiant Sun in Center */}
          <g transform="translate(200, 150)">
            {/* Sun Rays */}
            {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
              <g key={deg} transform={`rotate(${deg})`}>
                <line x1="0" y1="65" x2="0" y2="95" stroke="#FBBF24" strokeWidth="5" strokeLinecap="round" />
              </g>
            ))}
            {/* Central Sun Disc */}
            <circle cx="0" cy="0" r="55" fill="url(#sunRadial)" />
          </g>
          {/* Flying Bird Silhouettes */}
          <path d="M80 80 Q 90 70 100 80 Q 110 70 120 80" stroke="#0F172A" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d="M290 90 Q 298 82 306 90 Q 314 82 322 90" stroke="#0F172A" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          {/* Title Badge */}
          <g transform="translate(20, 20)">
            <rect width="130" height="28" rx="8" fill="#D97706" opacity="0.85" />
            <text x="65" y="18" fill="#FFFFFF" fontSize="12" fontWeight="700" textAnchor="middle" fontFamily="sans-serif">晴天 • Trời nắng</text>
          </g>
        </svg>
      );

    case 'wind':
      return (
        <svg viewBox="0 0 400 300" className="w-full h-full select-none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="skyWind" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#CCFBF1" />
              <stop offset="100%" stopColor="#99F6E4" />
            </linearGradient>
          </defs>
          <rect width="400" height="300" fill="url(#skyWind)" />
          {/* Leaning Windblown Willow Branch */}
          <path d="M380 40 Q 260 80 180 160" stroke="#78350F" strokeWidth="5" fill="none" strokeLinecap="round" />
          <path d="M280 90 Q 220 130 190 210" stroke="#15803D" strokeWidth="3" fill="none" strokeLinecap="round" />
          {/* Wind Streamlines */}
          <g stroke="#0D9488" strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.8">
            <path d="M40 80 C 140 80, 200 60, 260 60 C 290 60, 310 80, 290 95 C 270 110, 240 100, 250 80" />
            <path d="M20 140 C 160 140, 220 120, 300 120 C 330 120, 350 140, 330 155 C 310 170, 280 160, 290 140" />
            <path d="M60 210 C 180 210, 240 190, 320 190" />
          </g>
          {/* Drifting Autumn Leaves */}
          <g fill="#D97706">
            <ellipse cx="120" cy="120" rx="12" ry="6" transform="rotate(-30 120 120)" />
            <ellipse cx="220" cy="180" rx="14" ry="7" transform="rotate(25 220 180)" />
            <ellipse cx="330" cy="100" rx="10" ry="5" transform="rotate(-15 330 100)" />
          </g>
          {/* Title Badge */}
          <g transform="translate(20, 20)">
            <rect width="130" height="28" rx="8" fill="#0F766E" opacity="0.85" />
            <text x="65" y="18" fill="#FFFFFF" fontSize="12" fontWeight="700" textAnchor="middle" fontFamily="sans-serif">刮风 • Có gió</text>
          </g>
        </svg>
      );

    case 'singing':
      return (
        <svg viewBox="0 0 400 300" className="w-full h-full select-none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="stageSing" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4C1D95" />
              <stop offset="100%" stopColor="#1E1B4B" />
            </linearGradient>
            <radialGradient id="spotlightSing" cx="50%" cy="30%" r="60%">
              <stop offset="0%" stopColor="#C084FC" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#4C1D95" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="400" height="300" fill="url(#stageSing)" />
          <rect width="400" height="300" fill="url(#spotlightSing)" />
          {/* Vintage Microphone Stand */}
          <rect x="196" y="140" width="8" height="130" fill="#94A3B8" />
          <ellipse cx="200" cy="270" rx="40" ry="12" fill="#475569" />
          {/* Vintage Chrome Microphone Head */}
          <rect x="182" y="80" width="36" height="50" rx="12" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="2" />
          {/* Horizontal Mic Grille Lines */}
          {[88, 96, 104, 112, 120].map((y) => (
            <line key={y} x1="185" y1={y} x2="215" y2={y} stroke="#64748B" strokeWidth="2" />
          ))}
          {/* Floating Musical Notes */}
          <g fill="#FDE047">
            {/* Treble Clef Motif */}
            <text x="80" y="130" fontSize="48" fontFamily="serif" fontWeight="bold">♪</text>
            <text x="120" y="90" fontSize="36" fontFamily="serif">♫</text>
            <text x="280" y="100" fontSize="42" fontFamily="serif">♬</text>
            <text x="310" y="145" fontSize="32" fontFamily="serif">♪</text>
          </g>
          {/* Title Badge */}
          <g transform="translate(20, 20)">
            <rect width="130" height="28" rx="8" fill="#7C3AED" opacity="0.85" />
            <text x="65" y="18" fill="#FFFFFF" fontSize="12" fontWeight="700" textAnchor="middle" fontFamily="sans-serif">唱歌 • Hát ca</text>
          </g>
        </svg>
      );

    case 'dance':
      return (
        <svg viewBox="0 0 400 300" className="w-full h-full select-none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="bgDance" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#831843" />
              <stop offset="100%" stopColor="#500724" />
            </linearGradient>
          </defs>
          <rect width="400" height="300" fill="url(#bgDance)" />
          {/* Stage Lights */}
          <circle cx="100" cy="50" r="30" fill="#F43F5E" opacity="0.4" />
          <circle cx="300" cy="50" r="30" fill="#FBBF24" opacity="0.4" />
          {/* Wooden Stage Floor */}
          <rect y="230" width="400" height="70" fill="#854D0E" />
          {/* Graceful Dancer Silhouette */}
          <g transform="translate(200, 150)">
            {/* Head */}
            <circle cx="0" cy="-65" r="14" fill="#FDE047" />
            {/* Torso */}
            <path d="M-6 -50 L 6 -50 L 4 -15 L -4 -15 Z" fill="#F43F5E" />
            {/* Elegant Arms with Ribbon */}
            <path d="M-5 -45 Q -35 -70 -55 -40" stroke="#FDE047" strokeWidth="5" fill="none" strokeLinecap="round" />
            <path d="M5 -45 Q 40 -80 65 -70" stroke="#FDE047" strokeWidth="5" fill="none" strokeLinecap="round" />
            {/* Flowing Skirt Flare */}
            <path d="M-8 -15 Q -70 40 -85 55 Q 0 45 85 55 Q 70 40 8 -15 Z" fill="#FB7185" />
            {/* Slender Legs */}
            <line x1="-10" y1="50" x2="-25" y2="85" stroke="#FDE047" strokeWidth="5" strokeLinecap="round" />
            <line x1="10" y1="50" x2="25" y2="85" stroke="#FDE047" strokeWidth="5" strokeLinecap="round" />
          </g>
          {/* Title Badge */}
          <g transform="translate(20, 20)">
            <rect width="130" height="28" rx="8" fill="#BE185D" opacity="0.85" />
            <text x="65" y="18" fill="#FFFFFF" fontSize="12" fontWeight="700" textAnchor="middle" fontFamily="sans-serif">跳舞 • Khiêu vũ</text>
          </g>
        </svg>
      );

    case 'coffee':
      return (
        <svg viewBox="0 0 400 300" className="w-full h-full select-none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="bgCoffee" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FEF3C7" />
              <stop offset="100%" stopColor="#FDE68A" />
            </linearGradient>
            <linearGradient id="coffeeBrew" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#78350F" />
              <stop offset="100%" stopColor="#451A03" />
            </linearGradient>
          </defs>
          <rect width="400" height="300" fill="url(#bgCoffee)" />
          {/* Table Surface */}
          <rect y="210" width="400" height="90" fill="#B45309" opacity="0.25" />
          {/* Saucer */}
          <ellipse cx="200" cy="225" rx="100" ry="22" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="3" />
          <ellipse cx="200" cy="223" rx="75" ry="14" fill="#F8FAFC" />
          {/* Coffee Mug */}
          <g transform="translate(145, 120)">
            {/* Mug Handle */}
            <path d="M100 20 C 130 20, 130 70, 100 70" stroke="#FFFFFF" strokeWidth="12" fill="none" strokeLinecap="round" />
            <path d="M100 20 C 126 20, 126 70, 100 70" stroke="#E2E8F0" strokeWidth="4" fill="none" />
            {/* Mug Body */}
            <path d="M10 15 L20 85 C 20 95, 90 95, 90 85 L100 15 Z" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="2" />
            {/* Steaming Coffee Surface with Heart Latte Art */}
            <ellipse cx="55" cy="18" rx="42" ry="14" fill="url(#coffeeBrew)" />
            {/* Cream Heart */}
            <path d="M55 18 C 50 12, 42 14, 46 20 C 50 24, 55 27, 55 27 C 55 27, 60 24, 64 20 C 68 14, 60 12, 55 18 Z" fill="#FEF3C7" />
            {/* Steam Wisps */}
            <path d="M45 -5 Q 40 -20 50 -35" stroke="#94A3B8" strokeWidth="3" fill="none" strokeLinecap="round" />
            <path d="M65 -5 Q 70 -20 60 -35" stroke="#94A3B8" strokeWidth="3" fill="none" strokeLinecap="round" />
          </g>
          {/* Coffee Beans Scattered */}
          <ellipse cx="90" cy="235" rx="8" ry="5" fill="#451A03" transform="rotate(25 90 235)" />
          <ellipse cx="300" cy="240" rx="8" ry="5" fill="#451A03" transform="rotate(-30 300 240)" />
          {/* Title Badge */}
          <g transform="translate(20, 20)">
            <rect width="130" height="28" rx="8" fill="#78350F" opacity="0.85" />
            <text x="65" y="18" fill="#FFFFFF" fontSize="12" fontWeight="700" textAnchor="middle" fontFamily="sans-serif">咖啡 • Cà phê</text>
          </g>
        </svg>
      );

    case 'tea':
      return (
        <svg viewBox="0 0 400 300" className="w-full h-full select-none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="bgTea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ECFDF5" />
              <stop offset="100%" stopColor="#D1FAE5" />
            </linearGradient>
            <linearGradient id="celadonGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#A7F3D0" />
              <stop offset="50%" stopColor="#34D399" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
          </defs>
          <rect width="400" height="300" fill="url(#bgTea)" />
          {/* Bamboo Tea Tray */}
          <rect x="50" y="200" width="300" height="50" rx="8" fill="#78350F" stroke="#B45309" strokeWidth="3" />
          {/* Traditional Celadon Teapot */}
          <g transform="translate(140, 110)">
            {/* Teapot Handle */}
            <path d="M-15 40 C -40 30, -35 70, -10 75" stroke="#059669" strokeWidth="8" fill="none" strokeLinecap="round" />
            {/* Spout */}
            <path d="M85 45 Q 110 35 115 25 Q 105 55 80 65 Z" fill="#10B981" />
            {/* Pot Body */}
            <ellipse cx="40" cy="55" rx="55" ry="40" fill="url(#celadonGrad)" />
            {/* Lid & Knob */}
            <ellipse cx="40" cy="18" rx="30" ry="8" fill="#34D399" />
            <circle cx="40" cy="10" r="6" fill="#047857" />
          </g>
          {/* Two Small Tea Cups */}
          <g transform="translate(265, 175)">
            <rect x="0" y="0" width="28" height="24" rx="4" fill="#A7F3D0" stroke="#059669" strokeWidth="1.5" />
            <ellipse cx="14" cy="3" rx="12" ry="4" fill="#F59E0B" />
          </g>
          <g transform="translate(305, 185)">
            <rect x="0" y="0" width="28" height="24" rx="4" fill="#A7F3D0" stroke="#059669" strokeWidth="1.5" />
            <ellipse cx="14" cy="3" rx="12" ry="4" fill="#F59E0B" />
          </g>
          {/* Title Badge */}
          <g transform="translate(20, 20)">
            <rect width="130" height="28" rx="8" fill="#065F46" opacity="0.85" />
            <text x="65" y="18" fill="#FFFFFF" fontSize="12" fontWeight="700" textAnchor="middle" fontFamily="sans-serif">茶 • Uống trà</text>
          </g>
        </svg>
      );

    case 'movie':
      return (
        <svg viewBox="0 0 400 300" className="w-full h-full select-none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="bgMovie" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1E293B" />
              <stop offset="100%" stopColor="#0F172A" />
            </linearGradient>
          </defs>
          <rect width="400" height="300" fill="url(#bgMovie)" />
          {/* Clapperboard on Left */}
          <g transform="translate(70, 70) rotate(-8)">
            {/* Lower Slate Board */}
            <rect x="0" y="35" width="130" height="95" rx="6" fill="#0F172A" stroke="#475569" strokeWidth="3" />
            <text x="15" y="65" fill="#94A3B8" fontSize="11" fontWeight="bold">SCENE: 1</text>
            <text x="75" y="65" fill="#94A3B8" fontSize="11" fontWeight="bold">TAKE: 3</text>
            <text x="25" y="105" fill="#FDE047" fontSize="18" fontWeight="bold" fontFamily="sans-serif">电影院</text>
            {/* Clapper Top with Black/White Stripes */}
            <g transform="translate(0, 5)">
              <rect width="130" height="25" rx="4" fill="#000" />
              <polygon points="15,0 35,0 20,25 0,25" fill="#FFF" />
              <polygon points="45,0 65,0 50,25 30,25" fill="#FFF" />
              <polygon points="75,0 95,0 80,25 60,25" fill="#FFF" />
              <polygon points="105,0 125,0 110,25 90,25" fill="#FFF" />
            </g>
          </g>
          {/* Popcorn Bucket on Right */}
          <g transform="translate(240, 110)">
            {/* Popcorn Grains */}
            {[-10, 10, 30, 50, 70].map((x) => (
              <circle key={x} cx={x} cy="10" r="14" fill="#FEF08A" stroke="#F59E0B" strokeWidth="1.5" />
            ))}
            {[-5, 15, 35, 55].map((x) => (
              <circle key={x} cx={x} cy="-5" r="14" fill="#FEF08A" stroke="#F59E0B" strokeWidth="1.5" />
            ))}
            {/* Striped Cup */}
            <polygon points="0,20 60,20 50,120 10,120" fill="#EF4444" stroke="#DC2626" strokeWidth="2" />
            {/* White Stripes */}
            <polygon points="12,20 22,20 18,120 10,120" fill="#FFFFFF" />
            <polygon points="32,20 42,20 38,120 30,120" fill="#FFFFFF" />
          </g>
          {/* Title Badge */}
          <g transform="translate(20, 20)">
            <rect width="130" height="28" rx="8" fill="#BE123C" opacity="0.85" />
            <text x="65" y="18" fill="#FFFFFF" fontSize="12" fontWeight="700" textAnchor="middle" fontFamily="sans-serif">看电影 • Xem phim</text>
          </g>
        </svg>
      );

    case 'phone':
      return (
        <svg viewBox="0 0 400 300" className="w-full h-full select-none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="bgPhone" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#EEF2FF" />
              <stop offset="100%" stopColor="#C7D2FE" />
            </linearGradient>
          </defs>
          <rect width="400" height="300" fill="url(#bgPhone)" />
          {/* Modern Smartphone */}
          <g transform="translate(135, 30)">
            {/* Phone Body */}
            <rect width="130" height="240" rx="24" fill="#1E293B" stroke="#0F172A" strokeWidth="4" />
            {/* Screen */}
            <rect x="8" y="15" width="114" height="210" rx="16" fill="#0284C7" />
            {/* Caller Avatar */}
            <circle cx="65" cy="70" r="28" fill="#BAE6FD" />
            <circle cx="65" cy="65" r="14" fill="#0284C7" />
            <path d="M48 88 C 48 78, 82 78, 82 88 Z" fill="#0284C7" />
            {/* Caller Name */}
            <text x="65" y="120" fill="#FFFFFF" fontSize="16" fontWeight="bold" textAnchor="middle">妈妈</text>
            <text x="65" y="136" fill="#BAE6FD" fontSize="11" textAnchor="middle">Incoming Call...</text>
            {/* Green Accept Button */}
            <circle cx="38" cy="180" r="18" fill="#22C55E" />
            <path d="M30 180 Q 38 172 46 180" stroke="#FFFFFF" strokeWidth="3" fill="none" strokeLinecap="round" />
            {/* Red Decline Button */}
            <circle cx="92" cy="180" r="18" fill="#EF4444" />
            <path d="M84 180 Q 92 188 100 180" stroke="#FFFFFF" strokeWidth="3" fill="none" strokeLinecap="round" />
          </g>
          {/* Title Badge */}
          <g transform="translate(20, 20)">
            <rect width="130" height="28" rx="8" fill="#4338CA" opacity="0.85" />
            <text x="65" y="18" fill="#FFFFFF" fontSize="12" fontWeight="700" textAnchor="middle" fontFamily="sans-serif">打电话 • Gọi điện</text>
          </g>
        </svg>
      );

    case 'cat':
      return (
        <svg viewBox="0 0 400 300" className="w-full h-full select-none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="bgCat" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FFF1F2" />
              <stop offset="100%" stopColor="#FFE4E6" />
            </linearGradient>
          </defs>
          <rect width="400" height="300" fill="url(#bgCat)" />
          {/* Floor & Shadow */}
          <ellipse cx="200" cy="245" rx="90" ry="16" fill="#FDA4AF" opacity="0.3" />
          {/* Cute Cat Figure */}
          <g transform="translate(160, 90)">
            {/* Curled Tail */}
            <path d="M60 110 C 95 110, 105 70, 85 60 C 75 55, 75 75, 60 90" stroke="#F97316" strokeWidth="10" fill="none" strokeLinecap="round" />
            {/* Cat Body */}
            <ellipse cx="40" cy="100" rx="36" ry="42" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="2" />
            <ellipse cx="40" cy="100" rx="22" ry="28" fill="#FED7AA" />
            {/* Cat Ears */}
            <polygon points="12,30 25,2 40,25" fill="#F97316" />
            <polygon points="16,26 25,8 34,22" fill="#FDA4AF" />
            <polygon points="45,25 60,2 72,30" fill="#F97316" />
            <polygon points="50,22 60,8 68,26" fill="#FDA4AF" />
            {/* Cat Head */}
            <circle cx="42" cy="40" r="32" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="2" />
            {/* Eyes */}
            <ellipse cx="30" cy="38" rx="5" ry="7" fill="#0284C7" />
            <ellipse cx="54" cy="38" rx="5" ry="7" fill="#0284C7" />
            <circle cx="32" cy="36" r="2" fill="#FFFFFF" />
            <circle cx="56" cy="36" r="2" fill="#FFFFFF" />
            {/* Nose & Whiskers */}
            <polygon points="40,46 44,46 42,50" fill="#FB7185" />
            <line x1="18" y1="46" x2="3" y2="44" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
            <line x1="18" y1="50" x2="3" y2="52" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
            <line x1="66" y1="46" x2="81" y2="44" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
            <line x1="66" y1="50" x2="81" y2="52" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
          </g>
          {/* Red Yarn Ball on Left */}
          <circle cx="110" cy="235" r="18" fill="#EF4444" />
          <path d="M110 235 Q 130 240 150 238" stroke="#EF4444" strokeWidth="3" fill="none" />
          {/* Title Badge */}
          <g transform="translate(20, 20)">
            <rect width="130" height="28" rx="8" fill="#C2410C" opacity="0.85" />
            <text x="65" y="18" fill="#FFFFFF" fontSize="12" fontWeight="700" textAnchor="middle" fontFamily="sans-serif">小猫 • Con mèo</text>
          </g>
        </svg>
      );

    case 'hospital':
      return (
        <svg viewBox="0 0 400 300" className="w-full h-full select-none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="skyHospital" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#CCFBF1" />
              <stop offset="100%" stopColor="#F0FDFA" />
            </linearGradient>
          </defs>
          <rect width="400" height="300" fill="url(#skyHospital)" />
          {/* Ground */}
          <rect y="230" width="400" height="70" fill="#0F766E" opacity="0.2" />
          {/* Main Hospital Building */}
          <rect x="110" y="70" width="180" height="170" rx="8" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="2" />
          {/* Red Cross Medallion */}
          <circle cx="200" cy="105" r="24" fill="#FEE2E2" stroke="#EF4444" strokeWidth="2" />
          <rect x="194" y="91" width="12" height="28" fill="#DC2626" rx="2" />
          <rect x="186" y="99" width="28" height="12" fill="#DC2626" rx="2" />
          {/* Windows Grid */}
          {[140, 175, 210].map((y) => (
            <g key={y}>
              <rect x="130" y={y} width="24" height="20" rx="2" fill="#38BDF8" />
              <rect x="188" y={y} width="24" height="20" rx="2" fill="#38BDF8" />
              <rect x="246" y={y} width="24" height="20" rx="2" fill="#38BDF8" />
            </g>
          ))}
          {/* Entrance Canopy & Automatic Sliding Glass Doors */}
          <rect x="175" y="210" width="50" height="30" fill="#0D9488" rx="2" />
          <rect x="185" y="215" width="30" height="25" fill="#E0F2FE" />
          {/* Title Badge */}
          <g transform="translate(20, 20)">
            <rect width="130" height="28" rx="8" fill="#0F766E" opacity="0.85" />
            <text x="65" y="18" fill="#FFFFFF" fontSize="12" fontWeight="700" textAnchor="middle" fontFamily="sans-serif">医院 • Bệnh viện</text>
          </g>
        </svg>
      );

    case 'rice':
      return (
        <svg viewBox="0 0 400 300" className="w-full h-full select-none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="bgRice" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FEF3C7" />
              <stop offset="100%" stopColor="#FDE68A" />
            </linearGradient>
          </defs>
          <rect width="400" height="300" fill="url(#bgRice)" />
          {/* Wooden Table */}
          <rect y="210" width="400" height="90" fill="#78350F" opacity="0.25" />
          {/* Shadow */}
          <ellipse cx="200" cy="225" rx="85" ry="16" fill="#78350F" opacity="0.3" />
          {/* Bowl and Fluffy Rice */}
          <g transform="translate(200, 160)">
            {/* Mound of Fluffy Steaming Rice */}
            <path d="M-65 0 C -65 -45, 65 -45, 65 0 Z" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="2" />
            {/* Rice Texture Curvatures */}
            {[-40, -15, 10, 35].map((x) => (
              <circle key={x} cx={x} cy="-20" r="8" fill="#F8FAFC" />
            ))}
            {/* Ceramic Rice Bowl */}
            <path d="M-75 0 C -75 65, 75 65, 75 0 Z" fill="#2563EB" stroke="#1D4ED8" strokeWidth="3" />
            <rect x="-35" y="55" width="70" height="12" fill="#1E40AF" rx="2" />
            {/* White Decorative Rim */}
            <ellipse cx="0" cy="0" rx="75" ry="12" fill="#FFFFFF" stroke="#93C5FD" strokeWidth="2" />
            {/* Wooden Chopsticks */}
            <line x1="-85" y1="-25" x2="85" y2="5" stroke="#92400E" strokeWidth="5" strokeLinecap="round" />
            <line x1="-80" y1="-32" x2="80" y2="-2" stroke="#78350F" strokeWidth="5" strokeLinecap="round" />
          </g>
          {/* Title Badge */}
          <g transform="translate(20, 20)">
            <rect width="130" height="28" rx="8" fill="#1D4ED8" opacity="0.85" />
            <text x="65" y="18" fill="#FFFFFF" fontSize="12" fontWeight="700" textAnchor="middle" fontFamily="sans-serif">米饭 • Cơm trắng</text>
          </g>
        </svg>
      );

    case 'bookshelf':
      return (
        <svg viewBox="0 0 400 300" className="w-full h-full select-none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="bgBookshelf" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FEF3C7" />
              <stop offset="100%" stopColor="#EDE9FE" />
            </linearGradient>
          </defs>
          <rect width="400" height="300" fill="url(#bgBookshelf)" />
          {/* Wooden Bookshelf Structure */}
          <rect x="60" y="40" width="280" height="220" fill="#9A3412" rx="6" />
          {/* Shelf Tiers */}
          <rect x="75" y="55" width="250" height="90" fill="#FFFBEB" />
          <rect x="75" y="155" width="250" height="90" fill="#FFFBEB" />
          {/* Books on Tier 1 */}
          <g transform="translate(85, 65)">
            <rect x="0" y="0" width="18" height="75" fill="#EF4444" rx="2" />
            <rect x="22" y="5" width="22" height="70" fill="#3B82F6" rx="2" />
            <rect x="48" y="0" width="16" height="75" fill="#10B981" rx="2" />
            <rect x="68" y="10" width="24" height="65" fill="#F59E0B" rx="2" />
            <rect x="96" y="0" width="20" height="75" fill="#8B5CF6" rx="2" />
            {/* Leaning Book */}
            <rect x="125" y="0" width="18" height="75" fill="#EC4899" rx="2" transform="rotate(16 125 75)" />
          </g>
          {/* Books on Tier 2 */}
          <g transform="translate(85, 165)">
            <rect x="0" y="5" width="26" height="70" fill="#0284C7" rx="2" />
            <rect x="30" y="0" width="18" height="75" fill="#D97706" rx="2" />
            <rect x="52" y="10" width="20" height="65" fill="#059669" rx="2" />
            <rect x="76" y="0" width="25" height="75" fill="#DC2626" rx="2" />
            <rect x="105" y="5" width="22" height="70" fill="#4338CA" rx="2" />
          </g>
          {/* Title Badge */}
          <g transform="translate(20, 20)">
            <rect width="130" height="28" rx="8" fill="#9A3412" opacity="0.85" />
            <text x="65" y="18" fill="#FFFFFF" fontSize="12" fontWeight="700" textAnchor="middle" fontFamily="sans-serif">很多书 • Giá sách</text>
          </g>
        </svg>
      );

    case 'running':
      return (
        <svg viewBox="0 0 400 300" className="w-full h-full select-none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="skyRun" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#EA580C" />
              <stop offset="60%" stopColor="#FDBA74" />
              <stop offset="100%" stopColor="#FED7AA" />
            </linearGradient>
          </defs>
          <rect width="400" height="300" fill="url(#skyRun)" />
          {/* Running Track */}
          <rect y="200" width="400" height="100" fill="#B91C1C" />
          <line x1="0" y1="240" x2="400" y2="240" stroke="#FFFFFF" strokeWidth="4" strokeDasharray="15 15" />
          {/* Dynamic Runner Figure */}
          <g transform="translate(180, 110)">
            {/* Head */}
            <circle cx="25" cy="0" r="14" fill="#0F172A" />
            {/* Torso leaning forward */}
            <line x1="22" y1="12" x2="0" y2="50" stroke="#0F172A" strokeWidth="10" strokeLinecap="round" />
            {/* Arms pumping */}
            <line x1="16" y1="22" x2="-15" y2="35" stroke="#0F172A" strokeWidth="7" strokeLinecap="round" />
            <line x1="16" y1="22" x2="45" y2="15" stroke="#0F172A" strokeWidth="7" strokeLinecap="round" />
            {/* Front Leg */}
            <line x1="0" y1="50" x2="35" y2="70" stroke="#0F172A" strokeWidth="8" strokeLinecap="round" />
            <line x1="35" y1="70" x2="25" y2="105" stroke="#0F172A" strokeWidth="8" strokeLinecap="round" />
            {/* Back Leg */}
            <line x1="0" y1="50" x2="-30" y2="65" stroke="#0F172A" strokeWidth="8" strokeLinecap="round" />
            <line x1="-30" y1="65" x2="-55" y2="55" stroke="#0F172A" strokeWidth="8" strokeLinecap="round" />
          </g>
          {/* Title Badge */}
          <g transform="translate(20, 20)">
            <rect width="130" height="28" rx="8" fill="#C2410C" opacity="0.85" />
            <text x="65" y="18" fill="#FFFFFF" fontSize="12" fontWeight="700" textAnchor="middle" fontFamily="sans-serif">跑步 • Chạy bộ</text>
          </g>
        </svg>
      );

    case 'swimming':
      return (
        <svg viewBox="0 0 400 300" className="w-full h-full select-none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="poolWater" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0284C7" />
              <stop offset="50%" stopColor="#0369A1" />
              <stop offset="100%" stopColor="#075985" />
            </linearGradient>
          </defs>
          <rect width="400" height="300" fill="url(#poolWater)" />
          {/* Pool Lane Dividers (Floating Buoys) */}
          <line x1="0" y1="80" x2="400" y2="80" stroke="#E2E8F0" strokeWidth="2" />
          {[20, 60, 100, 140, 180, 220, 260, 300, 340, 380].map((x, i) => (
            <ellipse key={x} cx={x} cy="80" rx="10" ry="6" fill={i % 2 === 0 ? '#EF4444' : '#FFFFFF'} />
          ))}
          {/* Swimmer in Freestyle Stroke */}
          <g transform="translate(170, 130)">
            {/* Body inside water */}
            <ellipse cx="40" cy="20" rx="60" ry="15" fill="#38BDF8" opacity="0.6" />
            {/* Head with Swimming Cap & Goggles */}
            <circle cx="90" cy="10" r="14" fill="#FACC15" />
            <ellipse cx="96" cy="10" rx="5" ry="3" fill="#1E293B" />
            {/* Freestyle Overhead Arm Stroke */}
            <path d="M70 15 Q 85 -25 40 -35" stroke="#FBBF24" strokeWidth="8" strokeLinecap="round" fill="none" />
            {/* Water Splashes */}
            <path d="M-20 20 Q -10 0 0 20" stroke="#FFFFFF" strokeWidth="3" fill="none" />
            <path d="M10 25 Q 25 5 40 25" stroke="#FFFFFF" strokeWidth="3" fill="none" />
          </g>
          {/* Title Badge */}
          <g transform="translate(20, 20)">
            <rect width="130" height="28" rx="8" fill="#0284C7" opacity="0.85" />
            <text x="65" y="18" fill="#FFFFFF" fontSize="12" fontWeight="700" textAnchor="middle" fontFamily="sans-serif">游泳 • Bơi lội</text>
          </g>
        </svg>
      );

    case 'soccer':
      return (
        <svg viewBox="0 0 400 300" className="w-full h-full select-none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="grassField" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22C55E" />
              <stop offset="100%" stopColor="#15803D" />
            </linearGradient>
          </defs>
          <rect width="400" height="300" fill="url(#grassField)" />
          {/* Goal Net in Background */}
          <path d="M40 30 L 360 30 L 390 140 L 10 140 Z" fill="none" stroke="#FFFFFF" strokeWidth="1" strokeDasharray="6 6" opacity="0.4" />
          {/* White Field Goal Line */}
          <line x1="0" y1="230" x2="400" y2="230" stroke="#FFFFFF" strokeWidth="6" opacity="0.8" />
          {/* Ball Shadow */}
          <ellipse cx="200" cy="225" rx="45" ry="14" fill="#052E16" opacity="0.4" />
          {/* Soccer Ball */}
          <g transform="translate(200, 160)">
            <circle cx="0" cy="0" r="48" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="2" />
            {/* Central Black Pentagon */}
            <polygon points="0,-18 17,-5 11,15 -11,15 -17,-5" fill="#0F172A" />
            {/* Surrounding Lines to Outer Pentagons */}
            <line x1="0" y1="-18" x2="0" y2="-48" stroke="#0F172A" strokeWidth="3" />
            <line x1="17" y1="-5" x2="44" y2="-15" stroke="#0F172A" strokeWidth="3" />
            <line x1="11" y1="15" x2="35" y2="35" stroke="#0F172A" strokeWidth="3" />
            <line x1="-11" y1="15" x2="-35" y2="35" stroke="#0F172A" strokeWidth="3" />
            <line x1="-17" y1="-5" x2="-44" y2="-15" stroke="#0F172A" strokeWidth="3" />
          </g>
          {/* Title Badge */}
          <g transform="translate(20, 20)">
            <rect width="130" height="28" rx="8" fill="#15803D" opacity="0.85" />
            <text x="65" y="18" fill="#FFFFFF" fontSize="12" fontWeight="700" textAnchor="middle" fontFamily="sans-serif">足球 • Đá bóng</text>
          </g>
        </svg>
      );

    case 'handshake':
      return (
        <svg viewBox="0 0 400 300" className="w-full h-full select-none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="bgHandshake" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#EFF6FF" />
              <stop offset="100%" stopColor="#DBEAFE" />
            </linearGradient>
          </defs>
          <rect width="400" height="300" fill="url(#bgHandshake)" />
          {/* Golden Sunburst Accents */}
          <circle cx="200" cy="150" r="110" fill="#FEF3C7" opacity="0.6" />
          {/* Two Hands Clasped in Handshake */}
          <g transform="translate(200, 150)">
            {/* Left Arm & Navy Suit Sleeve */}
            <path d="M-180 50 L-90 20 L-90 -20 L-180 -50 Z" fill="#1E3A8A" />
            <rect x="-95" y="-20" width="10" height="40" fill="#FFFFFF" />
            {/* Left Hand Skin */}
            <path d="M-85 -15 L -20 -10 L 0 5 L -40 25 L -85 15 Z" fill="#FDBA74" />
            {/* Right Arm & Charcoal Suit Sleeve */}
            <path d="M180 50 L90 20 L90 -20 L180 -50 Z" fill="#334155" />
            <rect x="85" y="-20" width="10" height="40" fill="#FFFFFF" />
            {/* Right Hand Skin & Interlocking Fingers */}
            <path d="M85 -15 L 20 -10 L 0 5 L 40 25 L 85 15 Z" fill="#FDBA74" />
            {/* Fingers Clasping */}
            {[-12, -4, 4, 12].map((y) => (
              <rect key={y} x="-18" y={y} width="36" height="7" rx="3" fill="#FB923C" stroke="#EA580C" strokeWidth="1" />
            ))}
          </g>
          {/* Title Badge */}
          <g transform="translate(20, 20)">
            <rect width="130" height="28" rx="8" fill="#1E40AF" opacity="0.85" />
            <text x="65" y="18" fill="#FFFFFF" fontSize="12" fontWeight="700" textAnchor="middle" fontFamily="sans-serif">握手 • Bắt tay</text>
          </g>
        </svg>
      );

    default:
      return null;
  }
}

/**
 * Fallback Canvas for unlisted scenes or custom emoji
 */
function renderFallbackScene(label: string) {
  // Extract emoji if present
  const emojiMatch = label.match(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/u);
  const emoji = emojiMatch ? emojiMatch[0] : '🖼️';
  const cleanLabel = label.replace(/[\[\]]/g, '').trim();

  return (
    <svg viewBox="0 0 400 300" className="w-full h-full select-none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="fallbackGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#4F46E5" />
          <stop offset="50%" stopColor="#6366F1" />
          <stop offset="100%" stopColor="#818CF8" />
        </linearGradient>
      </defs>
      <rect width="400" height="300" fill="url(#fallbackGrad)" />
      {/* Decorative Grid Lines */}
      <line x1="0" y1="100" x2="400" y2="100" stroke="#FFFFFF" strokeWidth="1" opacity="0.15" />
      <line x1="0" y1="200" x2="400" y2="200" stroke="#FFFFFF" strokeWidth="1" opacity="0.15" />
      <line x1="133" y1="0" x2="133" y2="300" stroke="#FFFFFF" strokeWidth="1" opacity="0.15" />
      <line x1="266" y1="0" x2="266" y2="300" stroke="#FFFFFF" strokeWidth="1" opacity="0.15" />
      {/* Floating Center Badge */}
      <circle cx="200" cy="130" r="55" fill="#FFFFFF" opacity="0.2" />
      <circle cx="200" cy="130" r="45" fill="#FFFFFF" opacity="0.9" />
      <text x="200" y="145" fontSize="48" textAnchor="middle">{emoji}</text>
      {/* Text Label Banner */}
      <rect x="30" y="220" width="340" height="45" rx="10" fill="#0F172A" opacity="0.6" />
      <text x="200" y="248" fill="#FFFFFF" fontSize="13" fontWeight="700" textAnchor="middle" fontFamily="sans-serif">
        {cleanLabel.length > 36 ? cleanLabel.substring(0, 36) + '...' : cleanLabel}
      </text>
    </svg>
  );
}

export const HSKIllustrationCanvas: React.FC<HSKIllustrationProps> = ({
  scene,
  imageUrl,
  alt = 'Hình minh họa đề thi HSK',
  aspectRatio = '4/3',
  heightClass,
  showZoomButton = true,
  onZoom,
  badgeLabel,
  caption,
  className = '',
  isOptionCard = false,
}) => {
  const [imageError, setImageError] = useState(false);

  // Aspect ratio mapping
  const ratioClasses = {
    'video': 'aspect-video',
    '4/3': 'aspect-4/3',
    'square': 'aspect-square',
    'banner': 'aspect-21/9',
  }[aspectRatio];

  const matchedSceneKey = resolveSceneKey(scene || imageUrl);

  // Determine whether to render direct real image
  const isDirectImage = Boolean(
    imageUrl &&
    !imageError &&
    (imageUrl.startsWith('http://') ||
     imageUrl.startsWith('https://') ||
     imageUrl.startsWith('/') ||
     imageUrl.startsWith('data:image/'))
  );

  return (
    <div
      className={`relative w-full rounded-2xl overflow-hidden bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col justify-center items-center group transition-all ${ratioClasses} ${heightClass || ''} ${className}`}
    >
      {/* 1. Real Image Rendering (if URL is valid and not errored) */}
      {isDirectImage ? (
        <img
          src={imageUrl}
          alt={alt}
          onError={() => setImageError(true)}
          className="w-full h-full object-cover select-none"
        />
      ) : matchedSceneKey ? (
        // 2. High-Fidelity Vector SVG Scene
        renderSvgScene(matchedSceneKey)
      ) : (
        // 3. Fallback Canvas with extracted Emoji
        renderFallbackScene(scene || 'Hình minh họa')
      )}

      {/* Top Badge Overlay (if provided) */}
      {badgeLabel && (
        <div className="absolute top-2.5 left-2.5 z-10 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-xs text-white text-[11px] font-bold shadow-xs">
          {badgeLabel}
        </div>
      )}

      {/* Zoom Button Overlay */}
      {showZoomButton && onZoom && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onZoom();
          }}
          title="Phóng to hình minh họa (Zoom)"
          className="absolute top-2.5 right-2.5 z-10 p-2 rounded-xl bg-black/50 hover:bg-black/75 text-white backdrop-blur-xs transition-all opacity-80 group-hover:opacity-100 shadow-md cursor-pointer hover:scale-105 active:scale-95"
          aria-label="Phóng to hình ảnh"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      )}

      {/* Optional Bottom Caption inside option card or stem */}
      {caption && !isOptionCard && (
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2.5 text-center">
          <span className="text-xs text-white font-medium drop-shadow-xs">
            {caption}
          </span>
        </div>
      )}
    </div>
  );
};

export default HSKIllustrationCanvas;
