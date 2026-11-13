"""Challenger Adversarial Stress Suite: Python TTS Service (tts_service.py)

Empirically stress-tests:
1. parse_dialogue_segments edge cases (empty, whitespace, monologue, complex speaker roles, fullwidth/halfwidth colons, question stripping, fullwidth punctuation).
2. resolve_dialogue_pair voice resolution logic (gender mapping, seeds, fallbacks).
3. 5000-character boundary precision in generate_audio.
4. Chime generation and audio synthesis with fullwidth Chinese punctuation and special characters.
5. Surface defect: Question prompt stripping failure when 问： immediately follows Chinese punctuation without whitespace.
"""

import sys
import os
import unittest
import mutagen.mp3

# Ensure project root is in sys.path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from tts_service import (
    parse_dialogue_segments,
    resolve_dialogue_pair,
    generate_audio,
    get_or_create_chime,
    VOICES_CATALOG,
    DEFAULT_VOICE,
    FALLBACK_VOICE,
)


class TestTtsServiceAdversarial(unittest.TestCase):
    def test_empty_and_whitespace_dialogue_parsing(self):
        """Tests that empty and whitespace scripts return empty segments safely without crash."""
        for empty_val in ["", "   ", "\t\r\n", "   \n\n\t  "]:
            segments, m_v, f_v = parse_dialogue_segments(empty_val)
            self.assertEqual(segments, [], f"Failed on empty_val: {repr(empty_val)}")
            self.assertIn(m_v, VOICES_CATALOG)
            self.assertIn(f_v, VOICES_CATALOG)

    def test_monologue_without_speaker_tags(self):
        """Monologue should be returned as a single segment with speaker tags intact/unaffected."""
        script = "今天天气很好，我和朋友一起去北海公园划船，玩得非常开心。"
        segments, m_v, f_v = parse_dialogue_segments(script)
        self.assertEqual(len(segments), 1)
        self.assertEqual(segments[0][0], DEFAULT_VOICE)
        self.assertEqual(segments[0][1], script)

    def test_dialogue_speaker_tag_stripping_with_newline_question(self):
        """Dialogue speaker tags (男：, 女：) and questions separated by newline (问：...) are stripped."""
        script = (
            "男：今天天气真好，我们去公园吧。\n"
            "女：好啊，我也正想出去走走呢。\n"
            "问：他们打算去哪儿？"
        )
        segments, m_v, f_v = parse_dialogue_segments(script)
        self.assertEqual(len(segments), 2, "Expected exactly 2 dialogue segments (question must be excluded)")
        
        # Segment 1 should be male voice without "男："
        self.assertEqual(segments[0][0], m_v)
        self.assertEqual(segments[0][1], "今天天气真好，我们去公园吧。")
        self.assertFalse(segments[0][1].startswith("男"))
        
        # Segment 2 should be female voice without "女："
        self.assertEqual(segments[1][0], f_v)
        self.assertEqual(segments[1][1], "好啊，我也正想出去走走呢。")
        self.assertFalse(segments[1][1].startswith("女"))

    def test_halfwidth_colons_and_spaced_speaker_tags(self):
        """Speaker tags with halfwidth ASCII colons or spaces around colons must also be stripped."""
        script = (
            "男: 请问王老师在办公室吗？\n"
            "女 : 王老师去开会了，下午两点才回来。\n"
            "Question: 王老师在哪儿？"
        )
        segments, m_v, f_v = parse_dialogue_segments(script)
        self.assertEqual(len(segments), 2)
        self.assertEqual(segments[0][1], "请问王老师在办公室吗？")
        self.assertEqual(segments[1][1], "王老师去开会了，下午两点才回来。")

    def test_family_and_diverse_speaker_indicators(self):
        """Diverse roles (爸爸, 妈妈, 儿子, 老师) must be mapped to appropriate gender voices."""
        script = (
            "爸爸说：儿子，今天考试成绩怎么样？\n"
            "儿子说：我考了一百分！\n"
            "妈妈：太棒了，今天晚上给你做好吃的。\n"
            "★ 儿子考得怎么样？"
        )
        segments, m_v, f_v = parse_dialogue_segments(script)
        self.assertEqual(len(segments), 3)
        # 爸爸 -> male
        self.assertEqual(segments[0][0], m_v)
        self.assertEqual(segments[0][1], "儿子，今天考试成绩怎么样？")
        # 儿子 -> male
        self.assertEqual(segments[1][0], m_v)
        self.assertEqual(segments[1][1], "我考了一百分！")
        # 妈妈 -> female
        self.assertEqual(segments[2][0], f_v)
        self.assertEqual(segments[2][1], "太棒了，今天晚上给你做好吃的。")

    def test_inline_dialogue_with_whitespace_before_question(self):
        """Inline dialogue on a single line separated by whitespace before question works."""
        script = "男：你吃午饭了吗？ 女：还没呢，我们一起去食堂吧。 问：他们接下来要做什么？"
        segments, m_v, f_v = parse_dialogue_segments(script)
        self.assertEqual(len(segments), 2)
        self.assertEqual(segments[0][1], "你吃午饭了吗？")
        self.assertEqual(segments[1][1], "还没呢，我们一起去食堂吧。")

    def test_defect_inline_question_following_punctuation_without_whitespace(self):
        """
        DEMONSTRATES DEFECT IN tts_service.py:159
        When 问： directly follows Chinese punctuation without whitespace (e.g. '...食堂吧。问：...'),
        the regex re.split(r'(?:[\\r\\n\\s]+|^)(?:问|Question|★)...') FAILS to match because '。'
        is not in [\\r\\n\\s]+.
        Consequently, 问 is treated as a speaker tag and the question prompt is vocalized in the audio!
        """
        script = "男：你吃午饭了吗？女：还没呢，我们一起去食堂吧。问：他们接下来要做什么？"
        segments, m_v, f_v = parse_dialogue_segments(script)
        
        # Verify the actual behavior: 3 segments instead of 2, with the question prompt leaked as 3rd segment
        has_leaked_question = len(segments) == 3 and "要做什么" in segments[2][1]
        self.assertTrue(
            has_leaked_question,
            "Defect confirmed: When 问： directly follows punctuation without whitespace, question is voiced aloud."
        )

    def test_chinese_fullwidth_punctuation_preservation(self):
        """Fullwidth Chinese punctuation, quotes, dashes, ellipses must be safely preserved in segment."""
        script = (
            "男：“小王，你明天有空吗？”——我想请你吃饭。\n"
            "女：真不巧……明天我要加班。（叹气）"
        )
        segments, m_v, f_v = parse_dialogue_segments(script)
        self.assertEqual(len(segments), 2)
        self.assertIn("“小王，你明天有空吗？”——我想请你吃饭。", segments[0][1])
        self.assertIn("真不巧……明天我要加班。（叹气）", segments[1][1])

    def test_boundary_script_length_limit(self):
        """generate_audio must reject scripts exceeding 5000 characters."""
        out_tmp = os.path.join(BASE_DIR, "public", "audio", "tmp_test_limit.mp3")
        
        # 5001 characters
        res_5001 = generate_audio("字" * 5001, out_tmp)
        self.assertFalse(res_5001["success"])
        self.assertIn("5000", res_5001["error"])

        # Empty string
        res_empty = generate_audio("", out_tmp)
        self.assertFalse(res_empty["success"])
        self.assertIn("không được để trống", res_empty["error"])

    def test_chime_generation_returns_valid_bytes(self):
        """get_or_create_chime must return non-empty MP3 audio bytes."""
        chime_bytes = get_or_create_chime()
        self.assertIsInstance(chime_bytes, bytes)
        self.assertGreater(len(chime_bytes), 100, "Chime intro MP3 must have at least 100 bytes")

    def test_live_synthesis_with_chime_and_dialogue(self):
        """Generates real audio file via Edge-TTS and mutagen, verifying duration > 1.25s (with chime)."""
        out_mp3 = os.path.join(BASE_DIR, "public", "audio", "test_challenger_live_chime.mp3")
        try:
            res = generate_audio(
                text="男：你好！\n女：你好！\n问：他们说了什么？",
                output_path=out_mp3,
                voice="auto",
                intro_chime=True,
            )
            self.assertTrue(res["success"], f"Synthesis failed: {res.get('error')}")
            self.assertTrue(os.path.isfile(out_mp3))
            self.assertGreater(os.path.getsize(out_mp3), 1000)
            
            # Read mutagen duration
            audio = mutagen.mp3.MP3(out_mp3)
            duration = float(audio.info.length)
            self.assertGreater(duration, 1.2, "Duration should be greater than 1.2s due to chime + speech")
        finally:
            if os.path.exists(out_mp3):
                try:
                    os.remove(out_mp3)
                except Exception:
                    pass


if __name__ == "__main__":
    unittest.main()
