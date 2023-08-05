const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const bcrypt = require("bcryptjs");

const userSchema = new Schema({
  userName: { type: String, unique: true, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  loginHistory: [
    {
      dateTime: { type: Date, required: true },
      userAgent: { type: String, required: true },
    },
  ],
});

// Hash the password before saving it to the database
userSchema.pre("save", function (next) {
  const user = this;
  if (!user.isModified("password")) return next();

  bcrypt.genSalt(10, (err, salt) => {
    if (err) return next(err);

    bcrypt.hash(user.password, salt, (err, hash) => {
      if (err) return next(err);
      user.password = hash;
      next();
    });
  });
});

// update history
userSchema.pre("update", function (next) {
  // on login save the login history
  const user = this;
  const loginInfo = {
    dateTime: new Date().toString(),
    userAgent: user.userAgent,
  };
  user.loginHistory.push(loginInfo);
  next();
});

let User = mongoose.model("User", userSchema);

const comparePassword = function (candidatePassword, hash, callback) {
  bcrypt.compare(candidatePassword, hash, (err, isMatch) => {
    callback(err, isMatch);
  });
};

module.exports.User = User;

module.exports.initialize = function () {
  return new Promise(function (resolve, reject) {
    let db = mongoose.createConnection("mongodb+srv://kmgajjar:keshvigajjar@senecaweb.wxwng05.mongodb.net/");

    db.on("error", (err) => {
      reject(err); // reject the promise with the provided error
    });

    db.once("open", () => {
      User = db.model("users", userSchema);
      console.log("Connected to MongoDB");
      resolve();
    });
  });
};

module.exports.registerUser = async function (userData) {
  return new Promise(function (resolve, reject) {
    if (userData.password !== userData.password2) {
      reject("Passwords do not match");
    } else {
      let newUser = new User(userData);
      const promise = newUser.save();
      promise
        .then((user) => {
          resolve(user);
        })
        .catch((err) => {
          if (err.code == 11000) {
            reject("User Name already taken");
          } else {
            reject("There was an error creating the user: " + err);
          }
        });
    }
  });
};

module.exports.checkUser = function (userData) {
  return new Promise(function (resolve, reject) {
    User.find({ userName: userData.userName })
      .then((users) => {
        if (users.length === 0) {
          reject("Unable to find user: " + userData.userName);
        } else if (
          !comparePassword(
            userData.password,
            users[0].password,
            (err, isMatch) => {
              if (err) {
                reject("There was an error verifying the user: " + err);
              } else if (!isMatch) {
                reject("Incorrect Password for user: " + userData.userName);
              } else {
                const loginInfo = {
                  dateTime: new Date().toString(),
                  userAgent: userData.userAgent,
                };
                users[0].loginHistory.push(loginInfo);
                User.updateOne(
                  { userName: userData.userName },
                  { $set: { loginHistory: users[0].loginHistory } },
                  { multi: false }
                )
                  .then(() => {
                    resolve(users[0]);
                  })
                  .catch((err) => {
                    reject("There was an error verifying the user: " + err);
                  });
              }
            }
          )
        );
      })
      .catch((err) => {
        reject("Unable to find user: " + userData.userName);
      });
  });
};
