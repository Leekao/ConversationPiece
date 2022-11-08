import { Meteor } from 'meteor/meteor';
import { FilesCollection } from 'meteor/ostrio:files';
import path from 'path'

export const Wavs = new FilesCollection({
  collectionName: 'wavs',
  storagePath: path.resolve('/AOC_tmp/wavs'),
});

export const Images = new FilesCollection({
  collectionName: 'images',
  storagePath: path.resolve('/AOC_tmp/images'),
});



if (Meteor.isClient) {
  Meteor.subscribe('files.all');
}

if (Meteor.isServer) {
  Meteor.publish('files.all', function () {
    return [
      Images.find().cursor,
      Wavs.find().cursor]

  });
  Meteor.publish('files.wavs.all', function () {
  });
}