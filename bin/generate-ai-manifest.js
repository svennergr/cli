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

// Function to fetch the content of a webpage
const fetchWebpageContent = (url) => {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        const mainContentMatch = data.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
        const mainContent = mainContentMatch ? mainContentMatch[1] : '';

        // Remove HTML tags, JavaScript code, and extra whitespace
        const textContent = mainContent
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/<[^>]*>/g, '')
          .replace(/[\t\r ]+\n/g, '\n') // remove spaces/tabs preceding line breaks
          .replace(/\n[\t\r ]+/g, '\n') // remove spaces/tabs following line breaks
          .replace(/\n+/g, ' ') // replace line breaks with a space
          .trim();
        resolve(textContent);
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
};

const fetchDocs = async (urls) => {
  const docs = {};
  for (const url of urls) {
    docs[url] = await fetchWebpageContent(url);
  }
  return docs;
};

const files = [
  'packages/app/oclif.manifest.json',
  'packages/cli/oclif.manifest.json',
  'packages/create-app/oclif.manifest.json',
];

const concatenatedAndCleanedManifests = concatenateAndCleanManifests(files);

const docsUrls = [
  'https://shopify.dev/docs/apps/tools/cli',
  'https://shopify.dev/docs/apps/tools/cli/commands',
  'https://shopify.dev/docs/apps/tools/cli/structure',
  'https://shopify.dev/docs/apps/tools/cli/existing',
  'https://shopify.dev/docs/apps/app-extensions/list',
  'https://shopify.dev/docs/apps/marketing/pixels'
];

fetchDocs(docsUrls).then((docs) => {
  const output = {
    commands: concatenatedAndCleanedManifests,
    docs,
  };

  fs.writeFileSync('ai.json', JSON.stringify(output));

  console.log('Done!');
}).catch((error) => {
  console.error(`Error fetching docs: ${error}`);
});
