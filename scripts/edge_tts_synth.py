import sys
import os
import asyncio
import edge_tts

async def synthesize(text: str, voice: str, rate: str, output_path: str):
    dir_name = os.path.dirname(os.path.abspath(output_path))
    if dir_name:
        os.makedirs(dir_name, exist_ok=True)
    communicator = edge_tts.Communicate(text, voice, rate=rate)
    await communicator.save(output_path)

if __name__ == '__main__':
    if len(sys.argv) < 3:
        print("Usage: python edge_tts_synth.py <text> <output_path> [voice] [rate]")
        sys.exit(1)
    
    text = sys.argv[1]
    output_path = sys.argv[2]
    voice = sys.argv[3] if len(sys.argv) > 3 and sys.argv[3] else "zh-CN-XiaoxiaoNeural"
    rate = sys.argv[4] if len(sys.argv) > 4 and sys.argv[4] else "+0%"

    try:
        asyncio.run(synthesize(text, voice, rate, output_path))
        print("SUCCESS")
    except Exception as e:
        print(f"ERROR: {e}", file=sys.stderr)
        sys.exit(1)
