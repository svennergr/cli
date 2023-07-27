#!/usr/bin/env node

import fs from "fs";
import path from "path";
import glob from "fast-glob";
import https from "https";

const cleanManifest = (manifest) => {
  return Object.entries(manifest.commands).reduce((acc, [command, details]) => {
    acc[command] = {
      id: details.id,
      description: details.description,
      flags: Object.entries(details.flags).reduce((flagsAcc, [flag, flagDetails]) => {
        flagsAcc[flag] = {
          name: flagDetails.name,
          type: flagDetails.type,
          description: flagDetails.description,
          multiple: flagDetails.multiple,
          default: flagDetails.default,
        };
        return flagsAcc;
      }, {}),
      args: details.args,
    };
    return acc;
  }, {});
};

const concatenateAndCleanManifests = (files) => {
  return files.reduce((acc, file) => {
    const manifest = JSON.parse(fs.readFileSync(file, 'utf8'));
    const cleanedManifest = cleanManifest(manifest);
    return { ...acc, ...cleanedManifest };
  }, {});
};

const files = [
  'packages/app/oclif.manifest.json',
  'packages/cli/oclif.manifest.json',
  'packages/create-app/oclif.manifest.json',
];

const concatenatedAndCleanedManifests = concatenateAndCleanManifests(files);

fs.writeFileSync('ai.json', JSON.stringify(concatenatedAndCleanedManifests));
console.log('Done!');
