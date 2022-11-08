import React, { useEffect, useState } from 'react'

import { Wavs } from '../api/files';
import { useAudioRecorder } from 'react-audio-voice-recorder';

import {Art} from '../api/collections'
window.art = Art
let ran_once = false

export const Recorder = ({running, setTicker}) => {
  const {isRecording, startRecording, stopRecording, recordingBlob, recordingTime} = useAudioRecorder()

  const [auto, setAuto] = useState(false)

  const onComplete = (blob) => {
    const outputFile = new File([blob], "output3.wav")
    const upload_instance = Wavs.insert({
      file: outputFile,
      chunkSize: 'dynamic'
    }, true)
    setTicker(false)
    upload_instance.on('end', (e, f) => {
      const ready = Meteor.call('New File', f)
      console.log({ready})
    })
  };

  useEffect(() => {
    if (recordingTime > 30) stopRecording()
  }, [recordingTime])

  useEffect(() => {
    recordingBlob && onComplete(recordingBlob)
  }, [recordingBlob])

  useEffect(() => {
    if (auto && !running && !isRecording) startRecording()
  }, [running, isRecording, auto])
  
  return ( <div>
    <div>{running && "Running"}</div>
    <div>
      <input type="checkbox" value={auto} onChange={e => setAuto(!auto)} />
      <span onClick={() => {
        setTicker(true)
        startRecording()
      }}
      > START </span>
    </div>
  </div>
  )
}