/* eslint-disable linebreak-style */
/* eslint-disable prefer-template */
/* eslint-disable max-len */
const Poll = require('../models/Poll');
const Vote = require('../models/Vote');

// Casting a vote

async function postCastVote(req, res) {
  try {
    const pollId = req.params.id;
    const { selectedOption } = req.body;
    const voter = req.user.id;

    const poll = await Poll.findById(pollId);

    if (!poll) {
      return res.status(404).json({ message: 'Poll not found.' });
    }

    const selectedOptionId = poll.options.find((option) => option._id.toString() === selectedOption);

    if (!selectedOptionId) {
      return res.status(400).json({ message: 'Invalid option selected.' });
    }

    const existingVote = await Vote.findOne({ poll: pollId, voter });

    if (existingVote) {
      req.flash('error', { msg: 'You have already voted on this poll.' });
      return res.redirect('/poll/id/' + pollId);
    }

    const newVote = new Vote({
      poll: pollId,
      voter,
      selectedOption: selectedOptionId,
    });

    await newVote.save();

    // Update the vote count for the selected option in the poll
    selectedOptionId.votes += 1;
    await poll.save();
    req.flash('success', { msg: 'Your vote has been cast successfully.' });
    res.redirect('/poll/id/' + pollId);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message });
  }
}

async function getPollVotes(req, res) {
  try {
    const pollId = req.params.id;
    const unprocessedVotes = await Vote.find({ poll: pollId })
      .populate('voter')
      .populate('poll');
    const votes = unprocessedVotes.map((vote) => {
      const selectedOptionText = res.locals.poll.options
        .find((option) => option._id.toString() === vote.selectedOption.toString()).optionText;
      return {
        _id: vote._id,
        poll: vote.poll,
        voter: vote.voter,
        selectedOption: selectedOptionText,
        voted_at: vote.voted_at,
      };
    });
    res.render('poll/poll_page', {
      votes,
      hasVoted: res.locals.hasVoted,
      existingVote: res.locals.existingVote,
      title: 'Poll Details',
      poll: res.locals.poll,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message });
  }
}

// deleting a vote

async function deleteVote(req, res, next) {
  try {
    const pollId = req.params.id;
    const poll = await Poll.findById(pollId);
    if (!poll) {
      return res.status(404).json({ message: 'Poll not found.' });
    }
    await Vote.deleteMany({ poll: pollId });
    next();
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Failed to delete the votes' });
  }
}

// user has already voted on this poll

async function hasUserVoted(pollId, voter) {
  const existingVote = await Vote.findOne({ poll: pollId, voter });
  if (existingVote) {
    return true;
  }
  return false;
}

module.exports = {
  postCastVote,
  deleteVote,
  hasUserVoted,
  getPollVotes
};
