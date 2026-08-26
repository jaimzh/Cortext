import tempfile, os
from faster_whisper import WhisperModel

model = WhisperModel("base", device="cpu", compute_type="int8")



def transcribe_audio(audio_bytes: bytes, suffix:str='.m4a'):
    
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp:
        temp.write(audio_bytes)
        temp_path = temp.name
        
    #create a temp file storing the audio as a .webm and then deleting after transcription   
    try:
        segments, _ = model.transcribe(temp_path, beam_size=1, language="en")
        
        text = ""
        for segment in segments:
            text += segment.text
            print(text)
    
        return text.strip()
        
    finally:
        os.remove(temp_path)
        
    

