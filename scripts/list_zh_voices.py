import asyncio
import edge_tts

async def main():
    voices = await edge_tts.list_voices()
    zh = [v for v in voices if 'zh-' in v['Locale']]
    for v in zh:
        print(v['ShortName'], '|', v['Gender'], '|', v['FriendlyName'])

asyncio.run(main())
