import asyncio
import edge_tts

async def main():
    # Test 1: "AI小语，你好！"
    comm1 = edge_tts.Communicate("AI小语，你好！", "zh-CN-XiaoxiaoNeural", pitch="+0Hz", rate="-2%")
    await comm1.save("scripts/test1_ai.mp3")

    # Test 2: "A-I 小语，你好！"
    comm2 = edge_tts.Communicate("A I 小语，你好！", "zh-CN-XiaoxiaoNeural", pitch="+0Hz", rate="-2%")
    await comm2.save("scripts/test2_ai.mp3")

    # Test 3: "小语，你好！"
    comm3 = edge_tts.Communicate("小语，你好！", "zh-CN-XiaoxiaoNeural", pitch="+0Hz", rate="-2%")
    await comm3.save("scripts/test3_plain.mp3")

asyncio.run(main())
