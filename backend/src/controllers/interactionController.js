const Poll = require('../models/Poll');
const Question = require('../models/Question');
const Session = require('../models/Session');

// --- Polls ---
const getSessionPolls = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const polls = await Poll.find({ session: sessionId }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: polls.length, data: polls });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createPoll = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { question, options } = req.body;

    const session = await Session.findById(sessionId);
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });

    const formattedOptions = (options || []).map(opt => ({ text: opt, votes: [] }));
    const poll = await Poll.create({
      session: sessionId,
      question,
      options: formattedOptions,
      active: true
    });

    const io = req.app.get('io');
    if (io) {
      io.to(`session_${sessionId}`).emit('new_poll', poll);
    }

    res.status(201).json({ success: true, message: 'Poll created successfully', data: poll });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const votePoll = async (req, res) => {
  try {
    const { pollId, optionIndex } = req.body;
    const userId = req.user._id;

    const poll = await Poll.findById(pollId);
    if (!poll || !poll.active) {
      return res.status(404).json({ success: false, message: 'Active poll not found' });
    }

    // Remove user vote from all options in this poll
    poll.options.forEach(opt => {
      opt.votes = opt.votes.filter(id => id.toString() !== userId.toString());
    });

    // Add vote to chosen option
    if (poll.options[optionIndex]) {
      poll.options[optionIndex].votes.push(userId);
    }

    await poll.save();

    const io = req.app.get('io');
    if (io) {
      io.to(`session_${poll.session}`).emit('poll_updated', poll);
    }

    res.status(200).json({ success: true, message: 'Vote recorded', data: poll });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- Q&A ---
const getSessionQuestions = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const questions = await Question.find({ session: sessionId })
      .populate('author', 'name')
      .sort({ upvotes: -1, createdAt: -1 });
    res.status(200).json({ success: true, count: questions.length, data: questions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const askQuestion = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { text } = req.body;
    const userId = req.user._id;

    const session = await Session.findById(sessionId);
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });

    const question = await Question.create({
      session: sessionId,
      author: userId,
      text,
      upvotes: []
    });

    const populatedQuestion = await Question.findById(question._id).populate('author', 'name');

    const io = req.app.get('io');
    if (io) {
      io.to(`session_${sessionId}`).emit('new_question', populatedQuestion);
    }

    res.status(201).json({ success: true, message: 'Question posted', data: populatedQuestion });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const upvoteQuestion = async (req, res) => {
  try {
    const { questionId } = req.params;
    const userId = req.user._id;

    const question = await Question.findById(questionId);
    if (!question) return res.status(404).json({ success: false, message: 'Question not found' });

    const hasVoted = question.upvotes.includes(userId);
    if (hasVoted) {
      question.upvotes = question.upvotes.filter(id => id.toString() !== userId.toString());
    } else {
      question.upvotes.push(userId);
    }

    await question.save();
    const populated = await Question.findById(question._id).populate('author', 'name');

    const io = req.app.get('io');
    if (io) {
      io.to(`session_${question.session}`).emit('question_updated', populated);
    }

    res.status(200).json({ success: true, message: 'Question updated', data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getSessionPolls,
  createPoll,
  votePoll,
  getSessionQuestions,
  askQuestion,
  upvoteQuestion
};
