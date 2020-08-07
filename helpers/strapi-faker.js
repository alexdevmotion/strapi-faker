'use strict';

const faker = require('faker');

module.exports = {

  fakeAttr(attrName, attr, resultSoFar={}, modelAttrs={}) {
    if (attrName in resultSoFar) {
      return resultSoFar[attrName];
    }
    const anl = attrName.toLowerCase();
    switch (attr.type) {
      case 'string':
        switch(anl) {
          case 'username':
            return faker.internet.userName();
          case 'firstname':
            return faker.name.firstName();
          case 'lastname':
            return faker.name.lastName();
          case 'position':
            return faker.name.jobTitle();
          default:
            if (anl.includes('slug')) {
              if ('name' in modelAttrs) {
                if (!('name' in resultSoFar)) {
                  resultSoFar['name'] = faker.random.words(faker.random.number({min: 2, max: 4}));
                }
                return faker.helpers.slugify(resultSoFar['name']);

              }
              if ('title' in modelAttrs) {
                if (!('title' in resultSoFar)) {
                  resultSoFar['title'] = faker.random.words(faker.random.number({min: 2, max: 4}));
                }
                return faker.helpers.slugify(resultSoFar['title']);
              }
              return faker.lorem.slug();
            } else if (anl.includes('phone')) {
              return faker.phone.phoneNumber();
            } else if (anl.includes('photo') || anl.includes('image')) {
              return faker.random.image();
            } else if (anl.includes('city')) {
              return faker.address.city();
            } else if (anl.includes('address')) {
              return faker.address.streetAddress();
            } else if (anl.includes('token')) {
              return faker.internet.password();
            } else if (anl.includes('type')) {
              return faker.lorem.word();
            } else if (anl.includes('website') || anl.includes('linkedin') || anl.includes('github') || anl.includes('homepage') || anl.includes('youtube')) {
              return faker.internet.url();
            } else if (anl.includes('description')) {
              return faker.lorem.words(faker.random.number({min: 4, max: 6}));
            }
            return faker.random.words(faker.random.number({min: 2, max: 4}));
        }
      case 'integer':
      case 'biginteger':
        return faker.random.number();
      case 'float':
      case 'decimal':
        return faker.commerce.price();
      case 'date':
      case 'datetime':
        return faker.date.recent();
      case 'array':
        return [faker.address.latitude(), faker.address.longitude()];
      case 'email':
        if ('username' in resultSoFar) {
          return faker.internet.email(resultSoFar['username']);
        }
        return faker.internet.email();
      case 'text':
        return faker.lorem.paragraph();
      case 'password':
        return faker.internet.password();
      case 'boolean':
        return faker.random.boolean();
      case 'json':
        return {};
      case 'enumeration':
        return faker.random.arrayElement(attr.enum);
      default:
        return null;
    }
  },

  fakeModel(modelName, model) {
    const result = {};
    for (const [attrName, attr] of Object.entries(model.attributes)) {
      const fakedAttributeVal = module.exports.fakeAttr(attrName, attr, result, model.attributes);
      if (fakedAttributeVal) {
        result[attrName] = fakedAttributeVal;
      }
    }
    return result;
  }

};
