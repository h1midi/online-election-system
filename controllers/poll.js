/* eslint-disable linebreak-style */
const Poll = require('../models/Poll');

// Creating a poll

function getCreatePoll(req, res) {
  res.render('poll/creating_poll', {
    title: 'Create a Poll'
  });
}

async function postCreatePoll(req, res) {
  const optionsF = [];
  try {
    const { question, options } = req.body;
    const createdBy = req.user.id;
    options.forEach((value) => {
      if (value !== '') optionsF.push({ optionText: value, votes: 0 });
    });
    if (optionsF.length < 2) {
      req.flash('errors', { msg: 'Please add at least two options.' });
      return res.redirect('/poll/new');
    }
    const newPoll = new Poll({
      question,
      options: optionsF,
      createdBy,
    });
    await newPoll.save();
    req.flash('success', { msg: 'Poll has been created.' });
    res.redirect('/polls');
  } catch (err) {
    res.status(500).json({ message: 'Failed to create the poll.' });
  }
}

// Closing a poll
async function closePoll(req, res) {
  try {
    const pollId = req.params.id;
    const poll = await Poll.findById(pollId);
    if (!poll) {
      return res.status(404).json({ message: 'Poll not found.' });
    }
    poll.active = false;
    await poll.save();
    req.flash('success', { msg: 'Poll has been closed.' });
    res.redirect(`/poll/id/${pollId}`);
  } catch (err) {
    res.status(500).json({ message: 'Failed to close the poll.' });
  }
}

// Deleting a poll
async function deletePoll(req, res) {
  try {
    const pollId = req.params.id;
    const poll = await Poll.findById(pollId);
    if (!poll) {
      return res.status(404).json({ message: 'Poll not found.' });
    }
    await poll.remove();
    req.flash('success', { msg: 'Poll has been deleted.' });
    res.redirect('/polls');
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete the poll.' });
  }
}

// Getting all polls
async function getAllPolls(req, res) {
  try {
    const allPolls = await Poll.find().populate('createdBy', 'profile');
    res.render('poll/poll_list', {
      title: 'Polls',
      polls: allPolls
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch polls.' });
  }
}

// Getting a single poll by ID
async function getPollById(req, res) {
  try {
    const pollId = req.params.id;
    const poll = await Poll.findById(pollId).populate('createdBy', 'username');

    if (!poll) {
      return res.status(404).json({ message: 'Poll not found.' });
    }
    res.render('poll/poll_page', {
      title: 'Poll Details',
      poll
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch the poll.' });
  }
}

module.exports = {
  postCreatePoll,
  getCreatePoll,
  getAllPolls,
  getPollById,
  deletePoll,
  closePoll,
};
