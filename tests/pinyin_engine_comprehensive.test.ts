import { describe, it, expect } from 'vitest';
import {
  generateAccuratePinyin,
  isPinyinAligned,
  normalizePinyinForAlignment,
} from '../src/utils/pinyinEngine.js';

describe('Minnese Pinyin & Tone Sandhi Engine (HSK 3.0 / GB/T 16159-2012 Standard)', () => {
  it('1. Correctly applies tone sandhi for "一" (yí before 4th tone, yì before 1/2/3, yi in V-一-V)', () => {
    // Before 4th tone -> yí
    expect(generateAccuratePinyin('一个')).toContain('yí gè');
    expect(generateAccuratePinyin('一定')).toContain('yí dìng');
    expect(generateAccuratePinyin('一样')).toContain('yí yàng');
    expect(generateAccuratePinyin('一下')).toContain('yí xià');

    // Before 1st, 2nd, 3rd tone -> yì
    expect(generateAccuratePinyin('一天')).toContain('yì tiān');
    expect(generateAccuratePinyin('一起')).toContain('yì qǐ');
    expect(generateAccuratePinyin('一直')).toContain('yì zhí');
    expect(generateAccuratePinyin('一本')).toContain('yì běn');

    // Between repeated verbs -> yi
    expect(generateAccuratePinyin('看一看')).toBe('kàn yi kàn');
    expect(generateAccuratePinyin('想一想')).toBe('xiǎng yi xiǎng');
    expect(generateAccuratePinyin('试一试')).toBe('shì yi shì');
  });

  it('2. Correctly applies tone sandhi for "不" (bú before 4th tone, bu in V-不-V / potential complements)', () => {
    // Before 4th tone -> bú
    expect(generateAccuratePinyin('不是')).toContain('bú shì');
    expect(generateAccuratePinyin('不用')).toContain('bú yòng');
    expect(generateAccuratePinyin('不对')).toContain('bú duì');
    expect(generateAccuratePinyin('不要')).toContain('bú yào');

    // Before 1st, 2nd, 3rd tone -> bù
    expect(generateAccuratePinyin('不吃')).toContain('bù chī');
    expect(generateAccuratePinyin('不行')).toContain('bù xíng');
    expect(generateAccuratePinyin('不好')).toContain('bù hǎo');

    // Affirmative-negative V-不-V -> bu
    expect(generateAccuratePinyin('是不是')).toBe('shì bu shì');
    expect(generateAccuratePinyin('去不去')).toBe('qù bu qù');
    expect(generateAccuratePinyin('好不好')).toBe('hǎo bu hǎo');
    expect(generateAccuratePinyin('行不行')).toBe('xíng bu xíng');
    expect(generateAccuratePinyin('对不对')).toBe('duì bu duì');

    // Potential complements -> bu
    expect(generateAccuratePinyin('做不完')).toBe('zuò bu wán');
    expect(generateAccuratePinyin('看不懂')).toBe('kàn bu dǒng');
    expect(generateAccuratePinyin('吃不下')).toBe('chī bu xià');
  });

  it('3. Disambiguates structural particles "地" (de), "得" (de), "着" (zhe)', () => {
    // Adverbial marker 地 -> de (not dì)
    expect(generateAccuratePinyin('慢慢地走')).toBe('màn màn de zǒu');
    expect(generateAccuratePinyin('认真地听')).toBe('rèn zhēn de tīng');
    expect(generateAccuratePinyin('高兴地说')).toBe('gāo xìng de shuō');

    // Complement marker 得 -> de (not dé)
    expect(generateAccuratePinyin('跑得真快')).toBe('pǎo de zhēn kuài');
    expect(generateAccuratePinyin('说得很好')).toBe('shuō de hěn hǎo');
    expect(generateAccuratePinyin('考得不错')).toBe('kǎo de bú cuò');

    // Progressive aspect marker 着 -> zhe
    expect(generateAccuratePinyin('看着我')).toBe('kàn zhe wǒ');
    expect(generateAccuratePinyin('听着音乐')).toBe('tīng zhe yīn yuè');
  });

  it('4. Resolves HSK polyphones and standard neutral tone vocabulary', () => {
    expect(generateAccuratePinyin('什么时候')).toBe('shén me shí hou');
    expect(generateAccuratePinyin('买东西')).toBe('mǎi dōng xi');
    expect(generateAccuratePinyin('告诉')).toBe('gào su');
    expect(generateAccuratePinyin('便宜')).toBe('pián yi');
    expect(generateAccuratePinyin('清楚')).toBe('qīng chu');
    expect(generateAccuratePinyin('地方')).toBe('dì fang');

    // Polyphones
    expect(generateAccuratePinyin('有空')).toBe('yǒu kòng');
    expect(generateAccuratePinyin('没空')).toBe('méi kòng');
    expect(generateAccuratePinyin('还钱')).toBe('huán qián');
    expect(generateAccuratePinyin('还书')).toBe('huán shū');
    expect(generateAccuratePinyin('银行')).toBe('yín háng');
    expect(generateAccuratePinyin('教室')).toBe('jiào shì');
    expect(generateAccuratePinyin('重新开始')).toBe('chóng xīn kāi shǐ');
  });

  it('5. isPinyinAligned accepts legitimate tone sandhi and neutral tone equivalences without false rejections', () => {
    // "一" sandhi
    expect(isPinyinAligned('yī gè', 'yí gè')).toBe(true);
    expect(isPinyinAligned('yì tiān', 'yī tiān')).toBe(true);

    // "不" sandhi
    expect(isPinyinAligned('bú shì', 'bù shì')).toBe(true);
    expect(isPinyinAligned('qù bu qù', 'qù bù qù')).toBe(true);

    // Structural particles
    expect(isPinyinAligned('màn màn de zǒu', 'màn màn dì zǒu')).toBe(true);
    expect(isPinyinAligned('pǎo de kuài', 'pǎo dé kuài')).toBe(true);

    // Neutral tone variations
    expect(isPinyinAligned('shén me shí hou', 'shén me shí hòu')).toBe(true);
    expect(isPinyinAligned('mǎi dōng xi', 'mǎi dōng xī')).toBe(true);

    // Third-tone sandhi
    expect(isPinyinAligned('ní hǎo', 'nǐ hǎo')).toBe(true);

    // Genuine mismatch must still be rejected
    expect(isPinyinAligned('kàn shū', 'kàn bào')).toBe(false);
    expect(isPinyinAligned('shàng wǔ', 'xià wǔ')).toBe(false);
  });
});
