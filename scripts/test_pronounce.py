import asyncio
import edge_tts

async def test_pronunciation():
    # Test 1: raw "AI小语，你好！"
    comm1 = edge_tts.Communicate("AI小语，你好！", "zh-CN-XiaoxiaoNeural")
    await comm1.save("scripts/test_raw_ai.mp3")

    # Test 2: "A-I小语，你好！"
    comm2 = edge_tts.Communicate("A I 小语，你好！", "zh-CN-XiaoxiaoNeural")
    await comm2.save("scripts/test_spaced_ai.mp3")

    # Test 3: "小语，你好！"
    comm3 = edge_tts.Communicate("小语，你好！", "zh-CN-XiaoxiaoNeural")
    await comm3.save("scripts/test_plain.mp3")

    print("Generated test audio files successfully!")

asyncio.run(test_pronunciation())
