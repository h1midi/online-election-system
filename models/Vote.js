/* eslint-disable linebreak-style */
const mongoose = require('mongoose');

const voteSchema = new mongoose.Schema({
  poll: { type: mongoose.Schema.Types.ObjectId, ref: 'Poll', required: true },
  voter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  selectedOption: { type: mongoose.Schema.Types.ObjectId, ref: 'Options', required: true },
  voted_at: { type: Date, default: Date.now },
});

const Vote = mongoose.model('Vote', voteSchema);

module.exports = Vote;
