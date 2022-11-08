import React, {useCallback, useEffect, useState} from 'react';
import { useTracker } from 'meteor/react-meteor-data';
import {Art, Config} from '../api/collections'
import { Recorder } from './Hello.jsx';

const ImageContainer = ({c}) => {
  const [showDesc, setShowDesc] = useState(false)
  if (!c._id) return <div>1</div>
  return <div>
    <div style={{
      position: 'relative',
    }}>
    <div style={{
      display: 'flex'
    }}>
      <div>
        <img 
          style={{
            height: '89vh',
          }} 
          src={c.image_url} />
        <div 
          onClick={() => Meteor.call('Generate Image', c._id)}
          style={{position: 'absolute', top: 20, left: 20}} >Reload Image Only</div>
      </div>
      <div style={{
        margin: 15,
      }}>
        <div style={{position: 'relative', fontSize: 24}}>
          <div 
            onClick={() => Meteor.call('Generate Prompt', c._id)}
            style={{position: 'absolute', top: 250, right: 20}}>Reload From Prompt</div>
          {c.dale_prompt}
        </div>
        <hr/>
        {c.conv.split("\n").map((l,i) => {
          return <div style={{fontSize: 18, marginBottom: 10}} key={l}>{l.replace(/\[.*?\]/," - ")}</div>
        })}
        <div>{`Stopped recording at ${new Date(c.startedAt)}`}</div>
        {c.finishedAt && 
          <div>Overall image generation took {(c.finishedAt - c.startedAt) / 1000} seconds</div>
        }
      </div>
    </div>
    </div>
  </div>
}

const Configuration = ({closeMe, config}) => {
  if (!config) return <div>Something is wrong here</div>
  const [apiKey, setApiKey] = useState(config.apiKey)
  const [model, setModel] = useState(config.model)
  const [textModel, setTextModel] = useState(config.textModel)
  const save = () => {
    Config.update({
      _id: config._id
    }, {
      $set: {
        apiKey, model
      }
    })
    closeMe()
  }
  return <div style={{
    position: 'absolute',
    top: '33%',
    left: '20%',
    right: '33%',
    backgroundColor: 'white',
    padding: 5,
    zIndex: 3,
    border: 'solid thin black',
    }}>
      <div style={{padding: 5, margin: 5}}>
        <span>OpenAI API Token: </span>
        <input type='text' value={apiKey} onChange={e => setApiKey(e.currentTarget.value)} />
      </div>
      <div style={{padding: 5, margin: 5}}>
        <span>Whisper model: </span>
        <input type='text' value={model} onChange={e => setModel(e.currentTarget.value)} />
        <span> [base, small, medium, large]</span>
      </div>
      <div style={{padding: 5, margin: 5}}>
        <span>Text model: </span>
        <input type='text' value={textModel} onChange={e => setTextModel(e.currentTarget.value)} />
        <span> [text-curie-001, text-davinci-002]</span>
      </div>
      <div>
        <input type='button' onClick={save} value={`Save`} />
      </div>
  </div>
}

export const BlankScreen = ({config}) => {
  return <div>
    {!config?.apiKey && <div>
      <div>Welcome!</div>
      <div>In order to activate "Conversation Piece" your must enter a valid OpenAI API key</div>
      <div>Visit <a href="https://beta.openai.com/account/api-keys">OpenAI</a> for more details</div>
    </div>}
    <div>There is no art to display
      {config?.apiKey && ` press "Start" to activate.`}
    </div>
  </div>
}

export const Info = () => {
  const config = useTracker(() => Config.findOne())
  const currentArt = useTracker(() => Art.findOne({image_url: { $exists: true}}, {sort: {startedAt: -1}}))
  const last_image = useTracker(() => Art.findOne({}, {sort: {startedAt: -1}}))
  const [showConfig, setShowConfig] = useState(false)
  const [ticker, setTicker] = useState(false)
  let running = false
  if (!last_image || !currentArt) {
    running = false
  } else {
    running = (last_image._id != currentArt._id)
  }
  return <div>
    <div style={{display: 'flex', borderBottom: 'solid thin black'}}>
      {config?.apiKey && <Recorder running={running} setTicker={setTicker}/> }
      <div style={{
        textAlign: 'center',
        fontSize: 32,
        flexGrow: 1,
        lineHeight: '30px',
        marginTop: '-15px',
      }}> 
      Conversation
      <img 
        style={{height: '35px'}} src='/logo.png'
        onClick={() => setShowConfig(!showConfig)}
       />
      Piece
      </div>
    </div>
    {showConfig && <Configuration config={config} closeMe={() => setShowConfig(false)} />}
    {currentArt && <ImageContainer c={currentArt}  /> }
    {!currentArt && <BlankScreen config={config} />}
    {ticker && <div>
      <div class="ticker-wrap">
        <div class="ticker">
          <div class="ticker__item">
            Be aware, part of the conversation will be recorded for quality assurances and our ongoing effort to improve, thank you
          </div>
        </div>
      </div>
  </div>}
</div>
}