import asyncio
import edge_tts
from mutagen.mp3 import MP3

async def main():
    # Xiaoni (Shaanxi dialect)
    comm1 = edge_tts.Communicate("你好，小语！", "zh-CN-shaanxi-XiaoniNeural", pitch="+6Hz", rate="-2%")
    await comm1.save("scripts/test_xiaoni.mp3")

    # Xiaoyi (Standard Mainland Putonghua)
    comm2 = edge_tts.Communicate("你好，小语！", "zh-CN-XiaoyiNeural", pitch="+0Hz", rate="-2%")
    await comm2.save("scripts/test_xiaoyi.mp3")

    # Xiaoxiao (Standard Mainland Putonghua)
    comm3 = edge_tts.Communicate("你好，小语！", "zh-CN-XiaoxiaoNeural", pitch="+0Hz", rate="-2%")
    await comm3.save("scripts/test_xiaoxiao.mp3")

    # Yunxi (Standard Mainland Putonghua Male)
    comm4 = edge_tts.Communicate("你好，小语！", "zh-CN-YunxiNeural", pitch="+0Hz", rate="-2%")
    await comm4.save("scripts/test_yunxi.mp3")

    print("Xiaoni length:", MP3("scripts/test_xiaoni.mp3").info.length)
    print("Xiaoyi length:", MP3("scripts/test_xiaoyi.mp3").info.length)
    print("Xiaoxiao length:", MP3("scripts/test_xiaoxiao.mp3").info.length)
    print("Yunxi length:", MP3("scripts/test_yunxi.mp3").info.length)

asyncio.run(main())
