const util = require('util');
const exec = util.promisify(require('child_process').exec);

import { Meteor } from 'meteor/meteor';
import { Wavs, Images } from '../imports/api/files'
import { Configuration, OpenAIApi } from "openai"
import {Config, Art} from '../imports/api/collections'

let openApiConfig, openai

let config = Config.findOne()
if (!config) {
  Config.insert({
    apiKey: '',
    model: 'base',
    textModel: 'text-curie-001'
  })
} else {
  openApiConfig = new Configuration({ apiKey: config.apiKey.replace("\r\n","") });
  openai = new OpenAIApi(openApiConfig);
  console.log({config})
}

const create_image = async (prompt, _id) => {
  try {
    const image = await openai.createImage({
      prompt, n: 1, size: "1024x1024"
    })
    const image_url = image.data.data[0].url
    Art.update({_id}, {$set :{image_url, finishedAt: new Date().valueOf()}})
    return true
  } catch(e) {
    console.error(e)
  }
  return
}

const preamble = 'Suggest a long and detailed description and art style for a painting that will capture the general theme of the following conversation:'
const get_description = async (conv, _id) => {
  try {
    const completion = await openai.createCompletion({
      model: config.textModel,
      temperature: 0.8,
      max_tokens: 192,
      prompt: `${preamble}:
      
      ${conv}
      
      Description:`,
    });
    const dale_prompt = completion.data.choices[0].text.replace(/(\r\n|\n|\r)/gm, "")
    Art.update({_id}, {$set: {dale_prompt}})
    return await create_image(dale_prompt, _id)
  } catch(e) {
    console.error(e)
  }
  return false
}

let isWhisperRunning = false

Meteor.methods({
  "Reload Configuration": () => {
    config = Config.findOne()
    openApiConfig = new Configuration({ apiKey: config.apiKey });
    openai = new OpenAIApi(openApiConfig);
  },
  "Generate Prompt": async (_id) => {
    conv = Art.findOne({_id}).conv
    get_description(conv, _id)
  },
  "Generate Image": async (_id, prompt) => {
    if (!prompt) prompt = Art.findOne({_id}).dale_prompt
    console.log(1)
    create_image(prompt, _id)
  },
  "New File": async (file) => {
    if (isWhisperRunning) return false
    isWhisperRunning = true
    const {model} = Config.findOne()
    console.log('uploaded: ',file, {model})
    const _id = Art.insert({
      wav_file: file.path,
      model,
      startedAt: new Date().valueOf()
    })
    const {stdout, stderr} = await exec(`whisper ${file.path} --task translate --model ${model}`)
    if (stderr) console.error(stderr)
    const conv = stdout.split('\r\n').slice(2, -1).join('\r\n')
    console.log({conv})
    Art.update({_id}, {$set: {conv}})
    const rslt = await get_description(conv, _id)
    isWhisperRunning = false
    return rslt
  }
})

const remove_old_files = (before) => {
  console.log(`removing art before$ ${new Date(before)} `)
  const arts_to_remove = Art.find({
    finishedAt: { $lt: before }
  })
  .fetch()
  .map(v => v.wav_file)
  const wavs = Wavs.remove({path: {$in: arts_to_remove}})
  const art = Art.remove({
    finishedAt: { $lt: before }
  })
}

Meteor.startup(async () => {
  const file_removal = Meteor.setInterval(() => {
    const now = new Date().valueOf()
    remove_old_files(now - 1000*60*60)
  }, 1000*60*60*6)
  console.log('started')
});
