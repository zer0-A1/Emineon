import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;

    if (!audioFile) {
      return NextResponse.json({ error: 'Audio file is required' }, { status: 400 });
    }

    // Convert File to the format expected by OpenAI
    const audioBuffer = await audioFile.arrayBuffer();
    const audioBlob = new Blob([audioBuffer], { type: audioFile.type });
    
    // Create a File object with the proper format for OpenAI
    const file = new File([audioBlob], audioFile.name || 'recording.wav', {
      type: audioFile.type || 'audio/wav'
    });

    const transcription = await openai.audio.transcriptions.create({
      file: file,
      model: "whisper-1",
      language: "en", // You can make this dynamic based on user preference
      response_format: "text"
    });

    return NextResponse.json({ text: transcription });

  } catch (error) {
    console.error('Error transcribing audio:', error);
    return NextResponse.json(
      { error: 'Failed to transcribe audio' },
      { status: 500 }
    );
  }
} 