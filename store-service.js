const fs = require('fs');

let items = [];
let categories = [];

const initialize = () => {
  return new Promise((resolve, reject) => {
    fs.readFile('./data/items.json', 'utf8', (err, itemsData) => {
      if (err) {
        reject('unable to read file');
        return;
      }
      items = JSON.parse(itemsData);

      fs.readFile('./data/categories.json', 'utf8', (err, categoriesData) => {
        if (err) {
          reject('unable to read file');
          return;
        }
        categories = JSON.parse(categoriesData);

        resolve();
      });
    });
  });
};

const getAllItems = () => {
  return new Promise((resolve, reject) => {
    if (items.length === 0) {
      reject('no results returned');
      return;
    }
    resolve(items);
  });
};

const getPublishedItems = () => {
  return new Promise((resolve, reject) => {
    const publishedItems = items.filter(item => item.published === true);
    if (publishedItems.length === 0) {
      reject('no results returned');
      return;
    }
    resolve(publishedItems);
  });
};

const getCategories = () => {
  return new Promise((resolve, reject) => {
    if (categories.length === 0) {
      reject('no results returned');
      return;
    }
    resolve(categories);
  });
};

module.exports = {
  initialize,
  getAllItems,
  getPublishedItems,
  getCategories
};
