/********************************************************************************* 

WEB322 – Assignment 06
I declare that this assignment is my own work in accordance with Seneca
Academic Policy.  No part of this assignment has been copied manually or 
electronically from any other source (including 3rd party web sites) or 
distributed to other students. I acknoledge that violation of this policy
to any degree results in a ZERO for this assignment and possible failure of
the course. 

Name:   
Student ID:   
Date:  
Cyclic Web App URL:  https://long-ruby-cricket-tux.cyclic.app/
GitHub Repository URL:  

********************************************************************************/
const Sequelize = require('sequelize');
const DataTypes = Sequelize.DataTypes;

var sequelize = new Sequelize('lisrulqh', 'lisrulqh', 'J4eI4NNiMElV3n6uq8FJcSdwhImrZqg7', {
    host: 'snuffleupagus.db.elephantsql.com',
    dialect: 'postgres',
    port: 5432,
    dialectOptions: {
        ssl: { rejectUnauthorized: false }
    },
    query: { raw: true }
});

// Define the 'Item' model
const Item = sequelize.define('Item', {
    body: {
        type: DataTypes.TEXT,
    },
    title: {
        type: DataTypes.STRING,
    },
    postDate: {
        type: DataTypes.DATE,
    },
    featureImage: {
        type: DataTypes.STRING,
    },
    published: {
        type: DataTypes.BOOLEAN,
    },
    price: {
        type: DataTypes.NUMBER,
    }
});

// Define the 'Category' model
const Category = sequelize.define('Category', {
    category: {
        type: DataTypes.STRING,
    },
});

// Define the relationship between 'Item' and 'Category'
Item.belongsTo(Category, { foreignKey: 'categoryId', allowNull: true });

module.exports = { Item, Category };

module.exports.initialize = function () {
    return new Promise((resolve, reject) => {
        sequelize.authenticate()
            .then(() => {
                sequelize.sync();
                resolve();
            })
            .catch((err) => {
                reject("unable to sync the database");
            });
    });
}

module.exports.getAllItems = function () {
    return new Promise((resolve, reject) => {
        Item.findAll().then((data) => { data.length > 0 ? resolve(data) : reject("no results returned") })
            .catch((err) => reject('no results returned'))
    });
}

module.exports.getItemById = function (id) {
    return new Promise((resolve, reject) => {
        Item.findAll({
            where: {
                id: id,
            },
        })
            .then((data) => {
                data.length > 0 ? resolve(data[0]) : reject('No results returned');
            })
            .catch((err) => reject('No results returned'));
    });
};


module.exports.getPublishedItems = function () {
    return new Promise((resolve, reject) => {
        Item.findAll({
            where: {
                published: true,
            },
        })
            .then((data) => {
                resolve(data);
            })
            .catch((err) => reject('No results returned'));
    });
};

module.exports.getCategories = function () {
    return new Promise((resolve, reject) => {
        Category.findAll()
            .then((data) => {
                resolve(data);
            })
            .catch((err) => reject('No results returned'));
    });
};

module.exports.addItem = function (itemData) {
    return new Promise((resolve, reject) => {
        itemData.published = itemData.published ? true : false;
        for (const prop in itemData) {
            if (itemData[prop] === "") {
                itemData[prop] = null;
            }
        }
        itemData.postDate = new Date();
        Item.create(itemData)
            .then(() => {
                resolve();
            })
            .catch((err) => {
                console.log('====================================');
                console.log(err);
                console.log('====================================');
                reject("unable to create post");
            });
    });
};


module.exports.getItemsByCategory = function (categoryId) {
    return new Promise((resolve, reject) => {
        Item.findAll({
            where: {
                category: categoryId,
            },
        })
            .then((data) => {
                data.length > 0 ? resolve(data) : reject('No results returned');
            })
            .catch((err) => reject('No results returned'));
    });
};


module.exports.getItemsByMinDate = function (minDateStr) {
    return new Promise((resolve, reject) => {
        Item.findAll({
            where: {
                postDate: {
                    [Sequelize.Op.gte]: new Date(minDateStr),
                },
            },
        })
            .then((data) => {
                data.length > 0 ? resolve(data) : reject('No results returned');
            })
            .catch((err) => reject('No results returned'));
    });
};

module.exports.getPublishedItemsByCategory = function (category) {
    return new Promise((resolve, reject) => {
        Item.findAll({
            where: {
                category: category,
                published: true,
            },
        })
            .then((data) => {
                data.length > 0 ? resolve(data) : reject('No results returned');
            })
            .catch((err) => reject('No results returned'));
    });
};

module.exports.addCategory = function (categoryData) {
    return new Promise((resolve, reject) => {
        if (categoryData === "") {
            categoryData[prop] = null;
        }
        Category.create({ category: categoryData })
            .then(() => {
                resolve();
            })
            .catch((err) => {
                reject("unable to create category");
            });
    });
};

module.exports.deleteCategoryById = function (id) {
    return new Promise((resolve, reject) => {
        Category.destroy({
            where: {
                id: id,
            },
        })
            .then((rowsDeleted) => {
                if (rowsDeleted > 0) {
                    resolve();
                } else {
                    reject('Category not found');
                }
            })
            .catch((err) => reject('Unable to delete category'));
    });
};

module.exports.deletePostById = function (id) {
    return new Promise((resolve, reject) => {
        Item.destroy({
            where: {
                id: id,
            },
        })
            .then((rowsDeleted) => {
                if (rowsDeleted > 0) {
                    resolve();
                } else {
                    reject('Post not found');
                }
            })
            .catch((err) => reject('Unable to delete post'));
    });
};

module.exports.deletePostById = function (id) {
    return new Promise((resolve, reject) => {
        Item.destroy({
            where: {
                id: id,
            },
        })
            .then((rowsDeleted) => {
                if (rowsDeleted > 0) {
                    resolve();
                } else {
                    reject('Post not found');
                }
            })
            .catch((err) => reject('Unable to delete post'));
    });
};
