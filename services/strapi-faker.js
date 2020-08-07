'use strict';

const fs = require('fs');
const faker = require('faker');
const { fakeModel } = require('../helpers/strapi-faker');

const SEED_NUM_DEFAULT_ITEMS_DEFAULT = 2;
const SEED_OUTPUT_FOLDER_DEFAULT = '.tmp';

const seedDefaultIds = {};
let seedAllIds = {};


const seedModel = async (modelName, model, plugin=null) => {
  const entityIds = [];
  const numSeed = process.env.SEED_NUM_ITEMS || 10;
  const defaultPass = process.env.SEED_DEFAULT_USER_PASSWORD || 'password';
  for (let i = 0; i < numSeed; i++) {
    const seedData = fakeModel(modelName, model);
    if (modelName === 'user') {
      seedData.role = 1;
      seedData.confirmed = true;
      seedData.blocked = false;
      seedData.password = defaultPass;
    }
    try {
      const entity = await strapi.query(modelName, plugin).create(seedData);
      entityIds.push(entity.id);
    } catch (e) {
      strapi.log.error(`Error inserting record; skipping: ${e}`);
    }
  }
  return entityIds;
};

const seedApiModelsWithoutRelations = async () => {
  let numSeeded = 0;
  const modelNamesToSeed = Object.keys(strapi.models).filter(modelName => !modelName.startsWith('strapi_') && !modelName.startsWith('core_'));
  const numDefault = process.env.SEED_NUM_DEFAULT_ITEMS || SEED_NUM_DEFAULT_ITEMS_DEFAULT;
  for (const modelName of modelNamesToSeed) {
    const model = strapi.models[modelName];
    if (modelName.startsWith('strapi_')) {
      continue;
    }
    strapi.log.debug(`[${numSeeded + 1}/${modelNamesToSeed.length}] Seeding w/o relations: ${modelName}`)
    const allIds = await seedModel(modelName, model);
    seedAllIds[modelName] = allIds;
    seedDefaultIds[modelName] = allIds.slice(0, numDefault);
    numSeeded++;
  }
};

const getDefaultModelRelations = (modelName, model) => {
  const result = {};
  for (const [attrName, attr] of Object.entries(model.attributes)) {
    if (['created_by', 'updated_by'].includes(attrName)) {
      continue;
    }
    const relationModelName = attr.model ? attr.model : attr.collection;
    if (!relationModelName || ['role', 'file'].includes(relationModelName)) {
      continue;
    }
    if (!(relationModelName in seedDefaultIds)) {
      strapi.log.warn(`No default ids for relation model ${relationModelName}, attribute ${attrName} on model ${modelName}`);
      continue;
    }
    if ('model' in attr) {
      const relationIds = seedDefaultIds[attr.model];
      result[attrName] = faker.random.arrayElement(relationIds);
    } else if ('collection' in attr) {
      result[attrName] = seedDefaultIds[attr.collection];
    }
  }
  return result;
};

const seedModelRelations = async (modelName, model, plugin=null) => {
  const modelRelations = getDefaultModelRelations(modelName, model);
  for (const fakeModelId of seedDefaultIds[modelName]) {
    const existingEntry = await strapi.query(modelName, plugin).findOne({id: fakeModelId});
    for (const [propertyName, value] of Object.entries(modelRelations)) {
      if (Array.isArray(value)) {
        if (existingEntry[propertyName].length > 0) {
          if (existingEntry[propertyName].length === value.length) {
            delete modelRelations.propertyName;
          } else if (existingEntry[propertyName].length < value.length) {
            const existingIds = existingEntry[propertyName].map(e => e.id);
            const newIdsToAdd = value.filter(v => !existingIds.includes(v));
            modelRelations[propertyName] = existingIds.concat(newIdsToAdd).slice(0, value.length);
          }
        }
      } else {
        if (existingEntry[propertyName]) {
          delete modelRelations.propertyName;
        }
      }
    }
    await strapi.query(modelName, plugin).update({id: fakeModelId}, modelRelations);
  }
};

const seedApiModelsRelations = async () => {
  let numSeeded = 0;
  const modelNamesToSeed = Object.keys(strapi.models).filter(modelName => !modelName.startsWith('strapi_') && !modelName.startsWith('core_'));
  for (const modelName of modelNamesToSeed) {
    const model = strapi.models[modelName];
    strapi.log.debug(`[${numSeeded + 1}/${modelNamesToSeed.length}] Seeding relations: ${modelName}`);
    await seedModelRelations(modelName, model);
    numSeeded++;
  }
};

const persistSeedOutput = async () => {
  const seedOutputFolder = process.env.SEED_OUTPUT_FOLDER || SEED_OUTPUT_FOLDER_DEFAULT;
  if (!fs.existsSync(seedOutputFolder)) {
    strapi.log.debug(`Creating folder ${seedOutputFolder}`);
    fs.mkdirSync(seedOutputFolder);
  }

  fs.writeFileSync(`${seedOutputFolder}/seed_output_default.json`, JSON.stringify(seedDefaultIds));
  fs.writeFileSync(`${seedOutputFolder}/seed_output_full.json`, JSON.stringify(seedAllIds));
  strapi.log.info(`Persisted seed output to ${seedOutputFolder}/seed_output_default.json & ${seedOutputFolder}/seed_output_full.json`);
};

const readSeedOutput = () => {
  const seedOutputFolder = process.env.SEED_OUTPUT_FOLDER || SEED_OUTPUT_FOLDER_DEFAULT;
  if (!fs.existsSync(`${seedOutputFolder}/seed_output_full.json`)) {
    strapi.log.error('No previous seed output found. Run `up` before running `down`')
    return null;
  }
  return JSON.parse(fs.readFileSync(`${seedOutputFolder}/seed_output_full.json`));
};


module.exports =  {

  async up() {

    strapi.log.debug('Seeding w/o relations: user')
    const userModel = strapi.getModel('user', 'users-permissions');
    const allUserIds = await seedModel('user', userModel, 'users-permissions');
    strapi.log.debug('Seeding relations: user')
    seedAllIds['user'] = allUserIds;
    const numDefault = process.env.SEED_NUM_DEFAULT_ITEMS || SEED_NUM_DEFAULT_ITEMS_DEFAULT;
    seedDefaultIds['user'] = allUserIds.slice(0, numDefault);
    await seedApiModelsWithoutRelations();
    await seedModelRelations('user', userModel, 'users-permissions');
    await seedApiModelsRelations();
    await persistSeedOutput();
  },

  async down() {
    seedAllIds = readSeedOutput();
    if (!seedAllIds) {
      return;
    }
    const numModels = Object.keys(seedAllIds).length;
    let numDeleted = 0;
    strapi.log.debug('Removing seeded ids from all models');
    for (const [modelName, ids] of Object.entries(seedAllIds)) {
      strapi.log.debug(`[${numDeleted + 1}/${numModels}] Removing fake entries for ${modelName}`);
      for (const id of ids) {
        if (modelName === 'user') {
          await strapi.query(modelName, 'users-permissions').delete({id})
        } else {
          await strapi.query(modelName).delete({id})
        }
      }
      numDeleted++;
    }

    const seedOutputFolder = process.env.SEED_OUTPUT_FOLDER || SEED_OUTPUT_FOLDER_DEFAULT;
    strapi.log.debug(`Removing seed outputs ${seedOutputFolder}/seed_output_default.json & ${seedOutputFolder}/seed_output_full.json`);
    fs.unlinkSync(`${seedOutputFolder}/seed_output_default.json`);
    fs.unlinkSync(`${seedOutputFolder}/seed_output_full.json`);
  }

};
