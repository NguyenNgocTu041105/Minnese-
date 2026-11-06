import asyncio
import edge_tts

async def list_voices():
    voices = await edge_tts.list_voices()
    zh_voices = [v for v in voices if v['Locale'].startswith('zh-CN')]
    for v in zh_voices:
        print(v['ShortName'], '|', v['Gender'], '|', v['FriendlyName'])

if __name__ == '__main__':
    asyncio.run(list_voices())
