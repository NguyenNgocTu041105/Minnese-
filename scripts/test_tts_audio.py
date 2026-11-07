import asyncio
import edge_tts

async def test_tts(text, voice, pitch="+0Hz", rate="+0%"):
    comm = edge_tts.Communicate(text, voice, pitch=pitch, rate=rate)
    chunks = []
    async for chunk in comm.stream():
        if chunk["type"] == "audio":
            chunks.append(chunk["data"])
    return b"".join(chunks)

async def main():
    # Test Xiaoxiao with "AI小语，你好！"
    data1 = await test_tts("AI小语，你好！", "zh-CN-XiaoxiaoNeural")
    with open("scripts/test_ai_xiaoxiao.mp3", "wb") as f:
        f.write(data1)
    print("Synthesized test_ai_xiaoxiao.mp3, length:", len(data1))

    # Test Xiaoxiao with "小语，你好！" (Without AI)
    data2 = await test_tts("小语，你好！", "zh-CN-XiaoxiaoNeural")
    with open("scripts/test_xiaoxiao_noai.mp3", "wb") as f:
        f.write(data2)
    print("Synthesized test_xiaoxiao_noai.mp3, length:", len(data2))

asyncio.run(main())
