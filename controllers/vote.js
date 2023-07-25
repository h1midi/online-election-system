const Poll = require('../models/Poll');
const Vote = require('../models/Vote');

// Casting a vote

function getCastVote(req, res) {
  res.render('/poll/cast_vote', {
    title: 'Cast a Vote'
  });
};

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
      return res.status(400).json({ message: 'You have already voted on this poll.' });
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
    res.render('/poll/poll_page', {
      title: 'Poll Details',
      polls: poll
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to cast vote.' });
  }
}

module.exports = {
  getCastVote,
  postCastVote,
};
