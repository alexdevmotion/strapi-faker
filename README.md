# Strapi plugin strapi-faker

Seed your strapi models with faker.js


## Getting started

- Create a folder called `plugins` in the root of your strapi project

- Clone this repository into that folder
```
cd plugins
git clone https://github.com/alexdevmotion/strapi-faker
```

- Add `faker` as a dependency in your main `package.json` with something like
```
yarn add faker
```

`NOTE` faker v4.1.0 was used at the time this plugin was written.

- Copy over the environment variables from `.env.example` to the `.env` file in the root of your strapi project 
(change the values, if needed; see defaults below under `.env parameters`)

- (Re)start the strapi server

- Enable the `up` & `down` routes in the strapi admin:
Roles & Permissions > Edit the Public role > Scroll down to the STRAPI-FAKER plugin > Check both items > Click Save on the top right

`NOTE` It is advisable to disable those routes after you are done with seeding.


## Seeding

It is advisable to start with an empty database, though not mandatory: if the database
is not empty, the seeding procedure won't edit any existing records, it will only create new ones.

- In a browser, navigate to `<SERVER_URL>/strapi-faker/up`


## Un-seeding

This procedure won't delete any records other than the *last* seeded records.

`NOTE` If you accidentally ran `up` multiple times, you'll only be able to remove the last round of seeded items.

- In a browser, navigate to `<SERVER_URL>/strapi-faker/down`.


## .env parameters

`SEED_NUM_ITEMS`: integer (default `10`) = the number of fake entries to generate for each model

`SEED_NUM_DEFAULT_ITEMS`: integer (default `3`) = the number of fake entries out of all fake entries to also generate fake relations for

`SEED_OUTPUT_FOLDER`: string (default `.tmp`) = the folder name located in the root of the strapi project (`api-backend`) where to save the outputs

`SEED_DEFAULT_USER_PASSWORD`: string (default `password`) = what password to use when generating users


## Explanation of output

After performing the seeding procedure, you should expect the following:

- The default ids for each model saved under `<SEED_OUTPUT>` (those will be ids which also have relations populated)
- `<SEED_NUM_ITEMS>` fake entries for all models (collections)
- `<SEED_NUM_DEFAULT_ITEMS>` relation ids populated for *oneToMany*, *manyToMany* relations for models with default ids (collections)
- 1 random relation id populated for *oneToOne* relations for models with default ids
- The same `<SEED_NUM_DEFAULT_ITEMS>` default ids being used for each model, in relations to other models, for *oneToMany*, *manyToMany* relations
- The random relation id being used for each model to be sampled from the default ids, for *oneToOne* relations
- Due to dependencies between relations, not all default ids relations will be 100% filled
