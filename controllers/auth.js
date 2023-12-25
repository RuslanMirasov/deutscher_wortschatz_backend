const { User } = require('../models/user');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const path = require('path');
const fs = require('fs/promises');

require('dotenv').config();
const { SECRET_KEY, BASE_URL } = process.env;
const { ctrlWrapper, HttpError, nanoId, sendEmail } = require('../helpers');

const register = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (user) {
    throw HttpError(409, 'E-Mail in Gebrauch!');
  }
  const hashPassword = await bcrypt.hash(password, 10);
  const verificationToken = nanoId();

  const newUser = await User.create({ ...req.body, password: hashPassword, verificationToken });
  const verifyEmail = {
    to: email,
    subject: 'Deutscher Wortschatz E-Mail-Bestätigung',
    html: `<a target="_blank" href="${BASE_URL}/users/verify/${verificationToken}">Folgen Sie diesem Link, um Ihre E-Mail-Adresse zu verifizieren</a>`,
  };

  await sendEmail(verifyEmail);

  res.status(201).json({
    user: {
      name: newUser.name,
      email: newUser.email,
    },
  });
};

const emailVerification = async (req, res) => {
  const { verificationToken } = req.params;
  const user = await User.findOne({ verificationToken });
  if (!user) {
    throw HttpError(404, 'Benutzer nicht gefunden!');
  }
  await User.findByIdAndUpdate(user._id, { verify: true, verificationToken: null });
  res.status(200).json({
    message: 'Verifizierung erfolgreich',
  });
};

const resendVerifyEmail = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    throw HttpError(404, 'E-Mail nicht gefunden!');
  }
  if (user.verify) {
    throw HttpError(400, 'Die Verifizierung ist bereits erfolgt!');
  }
  const verifyEmail = {
    to: email,
    subject: 'Verify email',
    html: `<a target="_blank" href="${BASE_URL}/api/users/verify/${user.verificationToken}">Click verify email</a>`,
  };
  await sendEmail(verifyEmail);
  res.status(200).json({
    message: 'E-Mail zur Überprüfung gesendet',
  });
};

const login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    throw HttpError(401, 'E-Mail oder Passwort ist falsch!');
  }

  if (!user.verify) {
    throw HttpError(401, 'E-Mail ist nicht verifiziert!');
  }

  const passwordCompare = await bcrypt.compare(password, user.password);
  if (!passwordCompare) {
    throw HttpError(401, 'E-Mail oder Passwort ist falsch!');
  }

  const payload = {
    id: user._id,
  };

  const token = jwt.sign(payload, SECRET_KEY, { expiresIn: '23h' });

  await User.findByIdAndUpdate(user._id, { token });
  res.status(200).json({
    token,
    user: {
      email: user.email,
      subscription: user.subscription,
    },
  });
};

const getCurrent = async (req, res) => {
  const { email, subscription } = req.user;
  res.json({
    email,
    subscription,
  });
};

const logout = async (req, res) => {
  const { _id } = req.user;
  await User.findByIdAndUpdate(_id, { token: null });
  res.status(204).json();
};

module.exports = {
  register: ctrlWrapper(register),
  login: ctrlWrapper(login),
  logout: ctrlWrapper(logout),
  getCurrent: ctrlWrapper(getCurrent),
  emailVerification: ctrlWrapper(emailVerification),
  resendVerifyEmail: ctrlWrapper(resendVerifyEmail),
};
