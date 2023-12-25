const { Schema, model } = require('mongoose');
const Joi = require('joi');
const { handleMongooseError } = require('../helpers');
const emailRegExp = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Vorname ist erforderlich'],
    },
    email: {
      type: String,
      match: emailRegExp,
      unique: true,
      required: [true, 'Email ist erforderlich'],
    },
    password: {
      type: String,
      minlength: 6,
      required: [true, 'Kennwort ist erforderlich'],
    },
    token: {
      type: String,
      default: null,
    },
    verify: {
      type: Boolean,
      default: false,
    },
    verificationToken: {
      type: String,
      required: [true, 'Verify token is required'],
    },
    progress: {
      type: Array,
      default: [],
    },
  },
  { versionKey: false, timestamps: true }
);

userSchema.post('save', handleMongooseError);

const registerSchema = Joi.object({
  name: Joi.string().required().messages({ 'any.required': 'fehlendes erforderliches Namensfeld' }),
  password: Joi.string().required().messages({ 'any.required': 'fehlendes Feld für das erforderliche Kennwort' }),
  email: Joi.string().pattern(emailRegExp).messages({ 'string.pattern.base': 'falsches Email-Format!' }),
  verify: Joi.boolean(),
  verificationToken: Joi.string(),
  progress: Joi.array(),
});

const emailSchema = Joi.object({
  email: Joi.string().pattern(emailRegExp).messages({ 'string.pattern.base': 'falsches Email-Format!' }),
});

const loginSchema = Joi.object({
  email: Joi.string().pattern(emailRegExp).messages({ 'string.pattern.base': 'falsches Email-Format!' }),
  password: Joi.string().required().messages({ 'any.required': 'Fehlendes Feld für das erforderliche Kennwort' }),
});

const schemas = {
  registerSchema,
  loginSchema,
  emailSchema,
};
const User = model('user', userSchema);

module.exports = {
  User,
  schemas,
};
