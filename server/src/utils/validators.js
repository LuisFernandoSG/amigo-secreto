import Joi from 'joi';

export const createGroupSchema = Joi.object({
  name: Joi.string().min(3).max(120).required(),
  ownerName: Joi.string().min(2).max(120).required(),
  ownerEmail: Joi.string().email().allow('', null),
  eventDate: Joi.date().iso().allow(null, ''),
  budgetAmount: Joi.number().min(0).max(100000000).allow(null)
});

export const addParticipantSchema = Joi.object({
  name: Joi.string().min(2).max(120).required(),
  email: Joi.string().email().allow('', null)
});

export const wishlistItemSchema = Joi.object({
  title: Joi.string().min(2).max(200).required(),
  url: Joi.string().uri().required(),
  imageUrl: Joi.string().uri().allow('', null),
  note: Joi.string().max(300).allow('', null)
});

export const updateSettingsSchema = Joi.object({
  allowReveal: Joi.boolean(),
  eventDate: Joi.date().iso().allow(null, ''),
  budgetAmount: Joi.number().min(0).max(100000000).allow(null)
}).or('allowReveal', 'eventDate', 'budgetAmount');