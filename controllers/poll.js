/* eslint-disable linebreak-style */
const voteController = require('./vote');

const Poll = require('../models/Poll');

// Creating a poll

function getCreatePoll(req, res) {
  res.render('poll/creating_poll', {
    title: 'Create a Poll'
  });
}

async function postCreatePoll(req, res) {
  const processedOptions = [];
  try {
    const { question, options } = req.body;
    const createdBy = req.user.id;
    options.forEach((value) => {
      if (value !== '') processedOptions.push({ optionText: value, votes: 0 });
    });
    if (processedOptions.length < 2) {
      req.flash('errors', { msg: 'Please add at least two options.' });
      return res.redirect('/poll/new');
    }
    const newPoll = new Poll({
      question,
      options: processedOptions,
      createdBy,
    });
    await newPoll.save();
    req.flash('success', { msg: 'Poll has been created.' });
    res.redirect('/polls');
  } catch (err) {
    console.log(err);
    req.flash('success', { msg: 'Failed to create the poll.' });
    res.redirect('/polls');
  }
}

// Closing a poll
async function closePoll(req, res) {
  try {
    const pollId = req.params.id;
    const poll = await Poll.findById(pollId);
    if (!poll) {
      req.flash('success', { msg: 'Poll not found.' });
      return res.redirect(`/poll/id/${pollId}`);
    }
    poll.active = false;
    await poll.save();
    req.flash('success', { msg: 'Poll has been closed.' });
    res.redirect(`/poll/id/${pollId}`);
  } catch (err) {
    req.flash('success', { msg: 'Failed to close the poll.' });
    res.redirect('back');
  }
}

// Deleting a poll
async function deletePoll(req, res, next) {
  try {
    const pollId = req.params.id;
    const poll = await Poll.findById(pollId);
    await poll.remove();
    req.flash('success', { msg: 'Poll has been deleted.' });
    res.redirect('/polls');
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete the poll.' });
  }
}

// Getting all polls
async function allPolls(req, res, next) {
  try {
    const voter = req.user.id;
    const allPolls = await Poll.find().populate('createdBy', 'profile');

    const votePromises = allPolls.map(async (poll) => {
      poll.hasVoted = false;
      const existingVote = await voteController.hasUserVoted(poll._id, voter);
      if (existingVote) {
        poll.hasVoted = true;
      }
    });
    await Promise.all(votePromises);
    res.locals.allPolls = allPolls;
    next();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function getAllPolls(req, res, next) {
  const { allPolls } = res.locals;
  res.render('poll/poll_list', {
    title: 'Polls',
    polls: allPolls
  });
}

// Getting a single poll by ID
async function getPollById(req, res, next) {
  try {
    const pollId = req.params.id;
    const voter = req.user.id;
    let hasVoted = false;

    const poll = await Poll.findById(pollId);
    const existingVote = await voteController.hasUserVoted(poll._id, voter);

    if (existingVote) {
      hasVoted = true;
    }
    if (!poll) {
      return res.status(404).json({ message: 'Poll not found.' });
    }
    res.locals.poll = poll;
    res.locals.hasVoted = hasVoted;
    res.locals.existingVote = existingVote;
    next();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

module.exports = {
  postCreatePoll,
  getCreatePoll,
  getAllPolls,
  allPolls,
  getPollById,
  deletePoll,
  closePoll,
};
